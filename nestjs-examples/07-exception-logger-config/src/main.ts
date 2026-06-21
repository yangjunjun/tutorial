/**
 * 应用入口
 *
 * 学习要点：
 * 1. 使用自定义 Winston 日志替换默认 Logger
 * 2. 注册全局异常过滤器
 * 3. 注册全局拦截器
 * 4. 从 ConfigService 读取配置（端口号等）
 * 5. 创建 uploads 目录
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // 确保 uploads 目录存在
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 确保 logs 目录存在
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);

  // 获取 ConfigService 读取配置
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  // ========== 全局异常过滤器 ==========
  // 注意注册顺序：先注册的优先级更高（后执行）
  // BusinessExceptionFilter 优先处理业务异常
  // HttpExceptionFilter 作为兜底处理所有其他异常
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new BusinessExceptionFilter());

  // ========== 全局拦截器 ==========
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ========== 全局管道 ==========
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`应用已启动: http://localhost:${port}`);
  logger.log(`运行环境: ${configService.get('app.env')}`);
  logger.log(`日志级别: ${configService.get('log.level')}`);
}

bootstrap();
