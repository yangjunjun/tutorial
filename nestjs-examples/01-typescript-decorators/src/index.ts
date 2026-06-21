/**
 * 主入口文件 - 演示所有装饰器的用法
 *
 * 运行方式: pnpm start:dev
 *
 * 本文件展示了四种装饰器类型的实际应用：
 * 1. 方法装饰器 @Log() - 日志记录
 * 2. 属性装饰器 @Required() + 类装饰器 @Validate() - 数据验证
 * 3. 属性装饰器 @Readonly() - 只读属性
 * 4. 类装饰器 @ApiEndpoint() + 参数装饰器 @ApiParam() - 元数据存储
 */

// reflect-metadata 必须在最顶部导入！
// NestJS 依赖它来实现元数据存储和读取
import 'reflect-metadata';

import { Log } from './decorators/logger.decorator';
import { Required, Validate } from './decorators/validate.decorator';
import { Readonly } from './decorators/readonly.decorator';
import {
  ApiEndpoint,
  ApiParam,
  getApiEndpoint,
  getApiParams,
} from './decorators/api.decorator';

// ============================================================
// 分隔线工具函数
// ============================================================
function section(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// ============================================================
// 演示 1: @Log() 方法装饰器
// ============================================================
section('1. @Log() 方法装饰器 - 自动记录方法调用');

class Calculator {
  // @Log() 会自动记录方法名、参数、返回值和执行时间
  @Log()
  add(a: number, b: number): number {
    return a + b;
  }

  @Log()
  multiply(a: number, b: number): number {
    // 模拟一些计算时间
    let result = 0;
    for (let i = 0; i < a * b; i++) {
      result += 1;
    }
    return result;
  }

  @Log()
  greet(name: string, greeting: string = '你好'): string {
    return `${greeting}, ${name}!`;
  }
}

const calc = new Calculator();
calc.add(10, 20);
calc.multiply(5, 8);
calc.greet('NestJS', '欢迎使用');

// ============================================================
// 演示 2: @Required() + @Validate() 验证装饰器
// ============================================================
section('2. @Required() + @Validate() - 属性验证');

@Validate()
class User {
  @Required()
  name: string;

  @Required()
  email: string;

  // 非必填字段
  age?: number;

  constructor(name: string, email: string, age?: number) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
}

@Validate()
class Product {
  @Required()
  title: string;

  @Required()
  price: number;

  @Required()
  category: string;

  description?: string;

  constructor(title: string, price: number, category: string, description?: string) {
    this.title = title;
    this.price = price;
    this.category = category;
    this.description = description;
  }
}

// 有效的用户
const validUser = new User('张三', 'zhangsan@example.com', 25);
console.log('\n验证有效用户:', validUser.validate());

// 无效的用户（缺少必填字段）
const invalidUser = new User(null, undefined);
console.log('\n验证无效用户:', invalidUser.validate());

// 有效的商品
const validProduct = new Product('TypeScript 实战', 99.00, '编程书籍');
console.log('\n验证有效商品:', validProduct.validate());

// 无效的商品（缺少价格和分类）
const invalidProduct = new Product('未知商品', null, undefined);
console.log('\n验证无效商品:', invalidProduct.validate());

// ============================================================
// 演示 3: @Readonly() 只读属性装饰器
// ============================================================
section('3. @Readonly() 属性装饰器 - 只读保护');

class AppConfig {
  @Readonly()
  appName: string;

  @Readonly()
  version: string;

  // 普通属性，可以修改
  debug: boolean;

  constructor(appName: string, version: string, debug: boolean = false) {
    this.appName = appName;
    this.version = version;
    this.debug = debug;
  }
}

const config = new AppConfig('我的应用', '1.0.0', false);
console.log(`\n初始值: appName=${config.appName}, version=${config.version}, debug=${config.debug}`);

// 尝试修改只读属性
config.appName = '新名称';  // 会被拦截
config.version = '2.0.0';   // 会被拦截

// 普通属性可以正常修改
config.debug = true;

console.log(`修改后: appName=${config.appName}, version=${config.version}, debug=${config.debug}`);
console.log('（只读属性未被修改，普通属性 debug 修改成功）');

// ============================================================
// 演示 4: @ApiEndpoint() + @ApiParam() 元数据存储
// ============================================================
section('4. @ApiEndpoint() + @ApiParam() - 元数据存储模式');

// 这个装饰器会输出注册信息
@ApiEndpoint({ method: 'GET', path: '/users' })
class UserController {
  // @ApiParam 记录参数元数据
  findUser(@ApiParam('userId') id: string, @ApiParam('includePosts') includePosts: boolean) {
    return { id, includePosts };
  }

  listUsers(@ApiParam('page') page: number, @ApiParam('limit') limit: number) {
    return { page, limit };
  }
}

@ApiEndpoint({ method: 'POST', path: '/products' })
class ProductController {
  createProduct(@ApiParam('body') data: any) {
    return data;
  }
}

// 读取元数据 —— 这就是 NestJS 路由解析的核心机制
console.log('\n--- 读取元数据 ---');

const userEndpoint = getApiEndpoint(UserController);
console.log(`\nUserController 端点信息:`, userEndpoint);

const productEndpoint = getApiEndpoint(ProductController);
console.log(`ProductController 端点信息:`, productEndpoint);

// 读取参数装饰器存储的元数据
const findUserParams = getApiParams(UserController.prototype, 'findUser');
console.log(`\nfindUser 方法参数信息:`, findUserParams);

const listUsersParams = getApiParams(UserController.prototype, 'listUsers');
console.log(`listUsers 方法参数信息:`, listUsersParams);

const createProductParams = getApiParams(ProductController.prototype, 'createProduct');
console.log(`createProduct 方法参数信息:`, createProductParams);

// ============================================================
// 总结
// ============================================================
section('总结');
console.log(`
NestJS 中的装饰器类型及其用途：

1. 类装饰器 (Class Decorator)
   - @Controller('path')   → 定义控制器和路由前缀
   - @Injectable()         → 标记类可被注入
   - @Module({...})        → 定义模块
   - 本例: @Validate(), @ApiEndpoint()

2. 方法装饰器 (Method Decorator)
   - @Get('/path')         → 定义 GET 路由
   - @Post('/path')        → 定义 POST 路由
   - @UseGuards(...)       → 应用守卫
   - 本例: @Log()

3. 属性装饰器 (Property Decorator)
   - @Column()             → TypeORM/Prisma 字段映射
   - 本例: @Required(), @Readonly()

4. 参数装饰器 (Parameter Decorator)
   - @Param('id')          → 提取路由参数
   - @Query('page')        → 提取查询参数
   - @Body()               → 提取请求体
   - 本例: @ApiParam()

核心原理: reflect-metadata
   - Reflect.defineMetadata() 存储元数据
   - Reflect.getMetadata()    读取元数据
   - NestJS 框架在启动时读取所有装饰器存储的元数据，
     然后据此构建路由树、依赖注入容器等。
`);
