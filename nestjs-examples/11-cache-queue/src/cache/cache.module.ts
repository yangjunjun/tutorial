/**
 * 缓存模块配置
 *
 * 学习点：
 * 1. @nestjs/cache-manager 提供统一的缓存接口
 * 2. 可以配置内存缓存或 Redis 缓存
 * 3. CacheInterceptor 可以自动缓存 GET 请求响应
 *
 * 本项目同时提供：
 * - 内存缓存（通过 @nestjs/cache-manager，开箱即用）
 * - 自定义缓存服务（CustomCacheService，更灵活的控制）
 */
import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CustomCacheService } from './custom-cache.service';

@Global()  // 全局模块，所有模块都可以使用缓存
@Module({
  imports: [
    // ===== 内存缓存配置 =====
    // @nestjs/cache-manager 提供的内置缓存
    // ttl: 缓存过期时间（毫秒），max: 最大缓存条目数
    CacheModule.register({
      ttl: 5 * 60 * 1000,   // 默认5分钟过期
      max: 100,              // 最多缓存100个条目
      isGlobal: true,        // 全局可用
    }),

    // ===== Redis 缓存配置（生产环境） =====
    // 取消注释以下代码使用 Redis：
    //
    // CacheModule.registerAsync({
    //   useFactory: async () => {
    //     const redisStore = await import('cache-manager-ioredis-yet').then(
    //       (m) => m.redisStore,
    //     );
    //     return {
    //       store: await redisStore({
    //         host: process.env.REDIS_HOST || 'localhost',
    //         port: parseInt(process.env.REDIS_PORT || '6379'),
    //         ttl: 300,  // 默认5分钟（秒）
    //       }),
    //       isGlobal: true,
    //     };
    //   },
    // }),
  ],
  providers: [CustomCacheService],
  exports: [CacheModule, CustomCacheService],
})
export class AppCacheModule {}
