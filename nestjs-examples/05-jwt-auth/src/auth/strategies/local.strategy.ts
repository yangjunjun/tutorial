/**
 * Local 策略（Local Strategy）
 *
 * 学习要点：
 * 1. LocalStrategy 用于用户名/密码验证
 * 2. 默认从请求体中读取 username 和 password 字段
 * 3. validate() 方法返回的用户对象会挂载到 request.user
 * 4. 通常配合 AuthGuard('local') 在登录接口使用
 *
 * 工作流程：
 * 登录请求 → AuthGuard('local') → LocalStrategy.validate(username, password) → req.user
 *
 * 注意：LocalStrategy 只负责验证凭据，不负责签发 Token
 *       签发 Token 的逻辑在 Controller 中完成
 */
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // 可以自定义 username 和 password 的字段名
    // 例如：super({ usernameField: 'email' }) 用邮箱登录
    super();
  }

  /**
   * Passport 会自动从请求体提取 username 和 password 传入此方法
   *
   * @param username - 用户名（默认字段名）
   * @param password - 密码（默认字段名）
   * @returns 验证通过返回用户对象，失败抛出 UnauthorizedException
   *
   * 如果抛出异常，AuthGuard 会自动返回 401 响应
   * 如果返回用户对象，会被挂载到 request.user
   */
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }
}
