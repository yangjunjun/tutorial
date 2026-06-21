/**
 * 邮件任务处理器 - 消费邮件队列中的任务
 *
 * 学习点：
 * 1. @Processor('queue-name') 装饰器：标记为特定队列的消费者
 * 2. @Process('job-name') 装饰器：处理特定类型的任务
 * 3. 并发控制：不同任务类型可以设置不同的并发数
 * 4. 重试机制：失败的任务自动重试（指数退避）
 * 5. 任务生命周期事件：@OnQueueActive、@OnQueueCompleted 等
 *
 * Bull 队列架构：
 * ```
 *  Producer ──add job──> [Queue] ──process──> Consumer(Processor)
 *                             │
 *                             ├── Waiting（等待中）
 *                             ├── Active（处理中）
 *                             ├── Delayed（延迟中）
 *                             ├── Completed（已完成）
 *                             └── Failed（失败）
 * ```
 */
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('email')  // 绑定到 'email' 队列
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  /**
   * 处理欢迎邮件任务
   *
   * @Process() 装饰器说明：
   * - 无参数：处理队列中所有任务
   * - 有字符串参数：只处理特定名称的任务
   * - 有对象参数：可以配置并发数等选项
   *
   * 任务数据通过 job.data 获取
   * 任务完成后返回值会被存入 job.returnvalue
   */
  @Process('send-welcome')
  async handleWelcomeEmail(job: Job<{ userId: number; email: string; username: string }>) {
    this.logger.log(`[任务 ${job.id}] 开始发送欢迎邮件...`);
    this.logger.log(`  用户: ${job.data.username} (${job.data.email})`);

    // 模拟发送邮件的过程（真实项目中调用 nodemailer 或邮件API）
    // 步骤1：生成邮件内容
    this.logger.log(`  步骤1/3: 生成邮件模板...`);
    await this.simulateDelay(500);

    // 步骤2：连接到 SMTP 服务器
    this.logger.log(`  步骤2/3: 连接邮件服务器...`);
    await this.simulateDelay(300);

    // 步骤3：发送邮件
    this.logger.log(`  步骤3/3: 发送邮件中...`);
    await this.simulateDelay(700);

    this.logger.log(`[任务 ${job.id}] 欢迎邮件发送成功!`);

    // 返回处理结果（可在任务完成后通过事件获取）
    return { sent: true, sentAt: new Date().toISOString() };
  }

  /**
   * 处理订单确认邮件
   *
   * 任务数据包含订单信息，生成订单确认邮件并发送
   */
  @Process('send-order-confirmation')
  async handleOrderConfirmation(job: Job<{
    orderId: number;
    orderNo: string;
    totalAmount: number;
    email: string;
  }>) {
    this.logger.log(`[任务 ${job.id}] 开始发送订单确认邮件...`);
    this.logger.log(`  订单号: ${job.data.orderNo}`);
    this.logger.log(`  金额: ¥${job.data.totalAmount}`);
    this.logger.log(`  收件人: ${job.data.email}`);

    // 模拟邮件发送
    await this.simulateDelay(1000);

    this.logger.log(`[任务 ${job.id}] 订单确认邮件发送成功!`);
    return { sent: true, orderId: job.data.orderId };
  }

  /**
   * 处理报表邮件 - 单并发
   *
   * 使用 concurrency: 1 限制同时只处理一个报表任务
   * 为什么限制并发？
   * 1. 报表生成通常很耗资源（大量数据库查询）
   * 2. 避免多个报表同时生成导致数据库压力过大
   * 3. 报表邮件通常不需要实时性，排队处理即可
   *
   * 并发控制对比：
   * - 欢迎邮件：高并发（用户注册后立即发送，不能等太久）
   * - 报表邮件：低并发（定时任务，不需要实时）
   * - 批量通知：中等并发（平衡速度和资源使用）
   */
  @Process({ name: 'send-report', concurrency: 1 })
  async handleReportEmail(job: Job<{ reportType: string; date: string }>) {
    this.logger.log(`[任务 ${job.id}] 开始发送报表邮件...`);
    this.logger.log(`  报表类型: ${job.data.reportType}`);
    this.logger.log(`  日期: ${job.data.date}`);

    // 模拟报表生成（耗时较长）
    this.logger.log(`  生成报表数据中...`);
    await this.simulateDelay(2000);

    this.logger.log(`  发送报表邮件中...`);
    await this.simulateDelay(500);

    this.logger.log(`[任务 ${job.id}] 报表邮件发送成功!`);
    return { sent: true, reportType: job.data.reportType };
  }

  /**
   * 模拟异步延迟（替代真实的邮件发送）
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /*
   * ===== 任务生命周期事件处理器（可选） =====
   *
   * @OnQueueActive(job: Job)
   * - 任务开始处理时触发
   * - 用途：日志记录、监控
   *
   * @OnQueueCompleted(job: Job, result: any)
   * - 任务完成时触发
   * - 用途：发送完成通知、清理资源
   *
   * @OnQueueFailed(job: Job, err: Error)
   * - 任务失败时触发
   * - 用途：告警通知、记录失败原因
   *
   * @OnQueueError(error: Error)
   * - 队列发生错误时触发
   * - 用途：异常监控
   *
   * 示例：
   * @OnQueueActive()
   * onActive(job: Job) {
   *   this.logger.log(`任务 ${job.id} 开始处理`);
   * }
   */
}
