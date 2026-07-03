/**
 * 异步调试练习题
 *
 * 本文件包含 3 个带有故意设置的异步 Bug 的练习。
 * 请阅读代码，找出 Bug，然后修复它们。
 *
 * 运行方式：node exercise.js
 *
 * 每个练习会输出当前的错误行为，你的目标是修复代码使其输出正确结果。
 * 提示和答案在文件底部（尽量先自己找 Bug！）。
 */

// ============================================================
// 练习 1：并行 vs 串行
// ============================================================
// 目标：同时发起 5 个数据获取请求，要求总耗时不超过 300ms
// 当前问题：请求是串行执行的，总耗时约 1000ms
// ============================================================

console.log('╔══════════════════════════════════════╗');
console.log('║          异步调试练习题               ║');
console.log('╚══════════════════════════════════════╝\n');

/**
 * 模拟从远程获取数据
 * @param {string} endpoint - API 端点
 * @returns {Promise<Object>}
 */
async function fetchData(endpoint) {
  // 模拟网络延迟 200ms
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        endpoint,
        data: `来自 ${endpoint} 的数据`,
        timestamp: Date.now()
      });
    }, 200);
  });
}

async function exercise1() {
  console.log('═══ 练习 1：并行 vs 串行 ═══\n');

  const endpoints = [
    '/api/users',
    '/api/posts',
    '/api/comments',
    '/api/tags',
    '/api/categories'
  ];

  const startTime = Date.now();

  // BUG：这段代码看起来是在"并行"获取数据，但实际是串行的
  // 提示：注意 await 的位置
  const results = [];
  for (const endpoint of endpoints) {
    const result = await fetchData(endpoint);
    results.push(result);
  }

  const elapsed = Date.now() - startTime;

  console.log(`获取了 ${results.length} 个端点的数据`);
  console.log(`总耗时: ${elapsed}ms`);

  if (elapsed > 500) {
    console.log(`❌ 太慢了！应该是并行执行（约 200ms），但实际耗时 ${elapsed}ms`);
    console.log('   提示：检查循环中 await 的位置\n');
  } else {
    console.log('✅ 正确！请求是并行执行的。\n');
  }

  return results;
}

// ============================================================
// 练习 2：重试函数中的无限循环 Bug
// ============================================================
// 目标：实现一个带重试的异步操作，最多重试 3 次
// 当前问题：重试逻辑有 Bug，可能导致无限循环或跳过重试
// ============================================================

// 调用计数器，用于确定性地模拟失败
let operationCallCount = 0;

/**
 * 模拟一个不可靠的操作
 * 前 5 次调用一定失败，第 6 次才成功
 * @returns {Promise<string>}
 */
async function unreliableOperation() {
  operationCallCount++;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (operationCallCount <= 5) {
        reject(new Error('操作失败'));
      } else {
        resolve('操作成功！');
      }
    }, 50);
  });
}

async function exercise2() {
  console.log('═══ 练习 2：重试函数 Bug ═══\n');

  // 重置调用计数
  operationCallCount = 0;

  /**
   * 带重试的异步操作
   * @param {Function} operation - 要执行的异步操作
   * @param {number} maxRetries - 最大重试次数
   */
  async function withRetry(operation, maxRetries) {
    // BUG：这个重试逻辑有一个关键问题
    // attempt 变量在 catch 块中被错误地重置

    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        attempt++;
        console.log(`  第 ${attempt} 次尝试失败: ${error.message}`);

        // BUG：这里把 attempt 重置了！
        // 导致循环条件 attempt < maxRetries 永远为真
        // 程序会一直重试，直到操作碰巧成功（或超时保护触发）
        attempt = 0;

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    throw new Error(`在 ${maxRetries} 次重试后仍然失败`);
  }

  const startTime = Date.now();

  try {
    // 给重试函数设置超时保护，防止无限循环卡死
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('超时：重试函数可能陷入了无限循环！')), 5000)
    );

    const result = await Promise.race([
      withRetry(unreliableOperation, 3),
      timeout
    ]);

    const totalCalls = operationCallCount;
    console.log(`结果: ${result}`);
    console.log(`实际操作调用次数: ${totalCalls}`);

    if (totalCalls > 3) {
      console.log(`❌ 重试次数限制失效！maxRetries=3 但实际调用了 ${totalCalls} 次`);
      console.log('   提示：检查 catch 块中 attempt 变量是否被错误重置\n');
    } else {
      console.log('✅ 重试函数正常工作\n');
    }
  } catch (error) {
    console.log(`❌ ${error.message}`);
    console.log('   提示：检查 catch 块中 attempt 变量是否被错误重置\n');
  }

  const elapsed = Date.now() - startTime;
  console.log(`耗时: ${elapsed}ms\n`);
}

// ============================================================
// 练习 3：EventEmitter 的内存泄漏（监听器累积）
// ============================================================
// 目标：正确管理事件监听器的生命周期，避免内存泄漏
// 当前问题：每次处理请求时都添加新的监听器但从不移除
// ============================================================

const EventEmitter = require('events');

async function exercise3() {
  console.log('═══ 练习 3：EventEmitter 内存泄漏 ═══\n');

  // 创建事件发射器
  const dataBus = new EventEmitter();

  /**
   * 模拟处理一个请求
   * 每个请求都需要监听 dataBus 上的 'data' 事件
   * @param {string} requestId - 请求 ID
   */
  async function processRequest(requestId) {
    return new Promise((resolve) => {
      const collectedData = [];

      // BUG：每次调用都添加一个新的监听器
      // 但在请求完成后从不移除！
      // 处理 100 个请求后，就会有 100 个监听器堆积在 dataBus 上
      const onData = (data) => {
        collectedData.push(data);
      };

      dataBus.on('data', onData);

      // 模拟请求处理过程
      setTimeout(() => {
        // 请求完成，但我们忘记移除监听器了！
        // 应该在这里调用：dataBus.removeListener('data', onData)
        // 或者使用 dataBus.once() 代替 dataBus.on()

        resolve({
          requestId,
          dataCount: collectedData.length
        });
      }, 100);
    });
  }

  // 模拟处理 10 个请求
  const requestPromises = [];
  for (let i = 1; i <= 10; i++) {
    requestPromises.push(processRequest(`request-${i}`));
  }

  // 在请求处理期间，发送一些数据事件
  const intervalId = setInterval(() => {
    dataBus.emit('data', { value: Math.random(), time: Date.now() });
  }, 20);

  // 等待所有请求完成
  const results = await Promise.all(requestPromises);

  // 停止发送数据
  clearInterval(intervalId);

  // 检查监听器数量
  const listenerCount = dataBus.listenerCount('data');
  console.log(`处理了 ${results.length} 个请求`);
  console.log(`dataBus 上 'data' 事件的监听器数量: ${listenerCount}`);

  if (listenerCount > 0) {
    console.log(`❌ 内存泄漏！应该没有残留监听器，但有 ${listenerCount} 个`);
    console.log('   提示：在请求完成后需要移除监听器');

    // Node.js 默认的 maxListeners 警告阈值是 10
    if (listenerCount >= 10) {
      console.log('   注意：监听器数量已达到默认警告阈值！');
    }
    console.log('');
  } else {
    console.log('✅ 正确！没有内存泄漏，监听器已被正确清理\n');
  }

  // 清理所有监听器（为下一次运行准备）
  dataBus.removeAllListeners('data');
}

// ============================================================
// 运行所有练习
// ============================================================

async function runAllExercises() {
  // 练习 1
  await exercise1();

  console.log('───────────────────────────────\n');

  // 练习 2
  await exercise2();

  console.log('───────────────────────────────\n');

  // 练习 3
  await exercise3();

  console.log('═══════════════════════════════════════');
  console.log('所有练习运行完毕。\n');
  console.log('修复指南：');
  console.log('');
  console.log('练习 1 修复方法：');
  console.log('  将 for...of 循环中的 await 改为 Promise.all + map');
  console.log('  const results = await Promise.all(endpoints.map(ep => fetchData(ep)));');
  console.log('');
  console.log('练习 2 修复方法：');
  console.log('  删除 catch 块中的 "attempt = 0;" 这一行');
  console.log('  attempt 变量已经在 try 之前声明并在 catch 中递增，不应被重置');
  console.log('');
  console.log('练习 3 修复方法（任选一种）：');
  console.log('  方法 A：在 resolve 之前添加 dataBus.removeListener("data", onData)');
  console.log('  方法 B：使用 dataBus.once() 代替 dataBus.on()（如果只需要一次）');
  console.log('  方法 C：使用 AbortController 取消监听');
}

// 监听未处理的拒绝，帮助发现遗漏的错误处理
process.on('unhandledRejection', (reason) => {
  console.error('\n[!!!] 未处理的 Promise 拒绝:', reason);
});

runAllExercises();
