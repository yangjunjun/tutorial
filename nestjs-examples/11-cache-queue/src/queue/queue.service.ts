/**
 * 队列服务 - 向队列中添加任务
 *
 * 学习点：
 * 1. @InjectQueue 注入队列实例
 * 2. 任务选项（Job Options）：
 *    - priority: 优先级（数字越小越优先）
 *    - delay: 延迟执行（毫秒）
 *    - attempts: 重试次数
 *    - backoff: 重试退避策略
 *    - removeOnComplete: 完成后自动删除
 * 3. 生产者与消费者分离：添加任务不需要知道谁来处理
 *
 * 任务选项详解：
 * ┌──────────────────────────────────────────────────────┐
 * │ priority     数值型，越小越优先（1 > 2 > 3）         │
 * │              适用：VIP用户的邮件优先发送               │
 * ├──────────────────────────────────────────────────────┤
 * │ delay        延迟毫秒数                              │
 * │              适用：定时发送（如明天早上9点发报表）     │
 * ├──────────────────────────────────────────────────────┤
 * │ attempts     最大重试次数                            │
 * │              适用：邮件发送可能因网络问题失败          │
 * ├──────────────────────────────────────────────────────┤
 * │ backoff      重试间隔策略                            │
 * │              - fixed: 固定间隔（如每次等5秒）        │
 * │              - exponential: 指数退避（5s, 10s, 20s） │
 * │              适用：指数退避更适合处理临时性故障        │
 * ├──────────────────────────────────────────────────────┤
 * │ removeOnComplete  完成后自动删除任务记录             │
 * │                   适用：防止已完成任务占满存储        │
 * └──────────────────────────────────────────────────────┘
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    // 注入邮件队列 - @InjectQueue 的参数必须与 @Processor 的参数一致
    @InjectQueue('email') private readonly emailQueue: Queue,
    // 注入报表队列
    @InjectQueue('report') private readonly reportQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 发送欢迎邮件 - 添加到邮件队列
   *
   * 流程：
   * 1. 查询用户信息
   * 2. 添加任务到 'email' 队列
   * 3. 立即返回（不等待邮件发送完成）
   * 4. 后台的 EmailProcessor 会异步处理
   *
   * 这就是消息队列的核心价值：
   * - 用户注册后不需要等待邮件发送完成才能看到注册成功的响应
   * - 即使邮件服务暂时不可用，任务会保存在队列中等待重试
   */
  async sendWelcomeEmail(userId: number) {
    // 查询用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`);
    }

    // 添加任务到队列
    // add(任务名称, 任务数据, 任务选项)
    const job = await this.emailQueue.add(
      'send-welcome',  // 任务名称，对应 @Process('send-welcome')
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      {
        // 任务选项
        attempts: 3,        // 最多重试3次
        backoff: {
          type: 'exponential',  // 指数退避：第1次等2s，第2次等4s，第3次等8s
          delay: 2000,
        },
        removeOnComplete: true,  // 完成后自动删除任务记录
      },
    );

    this.logger.log(
      `欢迎邮件任务已入队: 用户${user.username}, 任务ID: ${job.id}`,
    );

    return {
      message: '欢迎邮件任务已添加到队列',
      jobId: job.id,
      queueName: 'email',
    };
  }

  /**
   * 发送订单确认邮件 - 带优先级
   *
   * 订单确认邮件比较重要，设置较高优先级
   */
  async sendOrderConfirmation(orderId: number) {
    // 查询订单信息
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderId} 不存在`);
    }

    // 查询关联用户获取邮箱
    const user = await this.prisma.user.findUnique({
      where: { id: order.userId },
    });

    const job = await this.emailQueue.add(
      'send-order-confirmation',
      {
        orderId: order.id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount,
        email: user?.email || 'unknown@example.com',
      },
      {
        priority: 1,          // 优先级1（高优先级，比欢迎邮件先处理）
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `订单确认邮件任务已入队: 订单${order.orderNo}, 优先级: 高`,
    );

    return {
      message: '订单确认邮件任务已添加到队列',
      jobId: job.id,
      queueName: 'email',
      priority: 'high',
    };
  }

  /**
   * 生成每日报表 - 延迟执行
   *
   * 使用 delay 选项让任务在指定时间后才开始处理
   * 典型场景：凌晨2点生成前一天的报表（避开业务高峰）
   */
  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];

    const job = await this.reportQueue.add(
      'daily-sales-report',
      {
        date: today,
        type: 'daily',
      },
      {
        delay: 5000,           // 延迟5秒执行（演示用，生产环境可设置到凌晨）
        attempts: 2,           // 报表生成最多重试2次
        backoff: {
          type: 'fixed',       // 固定间隔重试
          delay: 10000,        // 每次重试间隔10秒
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `日报表任务已入队: 日期${today}, 延迟5秒执行, 任务ID: ${job.id}`,
    );

    return {
      message: '报表生成任务已添加到队列（延迟5秒执行）',
      jobId: job.id,
      queueName: 'report',
      delay: 5000,
    };
  }

  /**
   * 获取队列统计信息
   *
   * 返回每个队列的任务状态分布：
   * - waiting: 等待处理的任务数
   * - active: 正在处理的任务数
   * - delayed: 延迟中的任务数
   * - completed: 已完成的任务数
   * - failed: 失败的任务数
   *
   * 用途：
   * - 监控队列积压情况
   * - 发现处理瓶颈
   * - 告警（如 waiting 数量过高说明处理能力不足）
   */
  async getQueueStats() {
    // 获取邮件队列统计
    const emailCounts = await this.emailQueue.getJobCounts();
    // 获取报表队列统计
    const reportCounts = await this.reportQueue.getJobCounts();

    return {
      email: {
        ...emailCounts,
        name: 'email',
      },
      report: {
        ...reportCounts,
        name: 'report',
      },
      summary: {
        totalWaiting: emailCounts.waiting + reportCounts.waiting,
        totalActive: emailCounts.active + reportCounts.active,
        totalCompleted: emailCounts.completed + reportCounts.completed,
        totalFailed: emailCounts.failed + reportCounts.failed,
      },
    };
  }
}
