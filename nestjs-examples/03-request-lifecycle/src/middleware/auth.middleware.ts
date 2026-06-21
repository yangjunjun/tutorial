/**
 * 认证中间件（函数中间件）
 *
 * 函数中间件是定义中间件的更简单方式：
 * - 不需要创建类
 * - 不需要实现接口
 * - 就是一个普通的 Express 中间件函数
 *
 * 类中间件 vs 函数中间件：
 * | 特性         | 类中间件              | 函数中间件          |
 * |-------------|---------------------|-------------------|
 * | 依赖注入     | 支持（@Injectable）  | 不支持             |
 * | 代码组织     | 适合复杂逻辑         | 适合简单逻辑        |
 * | 注册方式     | configure() 中使用   | configure() 中使用  |
 * | 可测试性     | 更容易单元测试       | 相对简单            |
 *
 * NestJS 官方建议：
 * 当中间件不需要任何依赖注入时，优先使用函数中间件。
 */
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * API Key 认证中间件
 *
 * 检查请求头中是否包含有效的 x-api-key
 * 如果缺失或无效，抛出 UnauthorizedException
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];

  // 检查 API Key 是否存在
  if (!apiKey) {
    console.log('[AuthMiddleware] 缺少 x-api-key 请求头');
    throw new UnauthorizedException('缺少 API Key，请在请求头中提供 x-api-key');
  }

  // 验证 API Key（这里使用简单的硬编码验证）
  const validKeys = ['secret-key-123', 'test-key-456'];
  if (!validKeys.includes(apiKey as string)) {
    console.log(`[AuthMiddleware] 无效的 API Key: ${apiKey}`);
    throw new UnauthorizedException('无效的 API Key');
  }

  console.log('[AuthMiddleware] API Key 验证通过 ✓');

  // 验证通过，继续处理
  next();
}
