/**
 * 角色守卫（Roles Guard）
 *
 * 学习要点：
 * 1. 实现 CanActivate 接口创建自定义守卫
 * 2. 使用 Reflector 读取 @Roles() 装饰器设置的元数据
 * 3. 对比用户角色和路由所需角色
 *
 * 角色守卫的执行时机：
 * JwtAuthGuard (验证身份) → RolesGuard (验证权限)
 *
 * 守卫链的执行顺序取决于 @UseGuards() 中参数的顺序：
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * 先执行 JwtAuthGuard，通过后再执行 RolesGuard
 *
 * 设计原则：
 * - 如果路由没有 @Roles() 装饰器，默认允许所有已认证用户访问
 * - 如果路由有 @Roles()，用户角色必须匹配其中之一
 * - ADMIN 角色具有所有权限（超级管理员）
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // 注入 Reflector 用于读取路由元数据
  constructor(private reflector: Reflector) {}

  /**
   * canActivate 方法
   * 返回 true 表示允许访问，返回 false 或抛出异常表示拒绝
   */
  canActivate(context: ExecutionContext): boolean {
    // 使用 Reflector 获取路由上的 roles 元数据
    // getAllAndOverride: 同时检查方法级和类级装饰器，方法级优先
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // 当前路由方法
        context.getClass(),   // 当前控制器类
      ],
    );

    // 如果路由没有设置 @Roles()，则默认放行
    // 这表示该路由只需要通过 JWT 认证即可
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 从请求对象中获取用户信息（由 JwtStrategy 设置）
    const { user } = context.switchToHttp().getRequest();

    // 如果没有用户信息（JWT 验证未通过），拒绝访问
    if (!user) {
      throw new ForbiddenException('未认证，无法访问');
    }

    // 检查用户角色是否在所需角色列表中
    // ADMIN 角色可以访问所有路由（超级管理员）
    const hasRole =
      user.role === 'ADMIN' || requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `需要以下角色之一: ${requiredRoles.join(', ')}。当前角色: ${user.role}`,
      );
    }

    return true;
  }
}
