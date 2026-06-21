/**
 * 业务异常过滤器
 *
 * 学习要点：
 * 1. @Catch(BusinessException) 只捕获自定义业务异常
 * 2. 可以与全局 HttpExceptionFilter 共存
 * 3. 业务异常通常包含额外的业务数据（如错误码、业务上下文）
 *
 * 使用场景：
 * - 库存不足（InsufficientStockException）
 * - 订单不存在（OrderNotFoundException）
 * - 余额不足（InsufficientBalanceException）
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BusinessException } from '../exceptions/business.exception';

@Catch(BusinessException) // 只捕获 BusinessException 及其子类
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // 记录业务异常日志（warn 级别，非 error）
    this.logger.warn(
      `业务异常: ${request.method} ${request.url} - ${exceptionResponse.businessCode} - ${exception.message}`,
    );

    // 业务异常响应，包含额外的业务数据
    response.status(status).json({
      code: status,
      // 业务错误码（区别于 HTTP 状态码）
      businessCode: exceptionResponse.businessCode || 'BUSINESS_ERROR',
      message: exception.message,
      // 额外的业务数据
      details: exceptionResponse.details || null,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
