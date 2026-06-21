/**
 * 用户响应 DTO
 *
 * 学习要点：
 * 1. @Exclude() 标记不需要在响应中暴露的字段
 * 2. @Expose() 标记需要暴露的字段
 * 3. class-transformer 在序列化时会根据装饰器决定字段是否包含
 *
 * 典型场景：
 * - 密码字段不应出现在响应中
 * - 内部 ID 不应暴露给客户端
 */
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  // 密码字段使用 @Exclude() 标记
  // 序列化时会自动移除
  @Exclude()
  password: string;

  // 内部字段，不应暴露
  @Exclude()
  internalNotes?: string;
}
