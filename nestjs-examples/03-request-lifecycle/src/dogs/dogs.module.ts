/**
 * 狗狗模块
 *
 * 模块中可以通过 MiddlewareConsumer 配置中间件的应用范围：
 * - forRoutes() 指定中间件应用到哪些路由
 * - exclude() 排除特定路由
 *
 * MiddlewareConsumer 方法：
 * - apply(Middleware)   → 指定要应用的中间件
 * - forRoutes(routes)   → 指定路由范围
 * - exclude(routes)     → 排除特定路由
 */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { DogsController } from './dogs.controller';
import { DogsService } from './dogs.service';
import { LoggingMiddleware } from '../middleware/logging.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

@Module({
  controllers: [DogsController],
  providers: [DogsService],
})
export class DogsModule implements NestModule {
  /**
   * configure() 方法用于配置中间件
   *
   * 这里我们将两个中间件应用到所有 /dogs 路由：
   * 1. LoggingMiddleware（类中间件） - 记录请求日志
   * 2. authMiddleware（函数中间件） - 验证 API Key
   *
   * 中间件按注册顺序依次执行：LoggingMiddleware → authMiddleware
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 应用类中间件
      .apply(LoggingMiddleware, authMiddleware)
      // 应用到 DogsController 的所有路由
      .forRoutes(DogsController);

    // 也可以更精细地控制：
    // consumer
    //   .apply(authMiddleware)
    //   .exclude(
    //     { path: 'dogs', method: RequestMethod.GET }, // 排除 GET /dogs
    //   )
    //   .forRoutes(DogsController);
  }
}
