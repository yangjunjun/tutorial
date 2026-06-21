/**
 * CORS 中间件（类中间件）
 *
 * 学习要点：
 * 1. 类中间件实现 NestMiddleware 接口
 * 2. 可以使用 @Injectable() 装饰器，支持依赖注入
 * 3. 类中间件适合需要配置化或注入服务的场景
 * 4. CORS（跨域资源共享）是 Web 安全的重要机制
 *
 * 什么时候用类中间件 vs 函数中间件？
 * - 需要注入服务（如 ConfigService）→ 类中间件
 * - 简单逻辑，无依赖 → 函数中间件
 * - 需要单元测试（mock 依赖）→ 类中间件
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  // 可配置的 CORS 选项
  private readonly allowedOrigins = [
    'http://localhost:3000',  // 前端开发服务器
    'http://localhost:5173',  // Vite
    'http://localhost:8080',  // Vue/React 开发服务器
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // 检查请求来源是否在白名单中
    if (origin && this.allowedOrigins.includes(origin)) {
      // 允许跨域请求
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With',
      );
      // 允许携带凭证（cookies）
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      // 预检请求缓存时间（秒）
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    // OPTIONS 预检请求直接返回 204
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  }
}
