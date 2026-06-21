/**
 * 支付服务 - 模拟支付流程
 *
 * 学习点：
 * 1. 幂等性 (Idempotency)：同一支付请求多次调用，只处理一次
 * 2. Webhook 回调模式：第三方支付系统异步通知支付结果
 * 3. 异步处理：使用 setTimeout 模拟支付网关的异步回调
 * 4. 状态机：支付状态只能按规则流转，防止重复处理
 *
 * 真实支付流程（以支付宝为例）：
 * 1. 用户下单 -> 调用支付宝接口创建支付单
 * 2. 用户跳转支付宝页面完成支付
 * 3. 支付宝异步通知我们的 Webhook（POST 请求）
 * 4. 我们验证签名、检查幂等性、更新订单状态
 * 5. 返回 "success" 告知支付宝已收到通知（否则会重复推送）
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成唯一支付单号
   * 格式: PAY + 时间戳 + 随机数
   */
  private generatePaymentNo(): string {
    const now = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PAY${now}${random}`;
  }

  /**
   * 模拟支付 - 完整的支付流程演示
   *
   * 流程：
   * 1. 检查订单是否存在且状态为 PENDING
   * 2. 检查是否已有支付记录（幂等性）
   * 3. 创建支付记录（状态 PENDING）
   * 4. 模拟异步支付处理（2秒延迟后更新状态）
   *
   * 幂等性保证：
   * - 在创建支付记录前检查是否已存在支付记录
   * - 如果已有 SUCCESS 状态的支付记录，直接返回，不重复扣款
   */
  async simulatePayment(orderId: number) {
    this.logger.log(`开始模拟支付: 订单${orderId}`);

    // 第一步：查询订单
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },  // 同时查询关联的支付记录
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    // 第二步：幂等性检查 - 是否已经支付成功
    // 这是防止重复支付的关键！
    // 场景：用户网络不好，点了两次"支付"按钮
    if (order.payment && order.payment.status === 'SUCCESS') {
      this.logger.warn(
        `订单 ${order.orderNo} 已经支付成功，跳过重复支付 (支付单号: ${order.payment.paymentNo})`,
      );
      return {
        message: '订单已支付，无需重复支付',
        payment: order.payment,
        idempotent: true,  // 标记这是一次幂等性命中
      };
    }

    // 第三步：检查订单状态
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `订单状态为 ${order.status}，无法支付。只有待支付状态的订单可以支付`,
      );
    }

    // 第四步：创建或使用已有支付记录
    let payment = order.payment;
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          paymentNo: this.generatePaymentNo(),
          amount: order.totalAmount,
          status: 'PENDING',
          method: 'SIMULATED',  // 模拟支付方式
          orderId: order.id,
        },
      });
      this.logger.log(`支付记录已创建: ${payment.paymentNo}`);
    }

    // 第五步：模拟异步支付处理
    // 在真实场景中，这里是调用第三方支付API，然后等待异步回调
    // 这里用 setTimeout 模拟 2 秒后支付完成的回调
    this.logger.log(`模拟支付处理中... (2秒后完成)`);

    // 注意：使用 setTimeout 而非 await，模拟异步回调
    // 在真实系统中，这个回调来自支付网关的 Webhook
    setTimeout(async () => {
      try {
        // 模拟支付网关回调：更新支付和订单状态
        await this.handlePaymentCallback(payment.paymentNo, 'SUCCESS');
      } catch (error) {
        this.logger.error(`支付回调处理失败: ${error.message}`);
      }
    }, 2000);

    return {
      message: '支付处理中，预计2秒后完成',
      payment: {
        paymentNo: payment.paymentNo,
        amount: payment.amount,
        status: 'PENDING',
      },
      idempotent: false,
    };
  }

  /**
   * 处理支付回调（内部方法）
   *
   * 当支付网关通知我们支付结果时调用
   * 关键：幂等性检查 + 事务更新
   */
  private async handlePaymentCallback(paymentNo: string, status: string) {
    this.logger.log(`收到支付回调: ${paymentNo}, 状态: ${status}`);

    // 查找支付记录
    const payment = await this.prisma.payment.findUnique({
      where: { paymentNo },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`支付记录不存在: ${paymentNo}`);
      return;
    }

    // 幂等性检查：如果支付已经是最终状态（SUCCESS/FAILED），不再处理
    // 支付网关可能会重复推送通知（网络重试），我们必须保证幂等
    if (payment.status !== 'PENDING') {
      this.logger.warn(
        `支付 ${paymentNo} 已经是 ${payment.status} 状态，跳过重复回调`,
      );
      return;
    }

    // 使用事务同时更新支付记录和订单状态
    await this.prisma.$transaction(async (tx) => {
      // 更新支付记录状态
      await tx.payment.update({
        where: { paymentNo },
        data: {
          status,
          paidAt: status === 'SUCCESS' ? new Date() : null,
        },
      });

      // 更新订单状态
      const newOrderStatus = status === 'SUCCESS' ? 'PAID' : 'PENDING';
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: newOrderStatus },
      });
    });

    this.logger.log(
      `支付回调处理完成: ${paymentNo} -> ${status}, 订单状态已更新`,
    );
  }

  /**
   * 处理支付网关 Webhook 回调
   *
   * 这是对外暴露的接口，模拟接收第三方支付系统的通知
   *
   * Webhook 安全要点（生产环境必须实现）：
   * 1. 签名验证：验证请求确实来自支付网关（防止伪造回调）
   * 2. 金额校验：对比通知中的金额和订单金额（防止篡改）
   * 3. 幂等性：同一通知可能收到多次，只处理一次
   * 4. 及时性：尽快返回成功响应，否则支付网关会重复推送
   *
   * 常见的 Webhook 重试策略：
   * - 支付宝：4m, 10m, 10m, 1h, 2h, 6h, 15h（共7次重试）
   * - 微信支付：15s, 30s, 3m, 10m, 20m, 30m, 30m, 30m, 60m, 3h, 3h
   */
  async handlePaymentWebhook(paymentNo: string, status: string) {
    this.logger.log(`收到Webhook回调: paymentNo=${paymentNo}, status=${status}`);

    // 查找支付记录
    const payment = await this.prisma.payment.findUnique({
      where: { paymentNo },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`支付记录 ${paymentNo} 不存在`);
    }

    // 幂等性检查：已处理的回调不再重复处理
    // 注意：即使返回"已处理"，也应该返回成功响应
    // 因为支付网关收到成功响应后就不会再推送了
    if (payment.status !== 'PENDING') {
      this.logger.warn(
        `Webhook 幂等性命中: ${paymentNo} 已处理 (${payment.status})`,
      );
      return {
        success: true,
        message: '已处理（幂等性命中）',
        idempotent: true,
      };
    }

    // 处理支付回调（事务操作）
    await this.handlePaymentCallback(paymentNo, status);

    // 返回成功响应，告知支付网关我们已收到
    // 如果不返回成功，网关会按照重试策略持续推送
    return {
      success: true,
      message: '处理成功',
      idempotent: false,
    };
  }
}
