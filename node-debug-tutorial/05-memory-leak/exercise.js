'use strict';

/**
 * 内存泄漏狩猎练习
 *
 * 本文件包含 3 个练习场景，每个场景都存在隐藏的内存泄漏。
 * 请阅读代码，找出泄漏的位置和原因，并尝试修复。
 *
 * 每个练习都会打印内存使用情况，方便你观察泄漏趋势。
 *
 * 用法：node exercise.js [1|2|3|all]
 *   1   - 练习 1：会话存储泄漏
 *   2   - 练习 2：日志缓冲区泄漏
 *   3   - 练习 3：发布/订阅系统泄漏
 *   all - 运行所有练习（默认）
 */

const EventEmitter = require('events');

// ============================================================
// 辅助函数
// ============================================================

/**
 * 格式化内存使用为 MB
 * @param {number} bytes - 字节数
 * @returns {string}
 */
function toMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * 打印当前内存状态
 * @param {string} label - 标签
 */
function printMem(label) {
  const mem = process.memoryUsage();
  console.log(`  [${label}] Heap Used: ${toMB(mem.heapUsed)} MB | RSS: ${toMB(mem.rss)} MB`);
}

// ============================================================
// 练习 1：会话存储泄漏（Session Store）
//
// 场景：一个 Web 服务器使用内存存储用户会话。
// 问题：会话永远不会过期，导致 sessionStore 无限增长。
//
// 你的任务：
// 1. 找到泄漏的根源
// 2. 添加会话过期机制（TTL）
// 3. 验证修复后的内存使用是否稳定
// ============================================================

function exercise1_sessionStore() {
  console.log('\n============================================');
  console.log('练习 1：会话存储泄漏');
  console.log('============================================');
  console.log('场景：Web 服务器的内存会话存储');
  console.log('问题：每次用户访问都创建会话，但会话从不过期\n');

  // 会话存储
  const sessionStore = {};

  /**
   * 模拟用户访问，创建会话
   * @param {string} userId - 用户 ID
   */
  function handleUserVisit(userId) {
    // 为每个用户创建一个会话
    const sessionId = `sess_${userId}_${Date.now()}`;
    sessionStore[sessionId] = {
      userId: userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      // 模拟会话数据
      data: {
        cart: Array.from({ length: 20 }, (_, i) => ({
          productId: `prod_${i}`,
          name: `商品 ${i}`,
          price: Math.floor(Math.random() * 1000),
        })),
        preferences: { theme: 'dark', language: 'zh-CN' },
        history: Array.from({ length: 50 }, (_, i) => `/page/${i}`),
      },
      // 每个会话大约 5KB 的数据
      _padding: 'x'.repeat(5120),
    };
  }

  printMem('开始');

  // 模拟 10000 次用户访问
  for (let i = 0; i < 10000; i++) {
    // 模拟用户 ID（有 1000 个不同的用户，但每次访问都创建新会话）
    const userId = `user_${i % 1000}`;
    handleUserVisit(userId);
  }

  const sessionCount = Object.keys(sessionStore).length;
  console.log(`  会话存储中有 ${sessionCount} 个会话`);
  printMem('结束后');

  console.log(`\n  问题：${sessionCount} 个会话全部保留在内存中，没有任何过期机制`);
  console.log(`  提示：尝试添加 TTL（生存时间）或使用定期清理逻辑\n`);
}

// ============================================================
// 练习 2：日志缓冲区泄漏（Logger Buffer）
//
// 场景：一个日志系统使用缓冲区存储日志，定期写入文件。
// 问题：日志缓冲区只增不减，flush 操作并没有真正清除数据。
//
// 你的任务：
// 1. 找到 flush 方法的问题
// 2. 修复缓冲区清理逻辑
// 3. 验证修复效果
// ============================================================

function exercise2_loggerBuffer() {
  console.log('\n============================================');
  console.log('练习 2：日志缓冲区泄漏');
  console.log('============================================');
  console.log('场景：日志系统的内存缓冲区');
  console.log('问题：日志被"写入"后缓冲区没有真正清空\n');

  // 简单的日志系统
  class Logger {
    constructor() {
      // 日志缓冲区
      this.buffer = [];
      // 已"写入"的日志计数（但实际并没有清除 buffer）
      this.flushedCount = 0;
    }

    /**
     * 记录一条日志
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     */
    log(level, message) {
      this.buffer.push({
        timestamp: Date.now(),
        level: level,
        message: message,
        // 模拟日志附加信息
        context: {
          requestId: Math.random().toString(36).slice(2),
          userId: `user_${Math.floor(Math.random() * 10000)}`,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        // 每条日志约 200 字节
        _raw: JSON.stringify({ level, message, extra: 'x'.repeat(150) }),
      });
    }

    /**
     * 将日志"写入磁盘"
     * 注意：这个方法有一个隐蔽的 bug！
     */
    flush() {
      if (this.buffer.length === 0) return;

      // "写入"日志到文件（模拟）
      const logsToWrite = this.buffer.slice(); // 复制一份用于写入
      this.flushedCount += logsToWrite.length;

      // BUG：虽然"写入"了日志，但没有清除 buffer！
      // 应该加上：this.buffer = []; 或 this.buffer.length = 0;
      // 但目前 buffer 保持不变，日志永远不会被释放

      // 模拟异步写入延迟
      // setTimeout(() => { /* 写入完成 */ }, 100);
    }

    /**
     * 获取缓冲区大小
     */
    getBufferSize() {
      return this.buffer.length;
    }
  }

  const logger = new Logger();
  printMem('开始');

  // 模拟大量日志写入
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  for (let i = 0; i < 20000; i++) {
    const level = levels[i % levels.length];
    logger.log(level, `处理请求 #${i} - ${level} 级别的日志消息`);

    // 每 1000 条日志执行一次 flush
    if (i > 0 && i % 1000 === 0) {
      logger.flush();
    }
  }

  // 最后再 flush 一次
  logger.flush();

  console.log(`  已 flush 计数: ${logger.flushedCount}`);
  console.log(`  缓冲区中仍有: ${logger.getBufferSize()} 条日志`);
  printMem('结束后');

  console.log(`\n  问题：flush() 方法只复制了日志但没有清空 buffer`);
  console.log(`  提示：检查 flush() 方法，确保在"写入"后清空缓冲区\n`);
}

// ============================================================
// 练习 3：发布/订阅系统泄漏（Pub/Sub System）
//
// 场景：一个消息系统使用发布/订阅模式。
// 问题：订阅者不断添加但从不取消订阅，
//       而且每个订阅者的回调都闭包引用了大量数据。
//
// 你的任务：
// 1. 找到订阅者累积的位置
// 2. 添加订阅者生命周期管理
// 3. 验证修复效果
// ============================================================

function exercise3_pubsubSystem() {
  console.log('\n============================================');
  console.log('练习 3：发布/订阅系统泄漏');
  console.log('============================================');
  console.log('场景：消息发布/订阅系统');
  console.log('问题：订阅者不断添加但从不取消订阅\n');

  // 简单的发布/订阅系统
  class PubSub {
    constructor() {
      this.subscribers = {};
    }

    /**
     * 订阅一个主题
     * @param {string} topic - 主题名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    subscribe(topic, callback) {
      if (!this.subscribers[topic]) {
        this.subscribers[topic] = [];
      }
      this.subscribers[topic].push(callback);

      // 返回取消订阅的函数
      return () => {
        this.subscribers[topic] = this.subscribers[topic].filter(
          (cb) => cb !== callback
        );
      };
    }

    /**
     * 发布消息到指定主题
     * @param {string} topic - 主题名称
     * @param {*} data - 消息数据
     */
    publish(topic, data) {
      const callbacks = this.subscribers[topic] || [];
      callbacks.forEach((cb) => cb(data));
    }

    /**
     * 获取某个主题的订阅者数量
     * @param {string} topic - 主题名称
     * @returns {number}
     */
    getSubscriberCount(topic) {
      return (this.subscribers[topic] || []).length;
    }
  }

  const pubsub = new PubSub();
  printMem('开始');

  /**
   * 模拟一个"工作线程"订阅消息
   * 每次创建都会订阅，但从不取消
   */
  function createWorker(workerId) {
    // 每个 worker 都有一个大的本地数据缓存
    const workerCache = Buffer.alloc(4096); // 4KB 缓存
    workerCache.fill(`worker-${workerId}-data`);

    // 订阅 "tasks" 主题
    // 注意：返回的 unsubscribe 函数没有被调用！
    const unsubscribe = pubsub.subscribe('tasks', (task) => {
      // 处理任务时引用 workerCache
      // 这意味着即使 worker 应该被销毁，闭包仍持有 workerCache
      workerCache.write(task.message || '', 0, 'utf-8');
    });

    // BUG：没有保存或调用 unsubscribe
    // 当 worker 完成工作或超时时，应该调用 unsubscribe()

    // 模拟 worker 完成后的清理（但被注释掉了）
    // setTimeout(() => {
    //   unsubscribe(); // 应该在这里取消订阅
    // }, workerLifespan);

    return { id: workerId, unsubscribe };
  }

  // 模拟 5000 个工作线程的创建和销毁
  const workers = [];
  for (let i = 0; i < 5000; i++) {
    const worker = createWorker(i);
    workers.push(worker);

    // 模拟发布任务
    if (i % 100 === 0) {
      pubsub.publish('tasks', { message: `任务批次 ${i / 100}` });
    }
  }

  const taskSubscribers = pubsub.getSubscriberCount('tasks');
  console.log(`  'tasks' 主题的订阅者数量: ${taskSubscribers}`);
  console.log(`  创建的 worker 数量: ${workers.length}`);
  printMem('结束后');

  console.log(`\n  问题：每个 worker 都订阅了 'tasks' 但从未取消订阅`);
  console.log(`  结果：${taskSubscribers} 个订阅者全部驻留在内存中`);
  console.log(`  提示：在 worker 完成工作后调用 unsubscribe() 取消订阅`);
  console.log(`  额外提示：可以添加最大订阅者数量限制或使用弱引用\n`);
}

// ============================================================
// 主程序入口
// ============================================================

if (require.main === module) {
  const mode = process.argv[2] || 'all';

  console.log('============================================');
  console.log('   内存泄漏狩猎练习');
  console.log('============================================');
  console.log(`运行模式: ${mode}\n`);
  console.log('说明：每个练习都包含一个隐藏的内存泄漏。');
  console.log('请阅读代码，找出泄漏原因，并尝试修复。\n');

  printMem('初始状态');

  if (mode === '1' || mode === 'all') {
    exercise1_sessionStore();
  }
  if (mode === '2' || mode === 'all') {
    exercise2_loggerBuffer();
  }
  if (mode === '3' || mode === 'all') {
    exercise3_pubsubSystem();
  }

  printMem('最终状态');

  console.log('\n============================================');
  console.log('练习完成');
  console.log('============================================');
  console.log('\n修复建议：');
  console.log('1. 会话存储：添加 TTL（生存时间），定期清理过期会话');
  console.log('2. 日志缓冲区：在 flush() 方法末尾添加 this.buffer = []');
  console.log('3. 发布/订阅：在 worker 生命周期结束时调用 unsubscribe()');
  console.log('\n进阶挑战：');
  console.log('- 尝试用 WeakMap 替代普通对象存储');
  console.log('- 为每个场景添加自动化测试来检测泄漏');
  console.log('- 使用 monitor.js 工具监控修复前后的内存变化');
}

// 导出供测试使用
module.exports = {
  exercise1_sessionStore,
  exercise2_loggerBuffer,
  exercise3_pubsubSystem,
};
