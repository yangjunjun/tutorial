/**
 * 商品服务
 *
 * 学习要点：
 * 1. 所有权过滤：商家只能操作自己的商品
 * 2. 角色判断：ADMIN 可以操作所有商品
 * 3. ForbiddenException 用于权限不足的情况
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取商品列表
   * - ADMIN: 查看所有商品
   * - MERCHANT: 只查看自己的商品
   * - USER: 查看所有商品（浏览模式）
   */
  async findAll(user: any) {
    // 管理员和用户可以查看所有商品
    if (user.role === 'ADMIN' || user.role === 'USER') {
      return this.prisma.product.findMany({
        include: { owner: { select: { id: true, username: true } } },
      });
    }

    // 商家只能查看自己的商品（所有权过滤）
    return this.prisma.product.findMany({
      where: { ownerId: user.id },
      include: { owner: { select: { id: true, username: true } } },
    });
  }

  /**
   * 获取公开商品列表（不需要认证）
   */
  async findPublicProducts() {
    return this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取单个商品
   */
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { owner: { select: { id: true, username: true } } },
    });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    return product;
  }

  /**
   * 创建商品
   * 自动关联当前用户作为商品所有者
   */
  async create(createProductDto: CreateProductDto, user: any) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        ownerId: user.id, // 设置商品所有者
      },
      include: { owner: { select: { id: true, username: true } } },
    });
  }

  /**
   * 更新商品
   * - ADMIN: 可以更新任何商品
   * - MERCHANT: 只能更新自己的商品
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    user: any,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    // 所有权检查：商家只能修改自己的商品
    if (user.role !== 'ADMIN' && product.ownerId !== user.id) {
      throw new ForbiddenException('你只能修改自己的商品');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: { owner: { select: { id: true, username: true } } },
    });
  }

  /**
   * 删除商品
   * 仅 ADMIN 角色可以调用此方法（由 RolesGuard 保证）
   */
  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: `商品 #${id} 已删除` };
  }
}
