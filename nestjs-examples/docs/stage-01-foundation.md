## 第一阶段：筑基篇 / Stage 1: Foundation (Week 1-2)

### 概述 / Overview

**中文：**

第一阶段是整个 NestJS 学习旅程的起点。在这两周的时间里，你将从 TypeScript 装饰器这一底层基石开始，逐步搭建起对 NestJS 框架核心概念的完整认知。我们会依次学习四个项目：首先掌握装饰器——这是 NestJS 一切魔法的源头；然后深入 NestJS 的 Module / Controller / Provider 核心三件套；接着剖析一个 HTTP 请求从进入到响应的完整生命周期；最后通过 Prisma ORM 打通数据库集成的最后一公里。

完成本阶段后，你将具备独立构建 RESTful API 的能力，并理解 NestJS 框架背后的设计哲学。

**EN:**

Stage 1 is the starting point of the entire NestJS learning journey. Over these two weeks, you will begin with TypeScript decorators — the fundamental building block — and progressively build a complete understanding of NestJS core concepts. We will work through four projects in sequence: first mastering decorators (the source of all NestJS magic), then diving deep into the Module / Controller / Provider trio, next dissecting the full lifecycle of an HTTP request, and finally connecting to a database using Prisma ORM.

After completing this stage, you will be able to independently build RESTful APIs and understand the design philosophy behind the NestJS framework.

> **学习目标 / Learning Objectives:**
> - 理解并能手写四种装饰器 / Understand and write all four decorator types
> - 掌握 Module、Controller、Provider 的协作方式 / Master how Module, Controller, and Provider work together
> - 能画出请求处理链并解释每个环节 / Draw the request processing chain and explain each step
> - 使用 Prisma 完成完整的 CRUD 操作 / Complete full CRUD operations with Prisma

---

### 项目 01: TypeScript 装饰器 / Project 01: TypeScript Decorators

#### 为什么需要学习装饰器？ / Why Learn Decorators?

**中文：**

打开任何一个 NestJS 项目的源码，你都会看到满屏的 `@Controller()`、`@Injectable()`、`@Get()`、`@Body()` 等装饰器。如果你不理解装饰器的工作原理，那么 NestJS 对你来说就像一个黑盒——你只能照猫画虎地复制粘贴，却无法调试深层问题，更无法自定义框架行为。

装饰器本质上是一种**元编程（Metaprogramming）**手段：它允许你在代码编写阶段为类、方法、属性、参数附加额外的元数据（Metadata）或修改其行为。NestJS 正是通过 `reflect-metadata` 库读取这些元数据，从而自动完成路由注册、依赖注入、参数解析等一系列工作。

简单来说：**装饰器是 NestJS 与你之间的契约**。你用装饰器告诉框架"这个类是什么角色"、"这个方法处理什么路由"、"这个参数从哪里取值"，框架则根据这些信息自动帮你完成剩下的事情。

**EN:**

Open any NestJS project and you will see decorators everywhere — `@Controller()`, `@Injectable()`, `@Get()`, `@Body()`, and more. If you do not understand how decorators work, NestJS will feel like a black box: you can only copy-paste patterns without understanding the underlying mechanics, making it impossible to debug deep issues or customize framework behavior.

Decorators are fundamentally a form of **metaprogramming**: they allow you to attach extra metadata or modify behavior at the code authoring stage for classes, methods, properties, and parameters. NestJS leverages the `reflect-metadata` library to read this metadata and automatically handle route registration, dependency injection, parameter extraction, and much more.

In short: **decorators are the contract between you and NestJS**. You use decorators to tell the framework "what role this class plays," "what route this method handles," "where this parameter value comes from," and the framework takes care of the rest.

#### 前置知识：tsconfig.json 配置 / Prerequisites: tsconfig.json Configuration

**中文：**

在 TypeScript 中使用装饰器，首先需要在 `tsconfig.json` 中开启实验性装饰器支持。这是很多人踩的第一个坑——忘记开启这个选项会导致编译错误。

**EN:**

Before using decorators in TypeScript, you must enable experimental decorator support in `tsconfig.json`. This is the first pitfall many beginners encounter — forgetting this option causes compilation errors.

```json
// tsconfig.json
{
  "compilerOptions": {
    // 启用装饰器语法 / Enable decorator syntax
    "experimentalDecorators": true,
    // 启用 reflect-metadata 的发射，允许运行时读取类型信息
    // Emit reflect-metadata type information at runtime
    "emitDecoratorMetadata": true,
    "target": "ES2021",
    "module": "commonjs",
    "strict": true
  }
}
```

> **提示 / Tip:** `emitDecoratorMetadata` 让 TypeScript 编译器在生成的 JavaScript 中自动插入 `Reflect.metadata()` 调用，这样 NestJS 就能通过 `Reflect.getMetadata('design:type', ...)` 获取构造函数参数的类型信息，从而实现自动依赖注入。没有它，DI 容器无法知道应该注入什么类型的服务。
>
> **EN:** `emitDecoratorMetadata` makes the TypeScript compiler automatically insert `Reflect.metadata()` calls in the generated JavaScript, enabling NestJS to retrieve constructor parameter type information via `Reflect.getMetadata('design:type', ...)` for automatic dependency injection. Without it, the DI container cannot determine what service type to inject.

#### 四种装饰器类型 / Four Decorator Types

TypeScript 支持四种装饰器，NestJS 对每一种都有大量应用。理解它们各自的签名和用途是掌握 NestJS 的关键。

TypeScript supports four decorator types, and NestJS makes heavy use of each one. Understanding their signatures and purposes is the key to mastering NestJS.

---

##### 1. 类装饰器 / Class Decorator

**中文：**

类装饰器应用于类的声明之上，接收一个参数——类的构造函数（`target: Function`）。NestJS 中最核心的类装饰器包括 `@Controller()`、`@Injectable()` 和 `@Module()`。它们的作用是告诉 NestJS 的 IoC 容器："这个类扮演什么角色"。

**EN:**

Class decorators are applied to class declarations and receive one parameter — the class constructor (`target: Function`). The most important class decorators in NestJS are `@Controller()`, `@Injectable()`, and `@Module()`. They tell the NestJS IoC container: "what role does this class play."

```typescript
// ============================================================
// 手写一个类装饰器 / Writing a class decorator by hand
// ============================================================

/**
 * 一个简单的类装饰器示例
 * A simple class decorator example
 *
 * @param prefix - 日志前缀 / Log prefix
 * @returns 类装饰器函数 / Returns a class decorator function
 */
function LogClass(prefix: string) {
  // target 是被装饰类的构造函数 / target is the constructor of the decorated class
  return function (target: Function) {
    console.log(`${prefix}: 类 ${target.name} 已被注册 / Class ${target.name} has been registered`);

    // 你可以在这里读取或修改类的原型 / You can read or modify the class prototype here
    // 例如给原型添加一个方法 / e.g., add a method to the prototype
    target.prototype.createdAt = new Date();
  };
}

// 使用装饰器 / Using the decorator
@LogClass('APP')
class ProductService {
  createdAt: Date;
  // 输出: APP: 类 ProductService 已被注册
  // Output: APP: Class ProductService has been registered
}

// ============================================================
// NestJS 中的类装饰器实际做了什么？
// What do class decorators actually do in NestJS?
// ============================================================
// @Injectable() 的核心逻辑（简化版）：
// Core logic of @Injectable() (simplified):
//
// function Injectable() {
//   return function(target: Function) {
//     // 将类标记为"可注入"，存入元数据
//     // Mark the class as "injectable" and store in metadata
//     Reflect.defineMetadata('injectable', true, target);
//
//     // 记录构造函数参数的类型信息，用于后续 DI
//     // Record constructor parameter types for later DI
//     const paramTypes = Reflect.getMetadata('design:paramtypes', target);
//     Reflect.defineMetadata('self:paramtypes', paramTypes, target);
//   };
// }
```

> **常见误区 / Common Pitfall:** 类装饰器的执行时机是**类定义时**，而不是类实例化时。这意味着 `@LogClass('APP')` 在 JavaScript 引擎解析到 `class ProductService { ... }` 的那一刻就会执行，而不是在 `new ProductService()` 时执行。
>
> **EN:** A common misconception is that class decorators execute at instantiation time. They actually execute at **class definition time**. This means `@LogClass('APP')` runs the moment the JavaScript engine parses `class ProductService { ... }`, not when `new ProductService()` is called.

---

##### 2. 方法装饰器 / Method Decorator

**中文：**

方法装饰器接收三个参数：`target`（原型对象或构造函数）、`propertyKey`（方法名）、`descriptor`（属性描述符）。NestJS 中的路由装饰器 `@Get()`、`@Post()`、`@Put()`、`@Delete()` 都是方法装饰器。它们的作用是将 HTTP 方法与处理函数关联起来。

**EN:**

Method decorators receive three parameters: `target` (the prototype object or constructor), `propertyKey` (the method name), and `descriptor` (the property descriptor). Route decorators in NestJS such as `@Get()`, `@Post()`, `@Put()`, `@Delete()` are all method decorators. They associate HTTP methods with handler functions.

```typescript
// ============================================================
// 手写一个方法装饰器 / Writing a method decorator by hand
// ============================================================

/**
 * 方法执行耗时统计装饰器
 * Method execution time measurement decorator
 */
function MeasureTime(
  target: any,           // 类的原型 / Class prototype
  propertyKey: string,   // 方法名 / Method name
  descriptor: PropertyDescriptor
) {
  // 保存原始方法引用 / Save reference to the original method
  const originalMethod = descriptor.value;

  // 用新的包装函数替换原方法 / Replace the original method with a wrapper
  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    console.log(`[MeasureTime] 开始执行 ${propertyKey} / Starting ${propertyKey}`);

    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;
      console.log(`[MeasureTime] ${propertyKey} 耗时 / took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`[MeasureTime] ${propertyKey} 失败 / failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  };

  return descriptor;
}

class OrderService {
  @MeasureTime
  async processOrder(orderId: string) {
    // 模拟耗时操作 / Simulate a time-consuming operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { orderId, status: 'processed' };
  }
}

// ============================================================
// NestJS 中 @Get() 装饰器的简化实现
// Simplified implementation of NestJS @Get() decorator
// ============================================================
//
// function Get(path?: string) {
//   return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     // 将路由路径和 HTTP 方法存入元数据
//     // Store the route path and HTTP method in metadata
//     Reflect.defineMetadata('path', path || '', target, propertyKey);
//     Reflect.defineMetadata('method', 'GET', target, propertyKey);
//   };
// }
```

---

##### 3. 属性装饰器 / Property Decorator

**中文：**

属性装饰器接收两个参数：`target` 和 `propertyKey`。在 NestJS 生态中，属性装饰器常见于 ORM 集成——比如 TypeORM 的 `@Column()` 或 Mongoose 的 `@Prop()`。虽然 NestJS 核心框架自身较少使用属性装饰器，但在数据建模场景中它们无处不在。

**EN:**

Property decorators receive two parameters: `target` and `propertyKey`. In the NestJS ecosystem, property decorators are commonly seen in ORM integrations — such as TypeORM's `@Column()` or Mongoose's `@Prop()`. While the NestJS core framework itself uses property decorators sparingly, they are ubiquitous in data modeling scenarios.

```typescript
// ============================================================
// 手写一个属性装饰器 / Writing a property decorator by hand
// ============================================================

/**
 * 标记必填字段的属性装饰器
 * Property decorator to mark required fields
 */
function Required(target: any, propertyKey: string) {
  // 获取或初始化该类的必填字段列表
  // Get or initialize the required fields list for this class
  const existingFields: string[] =
    Reflect.getMetadata('requiredFields', target.constructor) || [];
  existingFields.push(propertyKey);
  Reflect.defineMetadata('requiredFields', existingFields, target.constructor);
}

// 模拟 TypeORM 的 @Column 装饰器
// Simulating TypeORM's @Column decorator
function Column(options?: { type?: string; nullable?: boolean }) {
  return function (target: any, propertyKey: string) {
    // 获取属性类型并存储列元数据
    // Get the property type and store column metadata
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    const columns = Reflect.getMetadata('columns', target.constructor) || {};

    columns[propertyKey] = {
      type: options?.type || type?.name || 'string',
      nullable: options?.nullable || false,
    };

    Reflect.defineMetadata('columns', columns, target.constructor);
    console.log(
      `[Column] 注册字段 ${propertyKey}，类型 / type: ${columns[propertyKey].type}`
    );
  };
}

class User {
  @Required
  @Column({ type: 'varchar' })
  name: string;

  @Column({ nullable: true })
  bio: string;
}

// 读取元数据 / Reading metadata
// Reflect.getMetadata('requiredFields', User) => ['name']
// Reflect.getMetadata('columns', User) => { name: {...}, bio: {...} }
```

---

##### 4. 参数装饰器 / Parameter Decorator

**中文：**

参数装饰器接收三个参数：`target`、`propertyKey`（方法名）和 `parameterIndex`（参数在参数列表中的索引）。NestJS 大量使用参数装饰器来提取请求数据：`@Param()` 提取路由参数，`@Query()` 提取查询字符串，`@Body()` 提取请求体。这是 NestJS 中你最频繁接触的装饰器类型。

**EN:**

Parameter decorators receive three parameters: `target`, `propertyKey` (the method name), and `parameterIndex` (the index of the parameter in the parameter list). NestJS makes extensive use of parameter decorators to extract request data: `@Param()` for route parameters, `@Query()` for query strings, `@Body()` for the request body. This is the decorator type you will encounter most frequently in NestJS.

```typescript
// ============================================================
// 手写一个参数装饰器 / Writing a parameter decorator by hand
// ============================================================

/**
 * 自定义 @User() 参数装饰器，从请求中提取用户信息
 * Custom @User() parameter decorator to extract user info from request
 */
function User(property?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // 获取已有的参数元数据，或创建新数组
    // Get existing parameter metadata or create a new array
    const existingParams: Array<{ index: number; property?: string }> =
      Reflect.getMetadata('custom:params', target, propertyKey) || [];

    existingParams.push({ index: parameterIndex, property });

    // 存储参数提取规则 / Store parameter extraction rules
    Reflect.defineMetadata('custom:params', existingParams, target, propertyKey);
  };
}

// 在 NestJS 中的用法 / Usage in NestJS:
//
// @Get('profile')
// getProfile(@User('id') userId: string, @User('role') role: string) {
//   // NestJS 会自动从 request.user 中提取 id 和 role
//   // NestJS will automatically extract id and role from request.user
//   return this.userService.getProfile(userId, role);
// }
//
// 要实现真正功能，需配合 createParamDecorator：
// To make it fully functional, use createParamDecorator:
//
// export const User = createParamDecorator(
//   (data: string, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     // 从 request.user 中提取指定属性 / Extract specified property from request.user
//     return data ? request.user?.[data] : request.user;
//   }
// );
```

#### Reflect Metadata 元数据机制 / Reflect Metadata Mechanism

**中文：**

`reflect-metadata` 是 NestJS 框架运作的基石。当你在 `tsconfig.json` 中开启 `emitDecoratorMetadata: true` 后，TypeScript 编译器会在每个被装饰的类/方法旁自动生成 `__metadata()` 调用，将类型信息存储到 Reflect 的元数据系统中。

NestJS 在启动时扫描这些元数据来构建路由表、解析依赖关系、配置管道验证。你可以通过 `Reflect.defineMetadata()` 和 `Reflect.getMetadata()` 手动操作元数据，从而实现高度自定义的框架行为。

**EN:**

`reflect-metadata` is the cornerstone of how NestJS works. When you enable `emitDecoratorMetadata: true` in `tsconfig.json`, the TypeScript compiler automatically generates `__metadata()` calls alongside each decorated class/method, storing type information in the Reflect metadata system.

At startup, NestJS scans this metadata to build route tables, resolve dependency relationships, and configure pipe validation. You can manually manipulate metadata through `Reflect.defineMetadata()` and `Reflect.getMetadata()` to achieve highly customized framework behavior.

```typescript
import 'reflect-metadata';

// ============================================================
// Reflect Metadata 核心 API 详解 / Core API Deep Dive
// ============================================================

class PaymentService {
  constructor(private stripeKey: string) {}
}

class OrderController {
  constructor(private paymentService: PaymentService) {}
}

// 1. defineMetadata: 写入元数据 / Write metadata
//    参数: key, value, target(, propertyKey?)
Reflect.defineMetadata('version', '1.0.0', OrderController);
Reflect.defineMetadata('role', 'admin', OrderController, 'createOrder');

// 2. getMetadata: 读取元数据 / Read metadata
const version = Reflect.getMetadata('version', OrderController);
console.log(version); // '1.0.0'

// 3. TypeScript 自动发射的类型元数据
//    Type metadata automatically emitted by TypeScript
const designType = Reflect.getMetadata('design:type', OrderController.prototype, 'createOrder');
const paramTypes = Reflect.getMetadata('design:paramtypes', OrderController);
// paramTypes => [PaymentService]  (构造函数参数类型 / Constructor parameter types)

const returnTypes = Reflect.getMetadata('design:returntype', OrderController.prototype, 'createOrder');

// 4. 实际应用场景：构建简易 DI 容器
//    Practical application: building a simple DI container
function autoInject(target: any): any {
  // 获取构造函数的参数类型 / Get constructor parameter types
  const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || [];

  // 递归实例化每个依赖 / Recursively instantiate each dependency
  const injections = paramTypes.map((type) => {
    console.log(`[DI] 正在注入 / Injecting: ${type.name}`);
    return new type();
  });

  // 用注入的依赖创建实例 / Create instance with injected dependencies
  return new target(...injections);
}

// 使用 / Usage:
// const controller = autoInject(OrderController);
// 自动创建 PaymentService 实例并注入到 OrderController
// Automatically creates a PaymentService instance and injects it into OrderController
```

> **深度理解 / Deep Understanding:** NestJS 的 IoC 容器本质上是一个增强版的 `autoInject` 函数。它维护了一个全局的 provider 注册表（`ModuleContainer`），在解析依赖时会先查找注册表中的已有实例（单例模式），如果没有才创建新实例。此外它还处理循环依赖（通过 `forwardRef()`）、作用域（`REQUEST` / `TRANSIENT`）等复杂场景。
>
> **EN:** The NestJS IoC container is essentially an enhanced version of the `autoInject` function above. It maintains a global provider registry (`ModuleContainer`), checking for existing instances (singleton pattern) before creating new ones. It also handles circular dependencies (via `forwardRef()`), scopes (`REQUEST` / `TRANSIENT`), and other complex scenarios.

#### 实践练习 / Practice Exercises

**练习 1 / Exercise 1:** 创建一个 `@Deprecated(message: string)` 类装饰器，当被装饰的类被实例化时在控制台输出警告信息。
Create a `@Deprecated(message: string)` class decorator that logs a console warning when the decorated class is instantiated.

**练习 2 / Exercise 2:** 创建一个 `@Retry(times: number)` 方法装饰器，当方法抛出异常时自动重试指定次数。
Create a `@Retry(times: number)` method decorator that automatically retries a method a specified number of times when it throws an exception.

**练习 3 / Exercise 3:** 创建一个 `@Validate()` 方法装饰器，在方法执行前检查所有标记了 `@Required` 的属性装饰器的参数是否为 `undefined`。
Create a `@Validate()` method decorator that checks whether all parameters marked with a `@Required` property decorator are `undefined` before method execution.

**练习 4 / Exercise 4:** 使用 `Reflect.defineMetadata` 和 `Reflect.getMetadata` 手动实现一个简化版的 `@Injectable()` 装饰器，能够将类标记为可注入并记录其构造函数参数类型。
Use `Reflect.defineMetadata` and `Reflect.getMetadata` to manually implement a simplified `@Injectable()` decorator that marks a class as injectable and records its constructor parameter types.

**练习 5 / Exercise 5:** 使用 `createParamDecorator` 创建一个 `@Ip()` 参数装饰器，用于在 NestJS 控制器中自动提取客户端 IP 地址。
Use `createParamDecorator` to create an `@Ip()` parameter decorator that automatically extracts the client IP address in a NestJS controller.

---

### 项目 02: NestJS 核心三件套 / Project 02: NestJS Core Trio

NestJS 的核心架构围绕三个概念构建：**Module（模块）**、**Controller（控制器）**和 **Provider（服务提供者）**。理解它们各自的职责和协作方式，是掌握 NestJS 的关键。

The core architecture of NestJS is built around three concepts: **Module**, **Controller**, and **Provider**. Understanding their individual responsibilities and how they collaborate is essential to mastering NestJS.

#### Module 模块 / Modules

**中文：**

Module 是 NestJS 组织代码的基本单元。每个 NestJS 应用至少有一个根模块（`AppModule`），复杂应用会有数十个功能模块。`@Module()` 装饰器接收一个配置对象，包含四个属性：

- **`imports`**：导入其他模块，获取其 `exports` 中暴露的 provider
- **`controllers`**：注册本模块的控制器
- **`providers`**：注册本模块的服务提供者（可被注入）
- **`exports`**：将本模块的 provider 暴露给其他模块使用

**EN:**

Modules are the fundamental organizational unit in NestJS. Every NestJS application has at least one root module (`AppModule`), and complex applications will have dozens of feature modules. The `@Module()` decorator takes a configuration object with four properties:

- **`imports`**: Import other modules to access providers exposed via their `exports`
- **`controllers`**: Register controllers belonging to this module
- **`providers`**: Register providers (injectable services) belonging to this module
- **`exports`**: Expose providers from this module for use by other modules

```typescript
// products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  // 导入 CategoriesModule，以便注入其导出的 CategoryService
  // Import CategoriesModule to inject its exported CategoryService
  imports: [CategoriesModule],

  // 注册本模块的控制器 / Register this module's controller
  controllers: [ProductsController],

  // 注册本模块的 provider（可被本模块内其他组件注入）
  // Register providers (injectable within this module)
  providers: [ProductsService],

  // 将 ProductsService 导出，供其他导入此模块的模块使用
  // Export ProductsService for use by modules that import this module
  exports: [ProductsService],
})
export class ProductsModule {}
```

> **最佳实践 / Best Practice:** 遵循"单一职责"原则，每个 Module 只负责一个业务领域。例如 `ProductsModule` 只管商品相关逻辑，`OrdersModule` 只管订单逻辑。当模块之间需要协作时，通过 `imports` / `exports` 机制显式声明依赖关系，而不是直接导入文件。
>
> **EN:** Follow the Single Responsibility Principle — each Module should handle only one business domain. For example, `ProductsModule` handles only product-related logic, while `OrdersModule` handles only order logic. When modules need to collaborate, declare dependencies explicitly through the `imports` / `exports` mechanism rather than directly importing files.

#### Controller 控制器 / Controllers

**中文：**

Controller 的职责是**接收请求并返回响应**。它不应该包含业务逻辑——业务逻辑应该封装在 Provider（Service）中。Controller 通过各种装饰器声明路由、提取请求参数，然后委托给 Service 处理。

**EN:**

A Controller's responsibility is to **receive requests and return responses**. It should not contain business logic — that should be encapsulated in Providers (Services). Controllers declare routes and extract request parameters through decorators, then delegate processing to Services.

```typescript
// products.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Param, Query, Body, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// @Controller('products') 声明路由前缀为 /products
// @Controller('products') declares the route prefix as /products
@Controller('products')
export class ProductsController {
  // 通过构造函数注入 ProductsService
  // Inject ProductsService via constructor
  constructor(private readonly productsService: ProductsService) {}

  // GET /products?page=1&limit=10
  @Get()
  findAll(
    // @Query 提取查询参数 / @Query extracts query parameters
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // 委托给 Service 处理 / Delegate to the Service
    return this.productsService.findAll(+page, +limit);
  }

  // GET /products/:id
  @Get(':id')
  findOne(
    // ParseIntPipe 自动将字符串转为整数，转换失败则抛出 400 错误
    // ParseIntPipe automatically converts string to integer; throws 400 on failure
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.findOne(id);
  }

  // POST /products
  @Post()
  @HttpCode(HttpStatus.CREATED) // 设置响应状态码为 201 / Set response status to 201
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // PUT /products/:id
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // DELETE /products/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 无内容 / 204 No Content
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
```

#### Provider 服务提供者 / Providers

**中文：**

Provider 是 NestJS 中的核心概念，泛指所有用 `@Injectable()` 装饰的类。Service、Repository、Factory、Helper 都可以是 Provider。Provider 的核心特性是**可被注入**——当一个类标记为 `@Injectable()`，NestJS 的 IoC 容器就接管了它的实例化和生命周期管理。

**EN:**

Providers are a core NestJS concept encompassing all classes decorated with `@Injectable()`. Services, Repositories, Factories, and Helpers can all be Providers. The key characteristic of a Provider is that it is **injectable** — once a class is marked with `@Injectable()`, the NestJS IoC container manages its instantiation and lifecycle.

```typescript
// products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// 定义 Product 接口（实际项目中由 Prisma 生成）
// Define the Product interface (generated by Prisma in real projects)
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  createdAt: Date;
}

@Injectable() // 标记为可注入 / Mark as injectable
export class ProductsService {
  // 内存存储，仅用于演示（项目 04 会替换为数据库）
  // In-memory storage for demo only (replaced by database in Project 04)
  private products: Product[] = [];
  private idCounter = 1;

  findAll(page: number, limit: number): { data: Product[]; total: number } {
    const start = (page - 1) * limit;
    return {
      data: this.products.slice(start, start + limit),
      total: this.products.length,
    };
  }

  findOne(id: number): Product {
    const product = this.products.find((p) => p.id === id);
    // 找不到时抛出 404 异常 / Throw 404 when not found
    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在 / Product #${id} not found`);
    }
    return product;
  }

  create(dto: CreateProductDto): Product {
    const product: Product = {
      id: this.idCounter++,
      ...dto,
      createdAt: new Date(),
    };
    this.products.push(product);
    return product;
  }

  update(id: number, dto: UpdateProductDto): Product {
    const product = this.findOne(id);
    // Object.assign 合并更新 / Merge updates with Object.assign
    Object.assign(product, dto);
    return product;
  }

  remove(id: number): void {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`商品 #${id} 不存在 / Product #${id} not found`);
    }
    this.products.splice(index, 1);
  }
}
```

#### DTO 与验证 / DTOs and Validation

**中文：**

DTO（Data Transfer Object，数据传输对象）用于定义客户端向服务端传递数据的结构。在 NestJS 中，DTO 通常配合 `class-validator` 和 `class-transformer` 库使用，通过装饰器声明验证规则，再由 `ValidationPipe` 自动执行验证。

**EN:**

DTOs (Data Transfer Objects) define the structure of data passed from clients to the server. In NestJS, DTOs are typically used with `class-validator` and `class-transformer` libraries, declaring validation rules via decorators, which are then automatically enforced by `ValidationPipe`.

```typescript
// dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, Min, Length, IsPositive } from 'class-validator';

export class CreateProductDto {
  // 商品名称：必填，字符串，2-100 个字符
  // Product name: required, string, 2-100 characters
  @IsString({ message: '商品名称必须是字符串 / Product name must be a string' })
  @Length(2, 100, { message: '名称长度应在 2-100 之间 / Name must be 2-100 characters' })
  name: string;

  // 价格：必填，正数
  // Price: required, positive number
  @IsNumber({}, { message: '价格必须是数字 / Price must be a number' })
  @IsPositive({ message: '价格必须大于 0 / Price must be greater than 0' })
  price: number;

  // 描述：可选字段
  // Description: optional field
  @IsOptional()
  @IsString()
  description?: string;
}

// dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType 自动将所有字段变为可选
// PartialType automatically makes all fields optional
export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ============================================================
// 在 main.ts 中启用全局验证管道
// Enable global validation pipe in main.ts
// ============================================================
//
// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.useGlobalPipes(new ValidationPipe({
//     whitelist: true,         // 自动剥离 DTO 中未定义的字段 / Strip undefined properties
//     forbidNonWhitelisted: true, // 有未定义字段时直接报错 / Reject requests with extra properties
//     transform: true,         // 自动类型转换 / Enable automatic type transformation
//   }));
//   await app.listen(3000);
// }
```

#### 依赖注入深入 / Deep Dive into Dependency Injection

**中文：**

NestJS 的依赖注入系统是其最强大的特性之一。理解以下三个层次，能让你真正驾驭这个框架：

1. **构造函数注入（Constructor Injection）**：最常用的方式，在构造函数参数中声明依赖
2. **Provider 注册方式**：除了直接传类，还可以用 `useValue`、`useFactory`、`useExisting`、`useClass` 灵活配置
3. **作用域（Scope）**：默认单例（`DEFAULT`），也可设为 `REQUEST`（每个请求一个实例）或 `TRANSIENT`（每次注入一个实例）

**EN:**

NestJS's dependency injection system is one of its most powerful features. Understanding these three levels will let you truly harness the framework:

1. **Constructor Injection**: The most common approach — declare dependencies as constructor parameters
2. **Provider Registration Methods**: Beyond passing classes directly, use `useValue`, `useFactory`, `useExisting`, `useClass` for flexible configuration
3. **Scopes**: Default singleton (`DEFAULT`), or `REQUEST` (one instance per request), or `TRANSIENT` (one instance per injection)

```typescript
// 高级 DI 配置示例 / Advanced DI configuration example
import { Module } from '@nestjs/common';

@Module({
  providers: [
    // 方式 1: 标准类注入（最常用）
    // Method 1: Standard class injection (most common)
    ProductsService,

    // 方式 2: 使用 token 注入值（常用于配置、常量）
    // Method 2: Value injection with token (common for configs/constants)
    {
      provide: 'API_KEY',
      useValue: process.env.API_KEY || 'dev-key',
    },

    // 方式 3: 工厂模式（需要异步初始化或复杂逻辑时使用）
    // Method 3: Factory pattern (for async init or complex logic)
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async () => {
        // 模拟异步创建数据库连接 / Simulate async database connection creation
        const connection = await createDatabaseConnection();
        return connection;
      },
      inject: ['API_KEY'], // 工厂函数的依赖 / Dependencies for the factory function
    },

    // 方式 4: 别名（为已有 provider 创建别名）
    // Method 4: Alias (create an alias for an existing provider)
    {
      provide: 'ProductsServiceAlias',
      useExisting: ProductsService,
    },
  ],
})
export class ProductsModule {}
```

> **常见陷阱 / Common Pitfall:** 循环依赖是 DI 系统中最常见的问题。当 `ServiceA` 依赖 `ServiceB`，而 `ServiceB` 又依赖 `ServiceA` 时，NestJS 无法决定先实例化谁。解决方法是使用 `forwardRef()`：
>
> **EN:** Circular dependencies are the most common issue in DI systems. When `ServiceA` depends on `ServiceB` and `ServiceB` depends on `ServiceA`, NestJS cannot decide which to instantiate first. The solution is `forwardRef()`:
>
> ```typescript
> // service-a.ts
> constructor(@Inject(forwardRef(() => ServiceB)) private serviceB: ServiceB) {}
>
> // service-b.ts
> constructor(@Inject(forwardRef(() => ServiceA)) private serviceA: ServiceA) {}
> ```
> 但更好的做法是**重构代码以消除循环依赖**。如果你频繁使用 `forwardRef`，说明模块划分可能存在问题。
> But the better approach is to **refactor your code to eliminate the circular dependency**. If you find yourself using `forwardRef` frequently, it may indicate a problem with your module design.

---

### 项目 03: 请求生命周期 / Project 03: Request Lifecycle

#### 完整的请求处理链 / Complete Request Processing Chain

**中文：**

理解请求生命周期是掌握 NestJS 的分水岭。当一个 HTTP 请求到达你的应用时，它会按照固定的顺序经过一系列处理环节。每个环节都可以拦截、修改或增强请求和响应。掌握这条处理链，你就能在正确的位置实现日志、鉴权、数据转换、错误处理等横切关注点。

**EN:**

Understanding the request lifecycle is the watershed moment in mastering NestJS. When an HTTP request arrives at your application, it passes through a fixed sequence of processing stages. Each stage can intercept, modify, or enhance the request and response. Mastering this chain enables you to implement cross-cutting concerns — logging, authentication, data transformation, error handling — at the correct point.

```
请求进入 / Incoming Request
         │
         ▼
┌─────────────────────┐
│   Middleware 中间件   │  ← 最先执行，类似 Express 中间件
│                     │     Executes first, similar to Express middleware
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Guard 守卫         │  ← 权限检查，决定是否放行
│                     │     Authorization check, decides whether to proceed
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Interceptor 拦截器  │  ← 请求前处理 (pre-processing)
│  (前置逻辑)          │     Pre-processing logic before controller
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Pipe 管道          │  ← 参数验证与转换
│                     │     Parameter validation and transformation
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Controller 控制器   │  ← 业务逻辑入口
│                     │     Business logic entry point
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Service 服务        │  ← 核心业务逻辑
│                     │     Core business logic
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Interceptor 拦截器  │  ← 响应后处理 (post-processing)
│  (后置逻辑)          │     Post-processing logic after controller
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Exception Filter   │  ← 异常处理（仅当有异常抛出时）
│  异常过滤器          │     Error handling (only when exceptions are thrown)
└─────────┬───────────┘
          │
          ▼
    响应返回 / Response Sent
```

> **为什么顺序很重要？/ Why does order matter?**
> 每个环节都有明确的职责边界。Middleware 在最外层处理原始 HTTP 请求；Guard 在路由匹配后检查权限；Pipe 在参数传给控制器之前进行验证；Interceptor 则包裹整个处理过程，可以同时操作请求和响应。把逻辑放错位置会导致意想不到的行为——例如在 Middleware 中做权限检查会丢失路由信息，在 Guard 中做数据转换则违反单一职责。
>
> **EN:** Each stage has a clear responsibility boundary. Middleware handles raw HTTP requests at the outermost layer; Guard checks permissions after route matching; Pipe validates parameters before they reach the controller; Interceptor wraps the entire process, able to manipulate both request and response. Placing logic in the wrong stage causes unexpected behavior — for example, doing authorization in Middleware loses route information, and doing data transformation in Guard violates single responsibility.

#### Middleware 中间件 / Middleware

**中文：**

Middleware 是请求进入 NestJS 应用后经过的第一道关卡。它和 Express 的中间件概念几乎一致——可以访问 `Request`、`Response` 对象以及 `next()` 函数。NestJS 支持两种中间件形式：**类中间件**（实现 `NestMiddleware` 接口）和**函数中间件**（普通函数）。

**EN:**

Middleware is the first checkpoint a request passes through when entering a NestJS application. It is nearly identical to Express middleware — it has access to `Request`, `Response` objects, and the `next()` function. NestJS supports two forms of middleware: **class middleware** (implementing `NestMiddleware` interface) and **function middleware** (plain functions).

```typescript
// logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    // 监听响应完成事件，计算总耗时
    // Listen for response completion to calculate total duration
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${method}] ${originalUrl} - ${res.statusCode} (${duration}ms)`
      );
    });

    // 必须调用 next() 将控制权传递给下一个中间件或路由处理器
    // Must call next() to pass control to the next middleware or route handler
    next();
  }
}

// 函数中间件（更简洁，推荐用于简单场景）
// Function middleware (more concise, recommended for simple scenarios)
export function simpleLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`[Simple] ${req.method} ${req.url}`);
  next();
}

// ============================================================
// 在 Module 中注册中间件 / Registering middleware in a Module
// ============================================================
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

@Module({ /* ... */ })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      // 排除特定路由 / Exclude specific routes
      .exclude(
        { path: 'health', method: RequestMethod.GET },
      )
      // 应用到所有路由 / Apply to all routes
      .forRoutes('*');
  }
}
```

#### Guard 守卫 / Guard

**中文：**

Guard 专门负责**授权逻辑**——决定当前请求是否被允许继续执行。它实现了 `CanActivate` 接口，返回 `boolean`（或 `Promise<boolean>` / `Observable<boolean>`）。Guard 在 Middleware 之后、Interceptor 之前执行，此时路由信息已经确定，因此可以通过 `ExecutionContext` 和 `Reflector` 获取路由处理器上的元数据。

**EN:**

Guards are solely responsible for **authorization logic** — deciding whether the current request is allowed to proceed. They implement the `CanActivate` interface, returning `boolean` (or `Promise<boolean>` / `Observable<boolean>`). Guards execute after Middleware and before Interceptor; at this point route information is already resolved, so you can access metadata on route handlers via `ExecutionContext` and `Reflector`.

```typescript
// role.guard.ts
import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// 自定义装饰器：标记路由所需的角色
// Custom decorator: mark required roles for a route
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
  // Reflector 用于读取路由元数据 / Reflector reads route metadata
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 从处理器或控制器上读取 'roles' 元数据
    // Read 'roles' metadata from handler or controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),  // 方法级别 / Method level
      context.getClass(),   // 控制器级别 / Controller level
    ]);

    // 如果没有设置角色要求，直接放行
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 从请求对象中获取用户信息（假设已由 AuthMiddleware 注入）
    // Get user info from request (assumed injected by AuthMiddleware)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未登录 / Not authenticated');
    }

    // 检查用户角色是否包含所需角色
    // Check if user's role includes any of the required roles
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('权限不足 / Insufficient permissions');
    }

    return true;
  }
}

// ============================================================
// 在控制器中使用 Guard / Using Guard in a controller
// ============================================================
//
// @Controller('admin')
// @UseGuards(RoleGuard)  // 控制器级别应用 / Apply at controller level
// export class AdminController {
//   @Get('users')
//   @Roles('admin', 'superadmin') // 设置元数据 / Set metadata
//   getAllUsers() { ... }
// }
```

#### Interceptor 拦截器 / Interceptor

**中文：**

Interceptor 是最灵活的处理环节——它同时拥有请求和响应的控制权。Interceptor 实现了 `NestInterceptor` 接口，核心是 `intercept(context, next)` 方法。其中 `next` 是一个 `CallHandler`，调用 `next.handle()` 会将请求传递给下游（最终到达 Controller）并返回一个 RxJS `Observable`。你可以用 RxJS 操作符（`tap`、`map`、`catchError`）对响应流进行转换。

**EN:**

Interceptors are the most flexible processing stage — they have control over both the request and the response. Interceptors implement the `NestInterceptor` interface, with the core being the `intercept(context, next)` method. Here `next` is a `CallHandler`; calling `next.handle()` passes the request downstream (eventually reaching the Controller) and returns an RxJS `Observable`. You can use RxJS operators (`tap`, `map`, `catchError`) to transform the response stream.

```typescript
// transform.interceptor.ts
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

/**
 * 统一响应格式拦截器
 * Unified response format interceptor
 *
 * 将控制器返回值包装为统一格式：
 * Wraps controller return values in a unified format:
 * {
 *   success: true,
 *   data: <original data>,
 *   timestamp: "2024-01-01T00:00:00.000Z"
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      // tap: 执行副作用（如日志），不修改数据流
      // tap: perform side effects (like logging) without modifying the data stream
      tap(() => {
        const duration = Date.now() - start;
        console.log(
          `[Interceptor] ${request.method} ${request.url} 完成 / completed in ${duration}ms`
        );
      }),

      // map: 转换响应数据 / Transform response data
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        // 可以添加请求 ID 等额外信息 / Can add extra info like request ID
      })),

      // catchError: 捕获并转换错误 / Catch and transform errors
      catchError((error) => {
        console.error(`[Interceptor] 错误 / Error: ${error.message}`);
        throw error; // 重新抛出，交给 ExceptionFilter 处理 / Re-throw for ExceptionFilter
      }),
    );
  }
}
```

> **RxJS 提示 / RxJS Tip:** NestJS 内部使用 RxJS 管理响应流。你不需要精通 RxJS，但至少要理解 `Observable`、`tap`（副作用）、`map`（转换）和 `catchError`（错误处理）这四个核心概念。`next.handle()` 返回的 Observable 最终会 resolve 为控制器的返回值。
>
> **EN:** NestJS uses RxJS internally to manage the response stream. You do not need to be an RxJS expert, but you should at least understand four core concepts: `Observable`, `tap` (side effects), `map` (transformation), and `catchError` (error handling). The Observable returned by `next.handle()` will ultimately resolve to the controller's return value.

#### Pipe 管道 / Pipe

**中文：**

Pipe 有两个用途：**参数转换**（如将字符串转为整数）和**参数验证**（如检查 DTO 字段是否合法）。它实现了 `PipeTransform` 接口，核心方法是 `transform(value, metadata)`。Pipe 在 Controller 方法执行之前运行，且作用于每个参数——这意味着如果 Controller 方法有三个参数，Pipe 会被调用三次。

**EN:**

Pipes serve two purposes: **parameter transformation** (e.g., converting a string to an integer) and **parameter validation** (e.g., checking if DTO fields are valid). They implement the `PipeTransform` interface with the core method `transform(value, metadata)`. Pipes run before the Controller method executes and are applied to each parameter — meaning if a Controller method has three parameters, the Pipe is called three times.

```typescript
// parse-positive-int.pipe.ts
import {
  PipeTransform, Injectable, ArgumentMetadata, BadRequestException,
} from '@nestjs/common';

/**
 * 自定义管道：将字符串参数转换为正整数
 * Custom pipe: transform string parameter to a positive integer
 */
@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  /**
   * @param value - 参数的原始值 / The raw parameter value
   * @param metadata - 参数的元数据 / Parameter metadata
   *   - metadata.type: 'body' | 'query' | 'param' | 'custom'
   *   - metadata.metatype: 参数的 TypeScript 类型 / The TypeScript type (e.g., Number, String)
   *   - metadata.data: 装饰器中的参数名 / The parameter name from the decorator
   */
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsedValue = parseInt(value, 10);

    // 检查是否为有效数字 / Check if it is a valid number
    if (isNaN(parsedValue)) {
      throw new BadRequestException(
        `"${metadata.data}" 必须是数字 / "${metadata.data}" must be a number`
      );
    }

    // 检查是否为正数 / Check if it is positive
    if (parsedValue <= 0) {
      throw new BadRequestException(
        `"${metadata.data}" 必须是正整数 / "${metadata.data}" must be a positive integer`
      );
    }

    return parsedValue;
  }
}

// NestJS 内置的 Pipe 列表 / Built-in Pipes in NestJS:
// - ValidationPipe:       使用 class-validator 验证 DTO
// - ParseIntPipe:         转换为整数 / Transform to integer
// - ParseFloatPipe:       转换为浮点数 / Transform to float
// - ParseBoolPipe:        转换为布尔值 / Transform to boolean
// - ParseArrayPipe:       转换为数组 / Transform to array
// - ParseUUIDPipe:        验证 UUID 格式 / Validate UUID format
// - ParseEnumPipe:        验证枚举值 / Validate enum values
// - DefaultValuePipe:     为 undefined/null 提供默认值 / Provide defaults for undefined/null
```

#### 应用层级 / Application Levels

**中文：**

中间件、守卫、拦截器和管道都可以在三个层级应用：

| 层级 / Level | 应用方式 / How | 作用域 / Scope |
|---|---|---|
| 全局 / Global | `app.useGlobalGuards()` 或 `@Module` 中注册 | 所有路由 |
| 控制器 / Controller | `@UseGuards()` 放在类上 | 该控制器的所有方法 |
| 方法 / Method | `@UseGuards()` 放在方法上 | 仅该方法 |

**EN:**

Middleware, Guards, Interceptors, and Pipes can all be applied at three levels:

| Level | How | Scope |
|---|---|---|
| Global | `app.useGlobalGuards()` or register in `@Module` | All routes |
| Controller | `@UseGuards()` on the class | All methods in that controller |
| Method | `@UseGuards()` on the method | Only that method |

```typescript
// 全局注册示例（在 main.ts 中）
// Global registration example (in main.ts)
//
// const app = await NestFactory.create(AppModule);
// app.useGlobalPipes(new ValidationPipe({ transform: true }));
// app.useGlobalInterceptors(new TransformInterceptor());
// app.useGlobalGuards(new RoleGuard(reflector));

// 推荐方式：通过 Module 注册全局 provider（支持依赖注入）
// Recommended: register global providers via Module (supports DI)
//
// @Module({
//   providers: [
//     {
//       provide: APP_GUARD,       // 全局 Guard token / Global Guard token
//       useClass: RoleGuard,
//     },
//     {
//       provide: APP_INTERCEPTOR, // 全局 Interceptor token / Global Interceptor token
//       useClass: TransformInterceptor,
//     },
//     {
//       provide: APP_PIPE,        // 全局 Pipe token / Global Pipe token
//       useClass: ValidationPipe,
//     },
//   ],
// })
// export class AppModule {}
```

---

### 项目 04: 数据库集成 / Project 04: Database Integration

#### 为什么选择 Prisma？ / Why Prisma?

**中文：**

在 NestJS 生态中，主流的 ORM 选择有三个：TypeORM、Prisma 和 Sequelize。我们选择 Prisma 作为教学用 ORM，原因如下：

| 特性 / Feature | TypeORM | Prisma | Sequelize |
|---|---|---|---|
| 类型安全 / Type Safety | 装饰器驱动 / Decorator-driven | 自动生成客户端 / Auto-generated client | 手动定义 / Manual |
| Schema 定义 | TypeScript 类 / TS Classes | Prisma Schema Language | JavaScript 配置 |
| 查询 API | QueryBuilder / Repository | 链式 API / Chain API | 链式 API |
| 迁移 / Migration | 自动生成 + CLI | 自动生成 + CLI | 手动 + CLI |
| 学习曲线 / Learning Curve | 中等 / Medium | 低 / Low | 高 / High |
| NestJS 集成 | @nestjs/typeorm | @prisma/client | @nestjs/sequelize |

Prisma 的核心优势在于：**Schema 即真理源**。你通过一种专门的 Prisma Schema Language 定义数据模型，Prisma CLI 会自动生成类型安全的客户端代码、数据库迁移脚本，甚至是数据浏览界面（Prisma Studio）。

**EN:**

In the NestJS ecosystem, there are three mainstream ORM choices: TypeORM, Prisma, and Sequelize. We chose Prisma for this tutorial for the following reasons:

Prisma's core advantage is that **Schema is the single source of truth**. You define data models using the Prisma Schema Language, and the Prisma CLI automatically generates type-safe client code, database migration scripts, and even a data browsing interface (Prisma Studio).

#### Schema 设计 / Schema Design

**中文：**

Prisma Schema Language（PSL）是一种声明式的领域特定语言（DSL），专门用于定义数据库模型和关系。它简洁直观，比用 TypeScript 装饰器定义模型（TypeORM 的方式）更加清晰。

**EN:**

Prisma Schema Language (PSL) is a declarative domain-specific language (DSL) designed specifically for defining database models and relationships. It is concise and intuitive, clearer than defining models with TypeScript decorators (the TypeORM approach).

```prisma
// schema.prisma

// 数据源配置 / Datasource configuration
// 使用 SQLite 作为学习阶段的数据库（零配置，开箱即用）
// Using SQLite for the learning phase (zero configuration, works out of the box)
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// Prisma 客户端生成器 / Prisma client generator
generator client {
  provider = "prisma-client-js"
}

// ============================================================
// 数据模型定义 / Data model definitions
// ============================================================

/// 商品模型 / Product model
model Product {
  id          Int       @id @default(autoincrement()) // 主键，自增 / Primary key, auto-increment
  name        String    // 商品名称 / Product name
  price       Float     // 价格 / Price
  description String?   // 描述（可选） / Description (optional)
  stock       Int       @default(0)  // 库存，默认 0 / Stock, default 0
  isActive    Boolean   @default(true) // 是否上架 / Whether active
  categoryId  Int       // 外键 / Foreign key
  category    Category  @relation(fields: [categoryId], references: [id])
  tags        Tag[]     // 多对多关系 / Many-to-many relation
  createdAt   DateTime  @default(now()) // 创建时间 / Created timestamp
  updatedAt   DateTime  @updatedAt      // 更新时间 / Updated timestamp

  // 复合索引：加速按分类+状态的查询
  // Compound index: speed up queries by category + status
  @@index([categoryId, isActive])
}

/// 分类模型 / Category model
model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique // 分类名称唯一 / Unique category name
  products Product[] // 一对多关系：一个分类下有多个商品
                        // One-to-many: one category has many products
}

/// 标签模型 / Tag model
model Tag {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  products Product[] // 多对多关系 / Many-to-many relation
}
```

> **SQLite 的选择 / Choosing SQLite:** 在学习阶段使用 SQLite 是因为它零配置、无需安装额外服务。一个 `dev.db` 文件就是整个数据库。当你进入后续阶段学习 PostgreSQL 或 MySQL 时，只需修改 `datasource` 中的 `provider` 和 `url` 即可，模型定义几乎不需要改动。
>
> **EN:** We use SQLite during the learning phase because it requires zero configuration and no additional services. A single `dev.db` file is your entire database. When you advance to PostgreSQL or MySQL in later stages, you only need to change the `provider` and `url` in the `datasource` block — model definitions remain nearly identical.

#### PrismaService 封装 / PrismaService Wrapper

**中文：**

为什么不直接在 Service 中 `new PrismaClient()`？因为我们需要让 Prisma 的生命周期与 NestJS 应用对齐。通过封装为 `PrismaService` 并实现 `OnModuleInit` 和 `OnModuleDestroy` 接口，可以确保数据库连接在应用启动时建立、在应用关闭时正确断开。

**EN:**

Why not just `new PrismaClient()` directly in your services? Because we need to align Prisma's lifecycle with the NestJS application. By wrapping it in a `PrismaService` that implements `OnModuleInit` and `OnModuleDestroy`, we ensure the database connection is established when the app starts and properly closed when the app shuts down.

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // 开启查询日志（开发环境调试用）
      // Enable query logging (for development debugging)
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  // 模块初始化时连接数据库 / Connect to database on module initialization
  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] 数据库已连接 / Database connected');
  }

  // 模块销毁时断开连接 / Disconnect on module destruction
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[PrismaService] 数据库已断开 / Database disconnected');
  }

  // 可选：提供一个清理数据库的方法（仅用于测试）
  // Optional: provide a method to clean the database (for testing only)
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      // 按依赖顺序删除所有数据 / Delete all data in dependency order
      await this.tag.deleteMany();
      await this.product.deleteMany();
      await this.category.deleteMany();
    }
  }
}

// prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() 使 PrismaService 在全局可用，无需在每个模块中导入
// @Global() makes PrismaService available globally without importing in every module
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 导出供其他模块注入 / Export for injection in other modules
})
export class PrismaModule {}
```

#### CRUD 操作模式 / CRUD Operation Patterns

**中文：**

Prisma 客户端提供了一套直观的链式 API 来完成 CRUD 操作。以下是 NestJS Service 中常见操作模式：

**EN:**

The Prisma client provides an intuitive chain API for CRUD operations. Below are common operation patterns in a NestJS Service:

```typescript
// products.service.ts (Prisma 版本 / Prisma version)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // 注入 PrismaService（由 PrismaModule 全局导出）
  // Inject PrismaService (globally exported by PrismaModule)
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // 查询列表（带分页、过滤、排序）
  // Query list (with pagination, filtering, sorting)
  // ============================================================
  async findAll(query: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, categoryId, search } = query;

    // 构建 where 条件 / Build where conditions
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.name = { contains: search }; // SQLite 不支持 mode: 'insensitive'
    }

    // 并行执行查询和计数 / Execute query and count in parallel
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        // 分页 / Pagination
        skip: (page - 1) * limit,  // 跳过前 N 条 / Skip first N records
        take: limit,                // 取 N 条 / Take N records
        // 排序 / Sorting
        orderBy: { createdAt: 'desc' },
        // 包含关联数据 / Include related data
        include: {
          category: true,       // 包含分类信息 / Include category info
          tags: true,           // 包含标签信息 / Include tag info
        },
      }),
      this.prisma.product.count({ where }), // 总数（用于分页计算）
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // 查询单条记录 / Query a single record
  // ============================================================
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, tags: true },
    });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在 / Product #${id} not found`);
    }

    return product;
  }

  // ============================================================
  // 创建（含关联操作） / Create (with relation operations)
  // ============================================================
  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        description: dto.description,
        stock: dto.stock ?? 0,
        // 连接已有分类 / Connect to existing category
        category: { connect: { id: dto.categoryId } },
        // 连接已有标签（多对多） / Connect existing tags (many-to-many)
        tags: dto.tagIds
          ? { connect: dto.tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { category: true, tags: true },
    });
  }

  // ============================================================
  // 更新 / Update
  // ============================================================
  async update(id: number, dto: UpdateProductDto) {
    // 先检查是否存在 / Check existence first
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        // 如果要更新分类关联 / If updating category relation
        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),
        // 如果要更新标签关联 / If updating tag relations
        ...(dto.tagIds && {
          tags: { set: dto.tagIds.map((id) => ({ id })) },
          // set 会替换所有关联；connect 是追加
          // set replaces all relations; connect appends
        }),
      },
      include: { category: true, tags: true },
    });
  }

  // ============================================================
  // 删除（软删除 vs 硬删除） / Delete (soft delete vs hard delete)
  // ============================================================
  async remove(id: number) {
    await this.findOne(id);

    // 硬删除 / Hard delete
    return this.prisma.product.delete({ where: { id } });

    // 软删除（推荐生产环境使用）/ Soft delete (recommended for production)
    // return this.prisma.product.update({
    //   where: { id },
    //   data: { isActive: false },
    // });
  }
}
```

#### 数据迁移与种子 / Migration and Seeding

**中文：**

Prisma 提供了完善的迁移和种子工具链。每次修改 Schema 后，你都需要生成并执行迁移来同步数据库结构。种子脚本用于在开发环境中填充初始数据。

**EN:**

Prisma provides a complete migration and seeding toolchain. After each Schema modification, you need to generate and execute migrations to synchronize the database structure. Seed scripts are used to populate initial data in the development environment.

```bash
# 初始化 Prisma（生成 schema.prisma 和 .env）
# Initialize Prisma (generates schema.prisma and .env)
npx prisma init --datasource-provider sqlite

# 生成并执行迁移（每次修改 Schema 后运行）
# Generate and execute migration (run after each Schema change)
npx prisma migrate dev --name init_schema
# --name 参数是给迁移起一个描述性名称
# --name gives the migration a descriptive name

# 生成 Prisma Client（迁移时会自动执行，但手动修改 Schema 后需要单独运行）
# Generate Prisma Client (auto-runs during migration, but needed after manual Schema edits)
npx prisma generate

# 打开 Prisma Studio（可视化的数据库浏览器）
# Open Prisma Studio (visual database browser)
npx prisma studio

# 执行种子脚本 / Execute seed script
npx prisma db seed

# 重置数据库（危险！删除所有数据并重新迁移+种子）
# Reset database (DANGER! Deletes all data and re-runs migrations + seeds)
npx prisma migrate reset
```

```typescript
// prisma/seed.ts - 种子脚本 / Seed script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 创建分类 / Create categories
  const electronics = await prisma.category.upsert({
    where: { name: '电子产品' },
    update: {},
    create: { name: '电子产品' },
  });

  const books = await prisma.category.upsert({
    where: { name: '图书' },
    update: {},
    create: { name: '图书' },
  });

  console.log('分类已创建 / Categories created:', { electronics, books });

  // 2. 创建标签 / Create tags
  const hotTag = await prisma.tag.upsert({
    where: { name: '热销' },
    update: {},
    create: { name: '热销' },
  });

  const newTag = await prisma.tag.upsert({
    where: { name: '新品' },
    update: {},
    create: { name: '新品' },
  });

  // 3. 创建商品（含关联）/ Create products (with relations)
  await prisma.product.createMany({
    data: [
      {
        name: 'MacBook Pro 16"',
        price: 19999,
        description: '苹果笔记本电脑 / Apple laptop',
        stock: 50,
        categoryId: electronics.id,
      },
      {
        name: 'NestJS 实战指南',
        price: 89,
        description: '从零到一学习 NestJS / Learn NestJS from scratch',
        stock: 200,
        categoryId: books.id,
      },
      {
        name: '机械键盘',
        price: 599,
        description: 'Cherry 轴体 / Cherry switches',
        stock: 100,
        categoryId: electronics.id,
      },
    ],
  });

  console.log('种子数据已填充 / Seed data populated');
}

main()
  .catch((e) => {
    console.error('种子脚本执行失败 / Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

> **package.json 种子配置 / Seed configuration in package.json:**
> ```json
> {
>   "prisma": {
>     "seed": "ts-node prisma/seed.ts"
>   }
> }
> ```

---

### 阶段总结 / Stage Summary

**中文：**

恭喜你完成了第一阶段的学习！让我们回顾一下你已经掌握的核心概念：

**EN:**

Congratulations on completing Stage 1! Let's review the core concepts you have mastered:

#### 概念清单 / Concept Checklist

- [ ] **装饰器 (Decorators):** 能区分并手写四种装饰器类型，理解 `reflect-metadata` 的工作机制
  Can distinguish and write all four decorator types, understand how `reflect-metadata` works

- [ ] **Module 模块:** 理解 `imports` / `controllers` / `providers` / `exports` 的职责划分
  Understand the responsibilities of `imports` / `controllers` / `providers` / `exports`

- [ ] **Controller 控制器:** 能用路由装饰器和参数装饰器构建 RESTful API
  Can build RESTful APIs using route and parameter decorators

- [ ] **Provider / DI:** 理解 IoC 容器、构造函数注入、Provider 的多种注册方式
  Understand IoC container, constructor injection, multiple provider registration methods

- [ ] **DTO + ValidationPipe:** 能定义数据传输对象并配置自动验证
  Can define DTOs and configure automatic validation

- [ ] **请求生命周期:** 能画出 Middleware → Guard → Interceptor → Pipe → Controller 的完整链路
  Can draw the complete chain: Middleware → Guard → Interceptor → Pipe → Controller

- [ ] **Prisma ORM:** 能编写 Schema、运行迁移、在 Service 中完成 CRUD 操作
  Can write Schema, run migrations, and perform CRUD operations in Services

#### 常见错误排查 / Common Debugging Tips

| 错误 / Error | 原因 / Cause | 解决方案 / Solution |
|---|---|---|
| `Cannot find module 'reflect-metadata'` | 未安装依赖 | `npm install reflect-metadata` |
| `Nest can't resolve dependencies` | Provider 未在 Module 中注册或未导出 | 检查 `providers` 和 `exports` 数组 |
| `ValidationPipe` 未生效 | 未安装 `class-validator` / `class-transformer` | `npm install class-validator class-transformer` |
| Prisma Client 类型不存在 | 未运行 `prisma generate` | `npx prisma generate` |
| 循环依赖错误 | 两个 Service 互相注入 | 使用 `forwardRef()` 或重构代码 |

#### 下一阶段预告 / Next Stage Preview

**中文：**

在第二阶段（进阶篇），你将学习：
- **身份认证与授权**：JWT + Passport 策略集成
- **配置管理**：`@nestjs/config` 与环境变量
- **异常处理**：自定义 ExceptionFilter 与统一错误响应
- **日志系统**：自定义 Logger 与日志级别控制
- **单元测试与 E2E 测试**：Jest + Supertest 实战

**EN:**

In Stage 2 (Intermediate), you will learn:
- **Authentication & Authorization**: JWT + Passport strategy integration
- **Configuration Management**: `@nestjs/config` and environment variables
- **Error Handling**: Custom ExceptionFilter and unified error responses
- **Logging System**: Custom Logger and log level control
- **Unit Testing & E2E Testing**: Jest + Supertest in practice

---

> **最后的建议 / Final Advice:**
> 学习编程最有效的方式是**动手实践**。不要只是阅读文档——打开编辑器，创建项目，亲手输入每一行代码。遇到报错时先读错误信息，90% 的问题都能通过仔细阅读错误提示来解决。剩下的 10%，去 NestJS 官方文档 (https://docs.nestjs.com) 和 Prisma 文档 (https://www.prisma.io/docs) 中寻找答案。
>
> **EN:** The most effective way to learn programming is through **hands-on practice**. Do not just read this document — open your editor, create a project, and type every line of code yourself. When you encounter errors, read the error message first; 90% of problems can be solved by carefully reading the error output. For the remaining 10%, consult the NestJS official docs (https://docs.nestjs.com) and Prisma docs (https://www.prisma.io/docs).
