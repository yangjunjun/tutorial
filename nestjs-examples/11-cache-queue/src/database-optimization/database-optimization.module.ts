/**
 * 数据库优化模块
 *
 * 将数据库性能优化相关的功能组织在一个模块中
 * 包含 N+1 问题演示、游标分页、批量操作等
 */
import { Module } from '@nestjs/common';
import { DatabaseOptimizationController } from './database-optimization.controller';
import { DatabaseOptimizationService } from './examples.service';

@Module({
  controllers: [DatabaseOptimizationController],
  providers: [DatabaseOptimizationService],
})
export class DatabaseOptimizationModule {}
