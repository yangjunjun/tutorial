/**
 * 自定义业务异常
 *
 * 学习要点：
 * 1. 继承 HttpException 创建业务异常
 * 2. 可以添加额外的业务字段（businessCode、details）
 * 3. 通过继承可以创建具体的业务异常子类
 *
 * 异常类继承体系：
 * HttpException (NestJS 内置)
 *   └── BusinessException (自定义基类)
 *       ├── InsufficientStockException (库存不足)
 *       └── OrderNotFoundException (订单未找到)
 */
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类
 *
 * 所有业务相关的异常都应继承此类
 * 好处：
 * - 统一的异常格式
 * - BusinessExceptionFilter 可以统一处理
 * - 便于日志分类和监控
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    private readonly businessCode: string = 'BUSINESS_ERROR',
    private readonly details?: any,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    // 调用父类构造函数
    // 第二个参数是 HTTP 状态码
    super(
      {
        message,
        businessCode,
        details,
      },
      status,
    );
  }
}

/**
 * 库存不足异常
 *
 * 使用场景：用户下单时商品库存不够
 */
export class InsufficientStockException extends BusinessException {
  constructor(productName: string, requested: number, available: number) {
    super(
      `商品「${productName}」库存不足：需要 ${requested} 件，当前库存 ${available} 件`,
      'INSUFFICIENT_STOCK',
      { productName, requested, available },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 订单未找到异常
 *
 * 使用场景：查询或操作不存在的订单
 */
export class OrderNotFoundException extends BusinessException {
  constructor(orderId: string) {
    super(
      `订单 ${orderId} 不存在`,
      'ORDER_NOT_FOUND',
      { orderId },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * 余额不足异常
 *
 * 使用场景：用户余额不够完成支付
 */
export class InsufficientBalanceException extends BusinessException {
  constructor(required: number, current: number) {
    super(
      `余额不足：需要 ${required} 元，当前余额 ${current} 元`,
      'INSUFFICIENT_BALANCE',
      { required, current },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
