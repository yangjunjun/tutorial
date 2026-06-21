/**
 * 订单服务
 *
 * 负责订单的业务逻辑，并通过 ClientProxy 与通知微服务通信。
 *
 * 关键概念 - ClientProxy:
 *
 * ClientProxy 是 NestJS 微服务客户端的抽象接口，
 * 它封装了与远程微服务的通信细节。
 *
 * 两种通信方法：
 *
 * 1. emit() - 事件模式（Fire and Forget）
 *    - 发送事件，不等待响应
 *    - 返回 Observable，但通常不需要订阅
 *    - 适合：通知、日志、异步任务
 *
 * 2. send() - 消息模式（Request/Response）
 *    - 发送消息，等待响应
 *    - 返回 Observable，需要订阅才能触发发送
 *    - 适合：获取数据、需要确认的操作
 */
import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from '../../shared/dto/notify-order.dto';
import { OrderData, OrderStatus, OrderItem } from '../../shared/interfaces/order.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  /** 内存订单存储 */
  private orders: Map<string, OrderData> = new Map();
  /** ID 计数器 */
  private idCounter = 1;

  /**
   * 注入通知微服务客户端
   *
   * @Inject('NOTIFICATION_SERVICE') 使用与 ClientsModule.register()
   * 中相同的名称来获取对应的 ClientProxy 实例。
   *
   * 注意：ClientProxy 是一个代理对象，
   * 它知道如何连接到远程微服务并发送消息。
   */
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * 创建订单
   *
   * 流程：
   * 1. 创建订单数据
   * 2. 保存到内存
   * 3. 发送事件通知通知微服务（Fire and Forget）
   *
   * @param dto - 创建订单的数据
   * @returns 创建的订单
   */
  createOrder(dto: CreateOrderDto): OrderData {
    // 生成订单 ID
    const orderId = `ORD-${String(this.idCounter++).padStart(5, '0')}`;

    // 计算总金额
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // 构建订单数据
    const order: OrderData = {
      id: orderId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      items: dto.items as OrderItem[],
      totalAmount,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    // 保存订单
    this.orders.set(orderId, order);
    this.logger.log(`订单已创建: ${orderId}, 金额: ¥${totalAmount}`);

    /**
     * 发送事件到通知微服务
     *
     * emit() 方法：
     * - 第一个参数：事件模式名称（event pattern）
     * - 第二个参数：要传递的数据
     *
     * 注意：emit() 是 "fire and forget" 模式，
     * 它不会等待通知微服务的响应。
     * 即使通知微服务不可用，订单创建也会成功。
     *
     * 在实际项目中，可能需要使用消息队列（如 RabbitMQ、Kafka）
     * 来确保消息不会丢失。
     */
    this.notificationClient.emit('order_created', order);
    this.logger.log(`已发送订单创建事件: ${orderId}`);

    return order;
  }

  /**
   * 获取订单状态
   *
   * @param id - 订单 ID
   * @returns 订单状态信息
   */
  getOrderStatus(id: string): { id: string; status: OrderStatus; order: OrderData } {
    const order = this.orders.get(id);
    if (!order) {
      throw new NotFoundException(`订单 ${id} 不存在`);
    }
    return {
      id: order.id,
      status: order.status,
      order,
    };
  }

  /**
   * 获取通知计数
   *
   * 使用消息模式（Request/Response）从通知微服务获取数据。
   *
   * send() 方法：
   * - 第一个参数：消息模式名称（message pattern）
   * - 第二个参数：请求数据
   * - 返回 Observable，需要订阅或使用 async/await（通过 firstValueFrom）
   *
   * 与 emit() 的区别：
   * - send() 等待响应（像 HTTP 请求/响应）
   * - emit() 不等待响应（像发布事件）
   */
  async getNotificationCount(): Promise<any> {
    this.logger.log('正在从通知微服务获取通知计数...');

    // 使用 firstValueFrom 将 Observable 转为 Promise
    const { firstValueFrom } = await import('rxjs');
    return firstValueFrom(
      this.notificationClient.send('get_notification_count', {}),
    );
  }
}
