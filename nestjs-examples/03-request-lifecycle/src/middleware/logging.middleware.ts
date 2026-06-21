/**
 * 日志中间件（类中间件）
 *
 * 中间件是请求生命周期中**最先执行**的环节。
 * 它在守卫、拦截器、管道和控制器之前运行。
 *
 * NestJS 中间件与 Express 中间件概念完全相同，
 * 但 NestJS 提供了两种定义方式：
 *
 * 1. 类中间件（本文件）：
 *    - 实现 NestMiddleware 接口
 *    - 可以使用依赖注入（@Injectable）
 *    - 适合需要注入其他服务的复杂中间件
 *    - 在模块的 configure() 方法中注册
 *
 * 2. 函数中间件：
 *    - 普通函数 (req, res, next) => void
 *    - 更简单，适合纯逻辑中间件
 *    - 参见 auth.middleware.ts
 *
 * 中间件的典型用途：
 * - 请求日志记录
 * - CORS 配置
 * - 请求体/cookie 解析
 * - 认证 token 初步解析（注意：授权检查应在 Guard 中进行）
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 记录请求开始时间
    const startTime = Date.now();
    const { method, originalUrl, headers, body } = req;

    console.log('\n' + '─'.repeat(50));
    console.log(`[Middleware] → ${method} ${originalUrl}`);
    console.log(`[Middleware]   Headers:`, JSON.stringify(headers, null, 2).substring(0, 200));

    // 只在有请求体时打印
    if (Object.keys(body).length > 0) {
      console.log(`[Middleware]   Body:`, body);
    }

    // 监听响应完成事件，记录响应时间
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(
        `[Middleware] ← ${method} ${originalUrl} ${res.statusCode} (${duration}ms)`,
      );
    });

    // 调用 next() 将控制权传递给下一个中间件或路由处理器
    // 如果不调用 next()，请求将永远挂起！
    next();
  }
}
