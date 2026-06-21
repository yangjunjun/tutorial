/**
 * 日志拦截器（Interceptor）
 *
 * 拦截器在请求生命周期中的位置：
 * 守卫之后 → 管道之前（请求阶段）
 * 控制器之后（响应阶段）
 *
 * 拦截器的独特之处：
 * - 可以同时处理请求前和响应后的逻辑
 * - 使用 RxJS Observable 处理响应流
 * - 可以修改、扩展、甚至替换响应数据
 *
 * NestInterceptor 接口：
 * - intercept(context, next) 方法
 * - next.handle() 返回一个 Observable，代表控制器的返回值
 * - 使用 RxJS 操作符（tap, map, catchError 等）处理 Observable
 *
 * tap() 操作符：
 * - 用于执行副作用（如日志记录）
 * - 不会修改 Observable 的值
 * - 类似于 Array.forEach()，只是"观察"而不改变数据流
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    console.log(`[Interceptor:Logging] → 请求开始: ${method} ${url}`);
    const startTime = Date.now();

    // next.handle() 调用下一个拦截器或控制器方法
    // 返回的 Observable 包含控制器的返回值
    return next.handle().pipe(
      // tap() 在 Observable 发出值时执行副作用（不修改值）
      tap((data) => {
        const duration = Date.now() - startTime;
        console.log(
          `[Interceptor:Logging] ← 请求完成: ${method} ${url} (${duration}ms)`,
        );
        console.log(`[Interceptor:Logging]   响应数据:`, JSON.stringify(data));
      }),
    );
  }
}
