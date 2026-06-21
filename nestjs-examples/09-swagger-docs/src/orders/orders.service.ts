/**
 * 订单服务
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

// 订单状态类型
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

interface Order {
  id: number;
  items: Array<{
    productId: number;
    quantity: number;
    note?: string;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: string;
  remark?: string;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: Date;
}

@Injectable()
export class OrdersService {
  private orders: Order[] = [
    {
      id: 1,
      items: [
        { productId: 1, quantity: 1, price: 9999 },
      ],
      totalAmount: 9999,
      shippingAddress: '北京市朝阳区xx路xx号',
      paymentMethod: 'alipay',
      status: 'paid',
      createdAt: new Date('2024-03-01'),
    },
    {
      id: 2,
      items: [
        { productId: 2, quantity: 2, price: 14999 },
        { productId: 3, quantity: 3, price: 99 },
      ],
      totalAmount: 30295,
      shippingAddress: '上海市浦东新区xx路xx号',
      paymentMethod: 'wechat',
      status: 'pending',
      createdAt: new Date('2024-03-15'),
    },
  ];

  private nextId = 3;

  /**
   * 查询订单列表
   */
  findAll(status?: string) {
    let filtered = this.orders;

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    return {
      code: 200,
      data: filtered,
    };
  }

  /**
   * 获取订单详情
   */
  findOne(id: number) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`订单 #${id} 不存在`);
    }
    return { code: 200, data: order };
  }

  /**
   * 创建订单
   */
  create(createOrderDto: CreateOrderDto) {
    // 模拟计算总金额（实际应从商品服务获取价格）
    const totalAmount = createOrderDto.items.reduce((sum, item) => {
      return sum + item.quantity * 100; // 模拟价格
    }, 0);

    const order: Order = {
      id: this.nextId++,
      items: createOrderDto.items.map((item) => ({
        ...item,
        price: 100, // 模拟价格
      })),
      totalAmount,
      shippingAddress: createOrderDto.shippingAddress,
      remark: createOrderDto.remark,
      paymentMethod: createOrderDto.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
    };

    this.orders.push(order);

    return {
      code: 201,
      message: '订单创建成功',
      data: {
        orderId: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        // 模拟支付链接
        paymentUrl: `https://pay.example.com/order/${order.id}`,
      },
    };
  }

  /**
   * 取消订单
   */
  cancel(id: number) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`订单 #${id} 不存在`);
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(
        `订单状态为「${order.status}」，不允许取消。仅待付款订单可取消。`,
      );
    }

    order.status = 'cancelled';
    return { code: 200, message: '订单已取消', data: order };
  }
}
