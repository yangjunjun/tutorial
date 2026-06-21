/**
 * 创建分类的数据传输对象（DTO）
 */
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  /**
   * 分类名称 - 必填，字符串，最大长度 50
   */
  @IsString({ message: '分类名称必须是字符串' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @MaxLength(50, { message: '分类名称不能超过 50 个字符' })
  name: string;
}
