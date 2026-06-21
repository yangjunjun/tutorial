/**
 * 定时任务模块
 *
 * 学习点：
 * 1. 定时任务通常作为独立模块，不与业务逻辑耦合
 * 2. 需要导入 PrismaService 来直接操作数据库
 * 3. 在生产环境中，可能还需要导入通知服务（邮件、短信等）
 */
import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [SchedulerService],
})
export class SchedulerModule {}
