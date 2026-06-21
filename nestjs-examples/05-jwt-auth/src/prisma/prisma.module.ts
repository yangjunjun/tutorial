/**
 * Prisma 模块（Prisma Module）
 *
 * 学习要点：
 * 1. 设为全局模块（Global Module），所有模块都能注入 PrismaService
 *    使用 @Global() 装饰器标记
 * 2. 全局模块只需在 AppModule 中导入一次
 * 3. 必须在 exports 中导出 PrismaService
 *
 * 为什么使用全局模块？
 * - PrismaService 是几乎所有模块都需要的依赖
 * - 避免在每个模块中重复导入 PrismaModule
 * - 类似于 Angular 的 forRoot() 模式
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 标记为全局模块
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 必须导出才能被其他模块注入
})
export class PrismaModule {}
