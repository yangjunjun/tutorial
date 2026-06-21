/**
 * 登录数据传输对象（DTO）
 *
 * 学习要点：
 * 1. 登录只需要用户名和密码
 * 2. 验证规则相对简单
 * 3. Local 策略和手动登录都使用此 DTO
 */
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * 用户名
   */
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  /**
   * 密码
   */
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;
}
