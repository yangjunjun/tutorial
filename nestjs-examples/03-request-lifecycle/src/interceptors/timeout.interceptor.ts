/**
 * 超时拦截器（Timeout Interceptor）
 *
 * 使用 RxJS 的 timeout() 操作符限制请求处理时间。
 * 如果控制器处理时间超过指定阈值，自动抛出 RequestTimeoutException。
 *
 * timeout() 操作符：
 * - 如果 Observable 在指定时间内没有发出值，就会抛出 TimeoutError
 * - 在 NestJS 中通常配合 catchError() 转换为 HTTP 408 异常
 *
 * 实际应用场景：
 * - 防止慢查询拖垮服务
 * - 第三方 API 调用超时保护
 * - 复杂计算任务的超时控制
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  // 超时时间（毫秒）
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 5000) {
    this.timeoutMs = timeoutMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log(`[Interceptor:Timeout] 设置超时时间: ${this.timeoutMs}ms`);

    return next.handle().pipe(
      // timeout() 在指定时间后如果没有收到响应，抛出 TimeoutError
      timeout(this.timeoutMs),

      // catchError() 捕获超时错误并转换为 NestJS 异常
      catchError((err) => {
        if (err instanceof TimeoutError) {
          console.log('[Interceptor:Timeout] 请求超时！');
          return throwError(
            () => new RequestTimeoutException(`请求处理超时（${this.timeoutMs}ms）`),
          );
        }
        // 非超时错误继续抛出
        return throwError(() => err);
      }),
    );
  }
}
