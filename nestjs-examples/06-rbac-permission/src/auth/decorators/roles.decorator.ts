/**
 * @Roles() 角色装饰器
 *
 * 学习要点：
 * 1. SetMetadata 是 NestJS 提供的元数据设置工具
 *    它允许我们在路由或控制器上附加自定义数据
 * 2. Reflector 是 NestJS 提供的元数据读取工具
 *    Guard 中使用 Reflector 读取这些元数据
 * 3. 装饰器本质上就是一个「在类/方法上贴标签」的函数
 *
 * 使用方式：
 * @Roles('ADMIN')           - 仅管理员可访问
 * @Roles('MERCHANT', 'ADMIN') - 商家和管理员可访问
 *
 * 工作流程：
 * @Roles('ADMIN')
 *   ↓ SetMetadata 将 { roles: ['ADMIN'] } 存储到方法的元数据中
 *   ↓ Guard 通过 Reflector.get('roles', context) 读取
 *   ↓ 比对 user.role 是否在 roles 数组中
 */
import { SetMetadata } from '@nestjs/common';

// 元数据的 key，在 Guard 中使用相同的 key 来读取
// 使用常量避免硬编码字符串
export const ROLES_KEY = 'roles';

/**
 * Roles 装饰器工厂函数
 *
 * @param roles - 允许访问的角色列表
 * @returns MethodDecorator & ClassDecorator
 *
 * SetMetadata(ROLES_KEY, roles) 做的事情：
 * 在目标方法/类的元数据中设置 { 'roles': ['ADMIN', 'MERCHANT'] }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
