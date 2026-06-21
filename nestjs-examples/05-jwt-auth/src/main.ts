/**
 * 应用入口文件（Main）
 *
 * 学习要点：
 * 1. NestFactory.create() 创建 NestJS 应用实例
 * 2. ValidationPipe 全局管道 - 自动验证请求体（配合 class-validator）
 * 3. app.listen() 启动 HTTP 服务器
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // 创建 NestJS 应用实例
  const app = await NestFactory.create(AppModule);

  // 全局验证管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动剔除请求体中未定义在 DTO 中的字段
      whitelist: true,
      // 如果存在未定义的字段，直接抛出错误
      forbidNonWhitelisted: true,
      // 自动将请求体转换为 DTO 类型
      transform: true,
    }),
  );

  // 启动应用，监听 3000 端口
  const port = 3000;
  await app.listen(port);
  console.log(`🚀 JWT Auth 服务已启动: http://localhost:${port}`);
  console.log(`📝 注册接口: POST http://localhost:${port}/auth/register`);
  console.log(`🔑 登录接口: POST http://localhost:${port}/auth/login`);
}

bootstrap();
