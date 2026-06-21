/**
 * 支付模块
 *
 * 学习点：模块间的依赖关系
 * PaymentsModule 依赖 OrdersModule（虽然本示例中通过 Prisma 直接操作，
 * 但在更复杂的项目中可能需要调用 OrdersService 的方法）
 */
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
