/**
 * 角色守卫（Guard）
 *
 * 守卫在中间件之后、拦截器之前执行。
 * 守卫的唯一职责：**授权决策**（决定请求是否可以继续）。
 *
 * 守卫实现 CanActivate 接口：
 * - canActivate() 返回 true → 请求继续
 * - canActivate() 返回 false → 抛出 ForbiddenException
 * - 也可以直接抛出异常
 *
 * 为什么用守卫而不是中间件做授权？
 * 1. 守卫可以访问 Reflector，读取装饰器元数据（如 @Roles('admin')）
 * 2. 守卫可以精确到控制器方法级别
 * 3. 中间件不知道即将执行的路由处理器是什么
 *
 * Reflector：
 * NestJS 提供的工具类，用于读取装饰器通过 SetMetadata 存储的元数据。
 * 例如读取 @Roles('admin') 存储的角色要求。
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  // 注入 Reflector 用于读取元数据
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 使用 Reflector 读取 @Roles() 装饰器设置的角色要求
    // 'roles' 是元数据的 key，与 @Roles() 中 SetMetadata 的 key 对应
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      // 从方法级别读取（优先级高）
      context.getHandler(),
      // 从控制器类级别读取（优先级低）
      context.getClass(),
    ]);

    // 如果没有设置 @Roles()，说明不需要角色检查，直接放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 从请求头中获取用户角色
    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'];

    console.log(`[RolesGuard] 需要角色: [${requiredRoles.join(', ')}], 当前角色: ${userRole || '未设置'}`);

    // 检查用户角色是否在要求的角色列表中
    const hasRole = requiredRoles.some((role) => role === userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `需要以下角色之一: ${requiredRoles.join(', ')}。当前角色: ${userRole || '未设置'}`,
      );
    }

    return true;
  }
}
