/**
 * 网关主入口
 *
 * 这是一个标准的 HTTP 应用，作为 API 网关。
 * 它接收客户端的 HTTP 请求，然后将部分请求转发给后端的微服务。
 *
 * 架构：
 *   客户端 --> [HTTP] --> API 网关 --> [TCP] --> 通知微服务
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // 创建标准的 HTTP 应用
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 网关监听在 3000 端口
  await app.listen(3000);
  console.log('🚀 API 网关运行在: http://localhost:3000');
  console.log('📝 订单接口: POST http://localhost:3000/orders');
  console.log('📊 通知计数: GET http://localhost:3000/orders/notification-count');
}

bootstrap();
