/**
 * Todos 模块
 *
 * 将 TodosController 和 TodosService 组织在一起。
 * 通过 exports 导出 TodosService，允许其他模块使用。
 */
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}
