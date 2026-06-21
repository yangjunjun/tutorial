/**
 * 响应转换拦截器（Transform Interceptor）
 *
 * 这个拦截器展示了 map() 操作符的使用 —— 修改响应数据。
 *
 * map() vs tap()：
 * - tap() → 执行副作用，不修改数据（适合日志）
 * - map() → 转换数据，返回新值（适合格式化）
 *
 * 实际项目中常用这种模式统一 API 响应格式：
 * {
 *   "code": 0,           // 业务状态码
 *   "message": "success", // 提示信息
 *   "data": { ... },     // 实际数据
 *   "timestamp": "..."   // 时间戳
 * }
 *
 * 异常处理：
 * 使用 catchError() 操作符可以捕获控制器抛出的异常，
 * 将错误响应也转换为统一格式。
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * 统一响应格式接口
 */
interface ResponseFormat<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      // map() 转换控制器的返回值为统一格式
      map((data) => {
        console.log('[Interceptor:Transform] 转换响应格式');
        return {
          code: 0,
          message: 'success',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
      // catchError() 捕获控制器抛出的异常
      catchError((err) => {
        console.log(`[Interceptor:Transform] 捕获异常: ${err.message}`);
        // 重新抛出异常，让异常过滤器处理
        // 这里也可以返回自定义的错误格式响应
        return throwError(() => err);
      }),
    );
  }
}
