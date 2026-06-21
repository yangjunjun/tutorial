/**
 * 根模块
 *
 * 学习要点：
 * 1. NestModule 接口提供 configure() 方法用于配置中间件
 * 2. MiddlewareConsumer 提供链式 API：
 *    - apply(): 指定要应用的中间件
 *    - forRoutes(): 指定中间件应用的路由范围
 *    - exclude(): 排除某些路由
 * 3. 中间件按 configure() 中的注册顺序执行
 *
 * 路由匹配模式：
 * - '*' - 匹配所有路由
 * - '/cats' - 匹配特定路径
 * - { path: 'cats', method: RequestMethod.GET } - 匹配特定方法和路径
 */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { UsersModule } from './users/users.module';
import { timingMiddleware } from './middleware/timing.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [CatsModule, UsersModule],
})
export class AppModule implements NestModule {
  /**
   * 配置中间件
   *
   * 中间件执行顺序（按注册顺序）：
   * 1. CorsMiddleware - 处理跨域请求
   * 2. RateLimitMiddleware - 限流保护
   * 3. timingMiddleware - 记录响应时间
   */
  configure(consumer: MiddlewareConsumer) {
    // ========== CORS 中间件 ==========
    // 类中间件使用 apply(ClassName)
    consumer
      .apply(CorsMiddleware)
      .forRoutes('*'); // 应用到所有路由

    // ========== 限流中间件 ==========
    consumer
      .apply(RateLimitMiddleware)
      .exclude(
        // 排除健康检查等不需要限流的路由
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');

    // ========== 计时中间件 ==========
    // 函数中间件使用 apply(functionRef)
    consumer
      .apply(timingMiddleware)
      .forRoutes('*'); // 应用到所有路由
  }
}
