/**
 * 根模块（App Module）
 *
 * 学习要点：
 * 1. AppModule 是应用的入口模块
 * 2. 导入 PrismaModule（全局模块，提供数据库访问）
 * 3. 导入 AuthModule（认证相关功能）
 * 4. ProtectedController 需要在此注册
 *
 * 模块注册顺序：
 * - PrismaModule 先导入（其他模块可能依赖它）
 * - 然后导入业务模块
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProtectedController } from './protected/protected.controller';

@Module({
  imports: [
    PrismaModule, // 全局数据库模块
    AuthModule,   // 认证模块
  ],
  controllers: [ProtectedController], // 受保护路由控制器
})
export class AppModule {}
