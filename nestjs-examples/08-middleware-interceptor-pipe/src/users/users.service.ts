/**
 * 用户服务
 *
 * 内存存储实现，演示序列化拦截器对密码字段的处理
 */
import { Injectable, NotFoundException } from '@nestjs/common';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;       // 应在响应中排除
  role: string;
  internalNotes?: string; // 应在响应中排除
}

@Injectable()
export class UsersService {
  // 模拟数据库中的用户数据
  private users: User[] = [
    {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: '$2b$10$hashed_password_1', // bcrypt 哈希密码
      role: 'admin',
      internalNotes: '系统管理员账户',
    },
    {
      id: 2,
      name: 'Bob',
      email: 'bob@example.com',
      password: '$2b$10$hashed_password_2',
      role: 'user',
      internalNotes: '普通测试用户',
    },
    {
      id: 3,
      name: 'Charlie',
      email: 'charlie@example.com',
      password: '$2b$10$hashed_password_3',
      role: 'merchant',
    },
  ];

  /**
   * 获取所有用户
   * 注意：返回的数据中包含 password 字段
   * SerializeInterceptor 会在响应中移除它
   */
  findAll(): User[] {
    return this.users;
  }

  /**
   * 根据 ID 获取用户
   */
  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`用户 #${id} 不存在`);
    }
    return user;
  }
}
