/**
 * 应用入口
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`中间件/拦截器/管道 演示服务已启动: http://localhost:${port}`);
  logger.log('可用接口：');
  logger.log('  GET  /cats          - 获取猫咪列表（带分页默认值和缓存）');
  logger.log('  GET  /cats/:uuid    - 根据 UUID 获取猫咪');
  logger.log('  POST /cats          - 创建猫咪（自动去除空格）');
  logger.log('  GET  /users         - 获取用户列表（密码字段被隐藏）');
  logger.log('  GET  /users/:id     - 获取单个用户');
}

bootstrap();
