/**
 * @Log() 方法装饰器
 *
 * 方法装饰器是 NestJS 中最常见的装饰器类型之一。
 * 例如 @Get(), @Post() 等都是方法装饰器。
 *
 * 方法装饰器接收三个参数：
 * - target: 对于静态成员是类的构造函数，对于实例成员是类的原型对象
 * - propertyKey: 方法名称
 * - descriptor: 方法的属性描述符（PropertyDescriptor）
 *
 * 这个装饰器会：
 * 1. 在方法调用前打印传入的参数
 * 2. 记录方法执行时间
 * 3. 在方法调用后打印返回值
 */

// 方法装饰器工厂函数（使用工厂模式可以让装饰器接收参数）
export function Log(): MethodDecorator {
  // 返回实际的装饰器函数
  return function (
    target: Object,                           // 目标类的原型
    propertyKey: string | symbol,             // 方法名
    descriptor: PropertyDescriptor,           // 方法描述符
  ) {
    // 保存原始方法的引用
    const originalMethod = descriptor.value;

    // 用新函数替换原始方法
    descriptor.value = function (...args: any[]) {
      // 方法执行前：打印参数信息
      console.log(`\n[Log] 调用方法: ${String(propertyKey)}`);
      console.log(`[Log] 传入参数:`, args);

      // 使用 performance.now() 精确计时
      const start = performance.now();

      // 调用原始方法（注意绑定 this 上下文）
      const result = originalMethod.apply(this, args);

      const end = performance.now();
      const duration = (end - start).toFixed(3);

      // 方法执行后：打印返回值和耗时
      console.log(`[Log] 返回值:`, result);
      console.log(`[Log] 耗时: ${duration}ms`);

      return result;
    };

    // 返回修改后的描述符
    return descriptor;
  };
}
