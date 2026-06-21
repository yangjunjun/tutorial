/**
 * 应用根模块 - 组合所有功能模块
 *
 * 学习点：
 * 1. ScheduleModule.forRoot() 启用定时任务功能
 * 2. PrismaModule 作为全局模块在此导入
 * 3. 各功能模块按职责划分，互不耦合
 * 4. 模块的导入顺序通常不影响功能（NestJS 会自动解析依赖）
 */
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// 全局模块
import { PrismaModule } from './prisma/prisma.module';

// 功能模块
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // 启用定时任务模块
    // ScheduleModule 提供 @Cron()、@Interval()、@Timeout() 装饰器
    ScheduleModule.forRoot(),

    // 数据库服务（全局模块）
    PrismaModule,

    // 业务模块
    OrdersModule,
    PaymentsModule,

    // 定时任务模块
    SchedulerModule,
  ],
})
export class AppModule {}
