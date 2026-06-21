/**
 * 缓存拦截器
 *
 * 学习要点：
 * 1. 拦截器可以操作 Observable 响应流
 * 2. 缓存 key 基于 URL + 查询参数生成
 * 3. TTL（Time To Live）过期自动清除缓存
 * 4. 只对 GET 请求生效（幂等操作）
 *
 * 生产环境建议：
 * - 使用 @nestjs/cache-manager 官方缓存模块
 * - 使用 Redis 作为缓存后端
 * - 添加缓存预热和失效策略
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

// 缓存条目结构
interface CacheEntry {
  data: any;          // 缓存的响应数据
  expiry: number;     // 过期时间戳
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  // 内存缓存存储
  // 生产环境应使用 Redis
  private readonly cache = new Map<string, CacheEntry>();

  // 默认缓存时间：60 秒
  private readonly ttl = 60 * 1000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // 只缓存 GET 请求
    // POST/PUT/DELETE 等写操作不应被缓存
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 生成缓存 key：URL + 查询参数
    // 例如：/api/cats?page=1&limit=10
    const cacheKey = request.originalUrl;

    // 检查缓存是否存在且未过期
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      this.logger.log(`缓存命中: ${cacheKey}`);
      // 直接返回缓存数据，跳过 Controller 方法执行
      return of(cached.data);
    }

    // 缓存未命中，执行 Controller 方法
    this.logger.log(`缓存未命中: ${cacheKey}`);

    return next.handle().pipe(
      // tap 操作符在数据流通过时执行副作用（存储到缓存）
      tap((data) => {
        this.cache.set(cacheKey, {
          data,
          expiry: Date.now() + this.ttl,
        });
        this.logger.log(`已缓存: ${cacheKey} (TTL: ${this.ttl}ms)`);
      }),
    );
  }

  /**
   * 清除指定 key 的缓存
   */
  invalidate(cacheKey: string) {
    this.cache.delete(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    this.cache.clear();
  }
}
