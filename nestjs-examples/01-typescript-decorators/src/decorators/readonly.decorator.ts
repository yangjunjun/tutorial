/**
 * @Readonly() 属性装饰器
 *
 * 这个装饰器使用 Object.defineProperty 将属性设置为只读（不可修改）。
 * 这是属性装饰器的典型应用 —— 修改属性的描述符（descriptor）。
 *
 * Object.defineProperty 的 configurable: false, writable: false
 * 可以让属性变成真正的只读，尝试修改会抛出 TypeError（严格模式下）。
 *
 * 在 NestJS 生态中，这种模式常用于保护某些关键配置不被意外修改。
 */

/**
 * @Readonly() 属性装饰器
 * 将属性标记为只读
 *
 * 注意：属性装饰器在类定义时执行，而非实例化时。
 * 所以我们需要通过在构造函数中拦截赋值来实现。
 */
export function Readonly(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    // 使用一个特殊的 key 来存储只读属性列表
    const readonlyFields: (string | symbol)[] =
      Reflect.getOwnMetadata(Symbol.for('readonlyFields'), target) || [];
    readonlyFields.push(propertyKey);
    Reflect.defineMetadata(Symbol.for('readonlyFields'), readonlyFields, target);

    // 在原型上定义属性的 getter/setter
    // 当实例设置值时，会调用这个 setter
    const key = propertyKey as string;
    const privateKey = `__readonly_${key}`;

    Object.defineProperty(target, propertyKey, {
      get: function () {
        return this[privateKey];
      },
      set: function (value: any) {
        // 只在第一次赋值时允许（构造函数中赋值）
        if (this[`__${key}_initialized`]) {
          console.warn(`[Readonly] 警告: 尝试修改只读属性 "${key}"，操作被忽略`);
          return;
        }
        this[privateKey] = value;
        this[`__${key}_initialized`] = true;
      },
      enumerable: true,
      configurable: true,
    });
  };
}
