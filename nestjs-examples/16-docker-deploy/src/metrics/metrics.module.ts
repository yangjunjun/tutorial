/**
 * 指标模块
 *
 * 【模块职责】
 * 整合监控指标相关的所有组件：
 * - MetricsService: 指标数据的收集和聚合
 * - MetricsController: 暴露 /metrics 端点
 * - MetricsInterceptor: 自动记录请求指标
 *
 * 【exports 说明】
 * 通过 exports 导出 MetricsService，使得其他模块（如 AppModule）
 * 可以使用 MetricsInterceptor 来记录请求指标。
 */
import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService], // 导出供其他模块使用
})
export class MetricsModule {}
