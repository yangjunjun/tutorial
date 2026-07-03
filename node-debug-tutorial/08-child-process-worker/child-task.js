/**
 * 子进程任务脚本
 *
 * 通过 child_process.fork() 启动的子进程。
 * 通过 IPC 与父进程通信，接收计算任务并返回结果。
 *
 * ⚠️ 包含故意植入的 Bug：
 * - 未处理的消息类型会在内部数组中累积，导致内存泄漏
 * - 消息处理函数中存在竞态条件
 */

// ============================================================
// 子进程信息
// ============================================================

const childIndex = parseInt(process.env.CHILD_INDEX || '0', 10);
const childName = process.env.CHILD_NAME || `子进程-${childIndex}`;

console.log(`[${childName}] 子进程已启动 (PID: ${process.pid})`);

// ============================================================
// 内部状态
// ============================================================

/**
 * ⚠️ Bug: 未处理消息的累积队列
 * 当收到无法识别的消息类型时，消息被存入这个数组，
 * 但永远不会被清理，导致内存持续增长
 */
const unprocessedMessages = [];

/**
 * 正在处理的任务映射
 * 用于跟踪当前正在处理的任务
 */
const pendingTasks = new Map();

/**
 * ⚠️ Bug: 全局计数器存在竞态条件
 * 在高并发消息处理时，这个计数器可能不准确
 */
let taskCounter = 0;

// ============================================================
// 计算函数
// ============================================================

/**
 * 计算区间内所有整数的和
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @returns {number} 区间和
 */
function computeRangeSum(start, end) {
  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += i;
  }
  return sum;
}

/**
 * 计算斐波那契数列（递归方式，故意设计为慢速）
 * @param {number} n - 第 n 个斐波那契数
 * @returns {number} 结果
 */
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * 模拟耗时计算
 * @param {number} ms - 模拟耗时（毫秒）
 * @returns {Promise<void>}
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 任务处理
// ============================================================

/**
 * 处理计算任务
 * @param {object} task - 任务对象
 */
async function handleComputeTask(task) {
  const { taskId, payload } = task;
  const startTime = Date.now();

  // ⚠️ Bug: 竞态条件
  // taskCounter 在异步操作之间被递增，但不是原子操作
  // 如果多个消息几乎同时到达，可能导致计数不准确
  taskCounter++;
  const myTaskNumber = taskCounter;

  console.log(`[${childName}] 处理任务 ${taskId} (序号: ${myTaskNumber})`);

  // 标记任务为进行中
  pendingTasks.set(taskId, { startTime, taskNumber: myTaskNumber });

  let result;

  try {
    if (payload.start !== undefined && payload.end !== undefined) {
      // 区间求和
      const sum = computeRangeSum(payload.start, payload.end);
      result = {
        type: 'sum',
        start: payload.start,
        end: payload.end,
        sum: sum
      };
    } else if (payload.fibonacci) {
      // 斐波那契计算（慢速）
      const fibResult = fibonacci(payload.fibonacci);
      result = {
        type: 'fibonacci',
        n: payload.fibonacci,
        result: fibResult
      };
    } else if (payload.value !== undefined) {
      // 简单值处理
      result = {
        type: 'processed',
        input: payload.value,
        output: payload.value * 2 + childIndex
      };
    } else {
      result = {
        type: 'error',
        message: '无法识别的任务数据'
      };
    }

    // 模拟一些处理延迟
    await simulateDelay(100 + Math.random() * 200);

  } catch (err) {
    result = {
      type: 'error',
      message: err.message,
      stack: err.stack
    };
  }

  const duration = Date.now() - startTime;

  // 移除已完成的任务
  pendingTasks.delete(taskId);

  // 发送结果给父进程
  if (process.send) {
    process.send({
      type: 'result',
      taskId: taskId,
      taskNumber: myTaskNumber,
      result: result,
      duration: duration,
      childName: childName,
      pendingTaskCount: pendingTasks.size
    });
  }

  console.log(`[${childName}] 任务 ${taskId} 完成，耗时 ${duration}ms`);
}

// ============================================================
// IPC 消息处理
// ============================================================

/**
 * 监听来自父进程的 IPC 消息
 * ⚠️ Bug: 未处理的消息类型被存入 unprocessedMessages 数组
 * 但永远不会被清理，导致内存泄漏
 */
process.on('message', async (msg) => {
  console.log(`[${childName}] 收到消息: type=${msg.type}, taskId=${msg.taskId || 'N/A'}`);

  switch (msg.type) {
    case 'compute':
      // 正常的计算任务
      await handleComputeTask(msg);
      break;

    case 'status':
      // 状态查询
      if (process.send) {
        process.send({
          type: 'status',
          childName: childName,
          pid: process.pid,
          uptime: process.uptime(),
          pendingTasks: pendingTasks.size,
          totalTasksProcessed: taskCounter,
          memoryUsage: process.memoryUsage()
        });
      }
      break;

    case 'ping':
      // 心跳响应
      if (process.send) {
        process.send({
          type: 'pong',
          childName: childName,
          timestamp: Date.now()
        });
      }
      break;

    default:
      // ⚠️ Bug: 未处理的消息被永久存储
      // 这些消息永远不会被清理，随着时间推移会消耗大量内存
      console.warn(`[${childName}] 未处理的消息类型: ${msg.type}`);
      unprocessedMessages.push({
        message: msg,
        receivedAt: new Date().toISOString(),
        childName: childName
      });

      // 每累积 50 条未处理消息时打印警告
      if (unprocessedMessages.length % 50 === 0) {
        console.warn(
          `[${childName}] ⚠️ 未处理消息已累积 ${unprocessedMessages.length} 条！` +
          `估计内存: ${JSON.stringify(unprocessedMessages).length} 字节`
        );
      }
  }
});

// ============================================================
// 进程信号处理
// ============================================================

/**
 * 处理终止信号
 */
process.on('SIGTERM', () => {
  console.log(`[${childName}] 收到 SIGTERM，正在清理...`);
  console.log(`[${childName}] 已处理任务: ${taskCounter}`);
  console.log(`[${childName}] 未处理消息: ${unprocessedMessages.length}`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${childName}] 收到 SIGINT，正在退出...`);
  process.exit(0);
});

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (err) => {
  console.error(`[${childName}] 未捕获的异常:`, err.message);
  console.error(err.stack);

  // 通知父进程
  if (process.send) {
    process.send({
      type: 'error',
      childName: childName,
      error: err.message,
      stack: err.stack
    });
  }

  // 延迟退出，让父进程有时间处理
  setTimeout(() => process.exit(1), 100);
});

// ============================================================
// 就绪通知
// ============================================================

// 通知父进程子进程已就绪
if (process.send) {
  process.send({
    type: 'ready',
    childName: childName,
    pid: process.pid,
    childIndex: childIndex,
    timestamp: Date.now()
  });
}

console.log(`[${childName}] 就绪，等待任务...`);
