/**
 * @CurrentUser() 参数装饰器
 *
 * 学习要点：
 * 1. createParamDecorator 用于创建自定义参数装饰器
 *    类似内置的 @Body()、@Param()、@Query()
 * 2. 参数装饰器从请求对象中提取数据并注入到方法参数
 * 3. 可以指定提取请求对象中的特定字段
 *
 * 使用方式：
 * @CurrentUser() user        - 获取完整用户对象
 * @CurrentUser('id') userId  - 只获取用户ID
 * @CurrentUser('username')   - 只获取用户名
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser 参数装饰器
 *
 * @param data - 可选，指定要从 user 对象中提取的字段名
 * @param ctx - 执行上下文，包含 request 对象
 *
 * ExecutionContext 是一个抽象层：
 * - HTTP 请求中，ctx.switchToHttp() 返回 HTTP 上下文
 * - WebSocket 中，ctx.switchToWs() 返回 WebSocket 上下文
 * - RPC 中，ctx.switchToRpc() 返回 RPC 上下文
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 获取 HTTP 请求对象
    const request = ctx.switchToHttp().getRequest();

    // request.user 由 JwtStrategy.validate() 设置
    const user = request.user;

    // 如果指定了 data（字段名），只返回该字段
    // 例如 @CurrentUser('id') → 只返回 user.id
    return data ? user?.[data] : user;
  },
);
