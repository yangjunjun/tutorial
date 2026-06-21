/**
 * 应用入口文件
 *
 * 在 main.ts 中我们启动 NestJS 应用。
 * 为了测试方便，这里使用了全局验证管道和全局前缀。
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用全局验证管道，自动验证请求体中的 DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // 自动剥离 DTO 中未定义的属性
      forbidNonWhitelisted: true, // 存在未定义属性时抛出错误
      transform: true,       // 自动类型转换
    }),
  );

  await app.listen(3000);
  console.log('应用运行在: http://localhost:3000');
}

bootstrap();
