/**
 * 订单接口定义
 *
 * 共享类型定义 - 在网关和通知微服务之间共用。
 * 在实际项目中，这些类型通常会放在一个共享包(shared package)中，
 * 或者通过 Protocol Buffers / OpenAPI 规范来定义。
 */

/** 订单状态枚举 */
export enum OrderStatus {
  /** 待处理 */
  PENDING = 'PENDING',
  /** 已确认 */
  CONFIRMED = 'CONFIRMED',
  /** 已发货 */
  SHIPPED = 'SHIPPED',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

/** 订单数据接口 - 微服务之间传递的订单信息 */
export interface OrderData {
  /** 订单 ID */
  id: string;
  /** 客户邮箱 */
  customerEmail: string;
  /** 客户名称 */
  customerName: string;
  /** 商品列表 */
  items: OrderItem[];
  /** 总金额 */
  totalAmount: number;
  /** 订单状态 */
  status: OrderStatus;
  /** 创建时间 */
  createdAt: string;
}

/** 订单商品项 */
export interface OrderItem {
  /** 商品名称 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 单价 */
  price: number;
}

/** 通知计数响应 */
export interface NotificationCountResponse {
  /** 总通知数 */
  total: number;
  /** 按类型分组 */
  byType: {
    orderCreated: number;
    orderCancelled: number;
  };
}
