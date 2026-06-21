/**
 * 去空格管道
 *
 * 学习要点：
 * 1. 管道可以修改请求数据
 * 2. 递归处理嵌套对象的字符串字段
 * 3. 在 Controller 方法执行前清理用户输入
 *
 * 使用场景：
 * - 用户名前后有空格："  admin  " → "admin"
 * - 搜索关键词清理：" nestjs " → "nestjs"
 */
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any): any {
    // 只处理对象类型的数据（请求体）
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    // 递归遍历对象的所有字段
    return this.trimObject(value);
  }

  /**
   * 递归去除对象中所有字符串值的前后空格
   */
  private trimObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimObject(item));
    }

    // 处理普通对象
    if (typeof obj === 'object') {
      const trimmed: any = {};
      for (const key of Object.keys(obj)) {
        trimmed[key] = this.trimObject(obj[key]);
      }
      return trimmed;
    }

    // 处理字符串：去除前后空格
    if (typeof obj === 'string') {
      return obj.trim();
    }

    // 其他类型直接返回
    return obj;
  }
}
