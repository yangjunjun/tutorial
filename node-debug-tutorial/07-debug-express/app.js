/**
 * Express.js 调试教程 - 主应用入口
 *
 * 这是一个包含故意植入 Bug 的 Express REST API 应用，
 * 用于学习和练习 Express 应用的调试技巧。
 *
 * 内置 Bug 列表：
 * 1. 认证中间件在某个分支中不调用 next()
 * 2. 错误处理中间件的状态码不正确
 * 3. POST /api/users 路由在缺少字段时崩溃
 * 4. 请求日志中间件的内存泄漏
 */

const express = require('express');
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 异步本地存储 - 用于请求追踪
// ============================================================

/**
 * 请求上下文存储实例
 * 使用 AsyncLocalStorage 在整个异步调用链中传递请求信息
 */
const requestStore = new AsyncLocalStorage();

/**
 * 获取当前请求的上下文信息
 * @returns {object} 包含 requestId 等信息的上下文对象
 */
function getRequestContext() {
  return requestStore.getStore() || { requestId: 'unknown' };
}

// 将 getContext 挂载到 app 上，供路由模块使用
app.set('getRequestContext', getRequestContext);

// ============================================================
// 中间件注册（注意执行顺序）
// ============================================================

/**
 * 中间件 1：请求 ID 生成
 * 为每个请求生成唯一标识，用于请求追踪
 */
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID().slice(0, 8);
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // 在异步上下文中存储请求 ID
  requestStore.run({ requestId, startTime: Date.now() }, () => {
    next();
  });
});

/**
 * 中间件 2：请求日志
 * 记录每个请求的详细信息
 * ⚠️ Bug: 这个中间件存在内存泄漏（见 middleware/requestLogger.js）
 */
app.use(requestLogger);

/**
 * 中间件 3：请求体解析
 * 解析 JSON 和 URL 编码的请求体
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 中间件 4：简易认证中间件
 * ⚠️ Bug: 当 Authorization 头存在但 token 无效时，不调用 next() 也不发送响应
 * 导致请求永远挂起
 */
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // 没有认证头，放行（公开访问）
    return next();
  }

  // 简单验证 Bearer token
  const token = authHeader.replace('Bearer ', '');

  if (token === 'valid-token') {
    // Token 有效，标记用户身份并放行
    req.isAuthenticated = true;
    req.userId = 'admin';
    return next();
  }

  // ⚠️ Bug: 当 token 无效时，这里应该返回 401 错误
  // 但实际代码既没有调用 next()，也没有发送响应
  // 这会导致请求永远挂起
  console.log(`[认证] 无效的 token: ${token}`);
  // 缺少: return res.status(401).json({ error: '无效的认证令牌' });
  // 也缺少: return next();
});

/**
 * 中间件 5：请求计时
 * 在响应结束时记录请求耗时
 */
app.use((req, res, next) => {
  const start = Date.now();

  // 监听响应完成事件，记录耗时
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ctx = getRequestContext();
    console.log(`[计时] 请求 ${ctx.requestId} ${req.method} ${req.originalUrl} 耗时 ${duration}ms`);
  });

  next();
});

// ============================================================
// 路由注册
// ============================================================

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 用户 API 路由
app.use('/api/users', userRoutes);

// ============================================================
// 404 处理（放在所有路由之后）
// ============================================================
app.use((req, res, next) => {
  const error = new Error(`未找到资源: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// ============================================================
// 全局错误处理中间件（必须放在最后）
// ============================================================
app.use(errorHandler);

// ============================================================
// 启动服务器
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`🚀 Express 服务已启动: http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/health`);
  console.log(`👤 用户 API: http://localhost:${PORT}/api/users`);
  console.log(`🔧 调试模式: 使用 npm run dev 启动 --inspect`);
  console.log('');
  console.log('测试命令:');
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/users -H "Content-Type: application/json" -d '{"name":"张三","email":"zhang@example.com"}'`);
  console.log(`  curl http://localhost:${PORT}/api/users/1`);
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/users/1`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, requestStore, getRequestContext };
