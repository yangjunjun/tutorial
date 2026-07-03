'use strict';

/**
 * Node.js 内存泄漏演示
 *
 * 本文件演示 4 种常见的内存泄漏类型，每种泄漏在独立函数中。
 * 同时包含一个内存监控函数，每 2 秒打印一次内存使用情况。
 *
 * 用法：
 *   node app.js [all|cache|event|closure|detached]
 *
 * 参数说明：
 *   all       - 同时运行所有泄漏演示（默认）
 *   cache     - 仅运行全局缓存泄漏
 *   event     - 仅运行事件监听器泄漏
 *   closure   - 仅运行闭包持有大对象泄漏
 *   detached  - 仅运行分离对象树泄漏
 */

const EventEmitter = require('events');

// ============================================================
// 内存监控：每 2 秒打印一次内存使用情况
// ============================================================

/**
 * 格式化字节数为可读字符串
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串（如 "25.6 MB"）
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 启动内存监控，每 2 秒打印一次内存使用详情
 * @returns {NodeJS.Timeout} 定时器引用，可用于 clearInterval 停止监控
 */
function startMemoryMonitor() {
  console.log('=== 内存监控已启动（每 2 秒打印一次）===\n');

  const timer = setInterval(() => {
    const mem = process.memoryUsage();
    const timestamp = new Date().toLocaleTimeString();

    console.log(`[${timestamp}] 内存使用情况:`);
    console.log(`  RSS（常驻集大小）    : ${formatBytes(mem.rss)}`);
    console.log(`  Heap Total（堆总量） : ${formatBytes(mem.heapTotal)}`);
    console.log(`  Heap Used（堆已用）  : ${formatBytes(mem.heapUsed)}`);
    console.log(`  External（外部内存） : ${formatBytes(mem.external)}`);
    console.log(`  ArrayBuffers         : ${formatBytes(mem.arrayBuffers)}`);
    console.log('');
  }, 2000);

  // 允许定时器不阻止进程退出
  if (timer.unref) {
    timer.unref();
  }

  return timer;
}

// ============================================================
// 泄漏类型 1：全局缓存无限增长
// ============================================================

/**
 * 演示全局缓存没有淘汰策略导致的内存泄漏
 * 模拟一个请求缓存，每 10ms 添加一条新记录，但永远不清理
 */
function leakGlobalCache() {
  console.log('\n--- 泄漏类型 1：全局缓存无限增长 ---');
  console.log('模拟请求缓存，无淘汰策略，持续添加数据...\n');

  // 全局缓存对象，没有任何淘汰策略
  const requestCache = {};
  let requestCount = 0;

  const timer = setInterval(() => {
    requestCount++;
    // 模拟缓存一次请求的结果，包含较大的响应体
    const cacheKey = `request_${requestCount}`;
    requestCache[cacheKey] = {
      url: `https://api.example.com/data/${requestCount}`,
      timestamp: Date.now(),
      // 模拟一个较大的响应体（约 10KB）
      response: 'x'.repeat(10240),
      headers: { 'content-type': 'application/json' },
      metadata: { requestId: requestCount, retries: 0 },
    };

    if (requestCount % 500 === 0) {
      const cacheSize = Object.keys(requestCache).length;
      console.log(`  已缓存 ${cacheSize} 个请求，` +
        `缓存中最新键: ${cacheKey}`);
    }
  }, 1);

  return timer;
}

// ============================================================
// 泄漏类型 2：事件监听器泄漏
// ============================================================

/**
 * 演示事件监听器累积导致的内存泄漏
 * 每次"连接"都添加一个新的监听器，但从未移除
 */
function leakEventListeners() {
  console.log('\n--- 泄漏类型 2：事件监听器累积 ---');
  console.log('模拟反复添加事件监听器但从不移除...\n');

  const emitter = new EventEmitter();
  // 提高最大监听器警告阈值，避免警告干扰输出
  emitter.setMaxListeners(0);

  let connectionCount = 0;

  const timer = setInterval(() => {
    connectionCount++;

    // 模拟一个"连接处理器"，每次连接创建一个新的监听器
    // 监听器内部闭包引用了一个较大的缓冲区
    const buffer = Buffer.alloc(8192); // 8KB 缓冲区
    buffer.fill(`connection-${connectionCount}`);

    emitter.on('data', function onData(chunk) {
      // 每个监听器都持有对 buffer 的引用
      // 即使"连接"已结束，这个监听器也不会被移除
      buffer.write(chunk || '', 0, 'utf-8');
    });

    if (connectionCount % 500 === 0) {
      const listenerCount = emitter.listenerCount('data');
      console.log(`  已有 ${listenerCount} 个 'data' 事件监听器`);
    }
  }, 1);

  return timer;
}

// ============================================================
// 泄漏类型 3：闭包持有大对象引用（定时器回调引用大数组）
// ============================================================

/**
 * 演示闭包持有大对象引用导致的内存泄漏
 * 创建一个定时器，其回调闭包引用一个巨大的数组
 * 即使不再需要该数组，定时器也阻止 GC 回收它
 */
function leakClosureBigObject() {
  console.log('\n--- 泄漏类型 3：闭包持有大对象引用 ---');
  console.log('创建多个定时器，每个都闭包引用一个大数组...\n');

  const timers = [];

  // 每 500ms 创建一个新的"轮询任务"
  const createTimer = setInterval(() => {
    // 模拟从数据库或 API 获取的大量数据
    const bigData = [];
    for (let i = 0; i < 10000; i++) {
      bigData.push({
        id: i,
        name: `item-${i}`,
        payload: 'data'.repeat(50), // 每个对象约 200 字节
      });
    }

    // 创建一个定时器，闭包引用 bigData
    const innerTimer = setInterval(() => {
      // 只使用 bigData 的一个很小的信息
      // 但整个 bigData 都无法被 GC 回收
      if (bigData.length > 0) {
        const _unused = bigData[0].id; // 实际只用了第一个元素的 id
      }
    }, 60000); // 每分钟执行一次

    timers.push(innerTimer);

    if (timers.length % 5 === 0) {
      console.log(`  已创建 ${timers.length} 个轮询定时器，` +
        `每个持有 ~2MB 数据的引用`);
    }
  }, 500);

  return createTimer;
}

// ============================================================
// 泄漏类型 4：分离的 DOM-like 树（对象互相引用无法回收）
// ============================================================

/**
 * 演示分离的对象树导致的内存泄漏
 * 模拟一个类似 DOM 的树结构，节点互相引用
 * 即使从主数据结构中移除，循环引用仍阻止回收（在旧引擎中）
 * 在新版 V8 中，循环引用可以被 GC 处理，但如果有外部引用则仍然泄漏
 */
function leakDetachedTree() {
  console.log('\n--- 泄漏类型 4：分离的对象树 ---');
  console.log('反复创建大型对象树，部分节点被意外保留...\n');

  // 一个全局数组，意外地保留了对旧树节点的引用
  const retainedNodes = [];

  const timer = setInterval(() => {
    // 创建一棵模拟 DOM 树
    const root = { tag: 'div', children: [], parent: null, data: '' };

    // 构建 100 个子节点，每个有 10 个子节点（共 1001 个节点）
    for (let i = 0; i < 100; i++) {
      const child = {
        tag: 'div',
        children: [],
        parent: root,
        data: 'x'.repeat(1024), // 每个节点约 1KB 数据
      };
      root.children.push(child);

      for (let j = 0; j < 10; j++) {
        const grandchild = {
          tag: 'span',
          children: [],
          parent: child,
          data: 'y'.repeat(512), // 每个孙节点约 512B
        };
        child.children.push(grandchild);

        // 模拟"事件处理器"引用：某些孙节点被添加到全局数组
        // 这导致整棵子树都无法被 GC 回收（通过 parent 链可访问所有祖先）
        if (j === 0) {
          retainedNodes.push(grandchild);
        }
      }
    }

    // "移除"树——但由于 retainedNodes 持有孙节点引用，
    // 通过 parent 引用链，整个子树都无法被回收
    // root = null; // 即使 root 被置空也没用

    if (retainedNodes.length % 100 === 0) {
      console.log(`  已保留 ${retainedNodes.length} 个节点（每个连接到完整子树）`);
    }
  }, 100);

  return timer;
}

// ============================================================
// 导出函数，方便独立测试
// ============================================================

module.exports = {
  startMemoryMonitor,
  leakGlobalCache,
  leakEventListeners,
  leakClosureBigObject,
  leakDetachedTree,
  formatBytes,
};

// ============================================================
// 主程序入口
// ============================================================

if (require.main === module) {
  const mode = process.argv[2] || 'all';

  console.log('============================================');
  console.log('   Node.js 内存泄漏演示');
  console.log('============================================');
  console.log(`运行模式: ${mode}`);
  console.log(`进程 PID: ${process.pid}`);
  console.log('按 Ctrl+C 退出\n');

  // 启动内存监控
  const monitorTimer = startMemoryMonitor();

  // 根据参数决定运行哪些泄漏
  const timers = [];

  if (mode === 'all' || mode === 'cache') {
    timers.push(leakGlobalCache());
  }
  if (mode === 'all' || mode === 'event') {
    timers.push(leakEventListeners());
  }
  if (mode === 'all' || mode === 'closure') {
    timers.push(leakClosureBigObject());
  }
  if (mode === 'all' || mode === 'detached') {
    timers.push(leakDetachedTree());
  }

  // 30 秒后自动清理并退出，避免无限制运行
  setTimeout(() => {
    console.log('\n--- 30 秒演示结束，正在清理 ---');
    clearInterval(monitorTimer);
    timers.forEach((t) => clearInterval(t));

    // 强制一次 GC（仅在使用 --expose-gc 时有效）
    if (global.gc) {
      global.gc();
      console.log('已触发手动 GC');
    }

    const finalMem = process.memoryUsage();
    console.log(`\n最终内存使用:`);
    console.log(`  RSS: ${formatBytes(finalMem.rss)}`);
    console.log(`  Heap Used: ${formatBytes(finalMem.heapUsed)}`);
    console.log('\n提示：使用 --expose-gc 标志可以看到 GC 后的真实内存：');
    console.log('  node --expose-gc app.js');
  }, 30000);
}
