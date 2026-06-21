/**
 * 创建订单 DTO（含 Swagger 文档）
 *
 * 学习要点：
 * 1. 嵌套对象的 Swagger 文档
 * 2. @ApiProperty 的 type 属性描述嵌套类型
 * 3. 数组类型的文档标注
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 订单项 DTO
 * 嵌套在 CreateOrderDto 中使用
 */
export class OrderItemDto {
  @ApiProperty({
    description: '商品 ID',
    example: 1,
  })
  @IsInt({ message: '商品 ID 必须是整数' })
  productId: number;

  @ApiProperty({
    description: '购买数量',
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: '数量必须是整数' })
  @Min(1, { message: '数量至少为 1' })
  quantity: number;

  @ApiPropertyOptional({
    description: '商品备注（如颜色、尺码等）',
    example: '黑色，XL码',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * 创建订单 DTO
 */
export class CreateOrderDto {
  @ApiProperty({
    description: '订单项列表',
    type: [OrderItemDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
  })
  @IsArray({ message: '订单项必须是数组' })
  @ValidateNested({ each: true, message: '每个订单项格式不正确' })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: '收货地址',
    example: '北京市朝阳区xx路xx号',
  })
  @IsString()
  @IsNotEmpty({ message: '收货地址不能为空' })
  shippingAddress: string;

  @ApiPropertyOptional({
    description: '订单备注',
    example: '请在工作日送达',
  })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({
    description: '支付方式',
    example: 'alipay',
    enum: ['alipay', 'wechat', 'credit_card', 'bank_transfer'],
  })
  @IsString()
  @IsNotEmpty({ message: '支付方式不能为空' })
  paymentMethod: string;
}
