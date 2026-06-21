/**
 * @Required() 属性装饰器 + @Validate() 类装饰器
 *
 * 这个例子展示了两种装饰器的配合使用：
 *
 * 属性装饰器（Property Decorator）：
 * - 接收 target（原型对象）和 propertyKey（属性名）
 * - 无法直接获取属性的值，只能操作属性的元数据
 * - NestJS 中的 @Column(), @Prop() 等就是属性装饰器
 *
 * 类装饰器（Class Decorator）：
 * - 接收 constructor（构造函数）
 * - 可以替换整个类，或给类添加方法/属性
 * - NestJS 中的 @Controller(), @Injectable(), @Module() 就是类装饰器
 *
 * 实现原理：
 * 1. @Required() 使用 Symbol 作为 key，在类上记录哪些属性是必填的
 * 2. @Validate() 给类添加 validate() 方法，检查所有 @Required 标记的属性
 */

// 使用 Symbol 作为元数据 key，避免命名冲突
const REQUIRED_FIELDS_KEY = Symbol('requiredFields');

/**
 * @Required() 属性装饰器
 * 标记一个属性为必填字段
 *
 * 注意：属性装饰器无法获取属性值，只能记录元数据
 */
export function Required(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    // 获取已有的必填字段列表（从原型上读取）
    const existingFields: (string | symbol)[] =
      Reflect.getOwnMetadata(REQUIRED_FIELDS_KEY, target) || [];

    // 添加当前属性到必填列表
    existingFields.push(propertyKey);

    // 将更新后的列表存回元数据
    Reflect.defineMetadata(REQUIRED_FIELDS_KEY, existingFields, target);
  };
}

/**
 * @Validate() 类装饰器
 * 给类添加 validate() 方法，检查所有 @Required 标记的属性
 */
export function Validate(): ClassDecorator {
  return function <T extends Function>(target: T) {
    // 给类的原型添加 validate 方法
    target.prototype.validate = function (): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      // 从原型上读取所有必填字段列表
      const requiredFields: (string | symbol)[] =
        Reflect.getOwnMetadata(REQUIRED_FIELDS_KEY, Object.getPrototypeOf(this)) || [];

      // 逐一检查每个必填字段
      for (const field of requiredFields) {
        const value = this[field];
        // 检查值是否为 null 或 undefined
        if (value === null || value === undefined) {
          errors.push(`属性 "${String(field)}" 是必填的，但当前值为 ${value}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };
  };
}
