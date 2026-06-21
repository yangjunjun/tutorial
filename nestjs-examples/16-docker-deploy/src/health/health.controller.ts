/**
 * 健康检查控制器
 *
 * 【健康检查的重要性】
 * 在容器化和 Kubernetes 环境中，健康检查是保证服务可用性的关键机制：
 *
 * 1. Liveness Probe（存活探针）- /health/live
 *    - 检查应用是否在运行
 *    - 失败时 Kubernetes 会重启容器
 *    - 用于检测死锁、内存泄漏等无法自愈的问题
 *
 * 2. Readiness Probe（就绪探针）- /health/ready
 *    - 检查应用是否准备好接收流量
 *    - 失败时 Kubernetes 会将 Pod 从 Service 的 Endpoints 中移除
 *    - 用于检测依赖服务不可用、启动中等暂时性问题
 *
 * 3. Startup Probe（启动探针）
 *    - 检查应用是否已完成启动
 *    - 在启动探针成功前，不会执行 liveness 和 readiness 探针
 *    - 用于启动时间较长的应用（如加载大量数据）
 *
 * 【@nestjs/terminus 库】
 * NestJS 官方推荐的健康检查库，提供：
 * - 数据库连接检查（TypeORM, Mongoose, Sequelize）
 * - 内存使用检查
 * - 磁盘空间检查
 * - HTTP/HTTPS 端点检查
 * - 自定义健康指标
 *
 * 【Kubernetes 配置示例】
 * ```yaml
 * livenessProbe:
 *   httpGet:
 *     path: /health/live
 *     port: 3000
 *   initialDelaySeconds: 10
 *   periodSeconds: 30
 * readinessProbe:
 *   httpGet:
 *     path: /health/ready
 *     port: 3000
 *   initialDelaySeconds: 5
 *   periodSeconds: 10
 * ```
 */
import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * 综合健康检查端点
   *
   * 检查所有关键依赖的健康状态：
   * 1. 内存使用 - 检查堆内存是否超过阈值
   * 2. 磁盘空间 - 检查磁盘使用率是否超过阈值
   * 3. 数据库连接 - 模拟数据库连接检查（演示用）
   *
   * 返回 200 表示所有检查通过，503 表示任一检查失败
   *
   * 【注意】在生产环境中，应该检查真实的数据库连接：
   * ```typescript
   * this.typeorm.pingCheck('database')
   * ```
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    this.logger.debug('执行综合健康检查...');

    return this.health.check([
      // 内存检查：堆内存使用不超过 300MB
      // 超过阈值时健康检查失败，Kubernetes 会重启容器
      // 这可以防止内存泄漏导致的服务降级
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // 内存检查：常驻集内存（RSS）不超过 500MB
      // RSS 包含堆内存 + 栈内存 + C++ 对象等
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // 磁盘空间检查：磁盘使用率不超过 90%
      // 磁盘空间不足会导致日志写入失败、数据库崩溃等问题
      () =>
        this.disk.checkStorage('disk_storage', {
          thresholdPercent: 0.9,
          path: '/',
        }),

      // 自定义数据库检查（模拟）
      // 在实际项目中，替换为真实的数据库连接检查
      () => this.mockDatabaseCheck(),
    ]);
  }

  /**
   * 就绪探针（Readiness Probe）
   *
   * 检查应用是否准备好接收流量。
   * 在 Kubernetes 中，如果就绪探针失败：
   * - Pod 会从 Service 的 Endpoints 中被移除
   * - 新的请求不会被路由到这个 Pod
   * - 但 Pod 不会被重启（区别于 Liveness Probe）
   *
   * 适用场景：
   * - 数据库连接暂时断开（等待重连）
   * - 依赖的外部服务暂时不可用
   * - 应用正在加载必要数据
   */
  @Get('ready')
  @HealthCheck()
  async isReady(): Promise<HealthCheckResult> {
    this.logger.debug('执行就绪检查...');

    return this.health.check([
      // 检查应用是否就绪
      // 这里只检查内存，实际项目应该检查数据库和依赖服务
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // 模拟数据库就绪检查
      () => this.mockDatabaseCheck(),
    ]);
  }

  /**
   * 存活探针（Liveness Probe）
   *
   * 检查应用是否存活。
   * 在 Kubernetes 中，如果存活探针失败：
   * - Pod 会被终止并重新创建
   * - 这是最后手段，用于处理无法自愈的问题
   *
   * 【设计原则】
   * - 存活探针应该尽量简单和轻量
   * - 不要检查外部依赖（数据库、Redis 等）
   * - 因为外部依赖不可用不应该导致应用重启
   * - 只检查应用自身是否能正常响应
   *
   * 【注意】
   * - 避免在存活探针中做耗时操作
   * - 设置合理的 timeout 和 failureThreshold
   */
  @Get('live')
  @HealthCheck()
  async isLive(): Promise<HealthCheckResult> {
    // 存活探针只做最基本的检查
    // 不检查外部依赖，避免因为外部服务问题导致应用不断重启
    return this.health.check([
      () => Promise.resolve({ live: { status: 'up' as const } }),
    ]);
  }

  /**
   * 模拟数据库连接检查
   *
   * 在实际项目中，应该使用 TypeORM 的 pingCheck：
   * ```typescript
   * constructor(
   *   private typeorm: TypeOrmHealthIndicator,
   * ) {}
   *
   * () => this.typeorm.pingCheck('database', { timeout: 3000 })
   * ```
   *
   * 这里使用模拟实现，演示自定义健康检查指标的写法
   */
  private async mockDatabaseCheck(): Promise<Record<string, any>> {
    // 模拟数据库连接检查
    // 在生产环境中替换为真实的数据库 ping
    const isDbConnected = true; // 模拟数据库连接状态

    if (!isDbConnected) {
      // 返回 down 状态，@nestjs/terminus 会将其标记为失败
      return {
        database: {
          status: 'down',
          message: '数据库连接失败',
        },
      };
    }

    return {
      database: {
        status: 'up',
        type: 'mock',
        message: '数据库连接正常（模拟）',
      },
    };
  }
}
