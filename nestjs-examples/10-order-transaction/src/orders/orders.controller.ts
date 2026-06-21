/**
 * 订单控制器 - 处理 HTTP 请求
 *
 * 学习点：
 * 1. @Body() 装饰器配合 ValidationPipe 自动验证请求体
 * 2. @Query() 获取 URL 查询参数
 * 3. @Param() 获取路径参数
 * 4. RESTful API 设计规范
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, QueryOrdersDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders - 创建新订单
   *
   * 使用 ValidationPipe 自动验证请求体：
   * - whitelist: true 会自动过滤掉 DTO 中未定义的属性
   * - transform: true 会自动转换类型（如 string -> number）
   * - forbidNonWhitelisted: true 会在存在未定义属性时抛出错误
   */
  @Post()
  async createOrder(
    @Body(new ValidationPipe({
      whitelist: true,         // 自动过滤未定义的属性
      transform: true,         // 自动类型转换
      forbidNonWhitelisted: true,  // 存在多余属性时报错
    }))
    dto: CreateOrderDto,
  ) {
    this.logger.log(`收到创建订单请求: 用户${dto.userId}`);
    return this.ordersService.createOrder(dto);
  }

  /**
   * GET /orders - 订单列表
   *
   * 支持的查询参数：
   * - status: 按状态过滤 (PENDING, PAID, SHIPPED, COMPLETED, CANCELLED)
   * - page: 页码（默认1）
   * - pageSize: 每页数量（默认10）
   *
   * 示例: GET /orders?status=PAID&page=1&pageSize=20
   */
  @Get()
  async listOrders(@Query() query: QueryOrdersDto) {
    return this.ordersService.listOrders(query);
  }

  /**
   * GET /orders/:id - 订单详情
   *
   * ParseIntPipe 自动将路径参数从 string 转为 number
   * 如果转换失败会返回 400 Bad Request
   */
  @Get(':id')
  async getOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderDetail(id);
  }

  /**
   * PATCH /orders/:id/cancel - 取消订单
   *
   * 只有 PENDING 状态的订单可以取消
   * 取消后会自动恢复库存（在 service 中通过事务实现）
   */
  @Patch(':id/cancel')
  async cancelOrder(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`收到取消订单请求: ${id}`);
    return this.ordersService.cancelOrder(id);
  }

  /**
   * PATCH /orders/:id/status - 管理员更新订单状态
   *
   * 注意：生产环境中应该添加权限验证（@UseGuards(AuthGuard)）
   * 确保只有管理员可以调用此接口
   */
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateOrderStatusDto,
  ) {
    this.logger.log(`收到状态更新请求: 订单${id} -> ${dto.status}`);
    return this.ordersService.updateOrderStatus(id, dto);
  }
}
