/**
 * 指标拦截器
 *
 * 【NestJS Interceptor 说明】
 * 拦截器使用 AOP（面向切面编程）模式，在请求处理前后执行逻辑。
 * 与中间件的区别：
 * - 中间件：在请求到达控制器之前执行，无法感知具体的控制器方法
 * - 拦截器：可以感知控制器和方法，并且可以在响应发送后执行逻辑
 *
 * 【本拦截器的作用】
 * 自动记录每个 HTTP 请求的指标数据：
 * 1. 请求方法（GET/POST/PUT/DELETE）
 * 2. 请求路径
 * 3. 响应状态码
 * 4. 请求耗时
 *
 * 【使用方式】
 * 可以通过 @UseInterceptors() 装饰器应用在控制器或方法级别，
 * 也可以通过 APP_INTERCEPTOR 全局注册。
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取 HTTP 请求上下文
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.route?.path || request.url;

    // 记录请求开始时间
    const startTime = Date.now();

    // 调用下一个处理器（控制器方法）
    // tap 操作符在响应发送后执行回调
    return next.handle().pipe(
      tap(() => {
        // 计算请求耗时
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();
        const status = response.statusCode;

        // 记录请求指标
        this.metricsService.recordRequest({
          method,
          path,
          status,
          duration,
          timestamp: Date.now(),
        });
      }),
    );
  }
}
