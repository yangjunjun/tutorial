/**
 * JWT 策略（JWT Strategy）
 *
 * 学习要点：
 * 1. PassportStrategy 是 NestJS 对 Passport 的封装
 * 2. Strategy 来自 passport-jwt 包
 * 3. ExtractJwt.fromAuthHeaderAsBearerToken() 从 Authorization: Bearer <token> 提取 Token
 * 4. validate() 方法在 Token 验证通过后被调用
 *    - 参数 payload 是 JWT 解码后的载荷（不包含签名部分）
 *    - 返回值会被挂载到 request.user
 *
 * 工作流程：
 * 请求 → ExtractJwt 提取 Token → passport-jwt 验证签名和过期时间 → validate(payload) → req.user
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // 调用父类构造函数，配置 JWT 策略
    super({
      // jwtFromRequest: 定义如何从请求中提取 JWT Token
      // fromAuthHeaderAsBearerToken: 从 "Authorization: Bearer <token>" 中提取
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ignoreExpiration: 是否忽略 Token 过期
      // 生产环境务必设为 false（或省略，默认就是 false）
      ignoreExpiration: false,

      // secretOrKey: 用于验证 Token 签名的密钥
      // 必须和 JwtModule.register() 中的 secret 一致
      // 生产环境应使用环境变量
      secretOrKey: 'jwt-secret-key-change-in-production',
    });
  }

  /**
   * Token 验证通过后调用此方法
   *
   * @param payload - JWT 解码后的载荷
   *   例如：{ sub: 1, username: 'test', iat: ..., exp: ... }
   *
   * @returns 返回值会被自动挂载到 request.user
   *   后续路由可通过 @Request() req → req.user 获取
   *
   * 注意：这里可以做额外的用户验证（如检查用户是否被禁用）
   */
  async validate(payload: any) {
    // 通过 payload.sub（用户ID）查询数据库获取最新用户信息
    const user = await this.authService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    // 返回的用户对象会挂载到 req.user
    return user;
  }
}
