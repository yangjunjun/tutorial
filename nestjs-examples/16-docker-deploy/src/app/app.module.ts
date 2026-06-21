/**
 * 应用根模块
 *
 * 【NestJS 模块系统】
 * 模块是 NestJS 的核心组织单元：
 * - 每个应用至少有一个根模块（AppModule）
 * - 模块通过 imports 声明依赖关系
 * - 模块通过 providers 注册服务
 * - 模块通过 controllers 注册路由
 * - 模块通过 exports 暴露服务给其他模块
 *
 * 【本模块的配置说明】
 * 1. ConfigModule - 环境变量和配置管理
 * 2. HealthModule - 健康检查端点
 * 3. MetricsModule - 监控指标
 * 4. Middleware - 请求 ID 和日志
 * 5. Interceptor - 指标收集
 * 6. ExceptionFilter - 全局异常处理
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

// 配置
import { appConfig, validationSchema } from '../config/app.config';

// 模块
import { HealthModule } from '../health/health.module';
import { MetricsModule } from '../metrics/metrics.module';
import { MetricsService } from '../metrics/metrics.service';
import { MetricsInterceptor } from '../metrics/metrics.interceptor';

// 控制器和服务
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 中间件
import { RequestIdMiddleware } from '../common/middleware/request-id.middleware';
import { LoggingMiddleware } from '../common/middleware/logging.middleware';

@Module({
  imports: [
    // -----------------------------------------------------------------------
    // 配置模块（全局注册）
    // -----------------------------------------------------------------------
    // isGlobal: true 使得 ConfigService 可以在任何模块中注入使用
    // load: [appConfig] 加载自定义配置工厂
    // validationSchema 在应用启动时验证所有环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      // 如果验证失败，是否阻止应用启动
      // 生产环境建议设为 true（Fail Fast）
      validationOptions: {
        allowUnknown: true,
        abortEarly: false, // 收集所有验证错误，而非遇到第一个就停止
      },
      // 环境变量文件加载
      // .env.local 覆盖 .env（本地开发用）
      envFilePath: ['.env.local', '.env'],
    }),

    // 健康检查模块
    HealthModule,

    // 监控指标模块
    MetricsModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,

    // -----------------------------------------------------------------------
    // 全局指标拦截器
    // -----------------------------------------------------------------------
    // 使用 APP_INTERCEPTOR 令牌注册全局拦截器
    // 这样所有 HTTP 请求都会自动被 MetricsInterceptor 记录
    //
    // 【useFactory 说明】
    // 使用工厂函数是因为 MetricsInterceptor 需要注入 MetricsService
    // NestJS 的依赖注入会自动解析 useFactory 的参数
    {
      provide: APP_INTERCEPTOR,
      useFactory: (metricsService: MetricsService) => {
        return new MetricsInterceptor(metricsService);
      },
      inject: [MetricsService],
    },
  ],
})
/**
 * AppModule 实现 NestModule 接口以配置中间件
 *
 * 【中间件 vs 拦截器 vs 守卫 vs 管道】
 * NestJS 的请求处理管道（按执行顺序）：
 * 1. Middleware（中间件）- 最早执行，类似 Express 中间件
 * 2. Guard（守卫）- 权限检查
 * 3. Interceptor (pre)（拦截器前半段）- 请求预处理
 * 4. Pipe（管道）- 参数验证和转换
 * 5. Controller（控制器）- 业务逻辑
 * 6. Interceptor (post)（拦截器后半段）- 响应处理
 * 7. Exception Filter（异常过滤器）- 异常处理
 */
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用中间件到所有路由
    // forRoutes('*') 表示匹配所有路径
    //
    // 【中间件执行顺序】
    // 按照 apply() 的调用顺序执行
    // 1. RequestIdMiddleware 先执行（为请求分配 ID）
    // 2. LoggingMiddleware 后执行（使用已分配的 ID 记录日志）
    consumer
      .apply(RequestIdMiddleware, LoggingMiddleware)
      .forRoutes('*'); // 应用到所有路由
  }
}
