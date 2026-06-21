/**
 * 狗狗服务（Provider）
 *
 * 简单的内存 CRUD 服务，演示基本的提供者模式。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDogDto } from './dto/create-dog.dto';

// 狗狗数据接口
export interface Dog {
  id: number;
  name: string;
  age: number;
  breed: string;
  createdAt: Date;
}

@Injectable()
export class DogsService {
  // 内存数据存储
  private dogs: Dog[] = [];
  private nextId = 1;

  /**
   * 获取所有狗狗
   */
  findAll(): Dog[] {
    console.log('[Service:Dogs] 查询所有狗狗');
    return this.dogs;
  }

  /**
   * 根据 ID 获取单个狗狗
   */
  findOne(id: number): Dog {
    console.log(`[Service:Dogs] 查询 ID=${id} 的狗狗`);
    const dog = this.dogs.find((d) => d.id === id);

    if (!dog) {
      throw new NotFoundException(`未找到 ID 为 ${id} 的狗狗`);
    }

    return dog;
  }

  /**
   * 创建新狗狗
   */
  create(dto: CreateDogDto): Dog {
    const dog: Dog = {
      id: this.nextId++,
      name: dto.name,
      age: dto.age,
      breed: dto.breed || '未知品种',
      createdAt: new Date(),
    };

    this.dogs.push(dog);
    console.log(`[Service:Dogs] 创建狗狗: ${dog.name} (ID=${dog.id})`);
    return dog;
  }

  /**
   * 删除狗狗
   */
  remove(id: number): void {
    const index = this.dogs.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new NotFoundException(`未找到 ID 为 ${id} 的狗狗`);
    }

    const removed = this.dogs.splice(index, 1)[0];
    console.log(`[Service:Dogs] 删除狗狗: ${removed.name} (ID=${removed.id})`);
  }
}
