/**
 * 用户服务
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: '***',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      username: 'merchant1',
      email: 'merchant1@example.com',
      password: '***',
      role: 'merchant',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 3,
      username: 'user1',
      email: 'user1@example.com',
      password: '***',
      role: 'user',
      createdAt: new Date('2024-02-01'),
    },
  ];

  private nextId = 4;

  findAll() {
    return {
      code: 200,
      data: this.users.map(({ password, ...user }) => user),
    };
  }

  findOne(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`用户 #${id} 不存在`);
    }
    const { password, ...result } = user;
    return { code: 200, data: result };
  }

  create(createUserDto: CreateUserDto) {
    // 检查用户名和邮箱是否重复
    const exists = this.users.find(
      (u) =>
        u.username === createUserDto.username ||
        u.email === createUserDto.email,
    );
    if (exists) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const user: User = {
      id: this.nextId++,
      ...createUserDto,
      password: '***', // 模拟密码哈希
      role: createUserDto.role || 'user',
      createdAt: new Date(),
    };
    this.users.push(user);

    const { password, ...result } = user;
    return { code: 201, message: '用户创建成功', data: result };
  }
}
