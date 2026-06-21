/**
 * JWT 策略
 *
 * 与 05-jwt-auth 类似，但 payload 中包含角色信息
 * validate 方法返回的用户对象包含 role 字段
 * role 会被挂载到 req.user.role，供 RolesGuard 使用
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'rbac-jwt-secret-key',
    });
  }

  /**
   * Token 验证通过后调用
   * 返回的用户对象包含 role 字段（RolesGuard 需要）
   */
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,     // 角色字段，RBAC 必须
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    return user;
  }
}
