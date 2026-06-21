/**
 * 商品实体类
 *
 * 学习要点：
 * 1. Entity 类也可以用 @ApiProperty 标注
 * 2. Swagger 会根据 @ApiProperty 生成响应 Schema
 * 3. Entity 与 DTO 分离，职责更清晰
 */
import { ApiProperty } from '@nestjs/swagger';

export class ProductEntity {
  @ApiProperty({
    description: '商品 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '商品名称',
    example: 'iPhone 15 Pro Max 256GB',
  })
  name: string;

  @ApiProperty({
    description: '商品描述',
    example: '全新 A17 Pro 芯片，钛金属设计',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: '商品价格（元）',
    example: 9999.00,
  })
  price: number;

  @ApiProperty({
    description: '库存数量',
    example: 100,
  })
  stock: number;

  @ApiProperty({
    description: '商品分类',
    example: '电子产品',
  })
  category: string;

  @ApiProperty({
    description: '商品图片 URL 列表',
    example: ['https://example.com/img1.jpg'],
    type: [String],
  })
  images: string[];

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-16T14:20:00.000Z',
  })
  updatedAt: Date;
}
