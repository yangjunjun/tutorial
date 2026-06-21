/**
 * UUID 验证管道
 *
 * 学习要点：
 * 1. 自定义管道实现 PipeTransform 接口
 * 2. transform() 方法接收原始值，返回转换后的值
 * 3. 验证失败抛出 BadRequestException
 * 4. 管道可以替代内置的 ParseUUIDPipe 实现自定义逻辑
 *
 * UUID 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * 例如：550e8400-e29b-41d4-a716-446655440000
 */
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  // UUID v4 正则表达式
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  transform(value: string): string {
    // 检查是否为有效的 UUID 格式
    if (!this.isValidUuid(value)) {
      throw new BadRequestException(
        `"${value}" 不是有效的 UUID 格式。` +
        `正确格式示例: 550e8400-e29b-41d4-a716-446655440000`,
      );
    }

    // 返回标准化的 UUID（小写）
    return value.toLowerCase();
  }

  private isValidUuid(value: string): boolean {
    return this.uuidRegex.test(value);
  }
}
