/**
 * 全局 HTTP 异常过滤器
 *
 * 学习要点：
 * 1. ExceptionFilter 接口定义了 catch 方法
 * 2. @Catch() 装饰器指定要捕获的异常类型
 *    - @Catch() 不带参数 = 捕获所有异常
 *    - @Catch(HttpException) = 只捕获 HTTP 异常
 * 3. ArgumentsHost 提供了请求和响应的上下文
 *
 * 异常过滤器的层级（从内到外）：
 * 方法级 → 控制器级 → 全局级
 *
 * 响应格式统一为：
 * {
 *   code: number,       // HTTP 状态码
 *   message: string,    // 错误信息
 *   timestamp: string,  // 时间戳
 *   path: string,       // 请求路径
 *   method: string      // 请求方法
 * }
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // 不带参数，捕获所有异常
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // 获取 HTTP 上下文
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 区分 HttpException 和其他异常
    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      // NestJS 内置的 HTTP 异常（NotFoundException, BadRequestException 等）
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // getResponse() 可能是字符串或对象
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    } else {
      // 非 HTTP 异常（如数据库连接失败、内存溢出等）
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';

      // 记录详细错误日志（仅在开发环境暴露详细信息）
      this.logger.error(
        `未预期异常: ${exception}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
    );

    // 统一格式的响应
    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
