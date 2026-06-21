/**
 * 重试拦截器
 *
 * 学习要点：
 * 1. RxJS retry() 操作符在流发生错误时重新订阅
 * 2. 适用于处理临时性故障（网络抖动、数据库连接池繁忙）
 * 3. 可以配置重试次数
 * 4. 注意：重试会重新执行 Controller 方法
 *
 * 适用场景：
 * - 调用外部 API（网络不稳定）
 * - 数据库操作（死锁重试）
 *
 * 不适用场景：
 * - 验证错误（重试不会改变结果）
 * - 用户输入错误
 * - 幂等性不保证的操作（POST 等）
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { retry, tap } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);

  // 最大重试次数
  private readonly maxRetries: number;

  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let attempt = 0;

    return next.handle().pipe(
      // retry 操作符：在错误发生时重新订阅源 Observable
      retry({
        count: this.maxRetries,
        // 延迟重试策略（可选）
        delay: (error, retryCount) => {
          attempt = retryCount;
          this.logger.warn(
            `第 ${retryCount} 次重试，错误: ${error.message}`,
          );
          // 指数退避：100ms, 200ms, 400ms...
          return new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount - 1) * 100),
          );
        },
      }),
      tap({
        error: (error) => {
          this.logger.error(
            `重试 ${this.maxRetries} 次后仍然失败: ${error.message}`,
          );
        },
      }),
    );
  }
}
