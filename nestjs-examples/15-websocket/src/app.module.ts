/**
 * 根模块
 *
 * 聚合所有 WebSocket 网关模块。
 * 注意：WebSocket 网关是通过 Module 的 providers 注册的，
 * 而不是 controllers。
 */
import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [ChatModule, NotificationModule, EventsModule],
})
export class AppModule {}
