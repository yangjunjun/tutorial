/**
 * 应用入口文件
 *
 * 学习点：
 * 1. ValidationPipe 全局注册
 * 2. 应用启动流程：创建实例 → 配置中间件 → 监听端口
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 启用 CORS
  app.enableCors();

  const port = 3001;  // 使用 3001 端口，避免与项目10冲突
  await app.listen(port);

  logger.log(`========================================`);
  logger.log(`🚀 缓存与队列示例已启动`);
  logger.log(`📡 服务地址: http://localhost:${port}`);
  logger.log(`📦 商品接口: http://localhost:${port}/products`);
  logger.log(`📬 队列接口: http://localhost:${port}/queue`);
  logger.log(`⚡ 优化演示: http://localhost:${port}/optimization`);
  logger.log(`========================================`);
  logger.log(`提示: 确保 Redis 已启动 (默认 localhost:6379)`);
  logger.log(`启动 Redis: docker run -d -p 6379:6379 redis:alpine`);
}

bootstrap();
