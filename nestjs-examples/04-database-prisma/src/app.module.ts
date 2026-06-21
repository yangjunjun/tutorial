/**
 * 根模块（AppModule）
 *
 * 导入所有功能模块：
 * - PrismaModule: 全局数据库服务
 * - ProductsModule: 商品管理
 * - CategoriesModule: 分类管理
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    PrismaModule,       // 全局 Prisma 数据库服务
    ProductsModule,     // 商品管理模块
    CategoriesModule,   // 分类管理模块
  ],
})
export class AppModule {}
