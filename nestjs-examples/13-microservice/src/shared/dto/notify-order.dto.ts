/**
 * 创建订单通知的 DTO
 *
 * 定义通过微服务通信时传递的数据结构。
 * 在客户端发起请求时使用此 DTO 进行验证。
 */
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 订单商品项 DTO */
export class OrderItemDto {
  @IsString({ message: '商品名称必须是字符串' })
  @IsNotEmpty({ message: '商品名称不能为空' })
  name: string;

  @IsNumber({}, { message: '数量必须是数字' })
  @Min(1, { message: '数量至少为 1' })
  quantity: number;

  @IsNumber({}, { message: '价格必须是数字' })
  @Min(0, { message: '价格不能为负' })
  price: number;
}

/** 创建订单 DTO */
export class CreateOrderDto {
  @IsString({ message: '客户名称必须是字符串' })
  @IsNotEmpty({ message: '客户名称不能为空' })
  customerName: string;

  @IsEmail({}, { message: '客户邮箱格式不正确' })
  customerEmail: string;

  @IsArray({ message: '商品列表必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
