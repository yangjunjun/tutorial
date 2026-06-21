/**
 * 创建订单 DTO (Data Transfer Object)
 *
 * 学习点：
 * 1. class-validator 装饰器用于请求体验证
 * 2. class-transformer 用于嵌套对象的类型转换
 * 3. DTO 模式确保控制器只接收经过验证的数据
 * 4. 嵌套验证：订单项和收货地址也需要验证
 */
import {
  IsArray,
  IsInt,
  IsString,
  IsNotEmpty,
  Min,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// ========== 订单项 DTO ==========
// 每个订单项包含商品ID和数量
export class OrderItemDto {
  @IsInt({ message: '商品ID必须是整数' })
  @Min(1, { message: '商品ID必须大于0' })
  productId: number;

  @IsInt({ message: '数量必须是整数' })
  @Min(1, { message: '购买数量至少为1' })
  quantity: number;
}

// ========== 收货地址 DTO ==========
// 独立的收货地址信息，与用户账户地址可以不同
export class ShippingAddressDto {
  @IsString({ message: '收件人姓名必须是字符串' })
  @IsNotEmpty({ message: '收件人姓名不能为空' })
  name: string;

  @IsString({ message: '手机号必须是字符串' })
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString({ message: '地址必须是字符串' })
  @IsNotEmpty({ message: '收货地址不能为空' })
  address: string;
}

// ========== 创建订单主 DTO ==========
// 包含用户ID、订单项列表和收货地址
export class CreateOrderDto {
  @IsInt({ message: '用户ID必须是整数' })
  @Min(1, { message: '用户ID必须大于0' })
  userId: number;

  // 嵌套验证：数组中每个元素都需要符合 OrderItemDto 的规则
  @IsArray({ message: '订单项必须是数组' })
  @ValidateNested({ each: true, message: '每个订单项格式不正确' })
  @Type(() => OrderItemDto)  // class-transformer 将普通对象转换为 OrderItemDto 实例
  items: OrderItemDto[];

  // 嵌套验证：收货地址对象
  @ValidateNested({ message: '收货地址格式不正确' })
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  // 可选的订单备注
  @IsOptional()
  @IsString()
  remark?: string;
}

// ========== 查询订单列表 DTO ==========
// 用于 GET /orders 的查询参数
export class QueryOrdersDto {
  @IsOptional()
  @IsString()
  status?: string;  // 按状态过滤

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;  // 页码，默认第1页

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number = 10;  // 每页数量，默认10条
}
