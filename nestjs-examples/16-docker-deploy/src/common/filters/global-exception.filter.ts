/**
 * 全局异常过滤器
 *
 * 【异常处理策略】
 * 在生产环境中，未捕获的异常会导致：
 * 1. 暴露内部错误信息（安全风险）
 * 2. 返回不友好的错误响应
 * 3. 难以追踪和排查问题
 *
 * 全局异常过滤器的作用：
 * 1. 捕获所有未处理的异常
 * 2. 返回统一格式的错误响应
 * 3. 记录错误日志（包含 Request ID 便于追踪）
 * 4. 隐藏敏感的内部错误信息
 *
 * 【在 Docker/K8s 中的重要性】
 * - 未捕获的异常可能导致容器重启
 * - 结构化的错误响应便于前端处理
 * - Request ID 帮助在海量日志中定位问题
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
import { RequestWithId } from '../middleware/request-id.middleware';

/**
 * @Catch() 装饰器不传参数，表示捕获所有异常
 * 如果只想捕获特定类型的异常，可以传入类名：
 * @Catch(HttpException) - 只捕获 HTTP 异常
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // 获取 HTTP 上下文
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    // 确定 HTTP 状态码
    // 如果是 NestJS 的 HttpException，使用其自带的状态码
    // 否则默认为 500 Internal Server Error
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取错误消息
    let errorMessage: string;
    let errorCode: string;

    if (exception instanceof HttpException) {
      // NestJS 内置的 HTTP 异常（如 NotFoundException, BadRequestException）
      const exceptionResponse = exception.getResponse();
      errorMessage =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
      errorCode = `HTTP_${status}`;
    } else {
      // 未预期的错误（可能是 bug 或外部服务故障）
      // 生产环境中不要暴露内部错误细节
      errorMessage = '服务器内部错误，请稍后重试';
      errorCode = 'INTERNAL_ERROR';

      // 记录完整的错误堆栈（仅在服务端日志中）
      this.logger.error(
        `未捕获的异常 [RequestId: ${request.requestId || 'unknown'}]: ${
          (exception as Error).stack || exception
        }`,
      );
    }

    // 构造统一的错误响应格式
    const errorResponse = {
      // 错误码（便于前端程序化处理）
      code: errorCode,

      // 错误消息（显示给用户）
      message: errorMessage,

      // HTTP 状态码
      statusCode: status,

      // 请求路径（帮助定位问题）
      path: request.url,

      // 请求方法
      method: request.method,

      // 请求 ID（用于追踪和关联日志）
      requestId: request.requestId || 'unknown',

      // 时间戳
      timestamp: new Date().toISOString(),
    };

    // 对于 5xx 错误，记录警告日志（非 HttpException 的情况已在上面记录）
    if (status >= 500 && exception instanceof HttpException) {
      this.logger.error(
        `服务器错误 [RequestId: ${request.requestId}]: ${request.method} ${request.url} → ${status}`,
      );
    }

    // 对于 4xx 错误，记录警告日志
    if (status >= 400 && status < 500) {
      this.logger.warn(
        `客户端错误 [RequestId: ${request.requestId}]: ${request.method} ${request.url} → ${status} ${errorMessage}`,
      );
    }

    // 发送错误响应
    response.status(status).json(errorResponse);
  }
}
