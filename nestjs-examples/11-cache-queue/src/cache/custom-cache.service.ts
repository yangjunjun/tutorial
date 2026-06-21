/**
 * 自定义缓存服务 - 封装内存缓存和 Redis 缓存
 *
 * 学习点：
 * 1. Cache-Aside（旁路缓存）模式的实现
 * 2. 内存缓存使用 Map 数据结构，适合开发环境
 * 3. Redis 缓存适合生产环境（分布式、持久化、支持过期策略）
 * 4. TTL（Time To Live）过期时间管理
 *
 * 缓存模式对比：
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Cache-Aside（旁路缓存）—— 本项目使用                    │
 * │  读：查缓存 → 未命中查DB → 存缓存                        │
 * │  写：更新DB → 删缓存                                    │
 * │  优点：按需缓存，不会缓存冷数据                           │
 * │  缺点：缓存未命中时有延迟（需查DB）                       │
 * ├─────────────────────────────────────────────────────────┤
 * │  Write-Through（穿透写入）                               │
 * │  写：同时写缓存和DB                                      │
 * │  优点：缓存数据始终与DB一致                               │
 * │  缺点：写操作延迟增加                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  Write-Behind（回写缓存）                                │
 * │  写：先写缓存，异步批量写DB                               │
 * │  优点：写操作极快                                         │
 * │  缺点：宕机可能丢数据                                     │
 * └─────────────────────────────────────────────────────────┘
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

// 缓存条目类型：包含值和过期时间
interface CacheEntry {
  value: any;
  expiresAt: number | null;  // null 表示永不过期
}

@Injectable()
export class CustomCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomCacheService.name);

  // ===== 内存缓存实现 =====
  // 使用 Map 作为内存存储
  // 生产环境中应该替换为 Redis（见下方注释）
  private readonly cache = new Map<string, CacheEntry>();

  // 定期清理过期缓存（每60秒检查一次）
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 启动定期清理任务，防止内存泄漏
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * 获取缓存值
   *
   * Cache-Aside 模式的第一步：检查缓存
   * - 如果缓存存在且未过期，直接返回（缓存命中）
   * - 如果缓存不存在或已过期，返回 null（缓存未命中）
   *
   * @param key 缓存键
   * @returns 缓存值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`缓存未命中: ${key}`);
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`缓存已过期并删除: ${key}`);
      return null;
    }

    this.logger.debug(`缓存命中: ${key}`);
    return entry.value as T;
  }

  /**
   * 设置缓存值
   *
   * Cache-Aside 模式的第二步：查询数据库后写入缓存
   *
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒），默认5分钟
   *
   * TTL 选择策略：
   * - 商品列表：5分钟（数据变化较频繁）
   * - 热门商品：10分钟（查询频繁，数据变化不频繁）
   * - 商品详情：15分钟（单个商品变化较少）
   * - 用户信息：30分钟（用户数据相对稳定）
   */
  async set(key: string, value: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiresAt });
    this.logger.debug(`缓存写入: ${key} (TTL: ${ttl / 1000}秒)`);
  }

  /**
   * 删除缓存
   *
   * Cache-Aside 模式的关键：数据更新时删除缓存（而非更新缓存）
   *
   * 为什么删除而非更新？
   * 1. 更新缓存可能产生并发问题（多个请求同时更新）
   * 2. 删除缓存更简单，下次读取时会重新加载
   * 3. 如果更新了数据但没人读取，更新缓存就是浪费资源
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`缓存删除: ${key}`);
  }

  /**
   * 按模式删除缓存（支持通配符）
   *
   * 使用场景：更新商品时，需要删除所有与该商品相关的缓存
   * 例如：delPattern('product:*') 删除所有商品相关缓存
   *
   * 注意：内存缓存遍历删除效率较低，Redis 的 SCAN + DEL 更高效
   */
  async delPattern(pattern: string): Promise<number> {
    // 将通配符模式转换为正则表达式
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.logger.debug(`按模式删除缓存: ${pattern}, 删除了 ${count} 个`);
    return count;
  }

  /**
   * 清理过期缓存条目
   * 定期调用，防止内存中堆积大量过期数据
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`清理了 ${cleaned} 个过期缓存条目`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 模块销毁时清理定时器
   */
  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/*
 * ===== Redis 缓存配置（生产环境） =====
 *
 * 安装依赖:
 *   pnpm add cache-manager-ioredis-yet
 *
 * 使用方式（在 cache.module.ts 中配置）:
 *
 *   import { CacheModule } from '@nestjs/cache-manager';
 *   import { redisStore } from 'cache-manager-ioredis-yet';
 *
 *   CacheModule.registerAsync({
 *     useFactory: async () => ({
 *       store: await redisStore({
 *         host: process.env.REDIS_HOST || 'localhost',
 *         port: parseInt(process.env.REDIS_PORT || '6379'),
 *         password: process.env.REDIS_PASSWORD,
 *         ttl: 300,  // 默认 TTL（秒）
 *       }),
 *     }),
 *     isGlobal: true,
 *   })
 *
 * Redis 相比内存缓存的优势：
 * 1. 分布式：多个服务实例共享同一份缓存
 * 2. 持久化：服务重启后缓存不丢失
 * 3. 内存管理：Redis 有完善的 LRU/LFU 淘汰策略
 * 4. 高级功能：支持发布订阅、Lua脚本、事务等
 */
