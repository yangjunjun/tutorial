/**
 * 限流中间件
 *
 * 学习要点：
 * 1. 使用内存 Map 存储每个 IP 的请求次数
 * 2. 滑动窗口算法：在固定时间窗口内限制请求次数
 * 3. 返回 429 Too Many Requests 状态码
 * 4. 设置 Rate Limit 相关响应头
 *
 * 生产环境建议：
 * - 使用 Redis 替代内存 Map（支持多实例部署）
 * - 使用 @nestjs/throttler 官方限流模块
 * - 结合用户 ID 进行限流（不仅仅是 IP）
 */
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// 请求记录：{ IP地址 → { 请求次数, 窗口开始时间 } }
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  // 配置
  private readonly windowMs = 60 * 1000; // 时间窗口：1 分钟
  private readonly maxRequests = 100;     // 最大请求数

  // 存储请求记录
  // 注意：生产环境应使用 Redis，内存 Map 在进程重启后丢失
  private readonly store = new Map<string, RateLimitRecord>();

  use(req: Request, res: Response, next: NextFunction) {
    // 获取客户端 IP
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // 获取或创建请求记录
    let record = this.store.get(clientIp);

    if (!record || now > record.resetTime) {
      // 首次请求 或 窗口已过期，创建新记录
      record = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.store.set(clientIp, record);
    }

    // 递增请求计数
    record.count++;

    // 设置限流相关响应头
    const remaining = Math.max(0, this.maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(record.resetTime).toISOString(),
    );

    // 检查是否超过限制
    if (record.count > this.maxRequests) {
      // 计算重试等待时间（秒）
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      throw new HttpException(
        {
          code: 429,
          message: `请求过于频繁，请在 ${retryAfter} 秒后重试`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  /**
   * 定期清理过期的记录（可选）
   * 防止内存无限增长
   */
  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(ip);
      }
    }
  }
}
