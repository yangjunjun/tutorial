/**
 * 更新商品 DTO
 *
 * 使用 PartialType 使所有字段可选
 * 注意：这里手动实现而非使用 @nestjs/mapped-types，以保持简单
 */
import { IsString, IsNumber, IsOptional, Min, IsInt } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;
}
