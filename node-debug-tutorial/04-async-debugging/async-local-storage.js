/**
 * AsyncLocalStorage 请求上下文追踪示例
 *
 * 演示如何使用 AsyncLocalStorage 在并发请求中追踪上下文，
 * 使日志自动包含请求 ID，便于调试并发问题。
 *
 * 运行方式：node async-local-storage.js
 */

const { AsyncLocalStorage } = require('async_hooks');

// ============================================================
// 创建全局的异步本地存储实例
// ============================================================

const requestStore = new AsyncLocalStorage();

// 请求 ID 计数器
let requestIdCounter = 0;

/**
 * 生成唯一的请求 ID
 */
function generateRequestId() {
  return `req-${++requestIdCounter}-${Date.now().toString(36)}`;
}

// ============================================================
// 带上下文的日志函数
// ============================================================

/**
 * 日志函数 —— 自动附加请求 ID
 * 在 AsyncLocalStorage 的上下文中调用时，会自动获取当前请求 ID
 */
function log(message, ...args) {
  const store = requestStore.getStore();
  const requestId = store ? store.requestId : '无上下文';
  const prefix = store ? `[${requestId}]` : '[全局]';

  // 添加时间戳
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  console.log(`${timestamp} ${prefix} ${message}`, ...args);
}

// ============================================================
// 模拟的服务端处理逻辑
// ============================================================

/**
 * 模拟数据库查询
 * @param {string} query - SQL 查询语句
 * @param {number} delay - 模拟耗时（毫秒）
 */
async function queryDatabase(query, delay) {
  log(`执行数据库查询: "${query}"`);

  return new Promise(resolve => {
    setTimeout(() => {
      const result = { rows: [{ id: 1, name: '示例数据' }], rowCount: 1 };
      log(`查询完成，返回 ${result.rowCount} 行`);
      resolve(result);
    }, delay);
  });
}

/**
 * 模拟外部 API 调用
 * @param {string} url - API 地址
 * @param {number} delay - 模拟耗时（毫秒）
 */
async function callExternalAPI(url, delay) {
  log(`调用外部 API: ${url}`);

  return new Promise(resolve => {
    setTimeout(() => {
      const response = { status: 200, data: { success: true } };
      log(`API 响应: ${response.status}`);
      resolve(response);
    }, delay);
  });
}

/**
 * 模拟缓存操作
 * @param {string} key - 缓存键
 * @param {number} delay - 模拟耗时（毫秒）
 */
async function getFromCache(key, delay) {
  log(`查询缓存: ${key}`);

  return new Promise(resolve => {
    setTimeout(() => {
      // 模拟缓存未命中
      const cached = null;
      log(`缓存${cached ? '命中' : '未命中'}`);
      resolve(cached);
    }, delay);
  });
}

/**
 * 处理单个请求
 * @param {Object} request - 请求对象 { method, path, body }
 */
async function handleRequest(request) {
  log(`收到请求: ${request.method} ${request.path}`);

  const startTime = Date.now();

  try {
    // 第一步：检查缓存
    const cached = await getFromCache(request.path, 50);

    if (cached) {
      log('使用缓存数据响应');
      return { status: 200, data: cached, fromCache: true };
    }

    // 第二步：查询数据库
    const dbResult = await queryDatabase(
      `SELECT * FROM ${request.path.slice(1)}`,
      100 + Math.random() * 200
    );

    // 第三步：调用外部 API 做数据增强
    const apiResult = await callExternalAPI(
      `https://api.example.com/enrich`,
      80 + Math.random() * 150
    );

    const elapsed = Date.now() - startTime;
    log(`请求处理完成，耗时: ${elapsed}ms`);

    return {
      status: 200,
      data: dbResult.rows,
      enriched: apiResult.data.success,
      elapsed
    };
  } catch (error) {
    log(`请求处理失败: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

// ============================================================
// 模拟 HTTP 服务器
// ============================================================

/**
 * 模拟服务器接收请求
 * 每个请求在独立的 AsyncLocalStorage 上下文中运行
 */
async function simulateServer(requests) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   AsyncLocalStorage 请求追踪示例      ║');
  console.log('╚══════════════════════════════════════╝\n');

  log(`服务器启动，即将处理 ${requests.length} 个并发请求\n`);

  // 并发处理所有请求
  // 每个请求都在独立的 AsyncLocalStorage 上下文中运行
  const handlerPromises = requests.map(async (request, index) => {
    // 为每个请求创建唯一的上下文
    const context = {
      requestId: generateRequestId(),
      startTime: Date.now(),
      method: request.method,
      path: request.path
    };

    // 使用 requestStore.run() 在指定上下文中执行请求处理
    // 在 run 的回调中的所有异步调用都能通过 requestStore.getStore() 获取上下文
    return requestStore.run(context, async () => {
      log(`──── 请求 #${index + 1} 开始 ────`);
      const response = await handleRequest(request);
      log(`──── 请求 #${index + 1} 结束 (状态: ${response.status}) ────\n`);
      return response;
    });
  });

  const responses = await Promise.all(handlerPromises);

  // 打印汇总
  console.log('\n═══════════════════════════════════════');
  console.log('请求处理汇总:');
  console.log('═══════════════════════════════════════');
  responses.forEach((resp, i) => {
    console.log(`  请求 #${i + 1} ${requests[i].path}: ${resp.status} (${resp.elapsed || 0}ms)`);
  });
  console.log('');
}

// ============================================================
// 上下文丢失的 Bug 示例
// ============================================================

/**
 * 演示 AsyncLocalStorage 上下文在普通回调中丢失的问题
 */
async function demonstrateContextLoss() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   上下文丢失 Bug 示例                 ║');
  console.log('╚══════════════════════════════════════╝\n');

  const context = { requestId: 'bug-demo', info: '这个上下文会丢失' };

  await requestStore.run(context, async () => {
    // 这里可以正常获取上下文
    log('在 AsyncLocalStorage.run 内部，上下文正常');

    // BUG：在 setTimeout 的回调中使用 async/await 时，
    // AsyncLocalStorage 上下文可能会在某些旧版本 Node.js 中丢失
    // 在 Node.js 16+ 中通常不会丢失，但使用原始回调模式时仍有风险

    // 模拟上下文丢失的场景：将异步操作包装在不保留上下文的回调中
    await new Promise((resolve) => {
      setTimeout(() => {
        // 在较新版本的 Node.js 中，这里通常能保持上下文
        const store = requestStore.getStore();
        if (store) {
          log('setTimeout 回调中上下文保持正常（Node.js 16+）');
        } else {
          console.log('[全局] setTimeout 回调中上下文已丢失！');
        }
        resolve();
      }, 50);
    });

    // 演示一个真正会丢失上下文的场景：
    // 使用 setImmediate 并在其中创建新的 Promise 链
    const result = await new Promise((resolve) => {
      setImmediate(() => {
        // 在 setImmediate 中嵌套多层 then()
        Promise.resolve()
          .then(() => {
            return Promise.resolve();
          })
          .then(() => {
            const store = requestStore.getStore();
            if (!store) {
              console.log('  [全局] 深层 Promise 链中上下文丢失！');
              console.log('  [全局] 这是 AsyncLocalStorage 的已知限制。');
            } else {
              log('深层 Promise 链中上下文正常');
            }
            resolve(store ? '有上下文' : '无上下文');
          });
      });
    });

    log(`setImmediate 嵌套结果: ${result}`);
  });

  // 在 run 外部无法获取上下文
  const outsideStore = requestStore.getStore();
  console.log(`\n[全局] run 外部获取上下文: ${outsideStore ? '有' : '无'} (预期为"无")`);
}

// ============================================================
// 中间件模式：类似 Express 的上下文注入
// ============================================================

/**
 * 模拟 Express 风格的中间件
 * 展示如何在 Web 框架中集成 AsyncLocalStorage
 */
async function middlewarePattern() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   中间件模式示例                      ║');
  console.log('╚══════════════════════════════════════╝\n');

  /**
   * 请求上下文中间件
   * 为每个请求注入唯一的上下文，后续所有处理函数都可以访问
   */
  function requestContextMiddleware(request) {
    const context = {
      requestId: generateRequestId(),
      userId: request.headers?.userId || 'anonymous',
      startTime: Date.now(),
      // 可以附加更多请求相关的信息
      ip: request.ip || '127.0.0.1'
    };

    // 返回一个包装函数，在上下文中执行后续处理
    return (handler) => requestStore.run(context, () => handler(request));
  }

  /**
   * 认证中间件 —— 从上下文获取用户信息
   */
  async function authMiddleware() {
    const store = requestStore.getStore();
    log(`认证用户: ${store?.userId}`);
    // 在实际应用中，这里会验证 token 并设置用户信息到 store
  }

  /**
   * 日志中间件 —— 自动记录请求耗时
   */
  async function loggingMiddleware(handler) {
    const store = requestStore.getStore();
    log(`[${store?.requestId}] 请求开始`);

    const result = await handler();

    const elapsed = Date.now() - (store?.startTime || Date.now());
    log(`[${store?.requestId}] 请求结束，耗时 ${elapsed}ms`);

    return result;
  }

  // 模拟处理一个请求
  const request = {
    method: 'GET',
    path: '/api/users',
    headers: { userId: 'user-42' },
    ip: '192.168.1.100'
  };

  const withContext = requestContextMiddleware(request);

  const response = await withContext(async (req) => {
    await authMiddleware();

    const result = await loggingMiddleware(async () => {
      // 在中间件链中，所有函数都能访问请求上下文
      const store = requestStore.getStore();
      log(`处理请求: ${req.method} ${req.path} (用户: ${store?.userId}, IP: ${store?.ip})`);

      const data = await queryDatabase('SELECT * FROM users', 100);
      return { status: 200, data: data.rows };
    });

    return result;
  });

  log(`最终响应: ${response.status}`);
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  // 模拟 5 个并发请求
  const requests = [
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/posts' },
    { method: 'POST', path: '/comments' },
    { method: 'GET', path: '/products' },
    { method: 'DELETE', path: '/sessions' }
  ];

  // 1. 演示并发请求的上下文追踪
  await simulateServer(requests);

  // 等待一下，让输出更清晰
  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. 演示上下文丢失的 Bug
  await demonstrateContextLoss();

  // 等待
  await new Promise(resolve => setTimeout(resolve, 300));

  // 3. 演示中间件模式
  await middlewarePattern();

  console.log('\n所有示例运行完毕。');
  console.log('观察日志输出中每个请求的 ID，理解 AsyncLocalStorage 如何帮助区分并发请求。');
}

main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
