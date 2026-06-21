/**
 * 通知微服务模块
 *
 * 纯微服务模块，不需要 HTTP 相关的配置。
 * 只需要注册处理消息和事件的 Controller 和 Service。
 */
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class AppModule {}
