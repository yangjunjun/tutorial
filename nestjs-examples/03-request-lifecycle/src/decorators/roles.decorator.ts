/**
 * @Roles() 自定义装饰器
 *
 * 这是一个组合装饰器的经典示例：
 * 1. SetMetadata() 将元数据附加到方法/类上
 * 2. RolesGuard 通过 Reflector 读取这个元数据
 *
 * SetMetadata(key, value)：
 * - NestJS 内置的元数据存储工具
 * - 将 key-value 对存储到装饰目标上
 * - 可以被 Reflector 读取
 *
 * 这种"装饰器存元数据 + 守卫读元数据"的模式在 NestJS 中非常常见：
 * - @Roles() + RolesGuard → 角色授权
 * - @Throttle() + ThrottlerGuard → 速率限制
 * - @Public() + JwtAuthGuard → 标记公开路由
 */
import { SetMetadata } from '@nestjs/common';

/**
 * @Roles() 装饰器
 *
 * 使用方式：@Roles('admin', 'editor')
 *
 * 内部调用 SetMetadata('roles', ['admin', 'editor'])
 * 将角色列表存储为元数据，key 为 'roles'
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
