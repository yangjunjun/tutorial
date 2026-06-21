/**
 * 商品服务（Provider / Service）
 *
 * @Injectable() 装饰器的作用：
 * 1. 标记这个类可以被 NestJS 的 IoC（控制反转）容器管理
 * 2. 允许这个类被注入到其他类（如 Controller）的构造函数中
 * 3. NestJS 会自动创建单例实例并管理其生命周期
 *
 * 依赖注入（DI）是 NestJS 的核心设计模式：
 * - 传统方式：const service = new ProductsService()
 * - DI 方式：constructor(private readonly service: ProductsService) {}
 *
 * 好处：
 * - 解耦：控制器不需要知道服务的创建细节
 * - 可测试：可以轻松替换为 Mock 对象
 * - 生命周期管理：NestJS 自动管理单例/请求级/临时实例
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './interfaces/product.interface';

@Injectable() // 标记为可注入的提供者
export class ProductsService {
  // 内存数据存储（实际项目中会使用数据库）
  private products: Product[] = [];

  /**
   * 查询所有商品（支持筛选）
   *
   * @param category - 按分类筛选（可选）
   * @param minPrice - 最低价格筛选（可选）
   * @param maxPrice - 最高价格筛选（可选）
   */
  findAll(query?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Product[] {
    let result = [...this.products];

    // 按分类筛选
    if (query?.category) {
      result = result.filter((p) => p.category === query.category);
    }

    // 按最低价格筛选
    if (query?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= query.minPrice);
    }

    // 按最高价格筛选
    if (query?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= query.maxPrice);
    }

    return result;
  }

  /**
   * 根据 ID 查询单个商品
   *
   * @throws NotFoundException 当商品不存在时抛出 404 异常
   */
  findOne(id: string): Product {
    const product = this.products.find((p) => p.id === id);

    if (!product) {
      // NestJS 内置的异常类，会自动返回对应的 HTTP 状态码
      throw new NotFoundException(`商品 ID "${id}" 不存在`);
    }

    return product;
  }

  /**
   * 创建新商品
   *
   * 使用 crypto.randomUUID() 生成唯一 ID
   * 这是一个 Node.js 内置函数，无需额外安装 uuid 库
   */
  create(dto: CreateProductDto): Product {
    const product: Product = {
      id: randomUUID(), // 生成 UUID v4
      name: dto.name,
      description: dto.description || '',
      price: dto.price,
      category: dto.category,
      stock: dto.stock ?? 0, // 如果未提供 stock，默认为 0
      createdAt: new Date(),
    };

    this.products.push(product);
    return product;
  }

  /**
   * 更新商品信息
   *
   * 使用 PartialType 的好处：只需要传入要更新的字段
   * Object.assign() 会将 dto 中的字段合并到现有商品对象
   */
  update(id: string, dto: UpdateProductDto): Product {
    const product = this.findOne(id); // 如果不存在会抛出 NotFoundException
    const index = this.products.findIndex((p) => p.id === id);

    // 合并更新字段
    const updatedProduct = { ...product, ...dto };
    this.products[index] = updatedProduct;

    return updatedProduct;
  }

  /**
   * 删除商品
   *
   * @throws NotFoundException 当商品不存在时抛出 404 异常
   */
  remove(id: string): void {
    const index = this.products.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new NotFoundException(`商品 ID "${id}" 不存在`);
    }

    // 使用 splice 从数组中移除
    this.products.splice(index, 1);
  }
}
