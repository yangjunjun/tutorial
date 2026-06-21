/**
 * 创建商品 DTO（含 Swagger 文档）
 *
 * 学习要点：
 * 1. @ApiProperty 为每个字段提供详细的文档说明
 * 2. example 属性在 Swagger UI 中显示示例值
 * 3. required 属性标记字段是否为必填
 * 4. class-validator 和 @ApiProperty 互补使用
 * 5. enum 属性用于限定可选值范围
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
  Max,
} from 'class-validator';

export class CreateProductDto {
  /**
   * 商品名称
   */
  @ApiProperty({
    description: '商品名称，必填',
    example: 'iPhone 15 Pro Max 256GB',
    minLength: 1,
    maxLength: 200,
  })
  @IsString({ message: '商品名称必须是字符串' })
  @IsNotEmpty({ message: '商品名称不能为空' })
  name: string;

  /**
   * 商品描述（可选）
   */
  @ApiPropertyOptional({
    description: '商品描述，支持 HTML 格式',
    example: '全新 A17 Pro 芯片，钛金属设计，48MP 主摄像头',
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * 商品价格
   */
  @ApiProperty({
    description: '商品价格（元），精确到分',
    example: 9999.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格最多两位小数' })
  @Min(0, { message: '价格不能为负数' })
  price: number;

  /**
   * 库存数量
   */
  @ApiProperty({
    description: '库存数量',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsInt({ message: '库存必须是整数' })
  @Min(0, { message: '库存不能为负数' })
  stock: number;

  /**
   * 商品分类
   */
  @ApiProperty({
    description: '商品分类',
    example: '电子产品',
    enum: ['电子产品', '服装', '食品', '图书', '家居', '其他'],
  })
  @IsString()
  @IsNotEmpty({ message: '商品分类不能为空' })
  category: string;

  /**
   * 商品图片 URL 列表（可选）
   */
  @ApiPropertyOptional({
    description: '商品图片 URL 列表',
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    type: [String],
  })
  @IsOptional()
  images?: string[];
}
