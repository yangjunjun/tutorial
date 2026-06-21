/**
 * 订单模块
 *
 * 学习点：
 * 1. 模块组织：将相关的 Controller、Service、DTO 组织在一个模块中
 * 2. PrismaService 是全局模块，无需在此导入 PrismaModule
 */
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],  // 导出给其他模块使用（如 payments 模块）
})
export class OrdersModule {}
