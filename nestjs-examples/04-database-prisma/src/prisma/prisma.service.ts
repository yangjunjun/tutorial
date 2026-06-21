/**
 * Prisma 服务
 *
 * 这个服务继承 PrismaClient 并实现 NestJS 的生命周期钩子：
 *
 * - OnModuleInit: 模块初始化时连接数据库
 * - OnModuleDestroy: 模块销毁时断开连接
 *
 * 为什么不直接注入 PrismaClient？
 * 1. 需要在应用启动时建立数据库连接
 * 2. 需要在应用关闭时优雅地断开连接
 * 3. 可以在此扩展自定义方法（如软删除、分页等）
 *
 * PrismaClient 的生命周期：
 * - $connect()    → 建立数据库连接
 * - $disconnect() → 断开数据库连接
 * - 连接是惰性的：首次查询时自动连接，也可以手动调用 $connect()
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * 模块初始化时自动连接数据库
   * NestJS 会在所有模块加载完成后调用此方法
   */
  async onModuleInit() {
    console.log('[PrismaService] 正在连接数据库...');
    await this.$connect();
    console.log('[PrismaService] 数据库连接成功 ✓');
  }

  /**
   * 模块销毁时断开数据库连接
   * 确保应用关闭时不会留下悬空的数据库连接
   */
  async onModuleDestroy() {
    console.log('[PrismaService] 正在断开数据库连接...');
    await this.$disconnect();
    console.log('[PrismaService] 数据库连接已断开 ✓');
  }
}
