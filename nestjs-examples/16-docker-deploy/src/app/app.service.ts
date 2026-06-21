/**
 * 应用服务层
 *
 * 【服务层职责】
 * Service 是 NestJS 的核心概念，负责：
 * 1. 业务逻辑处理
 * 2. 数据访问和持久化
 * 3. 与外部服务交互
 *
 * 【本示例的简化实现】
 * 使用内存数组存储数据，演示基本的 CRUD 操作。
 * 在生产环境中，应该：
 * - 使用 TypeORM/Prisma 等 ORM 操作数据库
 * - 添加缓存层（Redis）
 * - 实现分页和过滤
 * - 添加数据验证和转换
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

/**
 * 数据项接口
 */
export interface Item {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建数据项的 DTO（Data Transfer Object）
 */
export interface CreateItemDto {
  name: string;
  description?: string;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  // 内存数据存储（演示用）
  // 在生产环境中替换为数据库操作
  private items: Item[] = [
    {
      id: 1,
      name: '示例项目 1',
      description: '这是一个演示数据项',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: '示例项目 2',
      description: '这是另一个演示数据项',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 自增 ID 计数器
  private nextId = 3;

  /**
   * 获取应用信息
   * 返回 API 的基本信息和版本
   */
  getApiInfo() {
    return {
      name: process.env.APP_NAME || 'nestjs-docker-demo',
      version: process.env.APP_VERSION || '1.0.0',
      description: 'NestJS Docker 容器化部署示例 API',
      documentation: '/api/docs',
      healthCheck: '/health',
      metrics: '/metrics',
      endpoints: {
        items: {
          list: 'GET /api/v1/items',
          get: 'GET /api/v1/items/:id',
          create: 'POST /api/v1/items',
        },
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 获取所有数据项
   *
   * 在生产环境中，这里应该：
   * 1. 调用 Repository 从数据库查询
   * 2. 支持分页参数（page, limit）
   * 3. 支持排序和过滤
   * 4. 添加缓存
   */
  findAll(): Item[] {
    this.logger.debug(`查询所有数据项，当前数量: ${this.items.length}`);
    return this.items;
  }

  /**
   * 根据 ID 获取单个数据项
   *
   * @throws NotFoundException 当数据项不存在时
   */
  findOne(id: number): Item {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      // NestJS 的 NotFoundException 会自动返回 404 状态码
      // 并被全局异常过滤器捕获
      throw new NotFoundException(`数据项 #${id} 不存在`);
    }
    this.logger.debug(`查询数据项 #${id}: ${item.name}`);
    return item;
  }

  /**
   * 创建新的数据项
   *
   * 在生产环境中，这里应该：
   * 1. 验证输入数据（使用 class-validator）
   * 2. 调用 Repository 保存到数据库
   * 3. 发送事件通知（EventEmitter）
   * 4. 记录审计日志
   */
  create(createItemDto: CreateItemDto): Item {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: this.nextId++,
      name: createItemDto.name,
      description: createItemDto.description || '',
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(newItem);
    this.logger.log(`创建数据项 #${newItem.id}: ${newItem.name}`);

    return newItem;
  }
}
