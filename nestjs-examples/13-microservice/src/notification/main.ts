/**
 * 通知微服务主入口
 *
 * 与 HTTP 应用不同，微服务使用不同的启动方式。
 *
 * 两种启动方式：
 *
 * 1. connectMicroservice() + startAllMicroservices()
 *    - 创建一个 Hybrid 应用（可以同时是 HTTP 和微服务）
 *    - 适合：需要在同一个应用中同时处理 HTTP 和微服务请求
 *
 * 2. NestFactory.createMicroservice()
 *    - 创建纯微服务（不处理 HTTP 请求）
 *    - 适合：只做后台处理的独立服务
 *
 * 本示例使用方式 2（纯微服务）。
 */
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  /**
   * 创建微服务应用
   *
   * createMicroservice<MicroserviceOptions>() 的参数：
   * - transport: 传输层类型
   * - options: 传输层配置
   *   - host: 监听地址
   *   - port: 监听端口
   *
   * TCP 传输层特点：
   * - 内置支持，无需额外依赖
   * - 点对点通信（不支持消息广播）
   * - 适合本地开发和小规模部署
   */
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3001, // 通知微服务监听 3001 端口
      },
    },
  );

  // 启动微服务（开始监听消息）
  await app.listen();
  console.log('📨 通知微服务已启动，监听 TCP 端口 3001');
  console.log('   等待接收事件和消息...');
}

bootstrap();
