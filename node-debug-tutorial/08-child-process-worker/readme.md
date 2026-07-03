# 调试多进程与 Worker Threads 架构

## 概述

Node.js 虽然是单线程的，但通过 `child_process`、`worker_threads` 和 `cluster` 模块，可以创建多进程/多线程架构来处理 CPU 密集型任务和并行计算。调试这类架构比单进程应用更复杂，因为需要同时跟踪多个执行上下文。

本教程将系统讲解如何调试 Node.js 多进程和多线程应用。

---

## 1. Node.js 多进程架构概述

### 1.1 三种并行计算方式

| 方式 | 模块 | 特点 | 适用场景 |
|------|------|------|----------|
| 子进程 | `child_process` | 独立进程，内存隔离 | 执行外部命令、隔离崩溃 |
| Worker 线程 | `worker_threads` | 共享内存，轻量 | CPU 密集型计算 |
| 集群 | `cluster` | 多进程共享端口 | Web 服务器水平扩展 |

### 1.2 进程/线程通信方式

```
子进程 (child_process):
  父进程 <--IPC (JSON 消息)--> 子进程

Worker 线程 (worker_threads):
  主线程 <--MessagePort / SharedArrayBuffer--> Worker

Cluster:
  主进程 <--IPC--> 工作进程（多个工作进程共享端口）
```

---

## 2. child_process.fork() 调试

### 2.1 父子进程各自的 Inspector 端口

当使用 `--inspect` 启动父进程时，子进程 **默认不会** 启动 inspector。需要显式地为子进程配置调试端口。

```javascript
const { fork } = require('child_process');

// 父进程使用默认端口 9229
// 子进程需要指定不同的端口，否则会端口冲突
const child = fork('./child-task.js', [], {
  execArgv: ['--inspect=9230']  // 子进程使用 9230 端口
});
```

### 2.2 --inspect-port 选项

Node.js 提供了 `--inspect-port` 选项，可以自动为子进程分配不同的调试端口：

```bash
# 启动父进程时，让 Node 自动为 fork 的子进程分配递增的端口
node --inspect --inspect-port=9229 app.js

# 父进程: 9229
# 第1个子进程: 9230
# 第2个子进程: 9231
# 以此类推...
```

### 2.3 在 VS Code 中调试多进程

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试主进程",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app.js",
      "runtimeArgs": ["--inspect-port=9229"],
      "autoAttachChildProcesses": true,
      "console": "integratedTerminal"
    }
  ]
}
```

**关键配置**：`autoAttachChildProcesses: true` 使 VS Code 自动附加到子进程的调试器。

---

## 3. Worker Threads 调试

### 3.1 每个 Worker 独立的 Inspector

Worker Threads 运行在同一个进程内，但每个 Worker 有独立的 V8 隔离区。调试时：

- 主线程使用主 inspector 端口
- 每个 Worker 在 Chrome DevTools 中有独立的 "session"
- 可以在 DevTools 的线程切换器中切换不同 Worker

### 3.2 通过 execArgv 传递调试参数

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./worker-compute.js', {
  workerData: { task: 'compute-primes' },
  // 将调试参数传递给 Worker
  execArgv: ['--inspect=0'],  // 端口 0 表示自动分配
});
```

### 3.3 在 Chrome DevTools 中切换 Worker

1. 打开 `chrome://inspect`
2. 点击 "Open dedicated DevTools for Node"
3. 在 DevTools 左上角，点击线程选择器（显示为 "Node.js" 旁边的下拉菜单）
4. 在列表中选择要调试的 Worker 线程

---

## 4. 进程间通信（IPC）调试

### 4.1 IPC 消息的发送与接收

```javascript
// 父进程发送消息
child.send({ type: 'task', id: 1, data: { numbers: [1, 2, 3] } });

// 子进程接收消息
process.on('message', (msg) => {
  console.log('子进程收到消息:', msg);
  // 处理任务...
  process.send({ type: 'result', id: msg.id, result: 42 });
});

// 父进程接收子进程的消息
child.on('message', (msg) => {
  console.log('父进程收到消息:', msg);
});
```

### 4.2 IPC 调试技巧

**1. 消息日志中间件**
```javascript
// 在父进程中包装 IPC 消息处理，添加日志
function wrapIPC(child, label) {
  const originalSend = child.send.bind(child);
  child.send = (msg) => {
    console.log(`[IPC -> ${label}]`, JSON.stringify(msg));
    return originalSend(msg);
  };
  child.on('message', (msg) => {
    console.log(`[IPC <- ${label}]`, JSON.stringify(msg));
  });
}
```

**2. 在 DevTools 中设置消息断点**
```javascript
// 在 process.on('message', ...) 的回调函数中设置断点
// 每次收到 IPC 消息时，调试器会暂停
```

**3. 追踪消息丢失**
```javascript
// 给每条消息添加唯一 ID 和超时检测
let messageId = 0;
const pendingMessages = new Map();

function sendAndWait(child, data, timeout = 5000) {
  const id = ++messageId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingMessages.delete(id);
      reject(new Error(`消息 ${id} 超时未响应`));
    }, timeout);

    pendingMessages.set(id, { resolve, reject, timer });
    child.send({ ...data, _msgId: id });
  });
}

child.on('message', (msg) => {
  if (msg._msgId && pendingMessages.has(msg._msgId)) {
    const { resolve, timer } = pendingMessages.get(msg._msgId);
    clearTimeout(timer);
    pendingMessages.delete(msg._msgId);
    resolve(msg);
  }
});
```

---

## 5. Cluster 模块的调试方法

### 5.1 Cluster 架构

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  // 主进程：管理工作进程
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 工作进程：运行实际的应用
  require('./server.js');
}
```

### 5.2 Cluster 调试注意事项

1. **端口冲突**：每个工作进程需要不同的 inspector 端口
   ```javascript
   // 使用 --inspect-port 自动分配
   // 或在 fork 时指定：
   cluster.fork({ NODE_DEBUG_PORT: 9230 + i });
   ```

2. **工作进程崩溃重启**：需要在调试器中处理进程重新附加
   ```javascript
   cluster.on('exit', (worker, code, signal) => {
     console.log(`工作进程 ${worker.process.pid} 退出 (${signal || code})`);
     // 调试时可能不想自动重启
     if (process.env.DEBUG) {
       console.log('调试模式：不自动重启工作进程');
     } else {
       cluster.fork(); // 重启
     }
   });
   ```

3. **共享端口调试**：在 `cluster.fork()` 之前设置环境变量

---

## 6. 常见问题

### 6.1 端口冲突

**症状**：
```
Error: listen EADDRINUSE: address already in use :::9229
```

**原因**：多个进程/线程尝试使用同一个 inspector 端口

**解决**：
```bash
# 使用 --inspect-port 选项让 Node 自动分配
node --inspect-port=9229 app.js

# 或手动指定不同端口
node --inspect=9229 app.js          # 父进程
# execArgv: ['--inspect=9230']      # 子进程
# execArgv: ['--inspect=9231']      # 第二个子进程
```

### 6.2 进程泄漏

**症状**：应用退出后仍有子进程在后台运行

**原因**：父进程退出时没有正确清理子进程

**解决**：
```javascript
// 在父进程中注册清理钩子
const children = [];

process.on('exit', () => {
  children.forEach(child => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
});

process.on('SIGINT', () => {
  children.forEach(child => child.kill('SIGTERM'));
  process.exit(0);
});
```

### 6.3 消息丢失

**症状**：发送了 IPC 消息，但对方没有收到

**原因**：
1. 子进程在发送消息前已退出
2. IPC 通道已断开
3. 消息格式不正确（非序列化对象）

**调试**：
```javascript
// 检查 IPC 通道是否可用
if (child.connected) {
  child.send(message);
} else {
  console.error('IPC 通道已断开，无法发送消息');
}

// 检查发送结果
const sent = child.send(message, (err) => {
  if (err) console.error('消息发送失败:', err);
});
```

---

## 7. 实战：调试 Worker Pool

### 7.1 Worker Pool 架构

```
主线程
  ├── WorkerPool 管理器
  │     ├── Worker 1 (端口 9230)
  │     ├── Worker 2 (端口 9231)
  │     └── Worker 3 (端口 9232)
  │
  ├── 任务队列
  │     ├── 任务 A -> 分配给 Worker 1
  │     ├── 任务 B -> 分配给 Worker 2
  │     └── 任务 C -> 等待空闲 Worker
  │
  └── 结果收集器
```

### 7.2 调试 Worker Pool 的步骤

1. **启动主进程调试**
   ```bash
   node --inspect --inspect-port=9229 worker-pool.js
   ```

2. **在 Chrome DevTools 中查看线程列表**
   - 打开 DevTools，左上角可以看到所有 Worker 线程
   - 每个 Worker 可以独立设置断点

3. **跟踪任务分配**
   - 在 `WorkerPool.dispatchTask()` 中设置断点
   - 观察任务如何被分配到不同 Worker

4. **跟踪任务执行**
   - 切换到 Worker 线程的 DevTools
   - 在 Worker 的 `message` 事件处理器中设置断点

5. **检查结果收集**
   - 在 `WorkerPool` 的结果处理回调中设置断点
   - 验证结果是否正确合并

### 7.3 常见 Worker Pool 问题

| 问题 | 症状 | 调试方法 |
|------|------|----------|
| Worker 未释放 | 内存持续增长 | 检查 Worker 完成后是否从活跃列表移除 |
| 任务队列溢出 | 新任务被丢弃 | 监控队列长度，设置最大容量 |
| Worker 崩溃 | 任务无响应 | 监听 Worker 的 `error` 和 `exit` 事件 |
| 死锁 | 所有 Worker 繁忙但不产出 | 检查任务是否有超时机制 |

---

## 项目文件说明

| 文件 | 说明 |
|------|------|
| `app.js` | 主应用，演示 fork 子进程和 Worker Threads |
| `child-task.js` | 子进程脚本（通过 fork 启动） |
| `worker-compute.js` | Worker Thread 计算脚本 |
| `worker-pool.js` | Worker Pool 实现 |

## 快速开始

```bash
# 运行主应用
npm start

# 调试模式运行
npm run dev

# 运行 Worker Pool 演示
node --inspect worker-pool.js
```

## 内置 Bug 说明

本项目故意包含以下 Bug：

1. **IPC 消息处理竞态条件**：子进程的消息处理存在竞态
2. **子进程泄漏**：父进程退出时未清理子进程
3. **调试端口冲突**：多个子进程使用相同端口
4. **Worker 未处理终止信号**：Worker 在被终止时不清理资源
5. **Worker Pool 中 Worker 未释放**：完成任务后 Worker 仍标记为繁忙
6. **任务队列溢出**：队列没有容量限制

尝试使用本教程的调试技巧来定位和修复这些 Bug！
