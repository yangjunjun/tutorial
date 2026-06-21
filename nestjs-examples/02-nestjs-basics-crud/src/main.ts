/**
 * 应用入口文件（main.ts）
 *
 * 这是 NestJS 应用的启动文件，负责：
 * 1. 创建 NestJS 应用实例
 * 2. 配置全局中间件和管道
 * 3. 启动 HTTP 服务器
 *
 * NestFactory 是 NestJS 的应用工厂：
 * - NestFactory.create(AppModule) → 创建基于 Express 的应用
 * - NestFactory.createMicroservice() → 创建微服务
 * - NestFactory.createApplicationContext() → 创建无 HTTP 的应用上下文
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // 创建 NestJS 应用实例
  // NestFactory.create() 默认使用 Express 作为 HTTP 适配器
  // 也可以使用 Fastify：NestFactory.create(AppModule, new FastifyAdapter())
  const app = await NestFactory.create(AppModule);

  /**
   * 注册全局 ValidationPipe（验证管道）
   *
   * 管道（Pipe）在请求到达控制器之前处理数据：
   * - 转换：将输入数据转换为期望的类型
   * - 验证：检查输入数据是否符合规则
   *
   * ValidationPipe 配置项：
   * - whitelist: true      → 自动过滤 DTO 中未定义的属性（防止恶意数据）
   * - forbidNonWhitelisted → 如果存在未定义属性则抛出错误
   * - transform: true      → 自动将输入数据转换为 DTO 类型
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 只允许 DTO 中定义的字段通过
      forbidNonWhitelisted: true, // 存在多余字段时返回错误
      transform: true,           // 自动类型转换
    }),
  );

  // 启动 HTTP 服务器，监听指定端口
  const port = 3000;
  await app.listen(port);
  console.log(`\n========================================`);
  console.log(`  商品 CRUD API 已启动`);
  console.log(`  地址: http://localhost:${port}`);
  console.log(`========================================`);
  console.log(`\n可用接口:`);
  console.log(`  GET    /products       - 查询所有商品`);
  console.log(`  GET    /products/:id   - 查询单个商品`);
  console.log(`  POST   /products       - 创建商品`);
  console.log(`  PUT    /products/:id   - 更新商品`);
  console.log(`  DELETE /products/:id   - 删除商品`);
  console.log(`\n查询参数:`);
  console.log(`  ?category=分类名称     - 按分类筛选`);
  console.log(`  ?minPrice=最低价       - 最低价格`);
  console.log(`  ?maxPrice=最高价       - 最高价格`);
}

// 启动应用
bootstrap();
