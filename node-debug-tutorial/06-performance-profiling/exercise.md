# 性能分析实战练习

本练习将指导你使用各种工具分析和优化 `app.js` 中的数据处理管道。

---

## 练习 1：使用 `--prof` 分析 CPU 使用

### 目标
使用 V8 内置的 profiler 找出 `app.js` 中消耗 CPU 最多的函数。

### 步骤

1. **运行 `app.js` 并生成 V8 日志：**

```bash
node --prof app.js
```

运行完成后，当前目录会生成一个 `isolate-0x...-v8.log` 文件。

2. **处理日志文件：**

```bash
node --prof-process isolate-*-v8.log > profile-report.txt
```

3. **阅读报告，回答以下问题：**

- 哪个 JavaScript 函数占用的 CPU 时间最多？
- GC（垃圾回收）占用了多少比例的 CPU 时间？
- `bubbleSort` 函数在报告中的 tick 数是多少？
- C++ 代码（如 `fs.readFileSync`）占多少比例？

4. **深入分析：**

在报告的 `[JavaScript]` 部分，列出 top 5 最耗时的函数：

```
函数名            | ticks | 占比
------------------|-------|------
（在此填写）       |       |
（在此填写）       |       |
（在此填写）       |       |
（在此填写）       |       |
（在此填写）       |       |
```

### 提示
- 如果日志文件名有多个，可以用通配符 `isolate-*-v8.log`
- 关注 `[JavaScript]` 和 `[Summary]` 部分
- `LazyCompile:*` 前缀表示该函数被 JIT 编译过

---

## 练习 2：使用 `--cpu-prof` 生成火焰图并找到热点函数

### 目标
使用 `--cpu-prof` 生成 `.cpuprofile` 文件，在 Chrome DevTools 中查看火焰图。

### 步骤

1. **生成 CPU profile 文件：**

```bash
# 指定输出目录，避免文件散落在当前目录
mkdir -p profiles
node --cpu-prof --cpu-prof-dir=./profiles app.js
```

运行后会在 `profiles/` 目录下生成一个 `.cpuprofile` 文件。

2. **在 Chrome DevTools 中加载：**

- 打开 Google Chrome
- 按 F12 打开 DevTools
- 切换到 **Performance** 面板
- 点击左上角的 **Load profile...** 按钮
- 选择生成的 `.cpuprofile` 文件

3. **分析火焰图：**

- 找到最宽的"平台"（plateau）—— 这些是 CPU 热点
- 找到 `bubbleSort` 函数在火焰图中的位置
- 观察字符串拼接（`stage3_stringConcat`）的调用栈
- 注意正则回溯（`stage4_regexBacktracking`）的表现

4. **记录发现：**

```
热点函数 1: _________________________  占比约 ______%
热点函数 2: _________________________  占比约 ______%
热点函数 3: _________________________  占比约 ______%
```

5. **进阶：使用 `--cpu-prof-interval` 调整采样频率：**

```bash
# 默认采样间隔 1000 微秒（1 毫秒），尝试更高频率
node --cpu-prof --cpu-prof-interval=100 --cpu-prof-dir=./profiles-fast app.js
```

对比两个 profile 的差异，高频率采样是否能发现更多细节？

### 提示
- 火焰图中宽度代表 CPU 时间占比
- 颜色通常是随机的，不代表特定含义
- 可以点击函数名展开调用栈细节

---

## 练习 3：使用 perf_hooks 添加自定义性能标记

### 目标
在 `app.js` 的基础上，使用 `perf_hooks` 模块添加更细粒度的性能标记。

### 任务

1. **创建一个新文件 `app-instrumented.js`**，基于 `app.js` 的代码，添加以下标记：

```js
const { performance, PerformanceObserver } = require('perf_hooks');

// 在程序开头添加 PerformanceObserver
const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`[PERF] ${entry.name}: ${entry.duration.toFixed(2)} ms`);
  }
});
obs.observe({ entryTypes: ['measure'] });

// 在每个阶段前后添加 mark 和 measure
performance.mark('stage1-start');
// ... 阶段 1 代码 ...
performance.mark('stage1-end');
performance.measure('阶段1-排序', 'stage1-start', 'stage1-end');
```

2. **在每个阶段内部添加更细粒度的标记：**

- 排序阶段：标记"数据生成"、"排序执行"、"结果验证"
- 文件 I/O 阶段：标记"目录创建"、"文件写入"、"文件读取"、"清理"
- 字符串阶段：标记"循环拼接"、"结果验证"
- 正则阶段：标记每个正则测试

3. **运行并分析：**

```bash
node app-instrumented.js
```

4. **对比输出，哪个子阶段最耗时？**

```
阶段      | 子阶段         | 耗时
----------|----------------|------
排序       | 数据生成       | _____ ms
排序       | 排序执行       | _____ ms
文件 I/O   | 文件写入       | _____ ms
文件 I/O   | 文件读取       | _____ ms
字符串拼接 | 循环拼接       | _____ ms
正则回溯   | 测试 1         | _____ ms
```

### 参考代码

如果需要参考，可以查看 `perf-hooks-demo.js` 中的示例。

---

## 练习 4：对比 app.js 和 optimized.js 的性能差异

### 目标
量化优化前后的性能提升。

### 步骤

1. **分别运行两个版本，记录总耗时：**

```bash
# 运行 3 次取平均值
node app.js
node app.js
node app.js

node optimized.js
node optimized.js
node optimized.js
```

2. **填写对比表格：**

| 阶段 | app.js 耗时 | optimized.js 耗时 | 提升倍数 |
|------|-------------|-------------------|----------|
| 排序 | _____ ms | _____ ms | _____ x |
| 文件 I/O | _____ ms | _____ ms | _____ x |
| 字符串拼接 | _____ ms | _____ ms | _____ x |
| 正则回溯 | _____ ms | _____ ms | _____ x |
| **总计** | **_____ ms** | **_____ ms** | **_____ x** |

3. **分析：**

- 哪个阶段的优化效果最显著？为什么？
- 排序优化为什么有那么大的提升？（提示：复杂度差异 O(n²) vs O(n log n)）
- 异步 I/O 的加速比是多少？是否接近理论值（文件数）？
- 正则优化的提升如何？更长的输入会怎样？

4. **使用 `--prof` 对比两个版本：**

```bash
node --prof app.js
node --prof-process isolate-*-v8.log > prof-app.txt

# 清理旧的日志文件
rm isolate-*-v8.log

node --prof optimized.js
node --prof-process isolate-*-v8.log > prof-optimized.txt

# 对比两个报告中 top 函数的差异
```

### 进阶挑战

尝试编写一个自动化脚本 `benchmark.js`，运行两个版本并自动生成对比报告：

```js
// benchmark.js 的框架
const { execSync } = require('child_process');

function runBenchmark(name, command) {
  // 运行 3 次，取平均耗时
  // 返回 { name, avgTime, minTime, maxTime }
}

const appResult = runBenchmark('app.js', 'node app.js');
const optResult = runBenchmark('optimized.js', 'node optimized.js');

// 打印对比报告
```

---

## 练习 5：用 Clinic.js 生成可视化报告（可选）

> 本练习需要安装 Clinic.js：`npm install -g clinic`

### 目标
使用 Clinic.js 工具链生成专业的性能分析报告。

### 步骤

#### 5.1 Clinic Doctor — 系统级诊断

```bash
clinic doctor -- node app.js
```

- 运行完成后会自动打开一个 HTML 报告
- 观察 CPU 使用率、事件循环延迟、内存使用等图表
- 回答：
  - 事件循环延迟最高达到多少？出现在哪个阶段？
  - Doctor 给出了什么建议？

#### 5.2 Clinic Flame — 火焰图

```bash
clinic flame -- node app.js
```

- 生成的火焰图与 Chrome DevTools 的有何不同？
- 在火焰图中找到 `bubbleSort` 函数
- 它的宽度（CPU 占比）大约是多少？

#### 5.3 Clinic Bubbleprof — 异步活动可视化

```bash
clinic bubbleprof -- node app.js
```

- 观察异步操作的依赖关系图
- 文件 I/O 操作是串行还是并行？
- 哪些异步操作可以优化为并行？

#### 5.4 对 optimized.js 做同样的分析

```bash
clinic doctor -- node optimized.js
clinic flame -- node optimized.js
clinic bubbleprof -- node optimized.js
```

对比两组报告的差异。

### 思考题

1. Clinic Doctor 报告中，哪些指标的变化最能说明优化效果？
2. Bubbleprof 的异步活动图中，优化前后的模式有什么不同？
3. 如果你要将这个分析流程集成到 CI/CD 中，你会怎么做？

---

## 总结

通过本练习，你应该掌握了以下技能：

| 技能 | 工具 | 用途 |
|------|------|------|
| V8 日志分析 | `--prof` + `--prof-process` | 函数级 CPU 使用分析 |
| CPU Profile | `--cpu-prof` + Chrome DevTools | 可视化火焰图 |
| 自定义标记 | `perf_hooks` | 细粒度性能测量 |
| 基准测试 | `performance.now()` | 量化优化效果 |
| 专业诊断 | Clinic.js | 全面性能诊断和可视化 |

### 最佳实践

1. **先测量，后优化**：不要凭直觉优化，用数据说话
2. **建立基线**：在优化前记录当前性能，作为对比基准
3. **多次测量**：单次测量可能受干扰，取多次平均值
4. **关注 P95/P99**：平均值可能掩盖长尾问题
5. **持续监控**：将性能测试加入 CI/CD，防止性能退化
