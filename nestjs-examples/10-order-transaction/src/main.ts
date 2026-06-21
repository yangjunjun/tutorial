/**
 * 应用入口文件
 *
 * 学习点：
 * 1. NestFactory.create() 创建 NestJS 应用实例
 * 2. ValidationPipe 全局注册，自动验证所有请求体
 * 3. enableCors() 启用跨域请求
 * 4. setGlobalPrefix() 设置全局路由前缀（可选）
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 全局验证管道 - 自动验证和转换请求数据
  // 所有 @Body()、@Query()、@Param() 都会经过验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // 自动过滤 DTO 中未定义的属性
      transform: true,          // 自动类型转换（如 string -> number）
      forbidNonWhitelisted: true,  // 请求体含未定义属性时报错
      transformOptions: {
        enableImplicitConversion: true,  // 允许隐式类型转换
      },
    }),
  );

  // 启用 CORS（跨域资源共享）
  // 开发环境中允许所有来源，生产环境应该限制
  app.enableCors();

  const port = 3000;
  await app.listen(port);

  logger.log(`========================================`);
  logger.log(`🚀 订单交易系统已启动`);
  logger.log(`📡 服务地址: http://localhost:${port}`);
  logger.log(`📋 订单接口: http://localhost:${port}/orders`);
  logger.log(`💳 支付接口: http://localhost:${port}/payments`);
  logger.log(`⏰ 定时任务: 已启用（超时取消 + 每日统计）`);
  logger.log(`========================================`);
}

bootstrap();
