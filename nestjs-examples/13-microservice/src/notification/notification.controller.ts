/**
 * 通知控制器
 *
 * 微服务控制器与 HTTP 控制器的区别：
 *
 * HTTP 控制器：
 * - 使用 @Controller() + @Get/@Post 等装饰器
 * - 处理 HTTP 请求，返回 HTTP 响应
 * - 路由基于 URL 路径
 *
 * 微服务控制器：
 * - 使用 @Controller() + @EventPattern/@MessagePattern
 * - 处理微服务消息/事件
 * - 路由基于模式（pattern）匹配
 *
 * 装饰器说明：
 * - @EventPattern(pattern) - 处理事件（不需要返回值）
 * - @MessagePattern(pattern) - 处理消息（需要返回响应）
 * - @Payload() - 获取消息/事件的数据
 * - @Ctx() - 获取传输层上下文
 */
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { OrderData } from '../shared/interfaces/order.interface';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 处理订单创建事件
   *
   * @EventPattern('order_created')
   * - 当事件模式为 'order_created' 时触发
   * - 不需要返回值（Fire and Forget）
   * - 即使抛出异常，网关也不会收到错误
   *
   * @Payload() data
   * - 从事件中获取传递的数据
   * - 数据格式由发送方（网关）定义
   *
   * 实际项目中，这里会：
   * - 发送邮件通知
   * - 发送 SMS
   * - 推送到消息队列
   * - 写入数据库
   */
  @EventPattern('order_created')
  handleOrderCreated(@Payload() data: OrderData) {
    this.logger.log(`收到订单创建事件: ${data.id}`);
    this.logger.log(`客户: ${data.customerName} (${data.customerEmail})`);
    this.logger.log(`订单金额: ¥${data.totalAmount}`);

    // 调用服务发送通知
    this.notificationService.sendOrderConfirmation(data);

    this.logger.log(`订单 ${data.id} 的确认通知已发送`);
  }

  /**
   * 处理订单取消事件
   *
   * 另一个 EventPattern 处理器，
   * 演示一个控制器可以处理多种事件模式。
   */
  @EventPattern('order_cancelled')
  handleOrderCancelled(@Payload() data: OrderData) {
    this.logger.log(`收到订单取消事件: ${data.id}`);

    // 调用服务发送取消通知
    this.notificationService.sendCancellationNotice(data);

    this.logger.log(`订单 ${data.id} 的取消通知已发送`);
  }

  /**
   * 处理获取通知计数的消息
   *
   * @MessagePattern('get_notification_count')
   * - 当消息模式为 'get_notification_count' 时触发
   * - 必须返回一个值（或 Observable），作为响应返回给调用方
   * - 如果抛出异常，调用方会收到错误
   *
   * 与 @EventPattern 的区别：
   * - @EventPattern: 不需要返回值，调用方不等待
   * - @MessagePattern: 必须返回值，调用方等待响应
   *
   * 返回值可以是：
   * - 普通值（同步）
   * - Promise（异步）
   * - Observable（流式响应）
   */
  @MessagePattern('get_notification_count')
  getNotificationCount(@Payload() data: any) {
    this.logger.log('收到获取通知计数的请求');

    const count = this.notificationService.getNotificationCount();

    this.logger.log(`返回通知计数: ${JSON.stringify(count)}`);
    return count; // 返回值会作为响应发送给调用方
  }
}
