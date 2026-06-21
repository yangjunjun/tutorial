/**
 * 指标控制器
 *
 * 【Prometheus 监控集成】
 * Prometheus 定期（默认每 15 秒）从应用的 /metrics 端点拉取指标数据。
 * 这些指标会被存储在时序数据库中，并可以：
 * 1. 使用 PromQL 进行查询和聚合
 * 2. 在 Grafana 中创建可视化仪表盘
 * 3. 配置告警规则（Alertmanager）
 *
 * 【典型的监控架构】
 * ```
 * NestJS App (/metrics) → Prometheus → Grafana (可视化)
 *                                    → Alertmanager (告警)
 * ```
 *
 * 【安全注意事项】
 * /metrics 端点可能暴露系统内部信息，在生产环境中应该：
 * 1. 通过防火墙或 NetworkPolicy 限制访问
 * 2. 添加基本认证
 * 3. 不要暴露敏感的业务数据
 */
import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus 指标端点
   *
   * 返回 Prometheus 格式的纯文本指标数据。
   * Content-Type 设置为 text/plain（Prometheus 规范要求）。
   *
   * 【Prometheus 抓取配置示例】
   * ```yaml
   * # prometheus.yml
   * scrape_configs:
   *   - job_name: 'nestjs-app'
   *     scrape_interval: 15s
   *     static_configs:
   *       - targets: ['nestjs-app:3000']
   *     metrics_path: '/metrics'
   * ```
   *
   * 【Grafana 仪表盘】
   * 可以导入现成的 NestJS/Node.js 仪表盘模板：
   * - Node.js Application Dashboard (ID: 11159)
   * - NestJS Monitoring (ID: 12545)
   */
  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  /**
   * JSON 格式的指标摘要
   *
   * 提供人类可读的 JSON 格式指标数据。
   * 适用于调试和简单的监控需求。
   * 不包含在 Prometheus 抓取范围内。
   */
  @Get('summary')
  getSummary() {
    return this.metricsService.getSummary();
  }
}
