/**
 * 注册 DTO（包含角色字段）
 *
 * 学习要点：
 * 1. 使用 IsEnum 验证枚举值
 * 2. IsOptional 标记可选字段
 * 3. 默认角色为 USER
 */
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';

// 角色枚举（与 Prisma schema 中的 Role 对应）
export enum Role {
  USER = 'USER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  // 角色字段是可选的，默认为 USER
  @IsOptional()
  @IsEnum(Role, { message: '角色必须是 USER、MERCHANT 或 ADMIN' })
  role?: Role;
}
