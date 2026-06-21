/**
 * 订单控制器
 *
 * 提供 HTTP 接口，将请求委托给 OrdersService。
 * OrdersService 内部会通过 ClientProxy 与通知微服务通信。
 *
 * 客户端不需要知道微服务的存在，
 * 这就是 API 网关模式的核心思想。
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../shared/dto/notify-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders - 创建订单
   *
   * 创建订单后，网关会自动发送事件通知通知微服务。
   * 客户端不需要关心通知是如何发送的。
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  /**
   * GET /orders/:id/status - 获取订单状态
   */
  @Get(':id/status')
  getOrderStatus(@Param('id') id: string) {
    return this.ordersService.getOrderStatus(id);
  }

  /**
   * GET /orders/notification-count - 获取通知计数
   *
   * 此接口演示了 Request/Response 模式：
   * 网关向通知微服务请求数据，等待响应后返回给客户端。
   */
  @Get('notification-count')
  getNotificationCount() {
    return this.ordersService.getNotificationCount();
  }
}
