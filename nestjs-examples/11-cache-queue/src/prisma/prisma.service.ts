/**
 * Prisma 服务 - 封装数据库客户端
 *
 * 与项目10类似，提供全局可用的数据库访问服务
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('数据库连接已建立');

    // 记录慢查询
    this.$on('query' as never, (e: any) => {
      if (e.duration > 100) {
        this.logger.warn(`慢查询: ${e.query} (${e.duration}ms)`);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('数据库连接已断开');
  }
}
