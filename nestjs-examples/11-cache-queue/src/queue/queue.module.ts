/**
 * 队列模块 - 配置 Bull 队列
 *
 * 学习点：
 * 1. BullModule.registerQueue() 注册命名队列
 * 2. 每个队列有独立的 Processor 处理任务
 * 3. 队列可以配置 Redis 连接（生产环境）或使用内存模式
 *
 * Bull 队列使用 Redis 作为后端存储：
 * - 任务数据存储在 Redis 中
 * - 支持持久化（Redis AOF/RDB）
 * - 支持分布式（多个消费者实例处理同一队列）
 *
 * 内存模式说明：
 * - 本项目使用 Bull 的默认配置（如果没有 Redis 会报错）
 * - 生产环境必须配置 Redis
 * - 如需纯内存队列，可考虑使用 bullmq 或 node-resque
 */
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor';
import { ReportProcessor } from './report.processor';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    // 注册邮件队列
    // 队列名称 'email' 对应 @Processor('email') 和 @InjectQueue('email')
    BullModule.registerQueue({
      name: 'email',
      // 默认使用 BullModule.forRoot() 中配置的 Redis 连接
      // 也可以为每个队列指定独立的 Redis 连接：
      // redis: { host: 'localhost', port: 6379 },
    }),

    // 注册报表队列
    BullModule.registerQueue({
      name: 'report',
    }),
  ],
  controllers: [QueueController],
  providers: [EmailProcessor, ReportProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
