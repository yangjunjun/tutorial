/**
 * 应用入口
 *
 * WebSocket 应用的启动方式与普通 HTTP 应用相同。
 * WebSocket 网关由 NestJS 自动注册和管理。
 *
 * 启动后，以下端点可用：
 * - ws://localhost:3000/chat         - 聊天网关
 * - ws://localhost:3000/notification - 通知网关
 * - ws://localhost:3000/events       - 事件演示网关
 */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // 使用 NestExpressApplication 以支持静态文件
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 提供静态文件服务 - 用于访问 HTML 客户端页面
  app.useStaticAssets(join(__dirname, '..', 'src', 'public'));

  await app.listen(3000);
  console.log('WebSocket 服务运行在: http://localhost:3000');
  console.log('聊天客户端页面: http://localhost:3000/index.html');
  console.log('');
  console.log('WebSocket 端点:');
  console.log('  聊天:   ws://localhost:3000/chat');
  console.log('  通知:   ws://localhost:3000/notification');
  console.log('  事件:   ws://localhost:3000/events');
}

bootstrap();
