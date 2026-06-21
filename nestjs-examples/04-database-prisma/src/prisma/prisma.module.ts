/**
 * Prisma 全局模块
 *
 * 使用 @Global() 装饰器将模块标记为全局模块。
 * 全局模块只需在根模块中导入一次，其导出的 Provider 可以在任何模块中使用。
 *
 * 全局模块的使用场景：
 * - 数据库服务（PrismaService）
 * - 配置服务（ConfigService）
 * - 日志服务（LoggerService）
 * - 缓存服务（CacheService）
 *
 * 注意：不要过度使用全局模块！
 * 大部分 Provider 应该通过模块的 imports/exports 来管理依赖关系。
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 标记为全局模块
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 导出 PrismaService 供其他模块使用
})
export class PrismaModule {}
