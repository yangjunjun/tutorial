/**
 * 更新商品的数据传输对象（DTO）
 *
 * PartialType 是 @nestjs/mapped-types 提供的工具类型。
 * 它将 CreateProductDto 中的所有字段变为可选（Partial），
 * 这样更新请求只需提交需要修改的字段。
 *
 * NestJS 提供了多种映射类型工具：
 * - PartialType()  → 所有字段变为可选
 * - PickType()     → 选择指定字段
 * - OmitType()     → 排除指定字段
 * - IntersectionType() → 合并两个 DTO
 *
 * 这些工具会自动继承原始 DTO 上的验证装饰器。
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType(CreateProductDto) 等价于：
// class UpdateProductDto {
//   @IsOptional() @IsString() name?: string;
//   @IsOptional() @IsString() description?: string;
//   @IsOptional() @IsNumber() price?: number;
//   @IsOptional() @IsString() category?: string;
//   @IsOptional() @IsNumber() stock?: number;
// }
export class UpdateProductDto extends PartialType(CreateProductDto) {}
