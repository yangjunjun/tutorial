/**
 * 订单模块
 *
 * 组装订单相关的控制器和服务。
 * 注意：ClientProxy 的注入是在 AppModule 中通过
 * ClientsModule.register() 全局注册的。
 */
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
