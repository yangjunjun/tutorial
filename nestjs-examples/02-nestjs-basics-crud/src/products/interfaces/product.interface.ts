/**
 * 商品接口定义
 *
 * 接口（Interface）用于定义数据结构，在编译时提供类型检查。
 * 接口不会产生运行时代码，仅用于 TypeScript 类型系统。
 *
 * 在 NestJS 项目中，接口通常用于：
 * 1. 定义实体数据结构
 * 2. 定义服务方法返回类型
 * 3. 定义自定义的注入令牌（Injection Token）
 */
export interface Product {
  /** 唯一标识符 */
  id: string;
  /** 商品名称 */
  name: string;
  /** 商品描述 */
  description: string;
  /** 商品价格 */
  price: number;
  /** 商品分类 */
  category: string;
  /** 库存数量 */
  stock: number;
  /** 创建时间 */
  createdAt: Date;
}
