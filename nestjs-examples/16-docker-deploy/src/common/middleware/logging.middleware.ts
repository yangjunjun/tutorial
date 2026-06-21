/**
 * 结构化日志中间件
 *
 * 【为什么需要结构化日志？】
 * 传统的文本日志难以被日志系统（如 ELK Stack、Loki）解析和搜索。
 * 结构化日志使用 JSON 格式，便于：
 * 1. 日志聚合系统自动解析字段
 * 2. 按字段（如 requestId、statusCode）过滤和搜索
 * 3. 自动生成监控图表和告警
 *
 * 【日志格式】
 * ```json
 * {
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "level": "info",
 *   "requestId": "abc-123-def",
 *   "method": "GET",
 *   "url": "/api/v1/items",
 *   "statusCode": 200,
 *   "duration": 45,
 *   "userAgent": "Mozilla/5.0..."
 * }
 * ```
 *
 * 【Docker/K8s 日志最佳实践】
 * 1. 输出到 stdout/stderr（Docker 会自动收集）
 * 2. 使用 JSON 格式（便于日志聚合）
 * 3. 包含 Request ID（便于分布式追踪）
 * 4. 不要输出敏感信息（密码、Token 等）
 * 5. 使用合适的日志级别（debug/info/warn/error）
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestWithId } from './request-id.middleware';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithId, res: Response, next: NextFunction) {
    // 记录请求开始时间（用于计算请求耗时）
    const startTime = Date.now();

    // 获取请求相关信息
    const { method, url } = req;
    const requestId = req.requestId || 'unknown';
    const userAgent = req.get('user-agent') || '';

    // 监听响应完成事件
    // 使用 res.on('finish', ...) 在响应发送完毕后记录日志
    res.on('finish', () => {
      // 计算请求耗时（毫秒）
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 根据状态码确定日志级别
      // 5xx 错误用 error 级别，4xx 用 warn，其余用 info
      const level =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      // 构造结构化日志对象
      const logEntry = {
        timestamp: new Date().toISOString(), // ISO 8601 格式时间戳
        level, // 日志级别
        requestId, // 请求唯一标识（用于追踪）
        method, // HTTP 方法（GET/POST/PUT/DELETE）
        url, // 请求路径
        statusCode, // HTTP 状态码
        duration, // 请求耗时（毫秒）
        contentLength: res.get('content-length') || 0, // 响应体大小
        userAgent, // 客户端标识
      };

      // 输出 JSON 格式的结构化日志
      // Docker/K8s 的日志收集系统会自动解析 JSON
      if (level === 'error') {
        this.logger.error(JSON.stringify(logEntry));
      } else if (level === 'warn') {
        this.logger.warn(JSON.stringify(logEntry));
      } else {
        this.logger.log(JSON.stringify(logEntry));
      }
    });

    next();
  }
}
