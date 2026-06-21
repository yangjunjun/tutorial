/**
 * 更新订单状态 DTO
 *
 * 学习点：
 * 1. 使用 IsIn 限制状态值的范围（枚举验证）
 * 2. 状态流转规则在服务层实现（而非DTO层），因为流转规则可能涉及业务逻辑
 */
import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

// 允许的订单状态列表
const VALID_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

export class UpdateOrderStatusDto {
  @IsString({ message: '状态必须是字符串' })
  @IsNotEmpty({ message: '状态不能为空' })
  @IsIn(VALID_STATUSES, {
    message: `状态必须是以下值之一: ${VALID_STATUSES.join(', ')}`,
  })
  status: string;

  // 可选的操作备注，例如取消原因
  @IsOptional()
  @IsString()
  remark?: string;
}
