/**
 * 支付控制器 - 处理支付相关 HTTP 请求
 *
 * 学习点：
 * 1. 模拟支付触发（类似前端点击"支付"按钮）
 * 2. Webhook 回调接口（接收第三方通知）
 * 3. Webhook 接口通常不需要用户认证，但需要签名验证
 */
import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/simulate/:orderId - 触发模拟支付
   *
   * 模拟用户在支付页面点击"确认支付"的行为
   * 返回后会异步处理支付结果（2秒后自动完成）
   */
  @Post('simulate/:orderId')
  async simulatePayment(@Param('orderId', ParseIntPipe) orderId: number) {
    this.logger.log(`收到模拟支付请求: 订单${orderId}`);
    return this.paymentsService.simulatePayment(orderId);
  }

  /**
   * POST /payments/webhook - 模拟支付网关回调
   *
   * 在真实系统中，这个接口由支付网关调用
   * 请求体示例：
   * {
   *   "paymentNo": "PAY1234567890",
   *   "status": "SUCCESS",
   *   "sign": "xxxx"  // 签名（本示例省略）
   * }
   *
   * 重要：这个接口需要快速响应（通常要求3秒内返回）
   * 如果处理时间较长，应该先返回成功，再异步处理业务逻辑
   */
  @Post('webhook')
  async handleWebhook(
    @Body() body: { paymentNo: string; status: string },
  ) {
    this.logger.log(`收到Webhook回调: ${body.paymentNo}`);
    return this.paymentsService.handlePaymentWebhook(
      body.paymentNo,
      body.status,
    );
  }
}
