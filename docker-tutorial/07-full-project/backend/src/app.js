/**
 * =============================================================================
 * 全栈应用后端 API - Express 应用入口
 * =============================================================================
 *
 * 功能：
 *   - RESTful API 路由
 *   - PostgreSQL 数据库连接（连接池）
 *   - Redis 缓存集成
 *   - 安全中间件（Helmet、CORS）
 *   - 请求日志（Morgan）
 *   - 统一错误处理
 *
 * 环境变量：
 *   PORT          - 服务端口（默认 3000）
 *   DB_HOST       - 数据库地址
 *   DB_PORT       - 数据库端口（默认 5432）
 *   DB_NAME       - 数据库名称
 *   DB_USER       - 数据库用户
 *   DB_PASSWORD   - 数据库密码
 *   REDIS_HOST    - Redis 地址
 *   REDIS_PORT    - Redis 端口（默认 6379）
 *   REDIS_PASSWORD - Redis 密码
 *   JWT_SECRET    - JWT 签名密钥
 *   LOG_LEVEL     - 日志级别（默认 info）
 *   NODE_ENV      - 运行环境（production / development）
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const Redis = require('ioredis');

// ──────────────────────────────────────────────────────────────────────────────
// 应用初始化
// ──────────────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ──────────────────────────────────────────────────────────────────────────────
// PostgreSQL 连接池
// ──────────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'fullstack_db',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || '',
  max: 20,                  // 最大连接数
  idleTimeoutMillis: 30000, // 空闲超时 30 秒
  connectionTimeoutMillis: 5000, // 连接超时 5 秒
});

// 监听数据库连接池事件
pool.on('connect', () => {
  console.log('[DB] 新连接已建立');
});

pool.on('error', (err) => {
  console.error('[DB] 连接池意外错误：', err.message);
  // 不在此处退出进程，让 Docker 健康检查处理重启
});

// ──────────────────────────────────────────────────────────────────────────────
// Redis 客户端
// ──────────────────────────────────────────────────────────────────────────────
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.log(`[Redis] 第 ${times} 次重连，延迟 ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('[Redis] 连接成功');
});

redis.on('error', (err) => {
  console.error('[Redis] 连接错误：', err.message);
});

// ──────────────────────────────────────────────────────────────────────────────
// 全局中间件
// ──────────────────────────────────────────────────────────────────────────────

// 安全头（Helmet）
app.use(helmet());

// 跨域配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 预检请求缓存 24 小时
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
const logFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// 请求 ID（用于链路追踪）
app.use((req, res, next) => {
  req.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ──────────────────────────────────────────────────────────────────────────────
// 数据库中间件（将 pool 和 redis 附加到 req 对象）
// ──────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.db = pool;
  req.redis = redis;
  next();
});

// ──────────────────────────────────────────────────────────────────────────────
// 路由：健康检查
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res, next) => {
  try {
    // 检查数据库连接
    const dbResult = await pool.query('SELECT 1 AS status');
    const dbHealthy = dbResult.rows[0].status === 1;

    // 检查 Redis 连接
    const redisResult = await redis.ping();
    const redisHealthy = redisResult === 'PONG';

    const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';
    const httpCode = status === 'healthy' ? 200 : 503;

    res.status(httpCode).json({
      status,
      timestamp: new Date().toISOString(),
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: NODE_ENV,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
      uptime: process.uptime(),
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 路由：用户管理 CRUD 示例
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/users - 获取用户列表
 * 支持分页：?page=1&limit=20
 */
app.get('/api/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // 尝试从 Redis 缓存获取
    const cacheKey = `users:page:${page}:limit:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        ...JSON.parse(cached),
      });
    }

    // 从数据库查询
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const response = {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 写入缓存（TTL 60 秒）
    await redis.setex(cacheKey, 60, JSON.stringify(response));

    res.json({ source: 'database', ...response });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id - 获取单个用户详情
 */
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 尝试从缓存获取
    const cacheKey = `user:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    const result = await pool.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];

    // 写入缓存（TTL 300 秒）
    await redis.setex(cacheKey, 300, JSON.stringify(user));

    res.json({ source: 'database', data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users - 创建新用户
 */
app.post('/api/users', async (req, res, next) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: '用户名和邮箱为必填项' });
    }

    const result = await pool.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username, email, created_at',
      [username, email]
    );

    const newUser = result.rows[0];

    // 清除用户列表缓存
    const keys = await redis.keys('users:page:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.status(201).json({ data: newUser, message: '用户创建成功' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '用户名或邮箱已存在' });
    }
    next(err);
  }
});

/**
 * PUT /api/users/:id - 更新用户信息
 */
app.put('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email), updated_at = NOW() WHERE id = $3 RETURNING id, username, email, updated_at',
      [username, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const updatedUser = result.rows[0];

    // 清除相关缓存
    await redis.del(`user:${id}`);
    const keys = await redis.keys('users:page:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({ data: updatedUser, message: '用户更新成功' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id - 删除用户
 */
app.delete('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 清除相关缓存
    await redis.del(`user:${id}`);
    const keys = await redis.keys('users:page:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({ message: '用户删除成功' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 路由：数据库初始化（仅开发环境可用）
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/init-db', async (req, res, next) => {
  if (NODE_ENV === 'production') {
    return res.status(403).json({ error: '生产环境禁止执行此操作' });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 插入示例数据
    await pool.query(`
      INSERT INTO users (username, email) VALUES
        ('张三', 'zhangsan@example.com'),
        ('李四', 'lisi@example.com'),
        ('王五', 'wangwu@example.com')
      ON CONFLICT DO NOTHING
    `);

    res.json({ message: '数据库初始化成功' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 404 处理
// ──────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 全局错误处理中间件
// ──────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[Error] ${req.id}:`, err.message);

  // 数据库连接错误
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: '服务暂时不可用，请稍后重试',
      requestId: req.id,
    });
  }

  // 数据库查询错误
  if (err.code && err.code.startsWith('2')) {
    return res.status(500).json({
      error: '数据操作失败',
      requestId: req.id,
    });
  }

  // 通用错误
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    requestId: req.id,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 启动服务器
// ──────────────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] 后端 API 服务已启动`);
  console.log(`[Server] 环境：${NODE_ENV}`);
  console.log(`[Server] 端口：${PORT}`);
  console.log(`[Server] 健康检查：http://localhost:${PORT}/api/health`);
});

// ──────────────────────────────────────────────────────────────────────────────
// 优雅关闭（处理 SIGTERM / SIGINT 信号）
// ──────────────────────────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] 收到 ${signal} 信号，开始优雅关闭...`);

  // 停止接收新连接
  server.close(async () => {
    console.log('[Server] HTTP 服务器已关闭');

    // 关闭数据库连接池
    try {
      await pool.end();
      console.log('[DB] 连接池已关闭');
    } catch (err) {
      console.error('[DB] 关闭连接池时出错：', err.message);
    }

    // 关闭 Redis 连接
    try {
      await redis.quit();
      console.log('[Redis] 连接已关闭');
    } catch (err) {
      console.error('[Redis] 关闭连接时出错：', err.message);
    }

    console.log('[Server] 所有资源已释放，进程退出');
    process.exit(0);
  });

  // 超时强制退出
  setTimeout(() => {
    console.error('[Server] 关闭超时（30 秒），强制退出');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] 未处理的 Promise 拒绝：', reason);
});

module.exports = app;
