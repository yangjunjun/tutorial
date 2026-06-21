/**
 * 请求 ID 中间件
 *
 * 【分布式追踪基础】
 * 在微服务和容器化环境中，一个用户请求可能经过多个服务。
 * 通过在每个请求中添加唯一的 Request ID，可以：
 * 1. 在日志中追踪一个请求的完整生命周期
 * 2. 在多个服务之间关联同一请求的日志
 * 3. 方便调试和排查问题
 * 4. 与 APM 工具（如 Jaeger、Zipkin）集成
 *
 * 【工作原理】
 * 1. 检查请求头中是否已有 X-Request-ID（可能由网关/负载均衡器设置）
 * 2. 如果没有，生成一个新的 UUID
 * 3. 将 Request ID 附加到请求对象和响应头中
 *
 * 【在 Kubernetes 中的实践】
 * - Ingress Controller（如 Nginx Ingress）通常会自动生成 Request ID
 * - Istio 等 Service Mesh 会注入 x-request-id 头
 * - 我们的中间件兼容这些外部设置的 ID
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 扩展 Express 的 Request 类型，添加 requestId 属性
export interface RequestWithId extends Request {
  requestId: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: RequestWithId, res: Response, next: NextFunction) {
    // 从请求头获取已有的 Request ID，或生成新的 UUID
    // 优先使用外部传入的 ID（兼容 API Gateway / Load Balancer）
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // 将 Request ID 附加到请求对象上
    req.requestId = requestId;

    // 将 Request ID 添加到响应头
    // 客户端可以通过响应头获取请求的唯一标识
    res.setHeader('X-Request-ID', requestId);

    // 记录请求 ID（仅在 debug 级别）
    this.logger.debug(`请求 ID: ${requestId} | ${req.method} ${req.url}`);

    next();
  }
}
