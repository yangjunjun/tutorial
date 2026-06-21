/**
 * 通知服务
 *
 * 负责实际的通知业务逻辑。
 * 在本示例中使用 console.log 模拟发送邮件/SMS。
 *
 * 在实际项目中，这里会集成：
 * - 邮件服务（如 SendGrid、Nodemailer）
 * - SMS 服务（如 Twilio、阿里云短信）
 * - 推送通知（如 Firebase Cloud Messaging）
 */
import { Injectable, Logger } from '@nestjs/common';
import { OrderData, NotificationCountResponse } from '../shared/interfaces/order.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /** 通知计数器 */
  private notificationCount = {
    orderCreated: 0,
    orderCancelled: 0,
  };

  /**
   * 发送订单确认通知
   *
   * 在实际项目中，这里会调用邮件/SMS API。
   * 本示例中使用 console.log 模拟。
   *
   * @param orderData - 订单数据
   */
  sendOrderConfirmation(orderData: OrderData): void {
    this.notificationCount.orderCreated++;

    // 模拟发送邮件
    this.logger.log('========== 订单确认邮件 ==========');
    this.logger.log(`收件人: ${orderData.customerEmail}`);
    this.logger.log(`主题: 订单 ${orderData.id} 确认`);
    this.logger.log(`内容:`);
    this.logger.log(`  亲爱的 ${orderData.customerName},`);
    this.logger.log(`  您的订单 ${orderData.id} 已创建成功！`);
    this.logger.log(`  订单金额: ¥${orderData.totalAmount}`);
    this.logger.log(`  商品数量: ${orderData.items.length} 件`);
    this.logger.log(`  我们将尽快为您处理。`);
    this.logger.log('==================================');

    // 模拟发送延迟
    this.logger.log('邮件发送成功 ✓');
  }

  /**
   * 发送订单取消通知
   *
   * @param orderData - 订单数据
   */
  sendCancellationNotice(orderData: OrderData): void {
    this.notificationCount.orderCancelled++;

    this.logger.log('========== 订单取消通知 ==========');
    this.logger.log(`收件人: ${orderData.customerEmail}`);
    this.logger.log(`主题: 订单 ${orderData.id} 已取消`);
    this.logger.log(`内容:`);
    this.logger.log(`  亲爱的 ${orderData.customerName},`);
    this.logger.log(`  您的订单 ${orderData.id} 已被取消。`);
    this.logger.log(`  退款将在 3-5 个工作日内处理。`);
    this.logger.log('==================================');
  }

  /**
   * 获取通知计数
   *
   * 返回已发送的通知数量统计。
   * 这个方法通过 MessagePattern 被网关调用。
   *
   * @returns 通知计数统计
   */
  getNotificationCount(): NotificationCountResponse {
    const total =
      this.notificationCount.orderCreated +
      this.notificationCount.orderCancelled;

    return {
      total,
      byType: {
        orderCreated: this.notificationCount.orderCreated,
        orderCancelled: this.notificationCount.orderCancelled,
      },
    };
  }
}
