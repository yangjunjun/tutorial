/**
 * 应用入口文件（main.ts）
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 注册全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 过滤 DTO 中未定义的属性
      forbidNonWhitelisted: true, // 存在多余属性时返回错误
      transform: true,           // 自动类型转换
    }),
  );

  const port = 3000;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════╗
║     NestJS + Prisma ORM 数据库集成示例                ║
║                                                      ║
║  应用已启动: http://localhost:${port}                  ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  分类接口:                                            ║
║  GET    /categories     - 获取所有分类                 ║
║  GET    /categories/:id - 获取单个分类（含商品）        ║
║  POST   /categories     - 创建分类                    ║
║  DELETE /categories/:id - 删除分类                    ║
║                                                      ║
║  商品接口:                                            ║
║  GET    /products       - 获取所有商品（分页+筛选）     ║
║  GET    /products/:id   - 获取单个商品                 ║
║  POST   /products       - 创建商品                    ║
║  PUT    /products/:id   - 更新商品                    ║
║  DELETE /products/:id   - 删除商品                    ║
║                                                      ║
║  查询参数:                                            ║
║  ?page=1&pageSize=10    - 分页                        ║
║  ?categoryId=1          - 按分类筛选                   ║
║                                                      ║
║  数据库工具:                                          ║
║  pnpm prisma:studio     - 打开 Prisma Studio          ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
