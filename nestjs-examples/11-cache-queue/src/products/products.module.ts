/**
 * 商品模块
 *
 * 依赖 PrismaModule（全局）和 AppCacheModule（全局）
 * 由于两个依赖都是全局模块，无需在此显式导入
 */
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
