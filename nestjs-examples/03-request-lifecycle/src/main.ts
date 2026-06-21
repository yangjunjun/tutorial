/**
 * 应用入口文件（main.ts）
 *
 * 在这个文件中，我们：
 * 1. 创建 NestJS 应用实例
 * 2. 注册全局管道和拦截器
 * 3. 打印请求生命周期图到控制台
 *
 * 全局注册的组件会对所有路由生效：
 * - app.useGlobalPipes()        → 全局管道
 * - app.useGlobalInterceptors() → 全局拦截器
 * - app.useGlobalGuards()       → 全局守卫
 * - app.useGlobalFilters()      → 全局异常过滤器
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 注册全局 ValidationPipe
   * 所有 DTO 参数都会自动验证
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 打印请求生命周期图
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           NestJS 请求生命周期演示                          ║
║                                                          ║
║  应用已启动: http://localhost:3000                        ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  请求处理顺序:                                            ║
║                                                          ║
║  ┌─────────────────┐                                     ║
║  │  客户端请求       │                                     ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Middleware       │  日志 + API Key 认证               ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Guard            │  角色检查 (@Roles)                ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Interceptor      │  日志 + 响应转换 + 超时           ║
║  │  (前置)           │                                    ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Pipe             │  参数转换 + 数据验证              ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Controller       │  业务逻辑                          ║
║  │  + Service        │                                    ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  Interceptor      │  记录耗时 + 转换格式              ║
║  │  (后置)           │                                    ║
║  └────────┬────────┘                                     ║
║           ↓                                              ║
║  ┌─────────────────┐                                     ║
║  │  响应返回         │                                     ║
║  └─────────────────┘                                     ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  可用接口:                                                ║
║  GET    /dogs      - 获取所有狗狗 (需要 x-api-key)        ║
║  GET    /dogs/:id  - 获取指定狗狗 (需要 x-api-key)        ║
║  POST   /dogs      - 创建狗狗     (需要 x-api-key)        ║
║  DELETE /dogs/:id  - 删除狗狗     (需要 x-api-key + admin)║
║                                                          ║
║  测试: curl -H "x-api-key: secret-key-123"               ║
║         http://localhost:3000/dogs                        ║
╚══════════════════════════════════════════════════════════╝
  `);

  await app.listen(3000);
}

bootstrap();
