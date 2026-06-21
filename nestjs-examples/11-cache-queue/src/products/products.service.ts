/**
 * 商品服务 - 缓存策略的完整演示
 *
 * 学习点：
 * 1. Cache-Aside 模式：先查缓存，未命中再查数据库
 * 2. 缓存键设计：使用查询参数的哈希作为缓存键
 * 3. 缓存失效策略：数据变更时删除相关缓存
 * 4. 热门商品缓存：更长的 TTL，因为热门商品查询频繁
 * 5. 游标分页：比偏移分页更高效的分页方式
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomCacheService } from '../cache/custom-cache.service';

// 缓存键前缀常量（集中管理，防止键名冲突）
const CACHE_PREFIX = {
  PRODUCT_LIST: 'product:list:',     // 商品列表
  PRODUCT_DETAIL: 'product:detail:', // 商品详情
  HOT_PRODUCTS: 'product:hot',       // 热门商品
  SEARCH: 'product:search:',         // 搜索结果
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CustomCacheService,
  ) {}

  /**
   * 查询所有商品 - 带缓存
   *
   * Cache-Aside 模式实现：
   * 1. 生成缓存键（基于查询参数的哈希）
   * 2. 检查缓存：命中则直接返回
   * 3. 缓存未命中：查询数据库
   * 4. 将结果存入缓存（设置 TTL）
   * 5. 返回结果
   *
   * 缓存键设计：
   * - 相同查询参数产生相同缓存键
   * - 不同分页、排序产生不同的缓存键
   * - 格式：product:list:{page}:{pageSize}:{sortBy}
   */
  async findAll(page: number = 1, pageSize: number = 10, sortBy: string = 'createdAt') {
    // 第一步：生成缓存键
    const cacheKey = `${CACHE_PREFIX.PRODUCT_LIST}${page}:${pageSize}:${sortBy}`;

    // 第二步：检查缓存
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`商品列表缓存命中: ${cacheKey}`);
      return { ...cached, _fromCache: true };  // 标记来源方便调试
    }

    // 第三步：缓存未命中，查询数据库
    this.logger.log(`商品列表缓存未命中，查询数据库: ${cacheKey}`);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    const result = {
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    // 第四步：写入缓存（TTL 5分钟）
    await this.cache.set(cacheKey, result, 5 * 60 * 1000);

    return { ...result, _fromCache: false };
  }

  /**
   * 查询单个商品 - 带缓存和浏览量统计
   *
   * 缓存策略：
   * - 单个商品使用独立缓存键：product:detail:{id}
   * - TTL 比列表更长（15分钟），因为单个商品变化较少
   * - 浏览量增加不影响缓存（浏览量是"弱一致性"数据）
   */
  async findOne(id: number) {
    const cacheKey = `${CACHE_PREFIX.PRODUCT_DETAIL}${id}`;

    // 检查缓存
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`商品详情缓存命中: ${cacheKey}`);

      // 即使缓存命中也要增加浏览量（异步执行，不影响响应速度）
      this.prisma.product.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});  // 忽略错误，不影响主流程

      return { ...cached, _fromCache: true };
    }

    // 查询数据库
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`商品 ${id} 不存在`);
    }

    // 增加浏览量
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 写入缓存（TTL 15分钟）
    await this.cache.set(cacheKey, product, 15 * 60 * 1000);

    return { ...product, _fromCache: false };
  }

  /**
   * 创建商品 - 写操作后失效缓存
   *
   * 缓存失效策略：
   * 1. 执行数据库写操作
   * 2. 删除所有商品列表缓存（因为列表内容变了）
   * 3. 不需要更新缓存（Cache-Aside 模式下次读取时会自动加载）
   *
   * 为什么删除而非更新缓存？
   * - 并发安全：多个请求同时更新缓存可能产生竞态条件
   * - 简单可靠：删除后下次读取时自然会从数据库加载最新数据
   * - 避免浪费：如果更新了缓存但没有人读取，就是白白消耗资源
   */
  async create(data: {
    name: string;
    price: number;
    stock: number;
    category?: string;
    description?: string;
  }) {
    const product = await this.prisma.product.create({ data });

    // 删除所有列表相关缓存
    // 使用模式匹配删除：product:list:* 会删除所有分页的列表缓存
    await this.cache.delPattern(`${CACHE_PREFIX.PRODUCT_LIST}*`);
    // 删除热门商品缓存（新商品可能影响排名）
    await this.cache.del(CACHE_PREFIX.HOT_PRODUCTS);

    this.logger.log(`商品已创建: ${product.name}, 相关缓存已失效`);
    return product;
  }

  /**
   * 更新商品 - 精确失效相关缓存
   *
   * 更新操作需要失效：
   * 1. 该商品的详情缓存
   * 2. 所有商品列表缓存
   * 3. 热门商品缓存
   */
  async update(id: number, data: Partial<{
    name: string;
    price: number;
    stock: number;
    category: string;
    description: string;
  }>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`商品 ${id} 不存在`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    // 删除该商品的详情缓存
    await this.cache.del(`${CACHE_PREFIX.PRODUCT_DETAIL}${id}`);
    // 删除所有列表缓存
    await this.cache.delPattern(`${CACHE_PREFIX.PRODUCT_LIST}*`);
    // 删除热门商品缓存
    await this.cache.del(CACHE_PREFIX.HOT_PRODUCTS);
    // 删除搜索缓存
    await this.cache.delPattern(`${CACHE_PREFIX.SEARCH}*`);

    this.logger.log(`商品已更新: ${updated.name}, 相关缓存已失效`);
    return updated;
  }

  /**
   * 删除商品 - 失效缓存
   */
  async remove(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`商品 ${id} 不存在`);
    }

    await this.prisma.product.delete({ where: { id } });

    // 失效所有相关缓存
    await this.cache.del(`${CACHE_PREFIX.PRODUCT_DETAIL}${id}`);
    await this.cache.delPattern(`${CACHE_PREFIX.PRODUCT_LIST}*`);
    await this.cache.del(CACHE_PREFIX.HOT_PRODUCTS);

    this.logger.log(`商品已删除: ${product.name}, 相关缓存已失效`);
    return { message: '商品已删除' };
  }

  /**
   * 获取热门商品 - 更长的缓存 TTL
   *
   * 热门商品的特征：
   * - 查询频率高（首页推荐、侧边栏展示）
   * - 数据变化不频繁（排名不会每秒变化）
   * - 适合较长的缓存时间（10分钟）
   *
   * 排序规则：viewCount（浏览量）+ salesCount（销量）加权
   */
  async getHotProducts(limit: number = 10) {
    const cacheKey = CACHE_PREFIX.HOT_PRODUCTS;

    // 检查缓存
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.log('热门商品缓存命中');
      return { ...cached, _fromCache: true };
    }

    // 查询数据库：按浏览量和销量综合排序
    // 热度计算公式：viewCount * 1 + salesCount * 10
    // 销量权重更高，因为购买行为比浏览行为更有价值
    const allProducts = await this.prisma.product.findMany({
      orderBy: { salesCount: 'desc' },
      take: limit,
    });

    // 在应用层计算热度排序（SQLite 不支持复杂排序表达式）
    const hotProducts = allProducts.sort((a, b) => {
      const scoreA = a.viewCount + a.salesCount * 10;
      const scoreB = b.viewCount + b.salesCount * 10;
      return scoreB - scoreA;  // 降序
    });

    const result = { data: hotProducts };

    // 写入缓存（TTL 10分钟 - 热门商品用更长的缓存时间）
    await this.cache.set(cacheKey, result, 10 * 60 * 1000);

    return { ...result, _fromCache: false };
  }

  /**
   * 搜索商品 - 游标分页 (Cursor-based Pagination)
   *
   * 游标分页 vs 偏移分页 (Offset Pagination)：
   *
   * ┌──────────────────────────────────────────────────────────┐
   * │  偏移分页 (OFFSET/LIMIT)                                 │
   * │  优点：实现简单，支持"跳到第N页"                           │
   * │  缺点：                                                 │
   * │    - 深分页慢：OFFSET 10000 需要扫描前10000行再丢弃       │
   * │    - 数据变动：翻页过程中插入/删除数据会导致重复或遗漏      │
   * │  适用：后台管理系统、数据量不大的场景                      │
   * ├──────────────────────────────────────────────────────────┤
   * │  游标分页 (CURSOR/LIMIT)                                 │
   * │  优点：                                                 │
   * │    - 性能稳定：无论第几页，查询时间都一样                  │
   * │    - 数据一致：不会因数据变动导致重复或遗漏                │
   * │  缺点：                                                 │
   * │    - 不支持"跳到第N页"                                   │
   * │    - 需要有唯一且有序的字段作为游标（通常是ID或时间戳）     │
   * │  适用：移动端瀑布流、无限滚动、实时数据流                  │
   * └──────────────────────────────────────────────────────────┘
   *
   * 游标分页工作原理：
   * 1. 首次请求：不传 cursor，返回前 N 条 + 下一页游标
   * 2. 翻页请求：传入上一次返回的 cursor，获取之后的 N 条
   * 3. 没有更多数据时，cursor 为 null
   */
  async searchProducts(query: string, limit: number = 10, cursor?: string) {
    const cacheKey = `${CACHE_PREFIX.SEARCH}${query}:${limit}:${cursor || 'start'}`;

    // 检查缓存
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`搜索缓存命中: ${cacheKey}`);
      return { ...cached, _fromCache: true };
    }

    // 构建查询条件
    const where = {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { category: { contains: query } },
      ],
    };

    // 执行游标分页查询
    const products = await this.prisma.product.findMany({
      where,
      take: limit + 1,  // 多取一条，用于判断是否有下一页
      cursor: cursor ? { id: parseInt(cursor) } : undefined,  // 游标定位
      skip: cursor ? 1 : 0,  // 有游标时跳过游标本身（避免重复）
      orderBy: { id: 'asc' },
    });

    // 判断是否有下一页
    const hasMore = products.length > limit;
    if (hasMore) {
      products.pop();  // 移除多取的那一条
    }

    // 生成下一页游标（最后一条记录的 ID）
    const nextCursor = hasMore && products.length > 0
      ? products[products.length - 1].id.toString()
      : null;

    const result = {
      data: products,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };

    // 写入缓存（搜索结果缓存时间较短，3分钟）
    await this.cache.set(cacheKey, result, 3 * 60 * 1000);

    return { ...result, _fromCache: false };
  }
}
