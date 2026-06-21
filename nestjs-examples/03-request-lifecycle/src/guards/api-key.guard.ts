/**
 * API Key 守卫
 *
 * 这是一个更简单的守卫示例，演示 @UseGuards() 装饰器的使用。
 *
 * 守卫的注册方式：
 * 1. @UseGuards(ApiKeyGuard) → 方法/控制器级别（本文件演示）
 * 2. APP_GUARD 提供者 → 全局级别（在模块中注册）
 * 3. app.useGlobalGuards() → 全局级别（在 main.ts 中注册）
 *
 * ExecutionContext 提供了丰富的上下文信息：
 * - switchToHttp()   → HTTP 请求上下文
 * - switchToRpc()    → RPC 上下文（微服务）
 * - switchToWs()     → WebSocket 上下文
 * - getHandler()     → 即将执行的路由处理方法
 * - getClass()       → 控制器类
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    const validKeys = ['secret-key-123', 'test-key-456'];

    if (!apiKey || !validKeys.includes(apiKey)) {
      console.log('[ApiKeyGuard] API Key 验证失败');
      throw new UnauthorizedException('无效的 API Key');
    }

    console.log('[ApiKeyGuard] API Key 验证通过 ✓');
    return true;
  }
}
