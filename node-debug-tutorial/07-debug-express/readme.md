# 调试 Express.js 应用

## 概述

Express.js 是 Node.js 最流行的 Web 框架。由于其中间件链式执行模型和异步特性，调试 Express 应用有其独特的挑战。本教程将系统性地讲解如何高效地调试 Express 应用。

---

## 1. Express 调试环境搭建

### 1.1 使用 --inspect 启动调试

```bash
# 普通启动
node app.js

# 调试模式启动（监听 9229 端口）
node --inspect app.js

# 调试模式启动，在首行暂停（等待调试器连接后才开始执行）
node --inspect-brk app.js

# 指定自定义调试端口
node --inspect=0.0.0.0:9230 app.js
```

### 1.2 VS Code 调试配置

在项目根目录创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试 Express 应用",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app.js",
      "runtimeArgs": ["--inspect"],
      "console": "integratedTerminal",
      "restart": true,
      "port": 9229
    },
    {
      "name": "附加到运行中的进程",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true
    }
  ]
}
```

### 1.3 Chrome DevTools 调试

```bash
# 启动应用后，在 Chrome 中打开：
# chrome://inspect
# 点击 "Open dedicated DevTools for Node"
```

---

## 2. 中间件执行流程调试

Express 的核心是中间件链。每个请求依次经过一系列中间件函数，理解执行顺序是调试的关键。

### 2.1 中间件执行顺序

```
请求进入
  -> 请求日志中间件
    -> 请求 ID 中间件
      -> 请求体解析中间件
        -> 路由匹配
          -> 路由处理函数
            -> 响应发送
              -> 错误处理中间件（仅在有错误时）
```

### 2.2 设置断点跟踪中间件

在 VS Code 中，可以在每个中间件函数的入口处设置断点：

```javascript
// 在 app.js 中每个中间件注册处设置断点
app.use((req, res, next) => {
  // 断点 1: 请求日志中间件
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json()); // 断点 2: 请求体解析

app.use('/api/users', userRoutes); // 断点 3: 路由中间件
```

### 2.3 调试技巧：打印中间件栈

```javascript
// 临时添加，打印当前注册的所有中间件
app._router.stack.forEach((layer, index) => {
  if (layer.route) {
    console.log(`[${index}] 路由: ${layer.route.path}`);
  } else {
    console.log(`[${index}] 中间件: ${layer.name}`);
  }
});
```

---

## 3. 请求追踪：使用 AsyncLocalStorage

在并发请求环境中，区分不同请求的日志至关重要。`AsyncLocalStorage` 可以在异步调用链中传递请求上下文。

### 3.1 实现请求 ID 中间件

```javascript
const { AsyncLocalStorage } = require('node:async_hooks');

// 创建异步本地存储实例
const requestStore = new AsyncLocalStorage();

// 请求 ID 中间件
function requestIdMiddleware(req, res, next) {
  // 优先使用客户端传入的请求 ID，否则生成新的
  const requestId = req.headers['x-request-id'] || generateId();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // 在异步上下文中存储请求 ID
  requestStore.run({ requestId }, () => {
    next();
  });
}

// 在任何地方获取当前请求 ID
function getCurrentRequestId() {
  const store = requestStore.getStore();
  return store ? store.requestId : 'unknown';
}
```

### 3.2 在日志中使用请求 ID

```javascript
// 所有日志自动携带请求 ID
function log(level, message, data = {}) {
  const requestId = getCurrentRequestId();
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    requestId,
    message,
    ...data
  };
  console.log(JSON.stringify(entry));
}
```

---

## 4. 错误处理中间件的调试

### 4.1 Express 错误处理中间件的特征

错误处理中间件必须有 **4 个参数**（err, req, res, next）：

```javascript
// 正确：4 个参数
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// 错误：只有 3 个参数，Express 会将其视为普通中间件
app.use((err, req, res) => { // 这不是错误处理中间件！
  res.status(500).json({ error: err.message });
});
```

### 4.2 常见错误处理陷阱

1. **异步错误未捕获**：Express 4.x 不会自动捕获异步错误
   ```javascript
   // 错误写法 - 异步错误不会到达错误处理中间件
   app.get('/api/users', async (req, res) => {
     const users = await db.getUsers(); // 如果这里抛出错误...
     res.json(users);
   });

   // 正确写法 - 使用 try-catch 包装
   app.get('/api/users', async (req, res, next) => {
     try {
       const users = await db.getUsers();
       res.json(users);
     } catch (err) {
       next(err); // 传递给错误处理中间件
     }
   });
   ```

2. **响应发送两次**：在错误处理中忘记 `return`
   ```javascript
   app.use((err, req, res, next) => {
     if (err.type === 'validation') {
       res.status(400).json({ error: err.message });
       // 缺少 return，会继续执行下面的代码
     }
     res.status(500).json({ error: '服务器内部错误' });
     // 导致 ERR_HTTP_HEADERS_SENT 错误
   });
   ```

---

## 5. 路由调试

### 5.1 路由参数验证

```javascript
// 使用 param 中间件验证路由参数
router.param('id', (req, res, next, id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return next(new Error('无效的用户 ID'));
  }
  req.params.id = parsedId;
  next();
});
```

### 5.2 404 处理

```javascript
// 404 处理器应放在所有路由之后、错误处理中间件之前
app.use((req, res, next) => {
  const error = new Error(`未找到资源: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});
```

### 5.3 调试路由匹配

```javascript
// 设置 DEBUG 环境变量查看所有路由匹配过程
// DEBUG=express:router node app.js
```

---

## 6. 环境变量与配置调试

### 6.1 配置验证

```javascript
// 在应用启动时验证关键配置
function validateConfig() {
  const required = ['NODE_ENV', 'PORT', 'API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`警告: 缺少环境变量: ${missing.join(', ')}`);
  }
}
```

### 6.2 调试环境变量

```bash
# 查看所有环境变量
node -e "console.log(JSON.stringify(process.env, null, 2))"

# 使用 dotenv 调试
DEBUG=dotenv node -r dotenv/config app.js
```

---

## 7. 生产环境调试策略

### 7.1 结构化日志

生产环境应使用 JSON 格式的结构化日志，便于日志收集和分析：

```javascript
// 结构化日志格式
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "requestId": "abc-123",
  "method": "POST",
  "url": "/api/users",
  "statusCode": 500,
  "duration": 1523,
  "error": {
    "message": "数据库连接超时",
    "stack": "..."
  }
}
```

### 7.2 错误追踪服务

集成 Sentry 等错误追踪服务：

```javascript
// 示例：错误追踪服务集成（伪代码）
const errorTracker = {
  captureException(err, context) {
    // 在生产环境中发送到 Sentry
    console.error('[ErrorTracker]', JSON.stringify({
      error: err.message,
      stack: err.stack,
      context
    }));
  }
};

// 在错误处理中间件中使用
app.use((err, req, res, next) => {
  errorTracker.captureException(err, {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id
  });
  res.status(err.status || 500).json({ error: err.message });
});
```

---

## 8. 日志配置

### 8.1 Morgan HTTP 请求日志

Morgan 是 Express 生态中最常用的 HTTP 请求日志中间件：

```javascript
const morgan = require('morgan');

// 开发环境：彩色输出
app.use(morgan('dev'));

// 生产环境：JSON 格式
app.use(morgan('combined'));

// 自定义格式
morgan.token('request-id', (req) => req.requestId);
app.use(morgan(':request-id :method :url :status :response-time ms'));
```

### 8.2 Winston 应用日志

Winston 提供灵活的多目标日志输出：

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-api' },
  transports: [
    // 文件输出
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 8.3 本教程的自定义日志

为简化依赖，本教程使用自定义的轻量日志中间件（见 `middleware/requestLogger.js`）。

---

## 9. DEBUG 环境变量和 debug 包

### 9.1 debug 包

`debug` 是 Node.js 生态中最广泛使用的调试日志库（Express 内部也使用它）：

```javascript
const debug = require('debug')('myapp:users');

router.get('/', (req, res) => {
  debug('获取用户列表，查询参数:', req.query);
  // 只有设置 DEBUG=myapp:* 或 DEBUG=myapp:users 时才会输出
  res.json(users);
});
```

### 9.2 使用 DEBUG 环境变量

```bash
# 启用所有 debug 输出
DEBUG=* node app.js

# 只启用特定模块
DEBUG=express:* node app.js

# 启用应用特定模块的调试
DEBUG=myapp:* node app.js

# 排除特定模块
DEBUG=*,-express:router node app.js

# 查看 Express 内部路由匹配过程
DEBUG=express:router,express:route node app.js
```

### 9.3 Express 内置的 DEBUG 命名空间

| 命名空间 | 描述 |
|---------|------|
| `express:application` | 应用级别的操作 |
| `express:router` | 路由匹配过程 |
| `express:route` | 路由定义 |
| `express:middleware` | 中间件执行 |
| `express:view` | 视图渲染 |

---

## 10. 常见 Express 陷阱和调试方法

### 10.1 中间件不调用 next()

**症状**：请求挂起，永不响应

```javascript
// Bug: 在某个条件分支中忘记调用 next()
app.use((req, res, next) => {
  if (req.headers.authorization) {
    // 验证 token...
    next();
  }
  // 缺少 else 分支的 next() 或 res.status(401).send()
  // 请求会永远挂起
});
```

**调试方法**：
1. 在中间件入口处设置断点
2. 单步执行，观察代码走哪个分支
3. 检查是否有代码路径既不调用 `next()` 也不发送响应

### 10.2 响应发送两次（ERR_HTTP_HEADERS_SENT）

**症状**：`Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`

```javascript
// Bug: 在异步操作中先发送了错误响应，又发送了成功响应
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await findUser(req.params.id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      // 缺少 return！会继续执行下面的代码
    }
    res.json(user); // 第二次发送响应 -> 崩溃
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**调试方法**：
1. 在 `res.json()` / `res.send()` / `res.status()` 处设置断点
2. 使用 VS Code 的 "Call Stack" 面板查看调用链
3. 搜索项目中连续出现 `res.` 的地方

### 10.3 内存泄漏

**症状**：应用运行一段时间后，内存持续增长

常见原因：
- 全局数组不断存储请求数据
- 事件监听器未移除
- 闭包持有大对象引用
- 未清理的定时器

**调试方法**：
```bash
# 使用 --inspect 启动，然后在 Chrome DevTools 的 Memory 面板
# 拍摄堆快照（Heap Snapshot），对比两次快照的差异
node --inspect app.js
```

### 10.4 请求体解析失败

**症状**：`req.body` 为 `undefined`

```javascript
// 忘记添加 body parser 中间件
// 解决：在路由之前添加
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

---

## 项目文件说明

| 文件 | 说明 |
|------|------|
| `app.js` | 主应用入口，包含中间件注册和路由挂载 |
| `routes/users.js` | 用户 CRUD 路由 |
| `middleware/errorHandler.js` | 全局错误处理中间件 |
| `middleware/requestLogger.js` | 请求日志中间件 |

## 快速开始

```bash
# 安装依赖
npm install

# 普通启动
npm start

# 调试模式启动
npm run dev

# 发送测试请求
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"张三","email":"zhang@example.com"}'
curl http://localhost:3000/api/users/1
curl -X DELETE http://localhost:3000/api/users/1
```

## 内置 Bug 说明

本项目故意包含以下 Bug，用于调试练习：

1. **中间件不调用 next()**：在某个条件分支中遗漏了 `next()` 调用，导致请求挂起
2. **错误处理中间件状态码错误**：错误处理器使用了错误的 HTTP 状态码
3. **POST 请求缺少字段校验**：创建用户时未校验必填字段，导致应用崩溃
4. **请求日志内存泄漏**：请求日志中间件将所有请求数据存储在内存中，永不清理
5. **路由数据合并错误**：更新用户时数据合并不正确

尝试使用本教程学到的调试技巧来定位和修复这些 Bug！
