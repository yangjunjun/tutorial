/**
 * Prisma 服务（Prisma Service）
 *
 * 学习要点：
 * 1. PrismaService 继承 PrismaClient，获得完整的数据库操作能力
 * 2. 实现 OnModuleInit 接口，在模块初始化时连接数据库
 * 3. enableShutdownHooks 确保应用关闭时正确断开数据库连接
 *
 * Prisma Client 常用方法：
 * - findUnique(): 根据唯一字段查找单条记录
 * - findFirst(): 查找第一条匹配记录
 * - findMany(): 查找多条记录
 * - create(): 创建记录
 * - update(): 更新记录
 * - delete(): 删除记录
 * - upsert(): 存在则更新，不存在则创建
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * 模块初始化时连接数据库
   * NestJS 生命周期钩子：在模块所有依赖注入完成后调用
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 模块销毁时断开数据库连接
   * 确保不会有未关闭的连接导致内存泄漏
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
