# Express 调试练习

本练习配合 `07-debug-express` 项目使用，项目中故意包含多个 Bug，需要你使用调试工具来定位和修复。

---

## 练习 1：启动调试模式并发送请求

### 目标
熟悉 Express 应用调试环境的搭建和基本操作。

### 步骤

1. 安装依赖并启动调试模式：
   ```bash
   npm install
   npm run dev
   ```

2. 打开 Chrome，访问 `chrome://inspect`，点击 "Open dedicated DevTools for Node"

3. 在 DevTools 的 Console 中，确认调试器已连接

4. 使用 curl 或 Postman 发送以下请求：
   ```bash
   # 获取用户列表
   curl http://localhost:3000/api/users

   # 获取健康检查
   curl http://localhost:3000/health

   # 访问不存在的路由
   curl http://localhost:3000/api/nonexistent
   ```

5. 观察 DevTools Console 中的输出，确认每个请求都生成了唯一的请求 ID

### 思考题
- 健康检查端点返回的 `memoryUsage` 中各字段代表什么含义？
- 请求 ID 在哪里生成？它是如何传递到响应头中的？

---

## 练习 2：跟踪请求在中间件链中的流转

### 目标
使用断点跟踪请求经过每个中间件的顺序，理解 Express 中间件链的执行模型。

### 步骤

1. 在 `app.js` 中以下位置设置断点：
   - 请求 ID 中间件（第 1 个 `app.use`）
   - 请求日志中间件（`requestLogger`）
   - 请求体解析中间件（`express.json()`）
   - 认证中间件
   - 请求计时中间件

2. 在 `routes/users.js` 的 `GET /` 路由处理函数中设置断点

3. 发送请求：
   ```bash
   curl http://localhost:3000/api/users
   ```

4. 在调试器中单步执行，记录请求经过的中间件顺序：
   ```
   中间件执行顺序：
   1. _______________
   2. _______________
   3. _______________
   4. _______________
   5. _______________
   6. _______________（路由处理函数）
   ```

5. 在 "响应完成" 的事件回调中，观察计时中间件的 `finish` 事件是何时触发的

### 思考题
- `next()` 调用后，代码执行流转到哪里？
- 如果某个中间件不调用 `next()`，后续中间件会执行吗？
- `res.on('finish', ...)` 回调在什么时候执行？

---

## 练习 3：定位中间件不执行的原因（漏掉 next()）

### 目标
发现并修复认证中间件中不调用 `next()` 的 Bug。

### 背景
项目中的认证中间件在某个代码路径中既没有调用 `next()`，也没有发送 HTTP 响应，导致请求永远挂起。

### 步骤

1. 发送以下请求（带无效的 Authorization 头）：
   ```bash
   curl -v http://localhost:3000/api/users -H "Authorization: Bearer invalid-token"
   ```

2. 观察请求是否收到响应。如果没有，说明请求挂起了。

3. 在认证中间件中设置断点，重新发送请求

4. 单步执行，观察代码走到了哪个分支

5. 检查该分支是否调用了 `next()` 或发送了响应

### 修复任务

找到 Bug 后，修复认证中间件，使其在 token 无效时返回 401 错误：

```javascript
// 在 token 无效的分支中添加：
return res.status(401).json({
  error: '认证失败',
  message: '无效的认证令牌'
});
```

### 验证
修复后，重新发送请求，确认收到 401 响应：
```bash
curl -v http://localhost:3000/api/users -H "Authorization: Bearer invalid-token"
# 期望：HTTP/1.1 401 Unauthorized
```

---

## 练习 4：调试 POST 请求的数据丢失问题

### 目标
发现并修复创建用户时缺少字段校验导致崩溃的 Bug。

### 步骤

1. 发送一个缺少必填字段的 POST 请求：
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. 观察服务器控制台输出的错误信息

3. 在 `routes/users.js` 的 `POST /` 路由处理函数中设置断点

4. 重新发送请求，在断点处检查 `req.body` 的值

5. 单步执行到 `name.trim()` 这一行，观察发生了什么

### 分析
- 为什么空请求体会导致应用崩溃？
- `req.body` 是什么值？`name` 是什么值？
- `undefined.trim()` 会抛出什么错误？

### 修复任务

在创建用户之前添加字段校验：

```javascript
// 在 POST 路由处理函数的开头添加校验逻辑
if (!name || !email) {
  return res.status(400).json({
    error: '缺少必填字段',
    message: '名称(name)和邮箱(email)为必填字段',
    required: ['name', 'email']
  });
}
```

### 验证
```bash
# 缺少字段 - 期望 400
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{}'

# 缺少邮箱 - 期望 400
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"测试"}'

# 完整数据 - 期望 201
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"赵六","email":"zhaoliu@example.com"}'
```

---

## 练习 5：使用条件断点只在特定用户 ID 时中断

### 目标
学习使用条件断点（Conditional Breakpoint）来精确调试。

### 场景
当用户 ID 为 2 时，GET /api/users/:id 的行为异常。你需要只在处理 ID 为 2 的请求时中断。

### 步骤

1. 在 `routes/users.js` 的 `GET /:id` 路由处理函数入口设置断点

2. 右键点击断点，选择 "Edit Breakpoint"（编辑断点）

3. 输入条件表达式：
   ```javascript
   req.parsedUserId === 2
   ```

4. 依次发送以下请求：
   ```bash
   curl http://localhost:3000/api/users/1   # 不应中断
   curl http://localhost:3000/api/users/3   # 不应中断
   curl http://localhost:3000/api/users/2   # 应该中断
   ```

5. 当断点命中时，检查：
   - `req.parsedUserId` 的值
   - `req.targetUser` 的值
   - `req.params` 的内容

### 进阶：日志断点

使用 "Logpoint"（日志断点）在不中断执行的情况下输出信息：

1. 在 `GET /:id` 路由处右键，选择 "Add Logpoint"
2. 输入日志表达式：
   ```
   查询用户 ID={req.parsedUserId}, 找到={!!req.targetUser}
   ```
3. 发送多个请求，观察控制台输出

### 思考题
- 条件断点和日志断点各适用于什么场景？
- 如果要调试"只在特定 IP 地址的请求时出问题"，条件表达式怎么写？

---

## 练习 6：找到内存泄漏的中间件

### 目标
使用 Node.js 的内存分析工具定位内存泄漏。

### 步骤

1. 启动应用，先记录初始内存使用：
   ```bash
   curl http://localhost:3000/health
   # 记录 heapUsed 的值
   ```

2. 发送大量请求（模拟流量）：
   ```bash
   # 使用循环发送 100 个请求
   for i in $(seq 1 100); do
     curl -s -X POST http://localhost:3000/api/users \
       -H "Content-Type: application/json" \
       -d "{\"name\":\"user$i\",\"email\":\"user$i@test.com\"}" > /dev/null
   done
   ```

3. 再次检查内存使用：
   ```bash
   curl http://localhost:3000/health
   # 对比 heapUsed 的变化
   ```

4. 在 Chrome DevTools 的 Memory 面板：
   - 拍摄第一个堆快照（Heap Snapshot 1）
   - 发送更多请求
   - 拍摄第二个堆快照（Heap Snapshot 2）
   - 选择 "Comparison" 视图，对比两个快照

5. 在对比视图中，按 "Size Delta" 排序，找到增长最多的对象类型

### 分析
- 哪个数组在不断增长？
- 每个数组元素包含什么数据？
- 这些数据是从哪里被添加的？

### 修复任务

修改 `middleware/requestLogger.js`，限制历史记录的最大数量：

```javascript
const MAX_HISTORY_SIZE = 1000;

// 在 push 之前检查数组长度
if (requestHistory.length >= MAX_HISTORY_SIZE) {
  // 移除最旧的记录
  requestHistory.shift();
}
requestHistory.push(requestRecord);
```

### 验证
修复后重复步骤 1-3，确认内存增长明显减缓。

---

## 练习 7：配置结构化日志

### 目标
将现有的 `console.log` 日志替换为结构化 JSON 日志。

### 步骤

1. 在项目中创建 `utils/logger.js` 文件

2. 实现一个结构化日志工具：
   ```javascript
   /**
    * 结构化日志工具
    * 输出 JSON 格式的日志，便于日志收集和分析
    */

   const LOG_LEVELS = {
     error: 0,
     warn: 1,
     info: 2,
     http: 3,
     debug: 4
   };

   const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

   function log(level, message, meta = {}) {
     if (LOG_LEVELS[level] > currentLevel) return;

     const entry = {
       timestamp: new Date().toISOString(),
       level: level,
       message: message,
       ...meta
     };

     // 错误级别输出到 stderr，其他输出到 stdout
     const output = level === 'error' ? process.stderr : process.stdout;
     output.write(JSON.stringify(entry) + '\n');
   }

   module.exports = {
     error: (msg, meta) => log('error', msg, meta),
     warn: (msg, meta) => log('warn', msg, meta),
     info: (msg, meta) => log('info', msg, meta),
     http: (msg, meta) => log('http', msg, meta),
     debug: (msg, meta) => log('debug', msg, meta)
   };
   ```

3. 将 `requestLogger.js` 中的 `console.log` 替换为结构化日志：
   ```javascript
   const logger = require('../utils/logger');

   // 替换前
   console.log(`[请求] ${requestId} -> ${req.method} ${req.originalUrl}`);

   // 替换后
   logger.http('收到请求', {
     requestId,
     method: req.method,
     url: req.originalUrl,
     phase: 'request_start'
   });
   ```

4. 将 `errorHandler.js` 中的 `console.error` 替换为结构化日志：
   ```javascript
   const logger = require('../utils/logger');

   logger.error('请求处理错误', {
     requestId,
     method: req.method,
     url: req.originalUrl,
     statusCode,
     errorMessage: err.message,
     stack: err.stack
   });
   ```

### 验证

设置日志级别并运行：
```bash
LOG_LEVEL=debug npm start

# 发送请求，观察 JSON 格式输出
curl http://localhost:3000/api/users
```

期望输出类似：
```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"http","message":"收到请求","requestId":"abc123","method":"GET","url":"/api/users","phase":"request_start"}
```

### 思考题
- 结构化日志相比普通文本日志有什么优势？
- 在生产环境中，你会如何收集和分析这些 JSON 日志？
- `LOG_LEVEL` 环境变量如何影响日志输出？
