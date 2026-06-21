/**
 * 创建商品的数据传输对象（DTO）
 *
 * DTO（Data Transfer Object）定义了客户端创建资源时需要提交的数据结构。
 *
 * class-validator 装饰器用于数据验证：
 * - @IsString()   → 值必须是字符串
 * - @IsNumber()   → 值必须是数字
 * - @IsOptional() → 字段可选
 * - @Min(n)       → 最小值
 * - @IsNotEmpty() → 不能为空
 * - @MaxLength(n) → 最大长度
 *
 * 这些装饰器利用反射（reflect-metadata）存储验证规则，
 * 然后由 ValidationPipe 在请求到达控制器之前自动验证。
 */
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  /**
   * 商品名称 - 必填，字符串，最大长度 100
   */
  @IsString({ message: '商品名称必须是字符串' })
  @IsNotEmpty({ message: '商品名称不能为空' })
  @MaxLength(100, { message: '商品名称不能超过 100 个字符' })
  name: string;

  /**
   * 商品描述 - 可选，字符串
   */
  @IsOptional()
  @IsString({ message: '商品描述必须是字符串' })
  description?: string;

  /**
   * 商品价格 - 必填，数字，最小值 0
   */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格必须是数字（最多两位小数）' })
  @Min(0, { message: '价格不能为负数' })
  price: number;

  /**
   * 商品分类 - 必填，字符串
   */
  @IsString({ message: '分类必须是字符串' })
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  /**
   * 库存数量 - 可选，数字，最小值 0，默认为 0
   */
  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 0 }, { message: '库存必须是整数' })
  @Min(0, { message: '库存不能为负数' })
  stock?: number;
}
