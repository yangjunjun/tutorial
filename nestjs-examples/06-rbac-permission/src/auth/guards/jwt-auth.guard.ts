/**
 * JWT 认证守卫
 *
 * 学习要点：
 * 1. 继承 AuthGuard('jwt') 并扩展功能
 * 2. 重写 canActivate 方法支持 @Public() 装饰器
 *    如果路由被标记为公开，直接跳过 JWT 验证
 * 3. 使用 Reflector 读取路由元数据
 *
 * 请求处理流程：
 * 1. 检查是否有 @Public() 标记 → 有则放行
 * 2. 调用父类 AuthGuard('jwt') 验证 Token
 * 3. Token 验证通过 → 用户信息挂载到 req.user
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 重写 canActivate 方法
   * 在标准 JWT 验证前检查是否为公开路由
   *
   * @param context - 执行上下文
   * @returns boolean | Promise<boolean> 是否允许访问
   */
  canActivate(context: ExecutionContext) {
    // 使用 Reflector 检查路由是否有 @Public() 装饰器
    // getAllAndOverride 会同时检查方法级和类级的元数据
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 当前方法
      context.getClass(),   // 当前类
    ]);

    // 如果是公开路由，直接放行，不进行 JWT 验证
    if (isPublic) {
      return true;
    }

    // 非公开路由，执行标准 JWT 验证
    return super.canActivate(context);
  }
}
