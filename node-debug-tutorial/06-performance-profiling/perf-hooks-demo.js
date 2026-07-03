'use strict';

/**
 * perf_hooks 模块演示
 *
 * 演示 Node.js 内置的性能分析 API：
 * - performance.now()：高精度计时
 * - performance.mark() / performance.measure()：命名性能标记和测量
 * - PerformanceObserver：监听性能事件
 * - performance.timerify()：自动追踪函数执行时间
 * - 自定义基准测试工具
 *
 * 无需外部依赖。
 *
 * 用法：node perf-hooks-demo.js
 */

const {
  performance,
  PerformanceObserver,
} = require('perf_hooks');

// ============================================================
// 演示 1：performance.now() — 高精度计时
// ============================================================

function demo_performanceNow() {
  console.log('--- 演示 1：performance.now() 高精度计时 ---\n');

  // performance.now() 返回自进程启动以来的毫秒数，精度可达亚毫秒级
  const t0 = performance.now();

  // 模拟一些计算
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += Math.sqrt(i);
  }

  const t1 = performance.now();

  console.log(`  performance.now() 起始: ${t0.toFixed(6)} ms`);
  console.log(`  performance.now() 结束: ${t1.toFixed(6)} ms`);
  console.log(`  计算 1000000 次平方根耗时: ${(t1 - t0).toFixed(3)} ms`);
  console.log(`  计算结果: ${sum.toFixed(2)}`);

  // 与 Date.now() 对比
  console.log('\n  与 Date.now() 的对比：');
  const d0 = Date.now();
  const p0 = performance.now();
  for (let i = 0; i < 100000; i++) {
    // 快速操作
  }
  const d1 = Date.now();
  const p1 = performance.now();
  console.log(`  Date.now() 精度: ${d1 - d0} ms（整数毫秒）`);
  console.log(`  performance.now() 精度: ${(p1 - p0).toFixed(6)} ms（亚毫秒级）`);
  console.log('');
}

// ============================================================
// 演示 2：performance.mark() 和 performance.measure()
// ============================================================

function demo_markAndMeasure() {
  console.log('--- 演示 2：performance.mark() 和 performance.measure() ---\n');

  // 清除之前的标记和测量（避免干扰）
  performance.clearMarks();
  performance.clearMeasures();

  // 模拟一个多阶段数据处理流程

  // 标记起点
  performance.mark('pipeline-start');

  // 阶段 1：数据生成
  const data = [];
  for (let i = 0; i < 50000; i++) {
    data.push({ id: i, value: Math.random() * 1000 });
  }
  performance.mark('phase1-done');

  // 阶段 2：数据过滤
  const filtered = data.filter((item) => item.value > 500);
  performance.mark('phase2-done');

  // 阶段 3：数据转换
  const transformed = filtered.map((item) => ({
    ...item,
    normalized: item.value / 1000,
    label: `item-${item.id}`,
  }));
  performance.mark('phase3-done');

  // 阶段 4：数据聚合
  const total = transformed.reduce((sum, item) => sum + item.normalized, 0);
  const average = total / transformed.length;
  performance.mark('phase4-done');

  // 创建命名测量
  performance.measure('阶段1-数据生成', 'pipeline-start', 'phase1-done');
  performance.measure('阶段2-数据过滤', 'phase1-done', 'phase2-done');
  performance.measure('阶段3-数据转换', 'phase2-done', 'phase3-done');
  performance.measure('阶段4-数据聚合', 'phase3-done', 'phase4-done');
  performance.measure('总计-全部阶段', 'pipeline-start', 'phase4-done');

  // 获取并打印所有测量结果
  const measures = performance.getEntriesByType('measure');

  console.log('  各阶段耗时：');
  measures.forEach((measure) => {
    console.log(`  [${measure.name.padEnd(16)}] ${measure.duration.toFixed(3)} ms`);
  });

  console.log(`\n  数据总量: ${data.length}, 过滤后: ${filtered.length}`);
  console.log(`  聚合平均值: ${average.toFixed(4)}`);

  // 清理
  performance.clearMarks();
  performance.clearMeasures();
  console.log('');
}

// ============================================================
// 演示 3：PerformanceObserver — 性能事件监听
// ============================================================

function demo_performanceObserver() {
  console.log('--- 演示 3：PerformanceObserver 性能事件监听 ---\n');

  return new Promise((resolve) => {
    // 创建一个性能观察者，监听 function 类型的事件
    const obs = new PerformanceObserver((list, observer) => {
      const entries = list.getEntries();
      console.log(`  收到 ${entries.length} 个性能事件：\n`);

      for (const entry of entries) {
        console.log(`  函数名: ${entry.name}`);
        console.log(`  类型: ${entry.entryType}`);
        console.log(`  耗时: ${entry.duration.toFixed(3)} ms`);
        console.log(`  开始时间: ${entry.startTime.toFixed(3)} ms`);
        console.log('');
      }

      observer.disconnect();
      resolve();
    });

    // 监听 function 类型的性能条目（由 timerify 产生）
    obs.observe({ entryTypes: ['function'] });

    // 使用 performance.timerify() 自动追踪函数执行时间
    // timerify 会包装函数，使其在执行后自动记录性能数据

    /**
     * 模拟一个数据处理函数
     */
    const processData = performance.timerify(function processData(items) {
      let result = 0;
      for (const item of items) {
        result += item * item;
      }
      return Math.sqrt(result);
    });

    /**
     * 模拟一个排序函数
     */
    const sortData = performance.timerify(function sortData(items) {
      return items.slice().sort((a, b) => a - b);
    });

    /**
     * 模拟一个过滤函数
     */
    const filterData = performance.timerify(function filterData(items) {
      return items.filter((x) => x > 0.5);
    });

    // 执行被追踪的函数
    const data = Array.from({ length: 100000 }, () => Math.random());

    console.log('  执行被 timerify 包装的函数...\n');
    const processed = processData(data);
    const sorted = sortData(data);
    const filtered = filterData(data);

    console.log(`  结果: processed=${processed.toFixed(2)}, ` +
      `sorted长度=${sorted.length}, filtered长度=${filtered.length}\n`);

    // 性能事件是异步传递的，观察者的回调会在下一个微任务中执行
  });
}

// ============================================================
// 演示 4：自定义基准测试工具
// ============================================================

/**
 * 简单的基准测试工具
 * 多次执行函数并统计耗时（平均值、最小值、最大值、标准差）
 */
class Benchmark {
  /**
   * @param {string} name - 测试名称
   * @param {number} iterations - 迭代次数
   * @param {number} warmup - 预热次数（不计入统计）
   */
  constructor(name, iterations = 100, warmup = 10) {
    this.name = name;
    this.iterations = iterations;
    this.warmup = warmup;
    this.results = [];
  }

  /**
   * 运行基准测试
   * @param {Function} fn - 要测试的函数
   * @returns {object} 统计结果
   */
  run(fn) {
    // 预热阶段（让 JIT 编译器优化代码）
    for (let i = 0; i < this.warmup; i++) {
      fn();
    }

    // 正式测量
    this.results = [];
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      this.results.push(end - start);
    }

    // 计算统计值
    const stats = this._computeStats();
    return stats;
  }

  /**
   * 计算统计值
   * @returns {object}
   */
  _computeStats() {
    const sorted = [...this.results].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const variance = sorted.reduce((acc, v) => acc + (v - avg) ** 2, 0) / sorted.length;

    return {
      name: this.name,
      iterations: this.iterations,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: avg,
      median: sorted[Math.floor(sorted.length / 2)],
      stddev: Math.sqrt(variance),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * 打印格式化的结果
   * @param {object} stats - 统计结果
   */
  static printResult(stats) {
    console.log(`  ┌─── ${stats.name} ───`);
    console.log(`  │ 迭代次数: ${stats.iterations}`);
    console.log(`  │ 最小值:   ${stats.min.toFixed(4)} ms`);
    console.log(`  │ 最大值:   ${stats.max.toFixed(4)} ms`);
    console.log(`  │ 平均值:   ${stats.mean.toFixed(4)} ms`);
    console.log(`  │ 中位数:   ${stats.median.toFixed(4)} ms`);
    console.log(`  │ 标准差:   ${stats.stddev.toFixed(4)} ms`);
    console.log(`  │ P95:      ${stats.p95.toFixed(4)} ms`);
    console.log(`  │ P99:      ${stats.p99.toFixed(4)} ms`);
    console.log(`  └──────────────────────────`);
    console.log('');
  }
}

/**
 * 运行基准测试对比
 */
function demo_benchmark() {
  console.log('--- 演示 4：自定义基准测试工具 ---\n');

  // 对比两种排序方式的性能
  const dataSize = 10000;
  const data = Array.from({ length: dataSize }, () => Math.random());

  // 测试 1：内置排序
  const bench1 = new Benchmark('Array.prototype.sort()', 50, 5);
  const stats1 = bench1.run(() => {
    data.slice().sort((a, b) => a - b);
  });
  Benchmark.printResult(stats1);

  // 测试 2：手动插入排序（对中等数据量更合适做对比）
  const bench2 = new Benchmark('手动插入排序', 50, 5);
  const stats2 = bench2.run(() => {
    const arr = data.slice();
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = key;
    }
    return arr;
  });
  Benchmark.printResult(stats2);

  // 对比结果
  const ratio = stats2.mean / stats1.mean;
  console.log(`  性能对比：内置排序比插入排序快 ${ratio.toFixed(1)} 倍\n`);
}

// ============================================================
// 演示 5：monitorEventLoopDelay — 事件循环延迟监控
// ============================================================

function demo_eventLoopDelay() {
  console.log('--- 演示 5：事件循环延迟监控 ---\n');

  // monitorEventLoopDelay 是 perf_hooks 提供的高级功能
  // 用于监控事件循环的延迟（即回调被延迟了多久）
  const { monitorEventLoopDelay } = require('perf_hooks');

  // 创建一个直方图来记录事件循环延迟
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  console.log('  监控事件循环延迟 2 秒...\n');

  // 制造一些同步阻塞
  const blockInterval = setInterval(() => {
    // 模拟一个 10ms 的同步阻塞操作
    const start = performance.now();
    while (performance.now() - start < 10) {
      // 忙等
    }
  }, 50);

  // 2 秒后查看结果
  setTimeout(() => {
    clearInterval(blockInterval);
    histogram.disable();

    console.log('  事件循环延迟统计：');
    console.log(`  最小延迟: ${(histogram.min / 1e6).toFixed(3)} ms`);
    console.log(`  最大延迟: ${(histogram.max / 1e6).toFixed(3)} ms`);
    console.log(`  平均延迟: ${(histogram.mean / 1e6).toFixed(3)} ms`);
    console.log(`  标准差:   ${(histogram.stddev / 1e6).toFixed(3)} ms`);
    console.log(`  P50:      ${(histogram.percentile(50) / 1e6).toFixed(3)} ms`);
    console.log(`  P90:      ${(histogram.percentile(90) / 1e6).toFixed(3)} ms`);
    console.log(`  P99:      ${(histogram.percentile(99) / 1e6).toFixed(3)} ms`);
    console.log('\n  提示：');
    console.log('  - 事件循环延迟越低越好');
    console.log('  - P99 > 100ms 通常表示有明显的同步阻塞');
    console.log('  - 可用此数据设置告警阈值\n');

    histogram.reset();
  }, 2000);
}

// ============================================================
// 主程序入口
// ============================================================

async function main() {
  console.log('============================================');
  console.log('   perf_hooks 模块演示');
  console.log('============================================\n');

  // 演示 1：高精度计时
  demo_performanceNow();

  // 演示 2：标记和测量
  demo_markAndMeasure();

  // 演示 3：PerformanceObserver
  await demo_performanceObserver();

  // 演示 4：基准测试工具
  demo_benchmark();

  // 演示 5：事件循环延迟监控
  demo_eventLoopDelay();

  // 等待异步操作完成
  setTimeout(() => {
    console.log('============================================');
    console.log('   所有演示完成');
    console.log('============================================');
    console.log('\n延伸阅读：');
    console.log('  - Node.js 官方文档: https://nodejs.org/api/perf_hooks.html');
    console.log('  - User Timing API: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API');
    console.log('  - W3C Performance Timeline: https://w3c.github.io/performance-timeline/');
  }, 3000);
}

// 运行
main().catch((err) => {
  console.error('发生错误:', err);
  process.exit(1);
});

// 导出 Benchmark 工具供其他文件使用
module.exports = { Benchmark };
