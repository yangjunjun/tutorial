# Node.js 调试完全教程

> 从零到一，以项目驱动学习 Node.js 调试的方方面面。每个章节都是一个独立可运行的小项目。

## 前置要求

- Node.js >= 18（推荐 20 LTS）
- VS Code（推荐编辑器，非强制）
- Chrome 浏览器

## 教程大纲

| 章节 | 目录 | 主题 | 你将学到 |
|------|------|------|----------|
| 01 | `01-console-debugger/` | console 与 debugger 基础 | `console` 家族方法、`debugger` 语句、断点原理 |
| 02 | `02-inspector-devtools/` | Node Inspector + Chrome DevTools | `--inspect` 启动、Chrome DevTools 远程调试、Watch / Scope / Call Stack |
| 03 | `03-vscode-launch/` | VS Code 调试配置 | `launch.json` 编写、条件断点、Logpoint、多配置切换 |
| 04 | `04-async-debugging/` | 异步代码调试 | async/await 堆栈追踪、Promise 链调试、`--async-stack-traces` |
| 05 | `05-memory-leak/` | 内存泄漏排查 | Heap Snapshot 对比、Retainer 分析、`process.memoryUsage()` |
| 06 | `06-performance-profiling/` | 性能分析与火焰图 | `--prof`、Clinic.js、火焰图阅读、瓶颈定位 |
| 07 | `07-debug-express/` | Express 实战调试 | 中间件调试、请求追踪、错误边界、生产环境日志策略 |
| 08 | `08-child-process-worker/` | 子进程与 Worker Threads | `child_process` 调试、Worker Threads inspector 端口分配 |

## 学习路线

```
基础篇（01-03）→ 进阶篇（04-06）→ 实战篇（07-08）
```

**基础篇**适合刚接触 Node.js 调试的开发者，从最简单的 `console.log` 一路到 IDE 集成调试。

**进阶篇**聚焦异步、内存、性能三大高频难题，掌握 DevTools 的高级功能。

**实战篇**在真实 Express 项目和多进程架构中综合运用所有技巧。

## 快速开始

```bash
# 进入任意章节
cd 01-console-debugger
npm install   # 如有依赖
# 按 readme.md 指引运行
```

## 调试工具速查

| 工具 | 适用场景 | 命令/入口 |
|------|----------|-----------|
| `console.*` | 快速打印、计时、断言 | 代码内调用 |
| `debugger` | 代码级断点标记 | 代码内写 `debugger;` |
| `node --inspect` | Chrome DevTools 远程调试 | `node --inspect app.js` |
| VS Code Debugger | IDE 内断点、变量查看 | F5 / `.vscode/launch.json` |
| Chrome DevTools | 堆栈、作用域、火焰图 | `chrome://inspect` |
| Clinic.js | 性能 / 内存 / 事件循环分析 | `npx clinic doctor -- node app.js` |
| `--heap-prof` | 内存分配采样 | `node --heap-prof app.js` |
