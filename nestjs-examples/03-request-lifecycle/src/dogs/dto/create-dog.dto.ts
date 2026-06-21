/**
 * 创建狗狗的数据传输对象（DTO）
 *
 * class-validator 装饰器用于数据验证：
 * - @IsString()   → 必须是字符串
 * - @IsNumber()   → 必须是数字
 * - @IsOptional() → 可选字段
 * - @Min(0)       → 最小值为 0
 * - @IsNotEmpty() → 不能为空
 */
import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateDogDto {
  /**
   * 狗狗名字 - 必填，字符串，不能为空
   */
  @IsString({ message: '名字必须是字符串' })
  @IsNotEmpty({ message: '名字不能为空' })
  name: string;

  /**
   * 狗狗年龄 - 必填，数字，最小值 0
   */
  @IsNumber({}, { message: '年龄必须是数字' })
  @Min(0, { message: '年龄不能为负数' })
  age: number;

  /**
   * 狗狗品种 - 可选
   */
  @IsOptional()
  @IsString({ message: '品种必须是字符串' })
  breed?: string;
}
