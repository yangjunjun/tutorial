/**
 * 商品服务 - 使用 Prisma ORM 进行数据库操作
 *
 * 本文件详细演示了 Prisma 的各种查询模式：
 *
 * 1. 基本 CRUD: create, findMany, findUnique, update, delete
 * 2. 关联查询: include（加载关联数据）
 * 3. 分页: skip + take
 * 4. 过滤: where 条件对象
 * 5. 排序: orderBy
 * 6. 聚合: _count（统计数量）
 *
 * Prisma 查询 vs SQL 对比：
 * - findMany()               → SELECT * FROM products
 * - findMany({ where: {} })  → SELECT * FROM products WHERE ...
 * - findMany({ include: {} }) → SELECT ... JOIN ...
 * - findMany({ skip, take }) → SELECT ... LIMIT ... OFFSET ...
 * - create({ data: {} })     → INSERT INTO ...
 * - update({ data, where })  → UPDATE ... WHERE ...
 * - delete({ where })        → DELETE FROM ... WHERE ...
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // 注入全局 PrismaService
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有商品（支持分页和筛选）
   *
   * @param page     - 当前页码（从 1 开始）
   * @param pageSize - 每页数量
   * @param categoryId - 按分类 ID 筛选（可选）
   *
   * Prisma 分页模式：
   * - skip: 跳过的记录数（相当于 SQL 的 OFFSET）
   * - take: 获取的记录数（相当于 SQL 的 LIMIT）
   *
   * 公式：skip = (page - 1) * pageSize
   */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId; // 按分类筛选
    }

    // 并行执行数据查询和总数查询（提高性能）
    const [data, total] = await Promise.all([
      // 查询商品数据
      this.prisma.product.findMany({
        where,
        skip,                              // 跳过前面的记录
        take: pageSize,                    // 限制返回数量
        orderBy: { createdAt: 'desc' },    // 按创建时间倒序
        include: {
          category: true,                  // 包含分类信息（自动 JOIN）
        },
      }),
      // 查询总记录数（用于计算总页数）
      this.prisma.product.count({ where }),
    ]);

    // 返回分页结果
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 根据 ID 获取单个商品
   *
   * include: { category: true } 会自动 JOIN Category 表，
   * 一次性获取商品及其所属分类信息。
   *
   * Prisma 的 findUnique vs findFirst：
   * - findUnique: 通过唯一字段查询（如 @id, @unique）
   * - findFirst:  通过任意条件查询，返回第一条
   */
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true, // 包含分类信息
      },
    });

    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    return product;
  }

  /**
   * 创建新商品
   *
   * Prisma create 的嵌套操作：
   * - connect: 连接已有记录（通过 ID 关联）
   * - create:  同时创建新记录并关联
   *
   * 这里我们使用 connect 将商品连接到已有的分类。
   * 如果分类不存在，Prisma 会抛出外键约束错误。
   */
  async create(dto: CreateProductDto) {
    // 先验证分类是否存在
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`分类 ID ${dto.categoryId} 不存在，请先创建分类`);
    }

    // 创建商品并关联到分类
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
        category: {
          connect: { id: dto.categoryId }, // 连接到已有分类
        },
      },
      include: {
        category: true, // 返回时包含分类信息
      },
    });
  }

  /**
   * 更新商品信息
   *
   * Prisma update：
   * - where: 指定要更新的记录
   * - data:  要更新的字段（只更新传入的字段，其他保持不变）
   *
   * 注意：Prisma 的 update 是"部分更新"，
   * 只会修改 data 中明确提供的字段。
   */
  async update(id: number, dto: UpdateProductDto) {
    // 先检查商品是否存在
    await this.findOne(id);

    // 如果更新了 categoryId，需要验证新分类是否存在
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`分类 ID ${dto.categoryId} 不存在`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * 删除商品
   *
   * Prisma delete vs 软删除：
   * - delete(): 物理删除，记录从数据库中永久移除
   * - 软删除: 添加 deletedAt 字段，查询时过滤
   *
   * 如果需要软删除，可以在 Schema 中添加：
   * deletedAt DateTime?
   *
   * 然后在查询中添加：
   * where: { deletedAt: null }
   *
   * 删除操作不会触发关联数据的自动删除（除非在 Schema 中配置级联删除）。
   * 商品删除后，分类不受影响。
   */
  async remove(id: number) {
    // 先检查商品是否存在
    await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });
  }
}
