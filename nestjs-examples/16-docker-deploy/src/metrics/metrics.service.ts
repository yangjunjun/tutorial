/**
 * 指标收集服务
 *
 * 【监控指标概述】
 * 在微服务架构中，监控指标（Metrics）是可观测性的三大支柱之一：
 * 1. Logs（日志）- 离散的事件记录
 * 2. Metrics（指标）- 可聚合的数值型时间序列
 * 3. Traces（追踪）- 分布式请求链路
 *
 * 【Prometheus 指标格式】
 * Prometheus 是最流行的云原生监控系统，使用 pull 模式收集指标。
 * 指标格式示例：
 * ```
 * # HELP http_requests_total 总请求数
 * # TYPE http_requests_total counter
 * http_requests_total{method="GET",path="/api/v1/items",status="200"} 1523
 *
 * # HELP http_request_duration_seconds 请求耗时（秒）
 * # TYPE http_request_duration_seconds histogram
 * http_request_duration_seconds_bucket{le="0.1"} 950
 * http_request_duration_seconds_bucket{le="0.5"} 1400
 * http_request_duration_seconds_bucket{le="1.0"} 1500
 * ```
 *
 * 【本示例的简化实现】
 * 这里使用简单的内存计数器演示核心概念。
 * 在生产环境中，推荐使用 prom-client 库：
 * ```typescript
 * import { Counter, Histogram, collectDefaultMetrics } from 'prom-client';
 *
 * const requestCounter = new Counter({
 *   name: 'http_requests_total',
 *   help: '总请求数',
 *   labelNames: ['method', 'path', 'status'],
 * });
 * ```
 */
import { Injectable } from '@nestjs/common';

/**
 * 请求指标数据结构
 */
export interface RequestMetric {
  method: string;
  path: string;
  status: number;
  duration: number; // 毫秒
  timestamp: number;
}

/**
 * 汇总指标数据结构
 */
export interface MetricsSummary {
  // 请求计数
  totalRequests: number;
  // 按路径分组的请求计数
  requestsByPath: Record<string, number>;
  // 按状态码分组的请求计数
  requestsByStatus: Record<string, number>;
  // 平均请求耗时（毫秒）
  averageDuration: number;
  // 最大请求耗时（毫秒）
  maxDuration: number;
  // 最小请求耗时（毫秒）
  minDuration: number;
  // 进程信息
  processInfo: {
    uptime: number; // 运行时间（秒）
    memoryUsage: NodeJS.MemoryUsage; // 内存使用
    nodeVersion: string; // Node.js 版本
    platform: string; // 运行平台
  };
}

@Injectable()
export class MetricsService {
  // 存储所有请求的指标数据
  // 在生产环境中，应使用环形缓冲区限制内存占用
  private metrics: RequestMetric[] = [];

  // 最大存储数量（防止内存无限增长）
  private readonly MAX_METRICS = 10000;

  /**
   * 记录一次请求的指标
   * 由 MetricsInterceptor 在每次请求完成后调用
   */
  recordRequest(metric: RequestMetric): void {
    this.metrics.push(metric);

    // 超过最大存储数量时，移除最旧的数据
    // 这是一个简单的环形缓冲区实现
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * 获取汇总的指标数据
   * 将原始指标聚合为有意义的统计数据
   */
  getSummary(): MetricsSummary {
    const durations = this.metrics.map((m) => m.duration);

    // 按路径分组统计
    const requestsByPath: Record<string, number> = {};
    this.metrics.forEach((m) => {
      const key = `${m.method} ${m.path}`;
      requestsByPath[key] = (requestsByPath[key] || 0) + 1;
    });

    // 按状态码分组统计
    const requestsByStatus: Record<string, number> = {};
    this.metrics.forEach((m) => {
      const key = String(m.status);
      requestsByStatus[key] = (requestsByStatus[key] || 0) + 1;
    });

    return {
      totalRequests: this.metrics.length,
      requestsByPath,
      requestsByStatus,
      averageDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      processInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }

  /**
   * 生成 Prometheus 格式的指标文本
   *
   * Prometheus 使用纯文本格式，每种指标包含：
   * - HELP: 指标描述
   * - TYPE: 指标类型（counter, gauge, histogram, summary）
   * - 指标数据行
   *
   * 【指标类型说明】
   * - counter: 只增不减的计数器（如请求总数）
   * - gauge: 可增可减的仪表盘（如当前内存使用）
   * - histogram: 直方图，用于分布统计（如请求耗时分布）
   * - summary: 摘要，类似 histogram 但由客户端计算分位数
   */
  getPrometheusMetrics(): string {
    const summary = this.getSummary();
    const lines: string[] = [];

    // ----- http_requests_total (Counter) -----
    lines.push('# HELP http_requests_total HTTP 请求总数');
    lines.push('# TYPE http_requests_total counter');
    for (const [path, count] of Object.entries(summary.requestsByPath)) {
      const [method, route] = path.split(' ');
      lines.push(
        `http_requests_total{method="${method}",path="${route}"} ${count}`,
      );
    }
    lines.push(
      `http_requests_total{method="ALL",path="ALL"} ${summary.totalRequests}`,
    );
    lines.push('');

    // ----- http_request_duration_seconds (Gauge - 简化实现) -----
    lines.push('# HELP http_request_duration_seconds HTTP 请求耗时统计');
    lines.push('# TYPE http_request_duration_seconds gauge');
    lines.push(
      `http_request_duration_seconds{quantile="avg"} ${(summary.averageDuration / 1000).toFixed(6)}`,
    );
    lines.push(
      `http_request_duration_seconds{quantile="max"} ${(summary.maxDuration / 1000).toFixed(6)}`,
    );
    lines.push(
      `http_request_duration_seconds{quantile="min"} ${(summary.minDuration / 1000).toFixed(6)}`,
    );
    lines.push('');

    // ----- nodejs_heap_size (Gauge) -----
    lines.push('# HELP nodejs_heap_size_bytes Node.js 堆内存使用');
    lines.push('# TYPE nodejs_heap_size_bytes gauge');
    lines.push(
      `nodejs_heap_size_bytes{type="used"} ${summary.processInfo.memoryUsage.heapUsed}`,
    );
    lines.push(
      `nodejs_heap_size_bytes{type="total"} ${summary.processInfo.memoryUsage.heapTotal}`,
    );
    lines.push(
      `nodejs_heap_size_bytes{type="rss"} ${summary.processInfo.memoryUsage.rss}`,
    );
    lines.push('');

    // ----- nodejs_uptime_seconds (Gauge) -----
    lines.push('# HELP nodejs_uptime_seconds Node.js 进程运行时间');
    lines.push('# TYPE nodejs_uptime_seconds gauge');
    lines.push(
      `nodejs_uptime_seconds ${summary.processInfo.uptime.toFixed(2)}`,
    );

    return lines.join('\n');
  }
}
