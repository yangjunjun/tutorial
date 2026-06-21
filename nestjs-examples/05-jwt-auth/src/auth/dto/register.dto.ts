/**
 * 注册数据传输对象（DTO）
 *
 * 学习要点：
 * 1. class-validator 装饰器用于自动验证请求体
 * 2. 每个字段可以定义多条验证规则
 * 3. NestJS 配合 ValidationPipe 自动返回友好的错误信息
 */
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  /**
   * 用户名
   * - 必须是字符串
   * - 不能为空
   * - 长度限制 3~20 个字符
   */
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  username: string;

  /**
   * 密码
   * - 必须是字符串
   * - 不能为空
   * - 最少 6 个字符（安全要求）
   */
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;

  /**
   * 邮箱
   * - 必须符合邮箱格式
   * - 不能为空
   */
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;
}
