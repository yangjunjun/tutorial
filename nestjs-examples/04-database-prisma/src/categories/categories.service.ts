/**
 * 分类服务
 *
 * 演示 Prisma 的基本 CRUD 操作：
 * - findMany()  → 查询多条记录
 * - findUnique() → 查询单条记录
 * - create()    → 创建记录
 * - update()    → 更新记录
 * - delete()    → 删除记录
 *
 * Prisma 查询的特点：
 * 1. 类型安全：所有查询方法都有完整的 TypeScript 类型提示
 * 2. 关联查询：使用 include 可以自动加载关联数据
 * 3. 过滤条件：使用 where 对象定义查询条件
 * 4. 排序分页：使用 orderBy, skip, take
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  // 注入 PrismaService（由 PrismaModule 全局导出）
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有分类
   *
   * Prisma 查询语法：
   * - findMany() → 查询所有记录
   * - include    → 包含关联数据（类似 SQL JOIN）
   * - orderBy    → 排序规则
   */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' }, // 按创建时间倒序
      include: {
        // 包含关联的商品数量统计
        _count: {
          select: { products: true }, // 统计每个分类下的商品数量
        },
      },
    });
  }

  /**
   * 根据 ID 获取单个分类（包含关联商品）
   *
   * include: { products: true } 会自动执行 JOIN 查询，
   * 一次性获取分类及其所有关联商品。
   * 这比手动查询两次要高效得多。
   */
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`分类 ID ${id} 不存在`);
    }

    return category;
  }

  /**
   * 创建新分类
   *
   * Prisma 的 create() 方法会自动处理：
   * - 数据类型验证
   * - 唯一约束检查
   * - 默认值填充
   *
   * 如果违反唯一约束，Prisma 会抛出 P2002 错误。
   * 我们将其转换为 NestJS 的 ConflictException (409)。
   */
  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
        },
      });
    } catch (error) {
      // Prisma 唯一约束冲突错误码: P2002
      if (error.code === 'P2002') {
        throw new ConflictException(`分类名称 "${dto.name}" 已存在`);
      }
      throw error;
    }
  }

  /**
   * 删除分类
   *
   * 注意：如果分类下有关联商品，直接删除会失败（外键约束）。
   * 需要先删除/转移关联商品，或使用级联删除。
   */
  async remove(id: number) {
    // 先检查分类是否存在
    await this.findOne(id);

    try {
      await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      // 外键约束错误
      if (error.code === 'P2003') {
        throw new ConflictException(
          `无法删除分类：该分类下还有关联商品。请先删除或转移商品。`,
        );
      }
      throw error;
    }
  }
}
