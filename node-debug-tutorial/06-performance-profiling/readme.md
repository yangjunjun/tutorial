# Node.js 性能分析教程

## 1. Node.js 性能分析概述

Node.js 性能问题通常分为以下几类：

| 类别 | 表现 | 常见原因 |
|------|------|----------|
| **CPU 密集** | 事件循环被阻塞，请求延迟高 | 复杂计算、同步加密、大排序 |
| **I/O 瓶颈** | 吞吐量低，等待时间长 | 同步文件操作、N+1 数据库查询 |
| **内存压力** | GC 频繁触发，延迟尖刺 | 大对象分配、内存泄漏 |
| **事件循环阻塞** | 所有操作响应变慢 | 长同步代码段、大 JSON 序列化 |

### 核心原则

1. **先测量，后优化**：不要凭直觉优化
2. **关注热路径**：80% 的时间花在 20% 的代码上
3. **了解事件循环**：任何同步阻塞都会影响所有并发请求
4. **使用正确工具**：不同问题需要不同的分析手段

---

## 2. `node --prof` 生成 V8 日志 + `node --prof-process` 分析

### 2.1 生成 V8 性能日志

```bash
# 运行应用并生成 V8 日志文件
node --prof app.js

# 会生成类似 isolate-0x1234567890-v8.log 的文件
```

### 2.2 处理日志

```bash
# 将 V8 日志转换为可读的摘要
node --prof-process isolate-*.log > profile.txt

# 查看输出
cat profile.txt
```

### 2.3 输出解读

`--prof-process` 的输出包含以下几个部分：

```
 [Summary]:
   ticks  total  nonlib   name
    1234   45.6%   67.8%  JavaScript      ← JS 代码占比
     234    8.7%   12.9%  C++             ← C++ 原生代码
     567   20.9%   31.3%  GC              ← 垃圾回收时间占比

 [JavaScript]:
   ticks  total  nonlib   name
    100    3.7%    5.5%  LazyCompile: *bubbleSort app.js:15:22    ← 热点函数
     80    2.9%    4.4%  LazyCompile: *processData app.js:42:25

 [C++]:
   ticks  total  nonlib   name
     50    1.8%    2.8%  node::fs::ReadFileCommand
```

**关键指标**：
- **ticks**：采样次数（越多表示该函数占用 CPU 时间越长）
- **total**：占总采样数的百分比
- **nonlib**：占非 idle 采样的百分比

---

## 3. Chrome DevTools Performance 面板（CPU Profiling）

### 3.1 基本步骤

1. 启动应用：`node --inspect app.js`
2. 打开 Chrome，访问 `chrome://inspect`
3. 点击 "inspect" 打开 DevTools
4. 切换到 **Performance** 面板
5. 点击 **Record**（录制）按钮
6. 执行操作（发送请求等）
7. 点击 **Stop** 停止录制
8. 分析火焰图和调用栈

### 3.2 Performance 面板功能

- **Flame Chart（火焰图）**：显示函数调用栈和时间分布
- **Bottom-Up 标签**：从被调用函数向上追踪
- **Call Tree 标签**：从调用函数向下展开
- **Summary 标签**：按类别（Scripting、Rendering 等）汇总时间

---

## 4. `--cpu-prof` 标志（Node 12+）生成 .cpuprofile 文件

```bash
# 在进程退出时自动生成 CPU profile 文件
node --cpu-prof app.js

# 指定输出目录
node --cpu-prof --cpu-prof-dir=./profiles app.js

# 指定采样间隔（微秒，默认 1000 = 1ms）
node --cpu-prof --cpu-prof-interval=500 app.js
```

生成的 `.cpuprofile` 文件可以直接在 Chrome DevTools 中加载：

1. 打开 Chrome DevTools
2. 切换到 **Performance** 面板
3. 点击 **Load profile...** 按钮
4. 选择生成的 `.cpuprofile` 文件

### 编程方式使用

```js
// Node.js 14.0.0+ 可以使用 inspector 模块编程式控制
const inspector = require('inspector');
const fs = require('fs');

const session = new inspector.Session();
session.connect();

session.post('Profiler.enable');
session.post('Profiler.start');

// ... 执行要分析的代码 ...

session.post('Profiler.stop', (err, { profile }) => {
  fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
  console.log('CPU profile 已保存');
});
```

---

## 5. 火焰图（Flame Graph）阅读指南

### 5.1 火焰图结构

```
              ┌──────────────┐
              │  main()       │  ← 入口函数（最底层）
              └──────┬───────┘
           ┌─────────┴─────────┐
     ┌─────┴──────┐      ┌────┴────────┐
     │ functionA  │      │ functionB   │  ← 调用层级
     └─────┬──────┘      └────┬────────┘
     ┌─────┴──────┐      ┌────┴────────┐
     │ helperA1   │      │ helperB1    │  ← 子函数
     └────────────┘      └─────────────┘

     ◄──── 宽度 ────►
     宽度 = 函数在栈中的时间占比
```

### 5.2 阅读要点

- **X 轴（宽度）**：函数占用 CPU 时间的比例，越宽表示越耗时
- **Y 轴（高度）**：调用栈深度，越往上越深
- **热点函数**：在火焰图中最宽的"平台"（plateau）就是优化目标
- **颜色**：通常随机分配，不代表任何含义（除非使用差异化着色）

### 5.3 常见模式

| 模式 | 含义 |
|------|------|
| 宽平台 | 该函数自身消耗大量 CPU（不是子函数） |
| 高尖塔 | 深层调用链，可能是递归或复杂的库调用 |
| 锯齿状 | 频繁切换函数，可能是事件驱动或回调模式 |
| GC 块 | V8 垃圾回收占用的时间（在 --prof 输出中可见） |

---

## 6. Clinic.js 工具链简介

[Clinic.js](https://clinicjs.org/) 是一套 Node.js 性能诊断工具集。

### 6.1 安装

```bash
npm install -g clinic
```

### 6.2 Clinic Doctor — 系统级诊断

```bash
clinic doctor -- node app.js
```

- 收集 CPU、内存、事件循环延迟、活跃句柄数等指标
- 生成 HTML 报告，自动检测常见问题
- 适合初步排查：它会告诉你"接下来该用哪个 Clinic 工具"

### 6.3 Clinic Flame — 火焰图生成器

```bash
clinic flame -- node app.js
```

- 生成可交互的火焰图 HTML
- 基于 `0x` 工具
- 支持差异对比（Differential Flame Graph）

### 6.4 Clinic Bubbleprof — 异步活动可视化

```bash
clinic bubbleprof -- node app.js
```

- 可视化异步操作的依赖关系
- 识别异步瓶颈（如串行 I/O 可以并行化的部分）
- 适合分析 I/O 密集型应用

### 6.5 Clinic HeapProfiler — 堆内存分析

```bash
clinic heapprofiler -- node app.js
```

- 生成堆内存分配火焰图
- 识别内存分配热点

---

## 7. `perf_hooks` 模块

### 7.1 `performance.now()` — 高精度计时

```js
const { performance } = require('perf_hooks');

const start = performance.now();
// ... 执行操作 ...
const end = performance.now();
console.log(`耗时: ${(end - start).toFixed(3)} 毫秒`);
```

相比 `Date.now()`，`performance.now()` 精度更高（亚毫秒级）。

### 7.2 `performance.mark()` 和 `performance.measure()`

```js
const { performance } = require('perf_hooks');

performance.mark('开始处理');
// ... 阶段 1 ...
performance.mark('阶段1完成');
performance.measure('阶段1耗时', '开始处理', '阶段1完成');

// ... 阶段 2 ...
performance.mark('阶段2完成');
performance.measure('阶段2耗时', '阶段1完成', '阶段2完成');

// 获取所有测量结果
const measures = performance.getEntriesByType('measure');
measures.forEach((m) => {
  console.log(`${m.name}: ${m.duration.toFixed(3)} ms`);
});
```

### 7.3 `PerformanceObserver` — 性能监控

```js
const { PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`[性能事件] ${entry.entryType}: ${entry.name} = ${entry.duration}ms`);
  }
});

// 监听 measure 类型的性能条目
obs.observe({ entryTypes: ['measure', 'mark', 'function'] });

// 使用 performance.timerify() 自动追踪函数调用
const { performance } = require('perf_hooks');
const slowFunc = performance.timerify(function slowFunction() {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) sum += i;
  return sum;
});

slowFunction(); // 会自动产生一个 function 类型的性能条目
```

---

## 8. 常见性能瓶颈模式

### 8.1 同步阻塞事件循环

```js
// 反例：同步读取大量文件
const files = fs.readdirSync('./data');
files.forEach((f) => {
  const content = fs.readFileSync(`./data/${f}`, 'utf-8'); // 每个文件都阻塞
});

// 正例：异步并行读取
const files = await fs.promises.readdir('./data');
const contents = await Promise.all(
  files.map((f) => fs.promises.readFile(`./data/${f}`, 'utf-8'))
);
```

### 8.2 正则表达式回溯（ReDoS）

```js
// 反例：容易回溯的正则
const regex = /^(a+)+$/;
regex.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'); // 极慢！

// 正例：避免嵌套量词
const regex = /^a+$/;
regex.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'); // 很快
```

### 8.3 大量 JSON 序列化/反序列化

```js
// 反例：同步序列化大对象
const json = JSON.stringify(hugeObject); // 阻塞事件循环

// 正例：使用流式 JSON 或分块处理
const { Transform } = require('stream');
// 或使用 fast-json-stringify 等优化库
```

### 8.4 N+1 查询

```js
// 反例：循环中逐个查询
for (const userId of userIds) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
}

// 正例：批量查询
const users = await db.query(
  'SELECT * FROM users WHERE id IN (?)',
  [userIds]
);
```

---

## 9. 实战：分析并优化数据处理管道

本项目包含以下实战文件：

| 文件 | 内容 |
|------|------|
| `app.js` | 包含 4 种性能问题的数据处理管道 |
| `optimized.js` | 优化版本，展示每种问题的修复方案 |
| `perf-hooks-demo.js` | `perf_hooks` 模块完整演示 |
| `exercise.md` | 5 个动手练习 |

### 快速开始

```bash
# 运行有性能问题的版本
node app.js

# 运行优化版本
node optimized.js

# 使用 --prof 分析
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# 使用 --cpu-prof 分析（Node 12+）
node --cpu-prof app.js

# 运行 perf_hooks 演示
node perf-hooks-demo.js
```
