/**
 * 网关应用模块
 *
 * 在这里注册微服务客户端。
 * ClientsModule.register() 配置与后端微服务的连接方式。
 *
 * 重要概念：
 * - name: 注入令牌（injection token），用于在 service 中通过 @Inject() 获取客户端
 * - transport: 传输层类型（TCP, Redis, NATS, Kafka 等）
 * - options: 传输层特定的配置（如 host, port）
 */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    /**
     * 注册通知微服务客户端
     *
     * ClientsModule.register() 返回一个动态模块，
     * 它创建一个 ClientProxy 实例并通过依赖注入提供。
     *
     * TCP 传输层是最简单的选择，适合本地开发。
     * 在生产环境中通常会使用 Redis、NATS 或 Kafka。
     */
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE', // 注入令牌名称
        transport: Transport.TCP,      // 使用 TCP 传输层
        options: {
          host: '127.0.0.1',          // 微服务主机
          port: 3001,                  // 微服务端口
        },
      },
    ]),
    OrdersModule,
  ],
})
export class AppModule {}
