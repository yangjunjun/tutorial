/**
 * 定时任务服务 - 自动化业务操作
 *
 * 学习点：
 * 1. @nestjs/schedule 模块提供 Cron 装饰器
 * 2. Cron 表达式语法：分 时 日 月 周
 * 3. 定时任务的幂等性设计
 * 4. 错误处理：定时任务中的异常不应该导致服务崩溃
 *
 * Cron 表达式速查 (5位: 分 时 日 月 周)：
 * - "* * * * *"     每分钟
 * - "0 * * * *"     每小时整点
 * - "0 0 * * *"     每天凌晨0点
 * - "0 9 * * *"     每天早上9点
 * - "0 0 * * 1"     每周一凌晨
 * - "0 0 1 * *"     每月1号凌晨
 *
 * NestJS Cron 支持6位表达式（多一个秒字段: 秒 分 时 日 月 周）：
 * - "* * * * * *"       每秒
 * - "0 *\/5 * * * *"    每5分钟
 * - "0 0 * * * *"       每小时
 * - "0 0 0 * * *"       每天凌晨
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 检查并取消超时未支付的订单
   *
   * Cron: "0 *\/5 * * * *" = 每5分钟执行一次（演示用每5秒）
   * 超时规则：创建超过30分钟仍未支付的订单自动取消
   *
   * 为什么需要自动取消：
   * 1. 释放库存：未支付的订单占用了库存，影响其他用户购买
   * 2. 数据清理：避免大量无效订单堆积
   * 3. 用户体验：用户可以明确知道订单已过期，而非一直等待
   *
   * 幂等性设计：
   * - 只查询 PENDING 状态的订单
   * - 取消操作使用事务保证原子性
   * - 即使多次执行，结果也一致
   */
  @Cron('*/5 * * * * *')  // 每5秒执行（演示用，生产环境改为每5分钟）
  async cancelExpiredOrders() {
    const TIMEOUT_MINUTES = 30;
    const timeoutDate = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    try {
      // 查找所有超时的待支付订单
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: timeoutDate },
        },
        include: { items: true },
      });

      if (expiredOrders.length === 0) {
        return;  // 没有超时订单，静默返回
      }

      this.logger.log(`发现 ${expiredOrders.length} 个超时未支付订单，开始处理...`);

      // 逐个处理超时订单（也可以用事务批量处理）
      for (const order of expiredOrders) {
        try {
          // 事务：取消订单 + 恢复库存
          await this.prisma.$transaction(async (tx) => {
            // 更新订单状态为已取消
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED' },
            });

            // 恢复每个商品的库存
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          });

          this.logger.log(
            `超时订单已取消: ${order.orderNo} (创建时间: ${order.createdAt.toISOString()})`,
          );
        } catch (error) {
          // 单个订单处理失败不影响其他订单
          this.logger.error(
            `取消超时订单失败: ${order.orderNo}, 错误: ${error.message}`,
          );
        }
      }

      this.logger.log(`超时订单处理完成，共处理 ${expiredOrders.length} 个`);
    } catch (error) {
      // 顶层异常捕获：定时任务不应该抛出未捕获的异常
      this.logger.error(`检查超时订单时发生错误: ${error.message}`);
    }
  }

  /**
   * 每日销售统计
   *
   * Cron: "0 0 0 * * *" = 每天凌晨 0:00
   * （NestJS 使用6位 Cron 表达式，第一位是秒）
   *
   * 功能：统计前一天的销售数据
   * 生产环境中通常会：
   * 1. 将统计结果存入报表数据库
   * 2. 发送邮件或消息通知运营人员
   * 3. 更新商品销量排名
   */
  @Cron('0 0 0 * * *')
  async dailySalesStatistics() {
    this.logger.log('开始执行每日销售统计...');

    try {
      // 计算昨天的时间范围
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 查询昨天的所有已支付订单
      const orders = await this.prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'SHIPPED', 'COMPLETED'] },
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // 计算统计数据
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalItems = orders.reduce(
        (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
        0,
      );

      // 商品销售排行
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const order of orders) {
        for (const item of order.items) {
          const key = item.productId.toString();
          if (!productSales[key]) {
            productSales[key] = { name: item.product.name, quantity: 0, revenue: 0 };
          }
          productSales[key].quantity += item.quantity;
          productSales[key].revenue += item.unitPrice * item.quantity;
        }
      }

      // 按销量排序
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // 输出统计结果（生产环境中应该存入数据库或发送通知）
      this.logger.log('========== 每日销售统计 ==========');
      this.logger.log(`日期: ${yesterday.toISOString().split('T')[0]}`);
      this.logger.log(`订单数: ${totalOrders}`);
      this.logger.log(`总收入: ${totalRevenue.toFixed(2)} 元`);
      this.logger.log(`商品销量: ${totalItems} 件`);
      if (topProducts.length > 0) {
        this.logger.log(`热销商品: ${JSON.stringify(topProducts, null, 2)}`);
      }
      this.logger.log('==================================');
    } catch (error) {
      this.logger.error(`每日统计执行失败: ${error.message}`);
    }
  }

  /**
   * 健康检查定时任务（可选）
   * 每10分钟检查一次系统状态
   *
   * Cron: "0 *\/10 * * * *" = 每10分钟
   */
  @Cron('0 */10 * * * *')
  async healthCheck() {
    try {
      // 检查数据库连接
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.debug('系统健康检查通过');
    } catch (error) {
      this.logger.error(`健康检查失败: ${error.message}`);
      // 生产环境中应该发送告警通知
    }
  }
}
