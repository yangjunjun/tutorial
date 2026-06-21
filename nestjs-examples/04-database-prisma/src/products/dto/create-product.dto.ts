/**
 * 创建商品的数据传输对象（DTO）
 */
import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  /**
   * 商品名称 - 必填
   */
  @IsString({ message: '商品名称必须是字符串' })
  @IsNotEmpty({ message: '商品名称不能为空' })
  @MaxLength(100, { message: '商品名称不能超过 100 个字符' })
  name: string;

  /**
   * 商品描述 - 可选
   */
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  /**
   * 商品价格 - 必填，最小值 0
   */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格必须是数字（最多两位小数）' })
  @Min(0, { message: '价格不能为负数' })
  price: number;

  /**
   * 库存数量 - 可选，默认 0
   */
  @IsOptional()
  @IsInt({ message: '库存必须是整数' })
  @Min(0, { message: '库存不能为负数' })
  stock?: number;

  /**
   * 分类 ID - 必填（外键）
   */
  @IsInt({ message: '分类 ID 必须是整数' })
  categoryId: number;
}
