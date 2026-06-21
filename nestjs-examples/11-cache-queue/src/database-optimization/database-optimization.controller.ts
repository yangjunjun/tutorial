/**
 * 数据库优化控制器 - 暴露优化演示接口
 *
 * 通过 HTTP 接口直观对比优化前后的性能差异
 * 建议配合查看控制台日志，了解具体的 SQL 执行情况
 */
import { Controller, Get, Query, Logger } from '@nestjs/common';
import { DatabaseOptimizationService } from './examples.service';

@Controller('optimization')
export class DatabaseOptimizationController {
  private readonly logger = new Logger(DatabaseOptimizationController.name);

  constructor(
    private readonly optimizationService: DatabaseOptimizationService,
  ) {}

  /**
   * GET /optimization/n-plus-one - N+1 问题演示
   *
   * 对比这个接口和 /optimization/solved 的响应时间
   * 控制台会输出查询次数
   */
  @Get('n-plus-one')
  async demonstrateNPlusOne() {
    this.logger.log('演示 N+1 问题...');
    return this.optimizationService.demonstrateNPlusOne();
  }

  /**
   * GET /optimization/solved - N+1 问题解决方案
   *
   * 使用 include 预加载关联数据
   * 查询次数从 N+1 降低到 1-2 次
   */
  @Get('solved')
  async demonstrateSolved() {
    this.logger.log('演示 N+1 解决方案...');
    return this.optimizationService.demonstrateSolved();
  }

  /**
   * GET /optimization/cursor-pagination - 游标分页
   *
   * 查询参数：
   * - limit: 每页数量（默认5）
   * - cursor: 游标值（上一页返回的 nextCursor）
   *
   * 首次: GET /optimization/cursor-pagination?limit=5
   * 翻页: GET /optimization/cursor-pagination?limit=5&cursor=5
   */
  @Get('cursor-pagination')
  async cursorPagination(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.optimizationService.cursorPagination(
      parseInt(limit || '5'),
      cursor ? parseInt(cursor) : undefined,
    );
  }

  /**
   * GET /optimization/batch - 批量操作演示
   *
   * 依次演示：createMany、updateMany、deleteMany
   * 查看返回值中的耗时对比
   */
  @Get('batch')
  async batchOperations() {
    this.logger.log('演示批量操作...');
    return this.optimizationService.batchOperations();
  }
}
