/**
 * 正整数解析管道（Pipe）
 *
 * 管道在控制器方法执行之前运行，用于：
 * 1. 转换（Transformation）：将输入数据转换为目标类型
 * 2. 验证（Validation）：检查输入数据是否合法
 *
 * PipeTransform 接口：
 * - transform(value, metadata) 方法
 * - value: 当前参数的值
 * - metadata: 包含参数的元数据（类型、数据等）
 *
 * NestJS 内置管道：
 * - ValidationPipe     → DTO 验证
 * - ParseIntPipe       → 字符串转整数
 * - ParseBoolPipe      → 字符串转布尔
 * - ParseUUIDPipe      → UUID 格式验证
 * - ParseEnumPipe      → 枚举值验证
 * - ParseArrayPipe     → 数组解析
 *
 * 自定义管道的使用场景：
 * - 需要特殊的验证逻辑
 * - 需要特殊的转换规则
 * - 需要自定义的错误消息
 */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  /**
   * transform 方法：
   * @param value    - 参数的原始值（通常是字符串）
   * @param metadata - 参数的元数据
   *   - type: 参数类型（'body' | 'query' | 'param' | 'custom'）
   *   - metatype: 参数的 TypeScript 类型（String, Number 等）
   *   - data: @Param('key') 或 @Query('key') 中的 key 值
   */
  transform(value: string, metadata: ArgumentMetadata): number {
    console.log(`[Pipe:ParsePositiveInt] 转换参数 "${metadata.data}": "${value}"`);

    // 尝试将字符串转换为整数
    const parsedValue = parseInt(value, 10);

    // 检查是否为有效数字
    if (isNaN(parsedValue)) {
      throw new BadRequestException(
        `参数 "${metadata.data}" 必须是有效的整数，当前值: "${value}"`,
      );
    }

    // 检查是否为正数
    if (parsedValue <= 0) {
      throw new BadRequestException(
        `参数 "${metadata.data}" 必须是正整数，当前值: ${parsedValue}`,
      );
    }

    console.log(`[Pipe:ParsePositiveInt] 转换成功: ${parsedValue}`);
    return parsedValue;
  }
}
