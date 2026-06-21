/**
 * 通知服务
 *
 * 管理通知数据的存储和状态。
 */
import { Injectable, Logger } from '@nestjs/common';

/** 通知数据接口 */
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /** 通知存储 - notificationId -> Notification */
  private notifications: Map<string, Notification> = new Map();

  /** ID 计数器 */
  private idCounter = 1;

  /**
   * 创建新通知
   * @param userId - 目标用户 ID
   * @param message - 通知消息
   */
  createNotification(userId: string, message: string): Notification {
    const notification: Notification = {
      id: `notif-${this.idCounter++}`,
      userId,
      message,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.set(notification.id, notification);
    this.logger.log(`创建通知: ${notification.id} -> 用户 ${userId}`);
    return notification;
  }

  /**
   * 标记通知为已读
   * @param notificationId - 通知 ID
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * 获取用户的所有通知
   * @param userId - 用户 ID
   */
  getUserNotifications(userId: string): Notification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId,
    );
  }

  /**
   * 获取用户的未读通知数
   * @param userId - 用户 ID
   */
  getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && !n.read,
    ).length;
  }
}
