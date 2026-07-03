# 多进程与 Worker Threads 调试练习

本练习配合 `08-child-process-worker` 项目使用，需要你使用调试工具来定位和修复多进程/多线程架构中的 Bug。

---

## 练习 1：为父进程和子进程分别启动 Inspector（不同端口）

### 目标
学会为父子进程配置不同的调试端口，避免端口冲突。

### 背景
默认情况下，`node --inspect` 使用 9229 端口。当父进程通过 `fork()` 创建子进程时，如果子进程也使用 `--inspect`，必须指定不同的端口，否则会报 `EADDRINUSE` 错误。

### 步骤

1. 首先尝试让父进程和子进程使用相同端口（观察错误）：
   ```bash
   # 修改 app.js 中所有子进程的 execArgv 为 --inspect=9229
   node --inspect=9229 app.js
   ```
   观察控制台输出的端口冲突错误。

2. 修改为不同端口：
   ```javascript
   // 在 app.js 的 createChildProcess 函数中
   // 为每个子进程分配不同的端口
   const debugPort = 9230 + index;
   const child = fork('./child-task.js', [], {
     execArgv: [`--inspect=${debugPort}`]
   });
   ```

3. 重新启动：
   ```bash
   node --inspect=9229 app.js
   ```
   确认父进程监听 9229，子进程分别监听 9230、9231 等。

4. 打开 `chrome://inspect`，确认能看到多个 Node.js 进程

### 思考题
- `--inspect=0` 的含义是什么？它如何帮助解决端口冲突？
- `--inspect-port` 选项和 `--inspect` 选项有什么区别？

---

## 练习 2：在 Chrome DevTools 中同时调试两个进程

### 目标
学会在多个调试会话之间切换，同时跟踪父进程和子进程的执行。

### 步骤

1. 启动应用并确保父子进程都有独立的 inspector 端口：
   ```bash
   node --inspect=9229 app.js
   ```

2. 打开 Chrome，访问 `chrome://inspect`

3. 在 "Remote Target" 列表中，你应该看到多个 Node.js 实例：
   - 主进程（端口 9229）
   - 子进程 1（端口 9230）
   - 子进程 2（端口 9231）

4. 为每个进程打开独立的 DevTools 窗口

5. 在主进程的 DevTools 中：
   - 在 `createChildProcess()` 函数中设置断点
   - 在 `sendTaskToChild()` 函数中设置断点

6. 在子进程的 DevTools 中：
   - 在 `process.on('message', ...)` 回调中设置断点
   - 在 `handleComputeTask()` 函数中设置断点

7. 观察消息在主进程断点 → IPC → 子进程断点之间的流转

### 技巧
- 在 DevTools 中使用 "Pause on exceptions" 捕获未处理的异常
- 使用 "Async" 调用栈选项查看异步调用链
- 使用 "Event Listener Breakpoints" 在 IPC 消息到达时暂停

---

## 练习 3：追踪 IPC 消息的发送和接收

### 目标
定位 IPC 消息丢失的 Bug，理解父子进程之间的消息传递机制。

### 背景
`app.js` 中存在一个竞态条件：在子进程可能还没完全就绪时就发送了"紧急任务"消息，导致消息丢失。

### 步骤

1. 在 `app.js` 中，找到以下代码段：
   ```javascript
   // ⚠️ Bug: 竞态条件
   console.log('\n--- 立即发送紧急任务（可能在子进程就绪前） ---');
   children.forEach((child, i) => {
     child.send({
       type: 'urgent',
       taskId: `urgent-${i}`,
       payload: { value: Math.random() * 1000 }
     });
   });
   ```

2. 在 `child.send(...)` 这一行设置断点

3. 在 `child-task.js` 的 `process.on('message', ...)` 回调中设置断点

4. 运行应用，观察：
   - 父进程发送 "urgent" 消息时，子进程是否已就绪？
   - 子进程是否收到了 "urgent" 消息？
   - `child.connected` 的值是什么？

5. 添加 IPC 消息追踪日志：
   ```javascript
   // 在 app.js 中，包装 child.send 方法
   const originalSend = child.send.bind(child);
   child.send = (msg, callback) => {
     console.log(`[IPC -> ${child.processName}]`, msg.type, msg.taskId || '');
     console.log(`  connected: ${child.connected}`);
     return originalSend(msg, callback);
   };
   ```

### 修复任务

修复竞态条件，确保只在子进程就绪后发送消息：

```javascript
// 方案 1：等待子进程的 'ready' 消息后再发送
child.on('message', function onReady(msg) {
  if (msg.type === 'ready') {
    child.removeListener('message', onReady);
    // 现在可以安全地发送消息了
    child.send({ type: 'urgent', taskId: `urgent-${i}`, payload: { ... } });
  }
});

// 方案 2：使用 child.connected 检查
if (child.connected) {
  child.send(message);
} else {
  child.once('connect', () => child.send(message));
}
```

### 验证
修复后，确认所有 "urgent" 消息都被子进程正确接收和处理。

---

## 练习 4：调试 Worker Thread 中的计算错误

### 目标
发现并修复 Worker 计算逻辑中的 off-by-one Bug。

### 背景
`worker-compute.js` 中的质数生成函数存在 off-by-one 错误，实际生成的质数数量比请求的少 1 个。

### 步骤

1. 单独运行 Worker Pool 演示：
   ```bash
   node worker-pool.js
   ```

2. 观察输出中质数计算的结果，注意 `count` 字段

3. 在 `worker-compute.js` 的 `generatePrimes()` 函数入口设置断点：
   ```bash
   node --inspect worker-pool.js
   ```

4. 在 Chrome DevTools 中切换到 Worker 线程的调试会话

5. 在 `generatePrimes` 函数中设置断点，单步执行，观察：
   - `count` 参数的值（期望值）
   - `primes.length` 在循环中的变化
   - 循环终止条件 `primes.length < count - 1`

6. 当循环结束时，检查 `primes` 数组的长度是否等于 `count`

### 分析
- 循环条件 `primes.length < count - 1` 意味着什么？
- 如果 `count = 10`，循环会在 `primes.length` 为多少时停止？
- 正确的条件应该是什么？

### 修复任务

```javascript
// 修改 generatePrimes 函数中的循环条件
// 修改前（Bug）：
while (primes.length < count - 1) {

// 修改后（正确）：
while (primes.length < count) {
```

### 验证
修复后运行测试：
```javascript
// 验证：生成前 10 个质数
// 期望结果：[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]（共 10 个）
```

---

## 练习 5：定位 Worker Pool 中的 Worker 泄漏

### 目标
发现 Worker Pool 中 Worker 完成任务后不被释放的 Bug，理解 Worker 状态管理。

### 背景
`worker-pool.js` 中，Worker 完成计算任务后没有被放回空闲池，导致后续任务无法被分配。

### 步骤

1. 运行 Worker Pool 演示：
   ```bash
   node worker-pool.js
   ```

2. 观察输出：
   - 提交了多少个任务？
   - 实际完成了多少个？
   - 最终状态中的 `availableWorkers`、`busyWorkers`、`queueLength` 各是多少？

3. 预期输出：
   ```
   初始状态: { totalWorkers: 4, availableWorkers: 4, busyWorkers: 0, queueLength: 0, ... }
   ...（只有 4 个任务完成）...
   最终状态: { totalWorkers: 4, availableWorkers: 0, busyWorkers: 4, queueLength: 8, ... }
   ```

4. 在 `_handleWorkerMessage()` 方法中设置断点

5. 当 Worker 返回结果时，检查：
   - Worker 是否从 `busyWorkers` 中移除？
   - Worker 是否被添加到 `availableWorkers`？
   - `_processQueue()` 是否被调用？

### 分析
- 为什么只有前 4 个任务完成了？
- `availableWorkers` 为什么变成了 0？
- 队列中积压的任务为什么没有被处理？

### 修复任务

在 `_handleWorkerMessage()` 方法中，任务完成后将 Worker 放回空闲池：

```javascript
_handleWorkerMessage(worker, msg) {
  if (msg.type === 'result') {
    // ... 现有的结果处理代码 ...

    // 修复：将 Worker 放回空闲池
    this.busyWorkers.delete(worker);
    this.availableWorkers.add(worker);

    // 修复：处理队列中等待的任务
    this._processQueue();
  }
}
```

### 验证
修复后重新运行，确认：
- 所有 12 个任务都完成
- 最终状态 `availableWorkers: 4`，`busyWorkers: 0`，`queueLength: 0`

---

## 练习 6：使用 --inspect-port 动态分配调试端口

### 目标
掌握 `--inspect-port` 选项的使用，让 Node.js 自动为子进程/Worker 分配调试端口。

### 背景
手动管理调试端口在进程数量多时非常麻烦。`--inspect-port` 可以让 Node.js 自动递增分配端口。

### 步骤

1. 使用 `--inspect-port` 启动应用：
   ```bash
   node --inspect --inspect-port=9229 app.js
   ```

2. 观察控制台输出，记录每个进程的调试端口：
   ```
   主进程: 9229
   子进程 1: ?
   子进程 2: ?
   Worker 1: ?
   Worker 2: ?
   ```

3. 打开 `chrome://inspect`，确认所有进程都出现在列表中

4. 为每个进程配置 "Network targets"（如果需要手动连接）

5. 编写一个辅助函数，动态获取所有调试端口：
   ```javascript
   // 在 app.js 中添加
   const inspector = require('node:inspector');

   function getDebugUrl() {
     return inspector.url();
   }

   // 在创建子进程/Worker 后打印调试 URL
   console.log(`子进程调试 URL: ${getDebugUrl()}`);
   ```

6. 使用 VS Code 的 `autoAttachChildProcesses` 功能：
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "调试多进程应用",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/app.js",
         "runtimeArgs": ["--inspect-port=9229"],
         "autoAttachChildProcesses": true,
         "console": "integratedTerminal",
         "timeout": 30000
       }
     ]
   }
   ```

### 进阶：调试 Worker Pool

```bash
# 调试 Worker Pool，同时查看所有 Worker 线程
node --inspect --inspect-port=9229 worker-pool.js
```

在 Chrome DevTools 中：
1. 打开主线程的 DevTools
2. 点击左上角的线程选择器
3. 切换到不同的 Worker 线程
4. 在每个 Worker 的 `parentPort.on('message', ...)` 中设置断点

### 思考题
- `--inspect-port=0` 和 `--inspect-port=9229` 的区别是什么？
- 在 Cluster 模式下，如何为每个工作进程分配独立的调试端口？
- 如果 Worker Pool 有 100 个 Worker，你会如何高效地调试？（提示：不需要同时调试所有 Worker）
