/**
 * 更新 Todo 的 DTO
 *
 * 所有字段都是可选的，只更新提供的字段。
 * 验证规则与 CreateTodoDto 类似。
 */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Priority } from '../interfaces/todo.interface';

export class UpdateTodoDto {
  /** 标题 - 可选 */
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  @MinLength(1, { message: '标题最少需要1个字符' })
  title?: string;

  /** 描述 - 可选 */
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  /** 优先级 - 可选 */
  @IsOptional()
  @IsEnum(Priority, {
    message: '优先级必须是 LOW、MEDIUM 或 HIGH 之一',
  })
  priority?: Priority;

  /** 是否已完成 - 可选 */
  @IsOptional()
  @IsBoolean({ message: 'completed 必须是布尔值' })
  completed?: boolean;
}
