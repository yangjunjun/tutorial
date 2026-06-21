/**
 * 默认值管道
 *
 * 学习要点：
 * 1. 为未提供的查询参数设置默认值
 * 2. 管道可以接收自定义配置参数
 * 3. 转换操作：将字符串转为数字类型
 * 4. 与内置的 DefaultValuePipe 类似但更灵活
 *
 * 使用场景：
 * - 分页参数（page 默认 1, limit 默认 10）
 * - 排序参数（sortBy 默认 'createdAt'）
 * - 搜索参数（keyword 默认 ''）
 */
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultValuePipe implements PipeTransform {
  // 默认值配置
  private readonly defaultValue: any;
  // 是否转换为数字
  private readonly toNumber: boolean;

  constructor(defaultValue: any = undefined, toNumber: boolean = false) {
    this.defaultValue = defaultValue;
    this.toNumber = toNumber;
  }

  transform(value: any) {
    // 如果值为 undefined、null 或空字符串，使用默认值
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    // 如果需要转换为数字
    if (this.toNumber) {
      const num = Number(value);
      // 如果转换失败（NaN），返回默认值
      return isNaN(num) ? this.defaultValue : num;
    }

    return value;
  }
}
