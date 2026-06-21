/**
 * 受保护的路由控制器
 *
 * 学习要点：
 * 1. 使用 @UseGuards(JwtAuthGuard) 保护整个控制器
 *    所有路由都需要有效的 JWT Token 才能访问
 * 2. 通过 @Request() req 获取 req.user（由 JwtStrategy 设置）
 * 3. 可以在方法级别添加额外的守卫或装饰器
 */
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
// 类级别的 Guard 会应用到该控制器的所有路由
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  /**
   * 获取当前用户信息
   * GET /protected/info
   *
   * 需要 Authorization: Bearer <token> 请求头
   * req.user 由 JwtStrategy.validate() 设置
   */
  @Get('info')
  getUserInfo(@Request() req) {
    return {
      message: '认证成功！这是你的用户信息',
      data: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    };
  }

  /**
   * 获取机密数据（示例）
   * GET /protected/secret
   *
   * 演示只有认证用户才能访问的数据
   */
  @Get('secret')
  getSecretData(@Request() req) {
    return {
      message: `你好 ${req.user.username}，这是机密数据`,
      data: {
        secret: '这是只有登录用户才能看到的秘密信息 🤫',
        serverTime: new Date().toISOString(),
      },
    };
  }
}
