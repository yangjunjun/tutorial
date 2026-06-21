/**
 * 报表任务处理器 - 处理报表生成队列中的任务
 *
 * 学习点：
 * 1. 独立的报表队列：与邮件队列分离，避免报表任务阻塞邮件发送
 * 2. 全局队列事件监听：@OnGlobalQueueActive、@OnGlobalQueueCompleted
 * 3. 任务优先级和延迟执行
 *
 * 为什么报表和邮件分开队列？
 * - 邮件发送通常很快（秒级），报表生成可能很慢（分钟级）
 * - 混合在一个队列中，邮件可能需要等报表生成完才能发送
 * - 分离队列可以为不同类型的任务分配不同的资源和并发策略
 */
import { Process, Processor, OnGlobalQueueActive, OnGlobalQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('report')  // 绑定到 'report' 队列
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  /**
   * 处理每日销售报表生成
   *
   * 任务数据：
   * - date: 报表日期
   * - type: 报表类型 (daily/weekly/monthly)
   */
  @Process('daily-sales-report')
  async handleDailyReport(job: Job<{ date: string; type: string }>) {
    this.logger.log(`[报表任务 ${job.id}] 开始生成 ${job.data.type} 报表...`);
    this.logger.log(`  报表日期: ${job.data.date}`);

    // 步骤1：聚合数据（模拟）
    this.logger.log('  步骤1/4: 聚合销售数据...');
    await this.simulateDelay(1500);

    // 步骤2：计算统计数据
    this.logger.log('  步骤2/4: 计算统计数据...');
    await this.simulateDelay(800);

    // 步骤3：生成报表文件
    this.logger.log('  步骤3/4: 生成报表文件...');
    await this.simulateDelay(1000);

    // 步骤4：发送邮件通知
    this.logger.log('  步骤4/4: 发送通知邮件...');
    await this.simulateDelay(500);

    const reportData = {
      date: job.data.date,
      type: job.data.type,
      totalOrders: Math.floor(Math.random() * 100) + 50,
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`[报表任务 ${job.id}] 报表生成完成!`);
    this.logger.log(`  订单数: ${reportData.totalOrders}`);
    this.logger.log(`  收入: ¥${reportData.totalRevenue}`);

    return reportData;
  }

  /**
   * 全局队列事件：任何队列的任务开始处理时触发
   *
   * @OnGlobalQueueActive 监听所有队列的任务激活事件
   * 用途：全局监控、资源调度
   */
  @OnGlobalQueueActive()
  onGlobalActive(queueName: string, job: Job) {
    this.logger.debug(`[全局事件] 队列 "${queueName}" 开始处理任务: ${job.id}`);
  }

  /**
   * 全局队列事件：任何队列的任务完成时触发
   *
   * @OnGlobalQueueCompleted 监听所有队列的任务完成事件
   * 用途：全局统计、完成后处理
   */
  @OnGlobalQueueCompleted()
  onGlobalCompleted(queueName: string, job: Job, result: any) {
    this.logger.debug(
      `[全局事件] 队列 "${queueName}" 任务完成: ${job.id}`,
    );
  }

  /**
   * 模拟异步延迟
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
