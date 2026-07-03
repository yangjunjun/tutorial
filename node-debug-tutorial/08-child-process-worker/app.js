/**
 * 多进程与 Worker Threads 调试教程 - 主应用入口
 *
 * 本文件演示了 Node.js 中三种并行计算方式：
 * 1. child_process.fork() - 创建子进程
 * 2. worker_threads.Worker - 创建 Worker 线程
 * 3. IPC 消息通信
 *
 * ⚠️ 包含故意植入的 Bug，用于调试练习：
 * - IPC 消息处理竞态条件
 * - 子进程未在父进程退出时清理
 * - 调试端口冲突
 */

const { fork } = require('node:child_process');
const { Worker } = require('node:worker_threads');
const path = require('node:path');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  // 子进程数量
  childProcessCount: 2,
  // Worker 线程数量
  workerCount: 2,
  // 调试端口基础值
  // ⚠️ Bug: 所有子进程使用同一个基础端口，导致端口冲突
  debugPort: 9230,
  // 任务数量
  taskCount: 10
};

console.log('=== Node.js 多进程与 Worker Threads 调试演示 ===\n');
console.log(`主进程 PID: ${process.pid}`);
console.log(`调试端口: ${process.debugPort || '未启用'}\n`);

// ============================================================
// 1. 子进程 (child_process.fork)
// ============================================================

/**
 * 活跃的子进程列表
 * ⚠️ Bug: 父进程退出时没有清理这些子进程
 */
const activeChildren = [];

/**
 * 创建子进程并分配任务
 * @param {number} index - 子进程编号
 * @returns {import('child_process').ChildProcess} 子进程实例
 */
function createChildProcess(index) {
  console.log(`[主进程] 创建子进程 #${index}...`);

  // ⚠️ Bug: 所有子进程使用相同的调试端口
  // 当多个子进程同时启动时，会因端口冲突而失败
  // 修复方案：每个子进程使用不同的端口，例如 debugPort + index
  const child = fork(path.join(__dirname, 'child-task.js'), [], {
    execArgv: [`--inspect=${CONFIG.debugPort}`],  // 应为 CONFIG.debugPort + index
    env: {
      ...process.env,
      CHILD_INDEX: String(index),
      CHILD_NAME: `子进程-${index}`
    }
  });

  child.processName = `child-${index}`;
  activeChildren.push(child);

  // 监听子进程消息
  child.on('message', (msg) => {
    console.log(`[主进程] 收到 ${child.processName} 的消息:`, msg.type, msg.taskId || '');
  });

  // 监听子进程退出
  child.on('exit', (code, signal) => {
    console.log(`[主进程] ${child.processName} 已退出 (code=${code}, signal=${signal})`);
    // 从活跃列表中移除
    const idx = activeChildren.indexOf(child);
    if (idx !== -1) activeChildren.splice(idx, 1);
  });

  // 监听错误
  child.on('error', (err) => {
    console.error(`[主进程] ${child.processName} 发生错误:`, err.message);
  });

  return child;
}

/**
 * 向子进程发送计算任务
 * @param {import('child_process').ChildProcess} child - 目标子进程
 * @param {object} task - 任务描述
 */
function sendTaskToChild(child, task) {
  if (!child.connected) {
    console.error(`[主进程] ${child.processName} 的 IPC 通道已断开，无法发送任务`);
    return;
  }

  console.log(`[主进程] 发送任务 ${task.id} -> ${child.processName}`);
  child.send({
    type: 'compute',
    taskId: task.id,
    payload: task.data
  });
}

// ============================================================
// 2. Worker Threads
// ============================================================

/**
 * 活跃的 Worker 列表
 */
const activeWorkers = [];

/**
 * 创建 Worker 线程
 * @param {number} index - Worker 编号
 * @returns {Worker} Worker 实例
 */
function createWorker(index) {
  console.log(`[主进程] 创建 Worker 线程 #${index}...`);

  const worker = new Worker(path.join(__dirname, 'worker-compute.js'), {
    workerData: {
      workerId: index,
      workerName: `Worker-${index}`
    },
    // 为每个 Worker 分配独立的调试端口
    execArgv: [`--inspect=0`]  // 端口 0 让系统自动分配
  });

  worker.workerName = `Worker-${index}`;
  activeWorkers.push(worker);

  // 监听 Worker 消息
  worker.on('message', (msg) => {
    console.log(`[主进程] 收到 ${worker.workerName} 的消息:`, msg.type);
    if (msg.type === 'result') {
      console.log(`  -> 任务 ${msg.taskId} 结果: ${msg.result}`);
    }
  });

  // 监听 Worker 错误
  worker.on('error', (err) => {
    console.error(`[主进程] ${worker.workerName} 发生错误:`, err.message);
  });

  // 监听 Worker 退出
  worker.on('exit', (code) => {
    console.log(`[主进程] ${worker.workerName} 已退出 (code=${code})`);
    const idx = activeWorkers.indexOf(worker);
    if (idx !== -1) activeWorkers.splice(idx, 1);
  });

  return worker;
}

/**
 * 向 Worker 发送计算任务
 * @param {Worker} worker - 目标 Worker
 * @param {object} task - 任务描述
 */
function sendTaskToWorker(worker, task) {
  console.log(`[主进程] 发送任务 ${task.id} -> ${worker.workerName}`);
  worker.postMessage({
    type: 'compute',
    taskId: task.id,
    payload: task.data
  });
}

// ============================================================
// 3. 任务生成
// ============================================================

/**
 * 生成计算任务列表
 * @param {number} count - 任务数量
 * @returns {Array<object>} 任务数组
 */
function generateTasks(count) {
  const tasks = [];
  for (let i = 1; i <= count; i++) {
    tasks.push({
      id: `task-${i}`,
      type: i % 2 === 0 ? 'primes' : 'sum',
      data: {
        // 交替生成不同类型的计算任务
        ...(i % 2 === 0
          ? { limit: 100 + i * 10 }           // 质数计算：找前 N 个质数
          : { start: i * 100, end: i * 100 + 1000 }  // 求和计算：区间求和
        )
      }
    });
  }
  return tasks;
}

// ============================================================
// 4. 主流程
// ============================================================

async function main() {
  const tasks = generateTasks(CONFIG.taskCount);

  console.log(`\n生成 ${tasks.length} 个计算任务\n`);

  // --- 创建子进程 ---
  console.log('--- 启动子进程 ---');
  const children = [];
  for (let i = 0; i < CONFIG.childProcessCount; i++) {
    // 只给第一个子进程启动 inspector，避免端口冲突
    // （其他子进程因端口冲突会失败，这是故意设置的 Bug）
    const child = createChildProcess(i);
    children.push(child);
  }

  // 等待子进程启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  // --- 创建 Worker 线程 ---
  console.log('\n--- 启动 Worker 线程 ---');
  const workers = [];
  for (let i = 0; i < CONFIG.workerCount; i++) {
    const worker = createWorker(i);
    workers.push(worker);
  }

  // 等待 Worker 就绪
  await new Promise(resolve => setTimeout(resolve, 500));

  // --- 分配任务给子进程 ---
  console.log('\n--- 向子进程分配任务 ---');
  const childTasks = tasks.filter(t => t.type === 'sum');
  childTasks.forEach((task, i) => {
    const child = children[i % children.length];
    if (child && child.connected) {
      sendTaskToChild(child, task);
    }
  });

  // --- 分配任务给 Worker ---
  console.log('\n--- 向 Worker 分配任务 ---');
  const workerTasks = tasks.filter(t => t.type === 'primes');
  workerTasks.forEach((task, i) => {
    const worker = workers[i % workers.length];
    sendTaskToWorker(worker, task);
  });

  // --- ⚠️ Bug: 竞态条件 ---
  // 在子进程可能还没完全启动时就发送了消息
  // 导致某些消息丢失
  console.log('\n--- 立即发送紧急任务（可能在子进程就绪前） ---');
  children.forEach((child, i) => {
    // ⚠️ 这里不检查 child.connected 状态就直接发送
    // 如果子进程还没完全启动，消息可能丢失
    child.send({
      type: 'urgent',
      taskId: `urgent-${i}`,
      payload: { value: Math.random() * 1000 }
    });
  });

  // --- 等待一段时间后清理 ---
  console.log('\n--- 等待任务完成 (5秒) ---');
  setTimeout(() => {
    console.log('\n--- 清理资源 ---');

    // 终止 Worker
    workers.forEach(w => {
      console.log(`[主进程] 终止 ${w.workerName}`);
      w.terminate();
    });

    // ⚠️ Bug: 没有终止子进程！
    // 子进程会继续在后台运行，导致进程泄漏
    // 正确做法应该是：
    // children.forEach(c => c.kill('SIGTERM'));

    console.log('\n[主进程] 主进程即将退出');
    console.log('[主进程] ⚠️ 注意：子进程可能仍在后台运行！');

    // 使用 process.exit 强制退出，但子进程不会被清理
    // 在实际应用中应该等待所有子进程正常退出
    setTimeout(() => process.exit(0), 1000);
  }, 5000);
}

// ============================================================
// 5. 进程退出处理
// ============================================================

/**
 * ⚠️ Bug: 退出处理不完整
 * 只打印了日志，但没有实际清理子进程
 */
process.on('SIGINT', () => {
  console.log('\n[主进程] 收到 SIGINT 信号');
  console.log('[主进程] ⚠️ 没有清理子进程就退出了！');
  // 缺少: activeChildren.forEach(c => c.kill());
  // 缺少: activeWorkers.forEach(w => w.terminate());
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[主进程] 收到 SIGTERM 信号');
  process.exit(0);
});

// 启动主流程
main().catch(err => {
  console.error('[主进程] 发生错误:', err);
  process.exit(1);
});
