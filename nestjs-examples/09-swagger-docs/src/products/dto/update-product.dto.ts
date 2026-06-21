/**
 * 更新商品 DTO
 *
 * 学习要点：
 * 1. 使用 PartialType 将所有字段变为可选
 *    来自 @nestjs/mapped-types
 * 2. PartialType 会保留原有的验证规则和 Swagger 装饰器
 * 3. 类似的工具：PickType（选择字段）、OmitType（排除字段）
 */
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsInt } from 'class-validator';

/**
 * 更新商品 DTO
 *
 * 所有字段都是可选的（PATCH 语义）
 * 只更新提供的字段
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    description: '商品名称',
    example: 'iPhone 15 Pro Max 512GB',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '商品描述',
    example: '升级款，更大存储空间',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '商品价格',
    example: 11999.00,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: '库存数量',
    example: 200,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    description: '商品分类',
    example: '电子产品',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: '商品图片 URL 列表',
    type: [String],
  })
  @IsOptional()
  images?: string[];
}
