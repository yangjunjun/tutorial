/**
 * 商品服务
 *
 * 内存存储实现，专注于演示 Swagger 文档生成
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

// 商品类型
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  // 内存商品数据
  private products: Product[] = [
    {
      id: 1,
      name: 'iPhone 15 Pro Max 256GB',
      description: '全新 A17 Pro 芯片，钛金属设计，48MP 主摄像头',
      price: 9999,
      stock: 50,
      category: '电子产品',
      images: ['https://example.com/iphone15.jpg'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 2,
      name: 'MacBook Pro 14" M3',
      description: 'M3 芯片，18GB 内存，512GB SSD',
      price: 14999,
      stock: 30,
      category: '电子产品',
      images: ['https://example.com/macbook.jpg'],
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 3,
      name: '纯棉 T 恤',
      description: '100% 纯棉，舒适透气',
      price: 99,
      stock: 500,
      category: '服装',
      images: ['https://example.com/tshirt.jpg'],
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
    },
  ];

  private nextId = 4;

  /**
   * 分页查询商品
   */
  findAll(paginationDto: PaginationDto, category?: string) {
    let filtered = this.products;

    // 按分类筛选
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    const { page = 1, limit = 10, sortBy, order = 'desc' } = paginationDto;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      code: 200,
      data: {
        items,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  /**
   * 获取单个商品
   */
  findOne(id: number) {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }
    return { code: 200, data: product };
  }

  /**
   * 创建商品
   */
  create(createProductDto: CreateProductDto) {
    const product: Product = {
      id: this.nextId++,
      ...createProductDto,
      images: createProductDto.images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(product);
    return { code: 201, message: '商品创建成功', data: product };
  }

  /**
   * 更新商品
   */
  update(id: number, updateProductDto: UpdateProductDto) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    this.products[index] = {
      ...this.products[index],
      ...updateProductDto,
      updatedAt: new Date(),
    };

    return { code: 200, message: '商品更新成功', data: this.products[index] };
  }

  /**
   * 删除商品
   */
  remove(id: number) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    this.products.splice(index, 1);
    return { code: 200, message: `商品 #${id} 已删除` };
  }
}
