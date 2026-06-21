/**
 * 详细验证管道（Custom Validation Pipe）
 *
 * 这个管道展示了如何自定义验证逻辑，
 * 收集所有验证错误并以友好的格式返回。
 *
 * class-validator 的 validate() 函数：
 * - 返回一个 ValidationError[] 数组
 * - 每个 ValidationError 包含：
 *   - property: 出错的属性名
 *   - constraints: 具体的验证规则及错误消息
 *   - children: 嵌套对象的验证错误
 *
 * NestJS 内置的 ValidationPipe 已经足够好用，
 * 但自定义验证管道可以：
 * 1. 自定义错误消息格式
 * 2. 添加额外的验证逻辑
 * 3. 记录验证日志
 * 4. 实现特殊的错误处理策略
 */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationDetailPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // 只验证 body 类型的参数
    if (metadata.type !== 'body') {
      return value;
    }

    // 如果没有 metatype（如内置类型），跳过验证
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 将普通对象转换为 DTO 类实例
    // plainToInstance 会保留 class-validator 装饰器的元数据
    const object = plainToInstance(metatype, value);

    // 执行验证，获取所有验证错误
    const errors: ValidationError[] = await validate(object);

    if (errors.length > 0) {
      console.log(`[Pipe:ValidationDetail] 验证失败，共 ${errors.length} 个错误`);

      // 收集并格式化所有错误消息
      const errorMessages = this.formatErrors(errors);

      throw new BadRequestException({
        message: '数据验证失败',
        errors: errorMessages,
        totalErrors: errors.length,
      });
    }

    return value;
  }

  /**
   * 判断是否需要验证
   * 内置的 JavaScript 类型（String, Number 等）不需要验证
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * 格式化验证错误为友好的消息数组
   */
  private formatErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        // 获取每个约束的错误消息
        for (const constraint of Object.values(error.constraints)) {
          messages.push(`[${error.property}] ${constraint}`);
        }
      }

      // 递归处理嵌套对象的错误
      if (error.children && error.children.length > 0) {
        messages.push(...this.formatErrors(error.children));
      }
    }

    return messages;
  }
}
