/**
 * 分页 DTO
 *
 * 学习要点：
 * 1. @ApiProperty 为每个字段提供文档说明
 * 2. @ApiPropertyOptional 用于可选字段
 * 3. 同时使用 class-validator 验证和 Swagger 文档
 * 4. 使用 @ApiProperty 的 example 属性提供示例值
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  /**
   * 页码（从 1 开始）
   */
  @ApiProperty({
    description: '页码，从 1 开始',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiProperty({
    description: '每页数量，默认 10，最大 100',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为 1' })
  @Max(100, { message: '每页数量最大为 100' })
  limit?: number = 10;

  /**
   * 排序字段
   */
  @ApiPropertyOptional({
    description: '排序字段名',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  /**
   * 排序方向
   */
  @ApiPropertyOptional({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  order?: 'asc' | 'desc' = 'desc';
}
