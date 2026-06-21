/**
 * 创建商品 DTO
 */
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: '商品名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格格式不正确' })
  @Min(0, { message: '价格不能为负数' })
  price: number;

  @IsInt({ message: '库存必须是整数' })
  @Min(0, { message: '库存不能为负数' })
  stock: number;
}
