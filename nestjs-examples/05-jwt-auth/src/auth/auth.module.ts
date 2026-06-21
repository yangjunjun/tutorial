/**
 * 认证模块（Auth Module）
 *
 * 学习要点：
 * 1. JwtModule.register() 配置 JWT 签发参数
 *    - secret: 签名密钥（生产环境使用环境变量）
 *    - signOptions.expiresIn: Token 有效期
 * 2. PassportModule 注册 Passport 框架
 * 3. 所有 Strategy 和 Guard 都需要在 providers 中注册
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // 引入 Prisma 模块用于数据库操作
    PrismaModule,

    // Passport 模块注册
    // defaultStrategy 可以设置默认策略，这里使用 jwt
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 模块配置
    JwtModule.register({
      // 签名密钥 - 生产环境必须使用环境变量！
      // 推荐长度：至少 32 个随机字符
      secret: 'jwt-secret-key-change-in-production',

      signOptions: {
        // Token 有效期
        // 常见设置：'15m'（15分钟）、'1h'（1小时）、'7d'（7天）
        // 安全建议：短期 Token + Refresh Token 机制
        expiresIn: '1h',
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,    // JWT 策略 - 验证 Token
    LocalStrategy,  // Local 策略 - 验证用户名密码
  ],
  controllers: [AuthController],
  exports: [AuthService], // 导出 AuthService 供其他模块使用
})
export class AuthModule {}
