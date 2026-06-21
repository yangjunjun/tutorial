/**
 * 数据库优化示例服务 - 演示常见性能问题和解决方案
 *
 * 学习点：
 * 1. N+1 问题：最常见的 ORM 性能陷阱
 * 2. 解决方案：使用 Prisma 的 include/select 预加载关联数据
 * 3. 游标分页：高性能的分页方式
 * 4. 批量操作：使用 createMany 减少数据库交互次数
 * 5. 索引优化：理解索引如何加速查询
 *
 * ╔════════════════════════════════════════════════════════════╗
 * ║  N+1 问题详解                                              ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║  问题：查询N条订单，每条订单再查1次用户                      ║
 * ║  SQL 执行次数：1（查订单）+ N（查用户）= N+1                ║
 * ║                                                            ║
 * ║  例如有100条订单：                                          ║
 * ║  SELECT * FROM orders;            -- 1次查询               ║
 * ║  SELECT * FROM users WHERE id=1;  -- 第1条订单的用户        ║
 * ║  SELECT * FROM users WHERE id=2;  -- 第2条订单的用户        ║
 * ║  ...                                                      ║
 * ║  SELECT * FROM users WHERE id=100;-- 第100条订单的用户      ║
 * ║  总共 101 次数据库查询！                                    ║
 * ║                                                            ║
 * ║  解决方案：使用 JOIN 或 include                             ║
 * ║  SELECT orders.*, users.* FROM orders                      ║
 * ║  JOIN users ON orders.userId = users.id;                   ║
 * ║  总共只需要 1 次查询！                                      ║
 * ╚════════════════════════════════════════════════════════════╝
 *
 * ╔════════════════════════════════════════════════════════════╗
 * ║  索引优化说明                                              ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║  索引就像书的目录，帮助数据库快速定位数据                    ║
 * ║                                                            ║
 * ║  什么时候需要索引：                                         ║
 * ║  - WHERE 条件中的字段                                       ║
 * ║  - ORDER BY 排序的字段                                      ║
 * ║  - JOIN 关联的字段                                          ║
 * ║  - 高选择性字段（值分布均匀，如用户ID）                      ║
 * ║                                                            ║
 * ║  什么时候不需要索引：                                       ║
 * ║  - 数据量很小的表（全表扫描比索引更快）                      ║
 * ║  - 低选择性字段（如性别，只有男/女两个值）                   ║
 * ║  - 很少用于查询条件的字段                                    ║
 * ║                                                            ║
 * ║  索引的代价：                                               ║
 * ║  - 占用额外磁盘空间                                         ║
 * ║  - 插入/更新时需要维护索引（降低写性能）                     ║
 * ╚════════════════════════════════════════════════════════════╝
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 演示 N+1 问题
   *
   * 先查询所有订单，再逐个查询每个订单的用户信息
   * 观察控制台输出的查询次数
   */
  async demonstrateNPlusOne() {
    this.logger.warn('===== N+1 问题演示 =====');
    this.logger.warn('注意：这是一个反模式，仅用于教学演示');

    const startTime = Date.now();

    // 第一步：查询所有订单（1次查询）
    const orders = await this.prisma.order.findMany({
      take: 10,  // 限制10条用于演示
    });

    this.logger.log(`查询到 ${orders.length} 条订单`);

    // 第二步：对每条订单单独查询用户信息（N次查询）
    // ❌ 这就是 N+1 问题！
    const ordersWithUsers = [];
    for (const order of orders) {
      // 每次循环都会执行一次 SELECT * FROM User WHERE id = ?
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
      });
      ordersWithUsers.push({
        ...order,
        user,
      });
    }

    const elapsed = Date.now() - startTime;

    this.logger.warn(
      `N+1 问题：共执行 ${orders.length + 1} 次数据库查询，耗时 ${elapsed}ms`,
    );

    return {
      problem: 'N+1 问题',
      totalQueries: orders.length + 1,
      elapsedMs: elapsed,
      orders: ordersWithUsers,
      explanation: '每条订单单独查询用户，导致 N+1 次数据库查询',
    };
  }

  /**
   * 演示 N+1 问题的解决方案
   *
   * 使用 Prisma 的 include 一次性加载关联数据
   * 只需 1 次查询（Prisma 内部使用 JOIN 或批量查询优化）
   */
  async demonstrateSolved() {
    this.logger.log('===== N+1 问题解决方案 =====');

    const startTime = Date.now();

    // ✅ 使用 include 预加载关联数据
    // Prisma 会自动优化为最少的查询次数
    // 在 SQLite 中通常是 2 次查询（1次查orders + 1次查users）
    // 在支持 JOIN 的场景中可能只有 1 次查询
    const orders = await this.prisma.order.findMany({
      take: 10,
      include: {
        user: true,  // 预加载用户信息
      },
    });

    const elapsed = Date.now() - startTime;

    this.logger.log(
      `优化后：仅执行 1-2 次数据库查询，耗时 ${elapsed}ms`,
    );

    return {
      solution: '使用 include 预加载',
      totalQueries: '1-2',
      elapsedMs: elapsed,
      orders,
      explanation:
        'Prisma 的 include 会自动优化查询，用最少次数获取所有数据',
    };
  }

  /**
   * 游标分页实现
   *
   * 与偏移分页的对比：
   *
   * 偏移分页 (OFFSET/LIMIT)：
   *   - 第1页: SELECT * FROM products LIMIT 10 OFFSET 0
   *   - 第2页: SELECT * FROM products LIMIT 10 OFFSET 10
   *   - 第100页: SELECT * FROM products LIMIT 10 OFFSET 990  ← 需要扫描990行再丢弃！
   *   - 问题：页码越大越慢
   *
   * 游标分页 (CURSOR/LIMIT)：
   *   - 首次: SELECT * FROM products WHERE id > 0 LIMIT 11
   *   - 翻页: SELECT * FROM products WHERE id > {lastId} LIMIT 11
   *   - 无论第几页，查询时间都一样（因为使用了索引）
   *   - 前提：cursor 字段必须有索引
   */
  async cursorPagination(limit: number = 5, cursor?: number) {
    this.logger.log(`游标分页: limit=${limit}, cursor=${cursor || '无(首次)'}`);

    const products = await this.prisma.product.findMany({
      take: limit + 1,  // 多取一条，用于判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,  // 有游标时跳过游标本身
      orderBy: { id: 'asc' },
      // 使用 select 只返回需要的字段（减少数据传输量）
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
      },
    });

    // 判断是否有下一页
    const hasMore = products.length > limit;
    if (hasMore) {
      products.pop();  // 移除多取的那一条
    }

    // 下一页游标 = 当前页最后一条记录的 ID
    const nextCursor = hasMore ? products[products.length - 1].id : null;

    return {
      data: products,
      pagination: {
        hasMore,
        nextCursor,
        limit,
        // 使用说明：
        // 1. 首次请求不传 cursor
        // 2. 如果 hasMore 为 true，使用 nextCursor 请求下一页
        // 3. 示例: GET /optimization/cursor-pagination?limit=5&cursor=10
      },
    };
  }

  /**
   * 批量操作演示
   *
   * 学习点：
   * 1. createMany vs 循环 create
   *    - createMany: 生成一条 INSERT ... VALUES (...), (...), (...) SQL
   *    - 循环 create: 生成 N 条 INSERT SQL
   *    - createMany 效率高很多（减少网络往返和事务开销）
   *
   * 2. updateMany: 批量更新
   * 3. deleteMany: 批量删除
   *
   * 性能对比：
   * - 插入 100 条记录：
   *   循环 create: ~100次数据库交互
   *   createMany:  ~1次数据库交互
   */
  async batchOperations() {
    this.logger.log('===== 批量操作演示 =====');

    const results: any = {};

    // ===== 演示1: 批量创建 (createMany) =====
    const createStart = Date.now();

    // ❌ 反模式：循环创建（不要这样做）
    // for (let i = 0; i < 10; i++) {
    //   await this.prisma.product.create({ data: { ... } });
    // }

    // ✅ 正确做法：批量创建
    const batchResult = await this.prisma.product.createMany({
      data: [
        { name: '批量商品A', price: 100, stock: 50, category: 'batch-test' },
        { name: '批量商品B', price: 200, stock: 30, category: 'batch-test' },
        { name: '批量商品C', price: 300, stock: 20, category: 'batch-test' },
        { name: '批量商品D', price: 400, stock: 10, category: 'batch-test' },
        { name: '批量商品E', price: 500, stock: 5, category: 'batch-test' },
      ],
      // skipDuplicates: true 仅在 PostgreSQL/MySQL 中支持，SQLite 不支持
      // 在 PostgreSQL/MySQL 中可以取消注释以跳过重复记录
    });

    results.batchCreate = {
      count: batchResult.count,
      elapsedMs: Date.now() - createStart,
      explanation: '使用 createMany 一次插入多条记录',
    };

    this.logger.log(`批量创建: 插入 ${batchResult.count} 条记录`);

    // ===== 演示2: 批量更新 (updateMany) =====
    const updateStart = Date.now();

    // 批量更新所有 batch-test 分类的商品价格（涨价10%）
    const updateResult = await this.prisma.product.updateMany({
      where: { category: 'batch-test' },
      data: {
        price: { increment: 10 },  // 每个商品涨价10元
      },
    });

    results.batchUpdate = {
      count: updateResult.count,
      elapsedMs: Date.now() - updateStart,
      explanation: '使用 updateMany 批量更新符合条件的记录',
    };

    this.logger.log(`批量更新: 更新了 ${updateResult.count} 条记录`);

    // ===== 演示3: 批量删除 (deleteMany) =====
    const deleteStart = Date.now();

    const deleteResult = await this.prisma.product.deleteMany({
      where: { category: 'batch-test' },
    });

    results.batchDelete = {
      count: deleteResult.count,
      elapsedMs: Date.now() - deleteStart,
      explanation: '使用 deleteMany 批量删除符合条件的记录',
    };

    this.logger.log(`批量删除: 删除了 ${deleteResult.count} 条记录`);

    return {
      title: '批量操作演示',
      operations: results,
      summary:
        'createMany/updateMany/deleteMany 比循环单条操作效率高很多，' +
        '因为它们只需要一次数据库交互',
    };
  }
}
