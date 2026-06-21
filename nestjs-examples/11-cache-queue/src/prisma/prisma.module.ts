/**
 * Prisma 全局模块
 *
 * 所有需要访问数据库的模块都可以通过依赖注入使用 PrismaService
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
