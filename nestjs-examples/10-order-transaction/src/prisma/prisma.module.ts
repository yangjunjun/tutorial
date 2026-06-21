/**
 * Prisma 全局模块
 *
 * 学习点：
 * 1. 使用 @Global() 装饰器使模块全局可用，无需在每个模块中重复导入
 * 2. 导出 PrismaService 使其他模块可以直接注入使用
 * 3. 数据库服务通常作为全局模块，因为几乎所有模块都需要访问数据库
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // 标记为全局模块，任何模块都可以直接注入 PrismaService
@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // 导出，让其他模块可以使用
})
export class PrismaModule {}
