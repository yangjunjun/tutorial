'use strict';

/**
 * 内存监控工具
 *
 * 功能：
 * - 跟踪内存使用随时间的变化
 * - 打印简单的 ASCII 图表展示内存增长趋势
 * - 检测潜在的内存泄漏（持续上升趋势）
 * - 可作为模块被其他文件引用
 *
 * 用法：
 *   作为独立脚本：node monitor.js
 *   作为模块引用：const monitor = require('./monitor');
 */

// ============================================================
// MemoryMonitor 类
// ============================================================

class MemoryMonitor {
  /**
   * 创建内存监控器实例
   * @param {object} [options] - 配置选项
   * @param {number} [options.interval=2000] - 采样间隔（毫秒）
   * @param {number} [options.maxSamples=60] - 最大采样点数
   * @param {number} [options.leakThreshold=5] - 连续上升次数阈值（超过此值判定为泄漏）
   * @param {boolean} [options.verbose=false] - 是否打印详细信息
   */
  constructor(options = {}) {
    this.interval = options.interval || 2000;
    this.maxSamples = options.maxSamples || 60;
    this.leakThreshold = options.leakThreshold || 5;
    this.verbose = options.verbose || false;

    // 采样数据
    this.samples = [];
    this.timer = null;
    this.running = false;
  }

  /**
   * 获取当前内存使用快照
   * @returns {object} 内存数据
   */
  _takeSample() {
    const mem = process.memoryUsage();
    return {
      timestamp: Date.now(),
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    };
  }

  /**
   * 启动内存监控
   */
  start() {
    if (this.running) {
      console.log('监控已在运行中');
      return;
    }

    this.running = true;
    console.log(`内存监控已启动（采样间隔: ${this.interval}ms）\n`);

    // 立即采集一次
    this._collectSample();

    // 定时采集
    this.timer = setInterval(() => {
      this._collectSample();
    }, this.interval);

    // 不阻止进程退出
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * 采集一次样本
   */
  _collectSample() {
    const sample = this._takeSample();
    this.samples.push(sample);

    // 保持样本数量不超过上限
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    if (this.verbose) {
      this._printSample(sample);
    }
  }

  /**
   * 打印单次采样结果
   * @param {object} sample - 采样数据
   */
  _printSample(sample) {
    const time = new Date(sample.timestamp).toLocaleTimeString();
    console.log(
      `[${time}] Heap: ${this._formatMB(sample.heapUsed)} MB / ` +
      `${this._formatMB(sample.heapTotal)} MB | ` +
      `RSS: ${this._formatMB(sample.rss)} MB`
    );
  }

  /**
   * 停止监控并打印分析报告
   */
  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    console.log('\n内存监控已停止\n');
    this.printChart();
    this.analyzeLeak();
  }

  /**
   * 格式化字节为 MB
   * @param {number} bytes - 字节数
   * @returns {string} MB 值字符串
   */
  _formatMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  /**
   * 打印 ASCII 内存增长图表
   */
  printChart() {
    if (this.samples.length < 2) {
      console.log('采样点不足，无法生成图表');
      return;
    }

    console.log('=== 内存使用趋势图 ===\n');

    const chartWidth = 60;
    const chartHeight = 20;

    // 获取 heapUsed 的范围
    const heapValues = this.samples.map((s) => s.heapUsed / (1024 * 1024));
    const minHeap = Math.min(...heapValues);
    const maxHeap = Math.max(...heapValues);
    const range = maxHeap - minHeap || 1;

    // 打印表头
    console.log(`Heap Used (MB)`);
    console.log(`  ${maxHeap.toFixed(1)} |${'─'.repeat(chartWidth + 2)}`);

    // 生成图表行
    for (let row = chartHeight; row >= 0; row--) {
      const threshold = minHeap + (range * row) / chartHeight;
      let line = '';

      for (let col = 0; col < this.samples.length; col++) {
        const value = heapValues[col];
        const normalizedRow = Math.round(((value - minHeap) / range) * chartHeight);
        if (normalizedRow === row) {
          line += '*';
        } else if (normalizedRow > row) {
          line += '|';
        } else {
          line += ' ';
        }
      }

      // 只在特定行打印 Y 轴标签
      if (row === chartHeight || row === Math.floor(chartHeight / 2) || row === 0) {
        const label = threshold.toFixed(1).padStart(7);
        console.log(`  ${label} | ${line}`);
      } else {
        console.log(`         | ${line}`);
      }
    }

    // 打印 X 轴
    console.log(`         +${'─'.repeat(this.samples.length)}`);
    console.log(`          ${new Date(this.samples[0].timestamp).toLocaleTimeString()}` +
      `  →  ${new Date(this.samples[this.samples.length - 1].timestamp).toLocaleTimeString()}`);
    console.log(`          采样点数: ${this.samples.length}\n`);

    // 打印图例
    console.log(`  * = Heap Used 值    | = 下方有数据点`);
    console.log(`  最小值: ${minHeap.toFixed(2)} MB`);
    console.log(`  最大值: ${maxHeap.toFixed(2)} MB`);
    console.log(`  增长量: ${(maxHeap - minHeap).toFixed(2)} MB\n`);
  }

  /**
   * 分析是否存在内存泄漏
   * @returns {object} 分析结果
   */
  analyzeLeak() {
    if (this.samples.length < 5) {
      console.log('采样点不足 5 个，无法进行泄漏分析\n');
      return { hasLeak: false, confidence: 0 };
    }

    const heapValues = this.samples.map((s) => s.heapUsed);

    // 方法 1：计算连续上升的次数
    let consecutiveIncreases = 0;
    let maxConsecutiveIncreases = 0;

    for (let i = 1; i < heapValues.length; i++) {
      if (heapValues[i] > heapValues[i - 1]) {
        consecutiveIncreases++;
        maxConsecutiveIncreases = Math.max(maxConsecutiveIncreases, consecutiveIncreases);
      } else {
        consecutiveIncreases = 0;
      }
    }

    // 方法 2：简单线性回归计算趋势
    const n = heapValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += heapValues[i];
      sumXY += i * heapValues[i];
      sumX2 += i * i;
    }

    // 斜率 = (n * Σxy - Σx * Σy) / (n * Σx² - (Σx)²)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const slopePerSecond = slope / (this.interval / 1000); // 每秒钟的增长量

    // 方法 3：比较前后段的平均值
    const firstHalf = heapValues.slice(0, Math.floor(n / 2));
    const secondHalf = heapValues.slice(Math.floor(n / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const avgIncrease = ((avgSecond - avgFirst) / avgFirst * 100).toFixed(1);

    // 判定结果
    const hasLeak = maxConsecutiveIncreases >= this.leakThreshold && slope > 0;
    const confidence = hasLeak
      ? Math.min(0.95, 0.5 + (maxConsecutiveIncreases / n) * 0.5)
      : 0.1;

    // 打印分析报告
    console.log('=== 内存泄漏分析 ===\n');
    console.log(`采样点数: ${n}`);
    console.log(`最大连续上升次数: ${maxConsecutiveIncreases}（阈值: ${this.leakThreshold}）`);
    console.log(`线性趋势斜率: ${(slope / 1024 / 1024).toFixed(4)} MB/样本`);
    console.log(`每秒内存增长: ${(slopePerSecond / 1024 / 1024).toFixed(4)} MB/s`);
    console.log(`前后半段平均差异: ${avgIncrease}%`);
    console.log('');

    if (hasLeak) {
      console.log(`⚠ 检测到潜在的内存泄漏！`);
      console.log(`  置信度: ${(confidence * 100).toFixed(0)}%`);
      console.log(`  建议：`);
      console.log(`  - 使用 Chrome DevTools Memory 面板获取堆快照进行对比`);
      console.log(`  - 检查全局变量、事件监听器、定时器是否有未清理的资源`);
      console.log(`  - 使用 node --heap-prof 进行长时间监控`);
    } else {
      console.log(`✓ 未检测到明显的内存泄漏趋势`);
      console.log(`  内存使用看起来正常`);
    }
    console.log('');

    return {
      hasLeak,
      confidence,
      maxConsecutiveIncreases,
      slopePerSecond,
      avgIncreasePercent: parseFloat(avgIncrease),
    };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = { MemoryMonitor };

// ============================================================
// 演示：使用 MemoryMonitor 检测一个内存泄漏
// ============================================================

if (require.main === module) {
  console.log('============================================');
  console.log('   内存监控工具演示');
  console.log('============================================\n');

  // 创建监控器：每 1 秒采样一次，最多 30 个采样点
  const monitor = new MemoryMonitor({
    interval: 1000,
    maxSamples: 30,
    leakThreshold: 5,
    verbose: true,
  });

  // 启动监控
  monitor.start();

  // 制造一个内存泄漏
  const leakedArray = [];
  const leakTimer = setInterval(() => {
    // 每次添加约 1MB 的数据
    leakedArray.push(Buffer.alloc(1024 * 1024, 'x'));
  }, 500);

  // 20 秒后停止并分析
  setTimeout(() => {
    clearInterval(leakTimer);
    monitor.stop();

    console.log('演示完成。以上图表应显示出持续上升的趋势。');
    process.exit(0);
  }, 20000);
}
