/**
 * JWT 认证守卫（JWT Auth Guard）
 *
 * 学习要点：
 * 1. AuthGuard('jwt') 是 NestJS 提供的内置守卫
 *    它会自动调用 JwtStrategy 进行验证
 * 2. 继承 AuthGuard 可以自定义行为
 * 3. 使用方式：@UseGuards(JwtAuthGuard)
 *
 * AuthGuard 的工作原理：
 * 1. 从请求中提取 Token（由 Strategy 配置的 ExtractJwt 决定）
 * 2. 验证 Token 签名和过期时间
 * 3. 调用 Strategy 的 validate() 方法
 * 4. validate() 返回值挂载到 request.user
 * 5. 任何一步失败都会抛出 401 Unauthorized
 *
 * 什么时候使用 Guard vs Middleware？
 * - Guard：与路由逻辑紧密相关的认证/授权
 * - Middleware：通用的请求处理（日志、CORS 等）
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // AuthGuard('jwt') 会自动查找名为 'jwt' 的 Passport Strategy
  // 即我们定义的 JwtStrategy

  /**
   * 可以重写 handleRequest 来自定义验证后的处理
   * 默认实现：如果 err 存在或 user 为空，抛出 UnauthorizedException
   *
   * 示例：
   * handleRequest(err, user, info) {
   *   if (err || !user) {
   *     throw err || new UnauthorizedException();
   *   }
   *   return user;
   * }
   */
}
