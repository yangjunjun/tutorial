/**
 * 队列控制器 - 触发队列任务的 HTTP 接口
 *
 * 学习点：
 * 1. 控制器只负责"添加任务到队列"，不执行具体业务逻辑
 * 2. 添加任务是即时的（非阻塞），任务在后台异步处理
 * 3. 返回值包含 jobId，可用于后续查询任务状态
 */
import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * POST /queue/email/:userId - 触发欢迎邮件
   *
   * 立即返回任务ID，邮件在后台异步发送
   * 查看控制台日志可以看到邮件发送过程
   */
  @Post('email/:userId')
  async sendWelcomeEmail(@Param('userId', ParseIntPipe) userId: number) {
    this.logger.log(`触发欢迎邮件: 用户${userId}`);
    return this.queueService.sendWelcomeEmail(userId);
  }

  /**
   * POST /queue/order-confirmation/:orderId - 触发订单确认邮件
   *
   * 使用高优先级，会比普通邮件先处理
   */
  @Post('order-confirmation/:orderId')
  async sendOrderConfirmation(@Param('orderId', ParseIntPipe) orderId: number) {
    this.logger.log(`触发订单确认邮件: 订单${orderId}`);
    return this.queueService.sendOrderConfirmation(orderId);
  }

  /**
   * POST /queue/report - 触发报表生成
   *
   * 任务延迟5秒后才开始执行
   * 适合在低峰期执行耗时任务
   */
  @Post('report')
  async generateReport() {
    this.logger.log('触发报表生成');
    return this.queueService.generateDailyReport();
  }

  /**
   * GET /queue/stats - 查看队列统计
   *
   * 返回所有队列的任务状态分布
   * 用于监控和调试
   */
  @Get('stats')
  async getStats() {
    return this.queueService.getQueueStats();
  }
}
