/**
 * 计时中间件（函数中间件）
 *
 * 学习要点：
 * 1. 中间件有两种写法：函数中间件 和 类中间件
 *    - 函数中间件：简单的纯函数，接收 req, res, next
 *    - 类中间件：实现 NestMiddleware 接口，可注入依赖
 * 2. 函数中间件适合简单逻辑，不需要依赖注入
 * 3. res.on('finish', ...) 监听响应完成事件
 * 4. 中间件在 app.module.ts 的 configure() 中配置路由
 *
 * 本示例：
 * 记录请求开始时间，响应完成后计算并设置 X-Response-Time 头
 */
import { Request, Response, NextFunction } from 'express';

/**
 * 函数中间件
 * 参数签名：(req, res, next) => void
 * 必须调用 next() 将控制权传递给下一个中间件或路由处理器
 */
export function timingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 记录请求开始的高精度时间
  const startTime = process.hrtime();

  // 监听响应完成事件
  // 'finish' 事件在响应发送完毕后触发
  res.on('finish', () => {
    // 计算耗时（process.hrtime 返回 [秒, 纳秒]）
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    // 在控制台输出请求耗时
    console.log(
      `[Timing] ${req.method} ${req.originalUrl} - ${durationMs}ms`,
    );
  });

  // 设置响应头，客户端可以通过此头获取服务器处理时间
  // 注意：需要在 next() 前设置，因为响应头在发送响应前就要确定
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    res.setHeader('X-Response-Time', `${durationMs}ms`);
    return originalEnd.apply(res, args);
  } as any;

  // 必须调用 next()，否则请求会挂起
  next();
}
