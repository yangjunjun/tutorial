/**
 * @Public() 公开路由装饰器
 *
 * 学习要点：
 * 1. 某些路由不需要认证（如公开商品列表、登录、注册）
 * 2. @Public() 在路由上标记 IS_PUBLIC_KEY 元数据
 * 3. JwtAuthGuard 检查此元数据，如为 true 则跳过认证
 *
 * 使用方式：
 * @Public()
 * @Get('public')
 * getPublicData() { ... }
 */
import { SetMetadata } from '@nestjs/common';

// 元数据 key 常量
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 装饰器
 * 标记路由为公开，无需 JWT 认证
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
