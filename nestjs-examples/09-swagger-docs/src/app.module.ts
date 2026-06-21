/**
 * 根模块
 */
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [ProductsModule, UsersModule, OrdersModule],
})
export class AppModule {}
