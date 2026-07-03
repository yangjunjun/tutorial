# Node.js 异步调试完全指南

## 目录

- [Node.js 异步调试的痛点](#nodejs-异步调试的痛点)
- [Async Stack Traces](#async-stack-traces)
- [async/await vs Promise.then 堆栈追踪](#asyncawait-vs-promisethen-堆栈追踪)
- [unhandledRejection 和 uncaughtException](#unhandledrejection-和-uncaughtexception)
- [异步代码中的常见 Bug 模式](#异步代码中的常见-bug-模式)
- [使用 util.debuglog 做条件调试日志](#使用-utildebuglog-做条件调试日志)
- [AsyncLocalStorage 请求上下文追踪](#asynclocalstorage-请求上下文追踪)
- [实战：调试并发下载器](#实战调试并发下载器)

---

## Node.js 异步调试的痛点

Node.js 的异步编程模型带来了独特的调试挑战：

1. **堆栈追踪不完整** — 回调和 Promise 链会打断调用栈，错误发生时的堆栈信息可能不包含真正的调用者
2. **时序不确定性** — 异步操作的完成顺序不确定，导致竞态条件
3. **静默失败** — 忘记 `await` 或遗漏 `.catch()` 时，错误可能被悄悄吞掉
4. **调试器行为差异** — 在异步代码中单步调试时，Step Over/Into 的行为与同步代码不同
5. **多个并发操作** — 同时运行的多个异步操作使问题更难复现

---

## Async Stack Traces

### 问题背景

在 Node.js 12 之前，异步操作的堆栈追踪经常是"断开"的：

```
Error: something went wrong
    at processData (app.js:10:11)
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
    // 堆栈在这里断了！看不到谁调用了 processData
```

### Node.js 12+ 的改进

从 Node.js 12 开始，`--async-stack-traces` 标志**默认开启**，异步堆栈追踪变得完整：

```
Error: something went wrong
    at processData (app.js:10:11)
    at async handleRequest (app.js:25:5)    ← 可以看到 async 调用链
    at async main (app.js:40:3)             ← 一直追踪到最外层
```

### 验证异步堆栈追踪

```javascript
// 在 Node.js 12+ 中运行
async function innerFunction() {
  throw new Error('异步错误');
}

async function outerFunction() {
  await innerFunction();
}

outerFunction().catch(err => {
  console.log(err.stack);
  // 堆栈追踪会包含 outerFunction → innerFunction 的完整链路
});
```

### 手动开启/关闭

```bash
# 关闭异步堆栈追踪（不推荐，仅用于性能对比）
node --no-async-stack-traces app.js

# 显式开启（Node.js 12+ 默认已开启）
node --async-stack-traces app.js
```

**注意：** 异步堆栈追踪只在 `async/await` 中有效，对于 `.then()` 链的支持有限。

---

## async/await vs Promise.then 堆栈追踪

### async/await 的堆栈追踪（推荐）

```javascript
async function fetchUser(id) {
  const user = await getUserFromDB(id);    // ← 错误在这里抛出
  return user;
}

async function getUserFromDB(id) {
  throw new Error(`找不到用户 ${id}`);
}

// 堆栈追踪清晰完整：
// Error: 找不到用户 42
//     at getUserFromDB (app.js:7:9)
//     at async fetchUser (app.js:2:16)     ← 包含 await 调用位置
//     at async main (app.js:11:3)
```

### Promise.then 链的堆栈追踪（较差）

```javascript
function fetchUser(id) {
  return getUserFromDB(id)
    .then(user => processUser(user));       // ← 堆栈信息可能不完整
}

function getUserFromDB(id) {
  return Promise.reject(new Error(`找不到用户 ${id}`));
}

// 堆栈追踪可能只有：
// Error: 找不到用户 42
//     at getUserFromDB (app.js:7:20)
//     at processTicksAndRejections (...)   ← 中间的 .then 链丢失
```

**结论：** 尽量使用 `async/await` 替代 `.then()` 链，获得更好的调试体验。

---

## unhandledRejection 和 uncaughtException

### unhandledRejection

当一个 Promise 被 reject 但没有任何 `.catch()` 或 `await` 处理时触发：

```javascript
// 监听未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  console.error('Promise:', promise);
  // 生产环境中应该记录日志并优雅退出
});

// 触发未处理的拒绝
Promise.reject(new Error('这个错误没人处理'));
```

### uncaughtException

当一个同步错误没有被 `try/catch` 捕获时触发：

```javascript
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 注意：发生 uncaughtException 后进程处于不确定状态
  // 应该尽快退出
  process.exit(1);
});

// 触发未捕获的异常
throw new Error('这个错误没人捕获');
```

### --unhandled-rejections 标志

Node.js 提供了控制未处理拒绝行为的标志：

```bash
# 严格模式：未处理的拒绝直接导致进程崩溃（推荐用于开发）
node --unhandled-rejections=strict app.js

# 警告模式：打印警告但不崩溃（Node.js 15+ 默认）
node --unhandled-rejections=warn app.js

# 无模式：完全忽略（不推荐）
node --unhandled-rejections=none app.js

# 抛出模式：将拒绝作为未捕获异常抛出
node --unhandled-rejections=throw app.js
```

**最佳实践：** 在开发阶段始终使用 `--unhandled-rejections=strict`，让所有遗漏的错误处理立刻暴露。

---

## 异步代码中的常见 Bug 模式

### 模式 1：忘记 await

```javascript
// 错误示例：忘记 await，函数返回 Promise 而非实际值
async function getUser() {
  const user = fetchUser(1);  // ← 缺少 await！
  console.log(user);           // 输出 Promise { <pending> }
  return user;
}

// 正确写法
async function getUser() {
  const user = await fetchUser(1);
  console.log(user);           // 输出实际的用户对象
  return user;
}
```

### 模式 2：并行 vs 串行

```javascript
// 错误示例：串行执行，效率低下
async function fetchAll() {
  const user = await fetchUser(1);       // 等 1 秒
  const posts = await fetchPosts(1);     // 再等 1 秒
  const comments = await fetchComments(1); // 再等 1 秒
  // 总共 3 秒
}

// 正确写法：并行执行
async function fetchAll() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
  ]);
  // 总共 1 秒
}
```

### 模式 3：竞态条件

```javascript
let counter = 0;

// 两个异步操作同时修改 counter
async function increment() {
  const current = counter;
  await new Promise(resolve => setTimeout(resolve, 10)); // 模拟异步操作
  counter = current + 1;  // ← 竞态条件！两次调用都读到 0，最终结果都是 1
}

increment();
increment();
// counter 最终可能是 1 而不是 2
```

---

## 使用 util.debuglog 做条件调试日志

`util.debuglog` 是 Node.js 内置的条件调试日志工具，只在设置了 `NODE_DEBUG` 环境变量时才输出。

```javascript
const debuglog = require('util').debuglog;

// 创建命名空间的调试日志
const debug = debuglog('app:downloader');
const dbDebug = debuglog('app:database');

// 只在 NODE_DEBUG=app:* 或 NODE_DEBUG=app:downloader 时输出
debug('开始下载文件: %s', filename);
dbDebug('查询数据库，耗时: %dms', elapsed);
```

### 使用方式

```bash
# 启用所有 app 命名空间的日志
NODE_DEBUG=app:* node app.js

# 只启用 downloader 的日志
NODE_DEBUG=app:downloader node app.js

# 启用多个命名空间
NODE_DEBUG=app:*,http:* node app.js
```

---

## AsyncLocalStorage 请求上下文追踪

### 问题

在并发处理多个请求时，日志混在一起难以区分哪些日志属于哪个请求。

### 解决方案

`AsyncLocalStorage` 可以在异步调用链中传递上下文，无需手动传参：

```javascript
const { AsyncLocalStorage } = require('async_hooks');

const requestStore = new AsyncLocalStorage();

async function handleRequest(req) {
  // 为每个请求创建唯一的上下文
  const context = { requestId: generateId(), startTime: Date.now() };

  // 在这个上下文中运行请求处理逻辑
  await requestStore.run(context, async () => {
    // 在嵌套的任何异步调用中都可以通过 requestStore.getStore() 获取上下文
    await processOrder(req.data);
    await sendResponse(req);
  });
}
```

详见项目中的 `async-local-storage.js` 文件获取完整示例。

---

## 实战：调试并发下载器

项目中的 `app.js` 实现了一个模拟的并发文件下载器，包含以下调试挑战：

1. **竞态条件** — 多个下载同时更新进度计数器
2. **遗漏的 await** — 某些异步操作没有被正确等待
3. **未处理的拒绝** — 某个下载任务会随机失败但没有错误处理

### 运行方式

```bash
# 正常运行
node app.js

# 启用严格模式（让未处理的拒绝导致崩溃）
node --unhandled-rejections=strict app.js

# 启用调试日志
NODE_DEBUG=downloader:* node app.js
```

### 调试步骤

1. 用 VS Code 打开 `app.js`，选择 "Launch" 配置按 F5
2. 在 `downloadFile` 函数内设置断点
3. 在 `onDownloadComplete` 函数内设置条件断点：`currentFile === 'report.pdf'`
4. 观察 Call Stack 中的 async 调用链
5. 在 Watch 中添加 `completedCount` 监控竞态条件

---

## 项目文件说明

| 文件 | 说明 |
|------|------|
| `app.js` | 并发文件下载器模拟器，包含竞态条件等 bug |
| `promise-pitfalls.js` | Promise 常见陷阱示例集 |
| `async-local-storage.js` | AsyncLocalStorage 请求上下文追踪示例 |
| `exercise.js` | 包含异步 bug 的练习题，供读者查找和修复 |

## 运行示例

```bash
# 运行并发下载器
node app.js

# 运行 Promise 陷阱示例
node promise-pitfalls.js

# 运行 AsyncLocalStorage 示例
node async-local-storage.js

# 运行练习题（会显示 bug 的症状，读者需要修复）
node exercise.js
```
