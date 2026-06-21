/**
 * 应用根模块 - 组合所有功能模块
 *
 * 学习点：
 * 1. BullModule.forRoot() 配置队列系统的全局连接
 * 2. 缓存模块、队列模块、数据库优化模块的整合
 * 3. 模块依赖关系的组织
 *
 * Bull 队列后端配置：
 * - 生产环境：使用 Redis 作为后端（分布式、持久化）
 * - 开发环境：可以使用 Redis 或内存模式
 *
 * 本项目使用 Redis（Bull 默认需要 Redis）
 * 如果没有 Redis，请参考 README 中的说明
 */
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

// 全局模块
import { PrismaModule } from './prisma/prisma.module';
import { AppCacheModule } from './cache/cache.module';

// 功能模块
import { ProductsModule } from './products/products.module';
import { QueueModule } from './queue/queue.module';
import { DatabaseOptimizationModule } from './database-optimization/database-optimization.module';

@Module({
  imports: [
    // ===== Bull 队列全局配置 =====
    // Bull 使用 Redis 作为后端存储
    // 如果没有 Redis，可以安装一个本地实例或使用 Docker:
    //   docker run -d -p 6379:6379 redis:alpine
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      // 默认任务选项（所有队列共享）
      defaultJobOptions: {
        removeOnComplete: true,  // 完成后自动清理
        removeOnFail: false,     // 失败后保留（方便调试）
      },
    }),

    // ===== 全局模块 =====
    PrismaModule,       // 数据库服务
    AppCacheModule,     // 缓存服务

    // ===== 功能模块 =====
    ProductsModule,                 // 商品（缓存演示）
    QueueModule,                    // 消息队列（Bull）
    DatabaseOptimizationModule,     // 数据库优化演示
  ],
})
export class AppModule {}
