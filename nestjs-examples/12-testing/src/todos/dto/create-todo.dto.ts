/**
 * 创建 Todo 的 DTO (Data Transfer Object)
 *
 * 使用 class-validator 装饰器来定义验证规则。
 * 这些规则会在请求到达控制器之前被 ValidationPipe 自动执行。
 */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Priority } from '../interfaces/todo.interface';

export class CreateTodoDto {
  /**
   * 标题 - 必填字段
   * @IsString() 确保值为字符串类型
   * @IsNotEmpty() 确保值不为空
   * @MinLength(1) 确保最小长度为1
   */
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MinLength(1, { message: '标题最少需要1个字符' })
  title: string;

  /**
   * 描述 - 可选字段
   * @IsOptional() 标记为可选，如果未提供则跳过后续验证
   * @IsString() 如果提供了值，则必须是字符串
   */
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  /**
   * 优先级 - 可选字段，默认值为 MEDIUM
   * @IsEnum() 确保值是枚举中的有效值
   */
  @IsOptional()
  @IsEnum(Priority, {
    message: '优先级必须是 LOW、MEDIUM 或 HIGH 之一',
  })
  priority?: Priority = Priority.MEDIUM;
}
