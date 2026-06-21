/**
 * 订单服务 - 核心业务逻辑
 *
 * 学习点：
 * 1. 数据库事务：使用 prisma.$transaction() 保证操作的原子性
 * 2. 交互式事务 vs 批量事务的区别
 * 3. 库存扣减与恢复的事务处理
 * 4. 分页查询与状态过滤
 *
 * 事务模式说明：
 * - 批量事务 (Batch Transaction): prisma.$transaction([p1, p2, p3])
 *   适合独立的多个写操作，自动批量执行
 * - 交互式事务 (Interactive Transaction): prisma.$transaction(async (tx) => { ... })
 *   适合有依赖关系的操作，可以在事务中读取前一步的结果
 *   本项目使用交互式事务，因为：
 *   a. 需要先查询库存，再决定是否扣减
 *   b. 需要创建订单后获取orderId，再创建订单项
 *   c. 任何一步失败都需要整体回滚
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成唯一订单号
   * 格式: ORD + 年月日时分秒 + 4位随机数
   * 例如: ORD202401011200001234
   */
  private generateOrderNo(): string {
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/[-T:\.Z]/g, '')
      .slice(0, 14);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${dateStr}${random}`;
  }

  /**
   * 创建订单 - 完整的事务实现
   *
   * 业务流程：
   * 1. 验证所有商品存在且库存充足（事务外预检查，减少事务持有时间）
   * 2. 计算订单总金额
   * 3. 在事务中：
   *    a. 创建订单记录
   *    b. 创建所有订单项
   *    c. 扣减每个商品的库存
   *    d. 创建收货地址
   * 4. 返回完整订单信息
   *
   * 事务隔离说明：
   * - SQLite 使用 SERIALIZABLE 隔离级别（最高级别）
   * - 在事务执行期间，其他事务无法看到中间状态
   * - 如果并发创建订单导致库存不足，事务会自动回滚
   *
   * 关于预检查：
   * - 库存预检查在事务外进行，这是一个"快速失败"优化
   * - 真正的库存扣减在事务内进行，如果此时库存已被其他事务扣减，
   *   update 语句的 where 条件会匹配0行，我们据此判断库存不足
   */
  async createOrder(dto: CreateOrderDto) {
    this.logger.log(`开始创建订单: 用户${dto.userId}, 商品数${dto.items.length}`);

    // ===== 第一步：事务外预检查（快速失败优化） =====
    // 预先查询所有商品，避免在事务中做不必要的查询
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // 验证所有商品都存在
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`以下商品不存在: ${missingIds.join(', ')}`);
    }

    // 验证用户存在
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`用户 ${dto.userId} 不存在`);
    }

    // 预检查库存（这只是初步检查，真正的保证在事务中）
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `商品 "${product.name}" 库存不足 (剩余: ${product.stock}, 需要: ${item.quantity})`,
        );
      }
    }

    // 计算总金额
    const totalAmount = dto.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + product.price * item.quantity;
    }, 0);

    // ===== 第二步：交互式事务 - 保证原子性 =====
    /**
     * prisma.$transaction(async (tx) => { ... })
     *
     * tx 是事务客户端，用法与 prisma 相同，但所有操作都在同一事务中
     * 如果回调函数抛出异常，整个事务自动回滚
     * 如果回调函数正常返回，事务自动提交
     */
    const order = await this.prisma.$transaction(async (tx) => {
      // --- 2a. 在事务内再次检查并扣减库存 ---
      // 为什么要在事务内再次检查？
      // 因为预检查之后、事务执行之前，可能有其他请求已经扣减了库存
      // 事务内的检查才是真正的并发安全保证
      for (const item of dto.items) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },  // 关键：只有库存 >= 需求量时才更新
          },
          data: {
            stock: { decrement: item.quantity },  // 原子性扣减库存
          },
        });

        // 如果 updateMany 没有匹配到任何行，说明库存不足
        if (updateResult.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          throw new BadRequestException(
            `商品 "${product?.name}" 库存不足，请减少购买数量或稍后再试`,
          );
        }
      }

      // --- 2b. 创建订单主记录 ---
      const newOrder = await tx.order.create({
        data: {
          orderNo: this.generateOrderNo(),
          status: 'PENDING',  // 初始状态为待支付
          totalAmount,
          userId: dto.userId,
        },
      });

      // --- 2c. 创建所有订单项 ---
      // 使用 createMany 批量创建，比循环单条创建更高效
      await tx.orderItem.createMany({
        data: dto.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,  // 快照价格：记录下单时的价格
          };
        }),
      });

      // --- 2d. 创建收货地址 ---
      await tx.shippingAddress.create({
        data: {
          orderId: newOrder.id,
          name: dto.shippingAddress.name,
          phone: dto.shippingAddress.phone,
          address: dto.shippingAddress.address,
        },
      });

      this.logger.log(
        `订单创建成功: ${newOrder.orderNo}, 金额: ${totalAmount}`,
      );

      return newOrder;
    });  // 事务结束：如果上面任何一步抛出异常，所有操作自动回滚

    // ===== 第三步：返回完整的订单信息 =====
    return this.getOrderDetail(order.id);
  }

  /**
   * 取消订单 - 事务处理
   *
   * 业务流程：
   * 1. 检查订单存在且状态为 PENDING（只有待支付的订单可以直接取消）
   * 2. 在事务中：
   *    a. 更新订单状态为 CANCELLED
   *    b. 恢复所有商品的库存
   *
   * 注意：已支付的订单取消需要走退款流程（这里简化处理）
   */
  async cancelOrder(orderId: number) {
    this.logger.log(`尝试取消订单: ${orderId}`);

    // 查询订单当前状态
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    // 状态校验：只有待支付状态可以取消
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `订单状态为 ${order.status}，无法取消。只有待支付(PENDING)状态的订单可以取消`,
      );
    }

    // 事务：取消订单 + 恢复库存
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // 恢复每个商品的库存
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },  // 原子性增加库存
        });
      }
    });

    this.logger.log(`订单 ${order.orderNo} 已取消，库存已恢复`);
    return this.getOrderDetail(orderId);
  }

  /**
   * 获取订单详情 - 包含所有关联数据
   *
   * 学习点：Prisma 的 include 用法（类似 SQL JOIN）
   * 一次性加载所有关联数据，避免 N+1 查询问题
   */
  async getOrderDetail(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, username: true, email: true },  // 只返回需要的字段
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
        payment: true,
        shippingAddr: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    return order;
  }

  /**
   * 订单列表 - 支持分页和状态过滤
   *
   * 学习点：
   * 1. skip/take 实现分页（类似 SQL 的 OFFSET/LIMIT）
   * 2. where 条件动态构建
   * 3. orderBy 排序
   * 4. 同时返回数据和分页信息
   */
  async listOrders(query: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 10 } = query;

    // 动态构建查询条件
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // 并行查询数据和总数（性能优化）
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          payment: { select: { id: true, status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },  // 按创建时间倒序
        skip: (page - 1) * pageSize,     // 跳过前面的记录
        take: pageSize,                   // 取指定数量
      }),
      this.prisma.order.count({ where }),  // 获取总数
    ]);

    return {
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 更新订单状态（管理员操作）
   *
   * 学习点：状态机模式
   * 不是所有状态转换都是合法的，例如：
   * - 不能从 COMPLETED 转回 PENDING
   * - 不能从 CANCELLED 转到任何状态
   * 这里简化实现，生产环境应该有完整的状态机
   */
  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    // 定义合法的状态转换映射
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['COMPLETED'],
      COMPLETED: [],     // 已完成，不能再变更
      CANCELLED: [],     // 已取消，不能再变更
    };

    const allowedNextStatuses = validTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `非法状态转换: ${order.status} -> ${dto.status}。` +
        `允许的目标状态: ${allowedNextStatuses.join(', ') || '无'}`,
      );
    }

    // 如果目标状态是 CANCELLED，需要恢复库存
    if (dto.status === 'CANCELLED' && order.status === 'PAID') {
      // 已支付的订单取消 = 退款 + 恢复库存
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: dto.status },
        });

        // 查询订单项并恢复库存
        const items = await tx.orderItem.findMany({
          where: { orderId },
        });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      // 普通状态更新
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: dto.status },
      });
    }

    this.logger.log(`订单 ${order.orderNo} 状态更新: ${order.status} -> ${dto.status}`);
    return this.getOrderDetail(orderId);
  }

  /**
   * 查询超时未支付的订单
   * 供定时任务调用
   */
  async findExpiredPendingOrders(timeoutMinutes: number = 30) {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    return this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: timeoutDate },
      },
      include: { items: true },
    });
  }
}
