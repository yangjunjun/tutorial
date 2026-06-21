/**
 * 序列化拦截器
 *
 * 学习要点：
 * 1. class-transformer 的 classToPlain 将类实例转为普通对象
 * 2. @Exclude() 装饰器标记不需要暴露的字段
 * 3. @Expose() 装饰器标记需要暴露的字段
 * 4. plainToInstance 将普通对象转换为类实例
 * 5. 拦截器可以在响应返回前统一处理数据格式
 *
 * 使用场景：
 * - 隐藏密码、token 等敏感字段
 * - 统一 API 响应格式
 * - 字段名称映射
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassConstructor, plainToInstance } from 'class-transformer';

/**
 * 序列化拦截器
 *
 * 用法：@UseInterceptors(new SerializeInterceptor(UserResponseDto))
 * 将 Controller 返回的数据转换为指定的 DTO 类型
 * DTO 中的 @Exclude() 字段会被自动移除
 */
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<any>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // plainToInstance 将响应数据转为 DTO 类实例
        // excludeExtraneousValues: true 表示只包含 @Expose() 标记的字段
        // 如果 DTO 中没有使用 @Expose()，则所有未标记 @Exclude() 的字段都会保留
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: false,
        });
      }),
    );
  }
}
