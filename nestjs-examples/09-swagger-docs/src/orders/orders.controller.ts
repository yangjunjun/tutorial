/**
 * 订单控制器（含 Swagger 文档）
 *
 * 学习要点：
 * 1. 订单相关接口的完整文档标注
 * 2. 多种 HTTP 状态码的响应描述
 * 3. 嵌套 DTO 的文档展示
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('订单管理')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 获取订单列表
   */
  @Get()
  @ApiOperation({
    summary: '获取订单列表',
    description: '获取当前用户的订单列表，支持按状态筛选',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '订单状态筛选',
    enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  /**
   * 获取订单详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取订单详情',
    description: '根据订单 ID 获取完整的订单信息，包含订单项列表',
  })
  @ApiParam({
    name: 'id',
    description: '订单 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({ status: 200, description: '订单详情' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  /**
   * 创建订单
   */
  @Post()
  @ApiOperation({
    summary: '创建订单',
    description: '提交新订单，包含商品列表和收货信息',
  })
  @ApiResponse({
    status: 201,
    description: '订单创建成功，返回订单 ID 和支付信息',
  })
  @ApiResponse({ status: 400, description: '请求参数错误（如商品不存在、库存不足）' })
  @ApiResponse({ status: 402, description: '支付失败' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  /**
   * 取消订单
   */
  @Post(':id/cancel')
  @ApiOperation({
    summary: '取消订单',
    description: '取消指定订单（仅待付款订单可取消）',
  })
  @ApiParam({
    name: 'id',
    description: '订单 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({ status: 200, description: '订单已取消' })
  @ApiResponse({ status: 400, description: '订单状态不允许取消' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancel(id);
  }
}
