/**
 * 根模块
 *
 * 学习要点：
 * 1. APP_GUARD 注册全局守卫
 *    全局 JWT 守卫会自动应用到所有路由
 * 2. 配合 @Public() 装饰器可以跳过认证
 * 3. RolesGuard 在需要权限控制的地方使用 @UseGuards 局部应用
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  providers: [
    // 全局注册 JWT 守卫
    // 所有路由默认需要 JWT 认证
    // 使用 @Public() 装饰器可以跳过
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
