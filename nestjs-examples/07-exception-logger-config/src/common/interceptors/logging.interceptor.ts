/**
 * 请求日志拦截器
 *
 * 学习要点：
 * 1. 拦截器在请求处理前后都能执行代码
 * 2. 使用 RxJS 的 tap 操作符记录响应时间
 * 3. NestJS Logger 提供统一的日志接口
 *
 * 拦截器执行流程：
 * 请求 → 拦截器前置逻辑 → Controller → 拦截器后置逻辑 → 响应
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;

    // 记录请求开始时间
    const startTime = Date.now();

    // 记录请求开始日志
    this.logger.log(`→ ${method} ${url} [${ip}]`);

    // next.handle() 执行后续的处理链（Controller 方法）
    return next.handle().pipe(
      // tap 操作符在响应返回时执行，不影响响应数据
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 记录请求完成日志，包含响应时间
        this.logger.log(
          `← ${method} ${url} [${ip}] - ${duration}ms`,
        );
      }),
    );
  }
}
