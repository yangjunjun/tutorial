/**
 * Worker Thread 计算脚本
 *
 * 在 Worker 线程中执行 CPU 密集型计算任务：
 * - 质数生成：找出前 N 个质数
 * - 矩阵乘法：两个矩阵相乘
 *
 * Worker 通过 postMessage 与主线程通信。
 *
 * ⚠️ 包含故意植入的 Bug：
 * - 不处理终止信号（message 类型为 'terminate' 时不清理资源）
 * - 质数计算中有 off-by-one 错误
 */

const { workerData, parentPort, isMainThread } = require('node:worker_threads');

// 确保只在 Worker 线程中运行
if (isMainThread) {
  console.error('此文件应作为 Worker 线程运行，不应直接执行');
  process.exit(1);
}

// ============================================================
// Worker 信息
// ============================================================

const workerId = workerData.workerId;
const workerName = workerData.workerName || `Worker-${workerId}`;

console.log(`[${workerName}] Worker 已启动 (线程 ID: ${workerId})`);

// ============================================================
// 计算函数
// ============================================================

/**
 * 判断一个数是否为质数
 * @param {number} n - 待判断的数
 * @returns {boolean} 是否为质数
 */
function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;

  // 只需检查到 sqrt(n)
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * 生成前 N 个质数
 * ⚠️ Bug: off-by-one 错误，实际只生成了 N-1 个质数
 *
 * @param {number} count - 需要生成的质数数量
 * @returns {number[]} 质数数组
 */
function generatePrimes(count) {
  const primes = [];
  let num = 2;

  // ⚠️ Bug: 条件应该是 primes.length < count
  // 但这里写成了 primes.length < count - 1，导致少生成一个质数
  while (primes.length < count - 1) {
    if (isPrime(num)) {
      primes.push(num);
    }
    num++;

    // 安全检查：防止无限循环（最多检查到 100 万）
    if (num > 1000000) {
      console.warn(`[${workerName}] 质数生成达到上限，当前找到 ${primes.length} 个`);
      break;
    }
  }

  return primes;
}

/**
 * 计算区间内所有整数的和
 * @param {number} start - 起始值（包含）
 * @param {number} end - 结束值（包含）
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
 * 矩阵乘法
 * @param {number[][]} matrixA - 矩阵 A
 * @param {number[][]} matrixB - 矩阵 B
 * @returns {number[][]} 结果矩阵
 */
function matrixMultiply(matrixA, matrixB) {
  const rowsA = matrixA.length;
  const colsA = matrixA[0].length;
  const colsB = matrixB[0].length;

  // 初始化结果矩阵
  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = new Array(colsB).fill(0);
  }

  // 矩阵乘法
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += matrixA[i][k] * matrixB[k][j];
      }
    }
  }

  return result;
}

/**
 * 生成随机方阵
 * @param {number} size - 矩阵维度
 * @returns {number[][]} 随机矩阵
 */
function generateRandomMatrix(size) {
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = Math.floor(Math.random() * 100);
    }
  }
  return matrix;
}

// ============================================================
// 任务处理
// ============================================================

/**
 * 处理来自父线程的计算任务
 * @param {object} task - 任务对象
 * @param {string} task.type - 任务类型
 * @param {string} task.taskId - 任务 ID
 * @param {object} task.payload - 任务数据
 */
function handleTask(task) {
  const { type, taskId, payload } = task;
  const startTime = Date.now();

  console.log(`[${workerName}] 开始处理任务 ${taskId} (类型: ${type})`);

  let result;

  switch (type) {
    case 'compute':
      // 根据 payload 决定计算类型
      if (payload.limit) {
        // 质数生成
        const primes = generatePrimes(payload.limit);
        result = {
          type: 'primes',
          count: primes.length,
          primes: primes,
          lastPrime: primes[primes.length - 1]
        };
      } else if (payload.matrixSize) {
        // 矩阵乘法
        const size = payload.matrixSize;
        const matrixA = generateRandomMatrix(size);
        const matrixB = generateRandomMatrix(size);
        const product = matrixMultiply(matrixA, matrixB);
        result = {
          type: 'matrix',
          matrixSize: size,
          resultSample: product[0]?.slice(0, 5)  // 只返回第一行前 5 个元素
        };
      } else {
        result = { type: 'unknown', error: '无法识别的计算类型' };
      }
      break;

    case 'ping':
      // 心跳检测
      result = { type: 'pong', timestamp: Date.now() };
      break;

    default:
      console.warn(`[${workerName}] 未知的任务类型: ${type}`);
      result = { type: 'error', error: `未知任务类型: ${type}` };
  }

  const duration = Date.now() - startTime;
  console.log(`[${workerName}] 任务 ${taskId} 完成，耗时 ${duration}ms`);

  // 发送结果给父线程
  parentPort.postMessage({
    type: 'result',
    taskId: taskId,
    result: result,
    duration: duration,
    workerId: workerId
  });
}

// ============================================================
// 消息监听
// ============================================================

/**
 * 监听来自父线程的消息
 * ⚠️ Bug: 不处理 'terminate' 类型的消息
 * 当父线程发送终止请求时，Worker 不会清理资源
 */
parentPort.on('message', (message) => {
  console.log(`[${workerName}] 收到消息:`, message.type);

  // ⚠️ Bug: 缺少对 'terminate' 消息的处理
  // 当父线程发送 { type: 'terminate' } 时，
  // Worker 应该清理资源并退出，但这里直接进入了 default 分支
  switch (message.type) {
    case 'compute':
    case 'ping':
      handleTask(message);
      break;

    // 缺少以下处理：
    // case 'terminate':
    //   console.log(`[${workerName}] 收到终止信号，正在清理...`);
    //   // 清理资源...
    //   process.exit(0);
    //   break;

    default:
      // ⚠️ 对于未知消息类型，只是打印警告，不做任何处理
      // 如果父线程发送了 'terminate'，这里会被忽略
      console.warn(`[${workerName}] 未处理的消息类型: ${message.type}`);
  }
});

// ============================================================
// Worker 就绪通知
// ============================================================

// 通知父线程 Worker 已就绪
parentPort.postMessage({
  type: 'ready',
  workerId: workerId,
  workerName: workerName,
  timestamp: Date.now()
});

console.log(`[${workerName}] Worker 就绪，等待任务...`);
