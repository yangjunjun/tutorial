# Node.js 内存泄漏调试指南

## 1. Node.js 内存模型简介

Node.js 使用 V8 引擎管理内存，主要分为以下几个区域：

### 1.1 V8 堆内存（Heap）

V8 堆内存是 Node.js 中对象分配的主要区域，采用**分代垃圾回收**策略：

- **新生代（New Space / Young Generation）**
  - 大小较小（通常 1~8 MB，64 位系统上约 32 MB）
  - 使用 **Scavenge 算法**（Cheney 复制算法）进行垃圾回收
  - 分为两个半空间（from-space 和 to-space），存活对象在两者之间复制
  - 大多数对象生命周期很短，在新生代即被回收

- **老生代（Old Space / Old Generation）**
  - 大小较大，可通过 `--max-old-space-size` 配置
  - 使用 **Mark-Sweep**（标记-清除）和 **Mark-Compact**（标记-整理）算法
  - 从新生代晋升（Promotion）过来的长生命周期对象存放于此
  - 垃圾回收频率较低但耗时较长

### 1.2 堆外内存

- **External Memory**：V8 对象关联的 C++ 对象所占用的内存（如 Buffer）
- **Array Buffers**：`ArrayBuffer`、`SharedArrayBuffer` 等分配的内存
- **Native Objects**：Node.js 底层 C++ 对象（如 zlib、crypto 上下文）

### 1.3 栈内存（Stack）

- 函数调用栈、局部变量
- 大小有限（默认约 1.5 MB），不受 GC 管理

---

## 2. `process.memoryUsage()` 各字段含义

```js
const mem = process.memoryUsage();
console.log(mem);
// {
//   rss: 52428800,           // 常驻集大小（Resident Set Size）
//   heapTotal: 34567890,     // V8 堆的总大小
//   heapUsed: 21234567,      // V8 堆已使用的大小
//   external: 1234567,       // V8 管理的外部内存（C++ 对象）
//   arrayBuffers: 987654     // ArrayBuffer 和 SharedArrayBuffer 的内存
// }
```

| 字段 | 含义 |
|------|------|
| `rss` | 进程在操作系统中占用的全部物理内存（包括堆、栈、C++ 对象、代码段等） |
| `heapTotal` | V8 引擎当前申请的堆内存总量（会随需要动态扩展，直到达到上限） |
| `heapUsed` | V8 堆中实际被对象占用的内存 |
| `external` | V8 对象所绑定的 C++ 对象的内存大小（如 `Buffer` 实例底层存储） |
| `arrayBuffers` | 通过 `ArrayBuffer` / `SharedArrayBuffer` 分配的内存（也包含在 `external` 中） |

> **提示**：`process.memoryUsage.rss()` 是一个更快的替代方法，只返回 RSS 值，不会触发 GC。

---

## 3. 内存泄漏的常见原因

### 3.1 全局变量无限增长

```js
// 反例：全局缓存没有淘汰策略
const cache = {};
function handleRequest(key, data) {
  cache[key] = data; // 永远不清理，cache 无限增长
}
```

**修复**：使用 LRU 缓存（如 `lru-cache` 包）、设置过期时间、或限制缓存大小。

### 3.2 闭包持有大对象引用

```js
function process(data) {
  const hugeArray = data.slice(); // 复制了一个大数组
  setInterval(() => {
    console.log(hugeArray.length); // 闭包引用 hugeArray，导致无法回收
  }, 10000);
}
```

**修复**：及时 `clearInterval`、在回调中只引用必要的数据、使用弱引用。

### 3.3 事件监听器累积

```js
const emitter = new EventEmitter();
function setup() {
  // 每次调用都添加新的监听器，但从未移除
  emitter.on('data', (chunk) => { /* 处理数据 */ });
}
// 如果 setup() 被反复调用，监听器会越来越多
```

**修复**：使用 `emitter.removeListener()` 或 `emitter.once()`，在适当时机移除监听器。

### 3.4 定时器未清理

```js
function startPolling() {
  const data = loadHugeData();
  const timer = setInterval(() => {
    refreshData(data); // data 被闭包持有
  }, 5000);
  // 忘记 clearInterval(timer)
}
```

**修复**：确保在对象销毁、连接关闭时清理所有定时器。

### 3.5 缓存无上限

```js
const userCache = new Map();
function getUser(id) {
  if (!userCache.has(id)) {
    userCache.set(id, fetchUser(id)); // 永远只增不减
  }
  return userCache.get(id);
}
```

**修复**：使用带容量限制的缓存、TTL 过期策略、WeakMap（适用于对象键）。

---

## 4. 使用 Chrome DevTools 做 Heap Snapshot 对比

### 4.1 基本步骤

1. 启动应用：`node --inspect app.js`
2. 打开 Chrome，访问 `chrome://inspect`
3. 点击 "inspect" 打开 DevTools
4. 切换到 **Memory** 面板
5. 选择 **Heap Snapshot**，点击 **Take snapshot** 获取基线快照
6. 触发可疑操作（如发送若干请求）
7. 再次点击 **Take snapshot** 获取操作后快照
8. 选择第二个快照，在上方下拉框中选择 **Comparison** 对比视图
9. 查看新增的对象类型和数量，定位泄漏来源

### 4.2 Allocation Timeline

1. 在 Memory 面板选择 **Allocation instrumentation on timeline**
2. 点击 **Start**
3. 执行操作
4. 点击 **Stop**
5. 在时间线上查看每个时间段的内存分配情况
6. 蓝色柱状条表示未被回收的内存——这些就是潜在的泄漏

### 4.3 Allocation Sampling

适用于长期运行的应用：
- 选择 **Allocation sampling**
- 以低开销采样方式记录内存分配
- 适合在生产环境进行初步排查

---

## 5. `--heap-prof` 和 `--heapsnapshot-signal` 标志

### 5.1 `--heap-prof`

```bash
node --heap-prof app.js
```

- 在进程退出时生成 `.heapprofile` 文件
- 文件包含堆内存分配的采样数据
- 可在 Chrome DevTools Memory 面板中加载分析

### 5.2 `--heapsnapshot-signal`

```bash
node --heapsnapshot-signal=SIGUSR2 app.js
```

- 当进程收到指定信号时，自动生成 `.heapsnapshot` 文件
- 在 Linux/macOS 上：`kill -USR2 <pid>`
- 在 Windows 上：不支持 UNIX 信号，可用 `--heapsnapshot-signal=SIGINT` 配合 Ctrl+C

```bash
# 示例
node --heapsnapshot-signal=SIGUSR2 server.js
# 然后在另一个终端：
kill -USR2 $(pgrep -f server.js)
# 会在当前目录生成 Heap-20240101-123456.heapsnapshot 文件
```

---

## 6. `v8.getHeapSnapshot()` 编程式获取快照

```js
const v8 = require('v8');
const fs = require('fs');

function takeSnapshot(filename) {
  const snapshotStream = v8.getHeapSnapshot();
  const fileStream = fs.createWriteStream(filename);
  snapshotStream.pipe(fileStream);
  console.log(`堆快照已保存到 ${filename}`);
}

// 使用示例
takeSnapshot('before.heapsnapshot');
// ... 执行一些操作 ...
takeSnapshot('after.heapsnapshot');
```

> **注意**：获取堆快照会暂停事件循环，堆越大暂停时间越长。生产环境中谨慎使用。

还可以使用 `v8.getHeapSpaceStatistics()` 获取各堆空间的统计信息：

```js
const v8 = require('v8');
console.log(v8.getHeapSpaceStatistics());
```

---

## 7. 使用 `--max-old-space-size` 控制堆大小

```bash
# 将老生代堆内存上限设为 4GB（默认值通常为 ~1.5GB 或物理内存的 1/4）
node --max-old-space-size=4096 app.js

# 设为 512MB（适合内存受限环境）
node --max-old-space-size=512 app.js
```

**何时使用**：
- 默认限制不够时（如处理大量数据）
- 限制内存使用以避免 OOM（Out of Memory）影响系统其他进程
- 注意：提高上限不能解决内存泄漏，只是推迟崩溃时间

**配合诊断**：

```bash
# 当堆使用量接近上限时，Node.js 会输出 GC 日志
node --max-old-space-size=512 --trace-gc app.js
```

---

## 8. 实战：定位并修复多个内存泄漏场景

本项目包含以下实战文件：

| 文件 | 内容 |
|------|------|
| `app.js` | 演示 4 种内存泄漏类型，每种泄漏在独立函数中 |
| `heap-snapshot.js` | 自动创建堆快照并对比分析 |
| `monitor.js` | 内存监控工具，可检测泄漏趋势 |
| `exercise.js` | 3 个练习：找出并修复隐藏的内存泄漏 |

### 快速开始

```bash
# 运行内存泄漏演示
node app.js

# 运行堆快照对比工具
node heap-snapshot.js

# 运行内存监控工具
node monitor.js

# 运行练习题
node exercise.js
```

### 调试技巧总结

1. **尽早发现**：定期监控 `process.memoryUsage()`，设置告警阈值
2. **定位泄漏源**：使用 Heap Snapshot 对比，找出新增的对象类型
3. **验证修复**：修复后用监控工具确认内存增长趋势已被遏制
4. **生产环境**：使用 `--heapsnapshot-signal` 在不中断服务的情况下获取快照
5. **代码审查**：重点关注全局变量、事件监听器、定时器、闭包引用
