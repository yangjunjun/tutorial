/**
 * Worker Pool 实现
 *
 * 一个简易的 Worker 线程池，用于分发 CPU 密集型任务：
 * - 创建 N 个 Worker 线程
 * - 将任务分配给空闲的 Worker
 * - 收集并聚合结果
 *
 * ⚠️ 包含故意植入的 Bug：
 * - Worker 完成任务后未被标记为空闲（Worker 泄漏）
 * - 任务队列没有容量限制（队列溢出）
 * - Worker 崩溃后未重建
 *
 * 可以独立运行：node worker-pool.js
 */

const { Worker } = require('node:worker_threads');
const path = require('node:path');
const { EventEmitter } = require('node:events');

// ============================================================
// WorkerPool 类
// ============================================================

class WorkerPool extends EventEmitter {
  /**
   * 创建 Worker Pool
   * @param {object} options - 配置选项
   * @param {number} options.size - Worker 数量
   * @param {string} options.workerScript - Worker 脚本路径
   */
  constructor(options = {}) {
    super();

    this.size = options.size || 4;
    this.workerScript = options.workerScript || path.join(__dirname, 'worker-compute.js');

    /** @type {Array<Worker>} 所有 Worker 实例 */
    this.workers = [];

    /** @type {Set<Worker>} 当前空闲的 Worker */
    this.availableWorkers = new Set();

    /** @type {Set<Worker>} 当前繁忙的 Worker */
    this.busyWorkers = new Set();

    /**
     * ⚠️ Bug: 任务队列没有容量限制
     * 如果任务提交速度远大于处理速度，队列会无限增长
     */
    /** @type {Array<object>} 等待处理的任务队列 */
    this.taskQueue = [];

    /** @type {Map<string, object>} 等待结果的任务映射 */
    this.pendingTasks = new Map();

    /** @type {number} 任务 ID 计数器 */
    this.taskIdCounter = 0;

    /** @type {Array<object>} 已完成的结果 */
    this.results = [];
  }

  /**
   * 初始化 Worker Pool
   * 创建所有 Worker 线程
   */
  async initialize() {
    console.log(`[WorkerPool] 初始化，创建 ${this.size} 个 Worker...`);

    const readyPromises = [];

    for (let i = 0; i < this.size; i++) {
      const readyPromise = this._createWorker(i);
      readyPromises.push(readyPromise);
    }

    // 等待所有 Worker 就绪
    await Promise.all(readyPromises);

    console.log(`[WorkerPool] 所有 ${this.size} 个 Worker 已就绪`);
    console.log(`[WorkerPool] 空闲: ${this.availableWorkers.size}, 繁忙: ${this.busyWorkers.size}`);
  }

  /**
   * 创建单个 Worker
   * @param {number} index - Worker 编号
   * @returns {Promise<void>} Worker 就绪后 resolve
   * @private
   */
  _createWorker(index) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerScript, {
        workerData: {
          workerId: index,
          workerName: `Pool-Worker-${index}`
        },
        execArgv: [`--inspect=0`]  // 自动分配调试端口
      });

      worker.poolIndex = index;
      worker.workerName = `Pool-Worker-${index}`;

      // Worker 就绪消息
      const onMessage = (msg) => {
        if (msg.type === 'ready') {
          console.log(`[WorkerPool] ${worker.workerName} 已就绪`);
          this.availableWorkers.add(worker);
          resolve();
        }
      };

      worker.once('message', onMessage);

      // 后续消息处理
      worker.on('message', (msg) => {
        this._handleWorkerMessage(worker, msg);
      });

      // Worker 错误处理
      worker.on('error', (err) => {
        console.error(`[WorkerPool] ${worker.workerName} 发生错误:`, err.message);
        this._handleWorkerError(worker, err);
      });

      // Worker 退出处理
      worker.on('exit', (code) => {
        console.log(`[WorkerPool] ${worker.workerName} 退出 (code=${code})`);
        this._handleWorkerExit(worker, code);
      });

      this.workers.push(worker);

      // 超时处理
      setTimeout(() => {
        reject(new Error(`${worker.workerName} 启动超时`));
      }, 10000);
    });
  }

  /**
   * 处理 Worker 返回的消息
   * @param {Worker} worker - 发送消息的 Worker
   * @param {object} msg - 消息内容
   * @private
   */
  _handleWorkerMessage(worker, msg) {
    if (msg.type === 'result') {
      const taskId = msg.taskId;
      const pendingTask = this.pendingTasks.get(taskId);

      if (pendingTask) {
        // 清除超时定时器
        clearTimeout(pendingTask.timeout);

        // 存储结果
        this.results.push({
          taskId: taskId,
          result: msg.result,
          duration: msg.duration,
          workerId: worker.poolIndex
        });

        // 从待处理任务中移除
        this.pendingTasks.delete(taskId);

        // 通知任务完成
        pendingTask.resolve(msg.result);

        // ⚠️ Bug: Worker 完成任务后没有被放回空闲池
        // 缺少以下代码：
        // this.busyWorkers.delete(worker);
        // this.availableWorkers.add(worker);
        // this._processQueue();
        //
        // 导致所有 Worker 在各自完成一个任务后都变成"繁忙"状态
        // 后续任务永远无法被分配，堆积在队列中

        console.log(
          `[WorkerPool] 任务 ${taskId} 完成 (${msg.duration}ms)` +
          ` | 空闲: ${this.availableWorkers.size}, 繁忙: ${this.busyWorkers.size}` +
          ` | 队列: ${this.taskQueue.length}`
        );
      }
    }
  }

  /**
   * 处理 Worker 错误
   * @param {Worker} worker - 出错的 Worker
   * @param {Error} err - 错误对象
   * @private
   */
  _handleWorkerError(worker, err) {
    // 将该 Worker 上正在处理的任务标记为失败
    for (const [taskId, task] of this.pendingTasks) {
      if (task.workerIndex === worker.poolIndex) {
        clearTimeout(task.timeout);
        task.reject(err);
        this.pendingTasks.delete(taskId);
      }
    }

    // ⚠️ Bug: Worker 崩溃后没有重建
    // 应该创建新的 Worker 替代崩溃的 Worker
    this.busyWorkers.delete(worker);
    this.availableWorkers.delete(worker);
  }

  /**
   * 处理 Worker 退出
   * @param {Worker} worker - 退出的 Worker
   * @param {number} code - 退出码
   * @private
   */
  _handleWorkerExit(worker, code) {
    this.busyWorkers.delete(worker);
    this.availableWorkers.delete(worker);

    const idx = this.workers.indexOf(worker);
    if (idx !== -1) this.workers.splice(idx, 1);

    // ⚠️ Bug: 同样没有重建退出的 Worker
    console.log(`[WorkerPool] 剩余 Worker: ${this.workers.length}`);
  }

  /**
   * 提交任务到 Worker Pool
   * @param {object} taskData - 任务数据
   * @param {number} [timeout=30000] - 超时时间（毫秒）
   * @returns {Promise<object>} 计算结果
   */
  submitTask(taskData, timeout = 30000) {
    const taskId = `pool-task-${++this.taskIdCounter}`;

    return new Promise((resolve, reject) => {
      const taskEntry = {
        taskId: taskId,
        data: taskData,
        resolve: resolve,
        reject: reject,
        workerIndex: -1,
        submittedAt: Date.now(),
        timeout: null
      };

      // 设置超时
      taskEntry.timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`任务 ${taskId} 超时 (${timeout}ms)`));
      }, timeout);

      // 尝试立即分配
      const worker = this._getAvailableWorker();

      if (worker) {
        // 有空闲 Worker，直接分配
        this._assignTask(worker, taskEntry);
      } else {
        // ⚠️ Bug: 没有检查队列长度限制
        // 如果队列已经非常长，应该拒绝新任务或发出警告
        this.taskQueue.push(taskEntry);

        if (this.taskQueue.length > 100) {
          console.warn(`[WorkerPool] ⚠️ 任务队列已积压 ${this.taskQueue.length} 个任务！`);
        }
      }
    });
  }

  /**
   * 获取一个空闲的 Worker
   * @returns {Worker|null} 空闲的 Worker，如果没有则返回 null
   * @private
   */
  _getAvailableWorker() {
    if (this.availableWorkers.size === 0) return null;

    // 取第一个空闲的 Worker
    const worker = this.availableWorkers.values().next().value;
    return worker;
  }

  /**
   * 将任务分配给 Worker
   * @param {Worker} worker - 目标 Worker
   * @param {object} taskEntry - 任务条目
   * @private
   */
  _assignTask(worker, taskEntry) {
    // 将 Worker 标记为繁忙
    this.availableWorkers.delete(worker);
    this.busyWorkers.add(worker);

    // 记录任务信息
    taskEntry.workerIndex = worker.poolIndex;
    taskEntry.assignedAt = Date.now();
    this.pendingTasks.set(taskEntry.taskId, taskEntry);

    // 发送任务给 Worker
    worker.postMessage({
      type: 'compute',
      taskId: taskEntry.taskId,
      payload: taskEntry.data
    });

    console.log(
      `[WorkerPool] 任务 ${taskEntry.taskId} -> ${worker.workerName}` +
      ` | 空闲: ${this.availableWorkers.size}, 繁忙: ${this.busyWorkers.size}`
    );
  }

  /**
   * 处理任务队列
   * 尝试将队列中的任务分配给空闲 Worker
   * @private
   */
  _processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.size > 0) {
      const taskEntry = this.taskQueue.shift();
      const worker = this._getAvailableWorker();

      if (worker) {
        this._assignTask(worker, taskEntry);
      } else {
        // 放回队列头部
        this.taskQueue.unshift(taskEntry);
        break;
      }
    }
  }

  /**
   * 获取 Worker Pool 的状态信息
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.size,
      busyWorkers: this.busyWorkers.size,
      queueLength: this.taskQueue.length,
      pendingTasks: this.pendingTasks.size,
      completedTasks: this.results.length
    };
  }

  /**
   * 关闭 Worker Pool
   * 终止所有 Worker 线程
   */
  async shutdown() {
    console.log('[WorkerPool] 正在关闭...');

    // 取消所有待处理的任务
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(new Error('Worker Pool 正在关闭'));
    }
    this.pendingTasks.clear();
    this.taskQueue = [];

    // 终止所有 Worker
    const terminatePromises = this.workers.map(worker => {
      console.log(`[WorkerPool] 终止 ${worker.workerName}`);
      return worker.terminate();
    });

    await Promise.all(terminatePromises);

    console.log('[WorkerPool] 已关闭');
  }
}

// ============================================================
// 独立运行演示
// ============================================================

/**
 * 当直接运行此文件时（node worker-pool.js），
 * 执行以下演示流程
 */
async function runDemo() {
  console.log('=== Worker Pool 演示 ===\n');

  // 创建 Worker Pool（4 个 Worker）
  const pool = new WorkerPool({ size: 4 });

  try {
    // 初始化
    await pool.initialize();

    console.log(`\n初始状态:`, pool.getStatus());

    // 提交一批任务
    console.log('\n--- 提交计算任务 ---');
    const taskPromises = [];

    for (let i = 1; i <= 12; i++) {
      const taskData = i % 2 === 0
        ? { limit: 50 + i * 5 }                     // 质数计算
        : { matrixSize: 3 + (i % 5) };              // 矩阵乘法

      const promise = pool.submitTask(taskData)
        .then(result => {
          console.log(`  任务 pool-task-${i} 完成:`, JSON.stringify(result).slice(0, 80) + '...');
          return result;
        })
        .catch(err => {
          console.error(`  任务 pool-task-${i} 失败:`, err.message);
        });

      taskPromises.push(promise);
    }

    // 等待 2 秒后打印中间状态
    setTimeout(() => {
      console.log(`\n中间状态 (2秒后):`, pool.getStatus());
    }, 2000);

    // 等待所有任务完成
    console.log('\n等待任务完成...');
    await Promise.allSettled(taskPromises);

    // 打印最终状态
    console.log(`\n最终状态:`, pool.getStatus());

    // ⚠️ 由于 Bug（Worker 不释放），你会发现：
    // - availableWorkers: 0（所有 Worker 都"繁忙"）
    // - busyWorkers: 4
    // - queueLength: 8（大部分任务堆积在队列中）
    // 只有前 4 个任务被处理，其余任务因 Worker 不释放而超时

    if (pool.getStatus().queueLength > 0) {
      console.log('\n⚠️ 检测到任务队列积压！可能有 Bug 导致 Worker 未释放。');
      console.log('   请检查 _handleWorkerMessage 方法中是否正确将 Worker 放回空闲池。');
    }

  } catch (err) {
    console.error('演示出错:', err);
  } finally {
    // 关闭 Worker Pool
    await pool.shutdown();
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runDemo().catch(console.error);
}

// 导出 WorkerPool 类供其他模块使用
module.exports = { WorkerPool };
