/**
 * 根模块
 *
 * 聚合 TodosModule 和 UsersModule
 */
import { Module } from '@nestjs/common';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [TodosModule, UsersModule],
})
export class AppModule {}
