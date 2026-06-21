/**
 * 猫咪服务
 *
 * 简单的内存存储实现，用于演示控制器中各种装饰器的使用
 */
import { Injectable, NotFoundException } from '@nestjs/common';

// 猫咪类型定义
export interface Cat {
  id: string;
  name: string;
  age: number;
  breed: string;
  createdAt: Date;
}

@Injectable()
export class CatsService {
  // 内存存储
  private cats: Cat[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Tom',
      age: 3,
      breed: '英短',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      name: 'Jerry',
      age: 2,
      breed: '美短',
      createdAt: new Date('2024-03-20'),
    },
    {
      id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      name: 'Garfield',
      age: 5,
      breed: '橘猫',
      createdAt: new Date('2023-11-10'),
    },
  ];

  /**
   * 分页查询猫咪列表
   */
  findAll(page: number = 1, limit: number = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = this.cats.slice(start, end);

    return {
      items,
      total: this.cats.length,
      page,
      limit,
      totalPages: Math.ceil(this.cats.length / limit),
    };
  }

  /**
   * 根据 ID 查找猫咪
   */
  findOne(id: string) {
    const cat = this.cats.find((c) => c.id === id);
    if (!cat) {
      throw new NotFoundException(`猫咪 #${id} 不存在`);
    }
    return cat;
  }

  /**
   * 创建猫咪
   */
  create(data: { name: string; age: number; breed?: string }) {
    const cat: Cat = {
      id: this.generateId(),
      name: data.name,  // TrimPipe 会自动去除前后空格
      age: data.age,
      breed: data.breed || '未知',
      createdAt: new Date(),
    };
    this.cats.push(cat);
    return cat;
  }

  /**
   * 生成简单 UUID
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
