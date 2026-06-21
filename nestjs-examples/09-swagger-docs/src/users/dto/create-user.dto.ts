/**
 * 创建用户 DTO（含 Swagger 文档）
 *
 * 学习要点：
 * 1. @ApiProperty 的多种配置选项
 * 2. format 属性（email、password 等）
 * 3. 与 class-validator 验证规则对应
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export class CreateUserDto {
  @ApiProperty({
    description: '用户名，3~20 个字符',
    example: 'john_doe',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'john@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码，最少 6 个字符',
    example: 'StrongP@ss123',
    format: 'password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;

  @ApiPropertyOptional({
    description: '用户角色',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: '用户头像 URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: '手机号',
    example: '+86 13800138000',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
