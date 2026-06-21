/**
 * Prisma 服务 - 封装 PrismaClient 为 NestJS 服务
 *
 * 学习点：
 * 1. 继承 PrismaClient 使其可以直接注入使用
 * 2. 实现 OnModuleInit 在模块初始化时建立数据库连接
 * 3. 实现 OnModuleDestroy 在应用关闭时断开连接（优雅退出）
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // 日志级别配置：在生产环境中应该设置为 'error'
      log: [
        { level: 'query', emit: 'event' },  // 记录所有SQL查询（开发调试用）
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  // 模块初始化时连接数据库
  async onModuleInit() {
    await this.$connect();
    this.logger.log('数据库连接已建立');

    // 监听慢查询（超过100ms的查询）
    this.$on('query' as never, (e: any) => {
      if (e.duration > 100) {
        this.logger.warn(`慢查询警告: ${e.query} (${e.duration}ms)`);
      }
    });
  }

  // 应用关闭时断开数据库连接，防止连接泄漏
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('数据库连接已断开');
  }
}
