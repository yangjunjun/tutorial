/**
 * 健康检查模块
 *
 * 【模块说明】
 * 整合所有健康检查相关的组件：
 * - HealthCheckService: @nestjs/terminus 提供的核心服务
 * - MemoryHealthIndicator: 内存使用检查
 * - DiskHealthIndicator: 磁盘空间检查
 *
 * 【在 Docker 部署中的角色】
 * 健康检查模块是容器编排的基础设施：
 * 1. Docker HEALTHCHECK 指令调用 /health/live
 * 2. Kubernetes 的 liveness/readiness probe 调用对应端点
 * 3. 负载均衡器可以使用健康检查决定流量分配
 * 4. 监控系统可以基于健康检查状态设置告警
 */
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // TerminusModule 提供健康检查基础设施
    // 包含各种 HealthIndicator（内存、磁盘、HTTP、数据库等）
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
