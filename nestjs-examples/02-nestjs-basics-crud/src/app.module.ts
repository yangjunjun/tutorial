/**
 * 根模块（AppModule）
 *
 * 每个 NestJS 应用都有一个根模块，通常命名为 AppModule。
 * 根模块是整个应用的入口点，NestJS 从这里开始解析依赖关系。
 *
 * 在大型应用中，根模块负责：
 * 1. 导入所有功能模块
 * 2. 配置全局中间件
 * 3. 设置全局提供者（如配置服务、日志服务等）
 */
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // 导入商品模块
    // ProductsModule 内部的 ProductsService 通过 exports 暴露，
    // 如果需要可以在 AppModule 中注入使用
    ProductsModule,
  ],
})
export class AppModule {}
