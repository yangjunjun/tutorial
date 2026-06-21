# 01 - TypeScript 装饰器模式

## 项目简介

本项目是一个纯 TypeScript 项目（不依赖 NestJS 运行时），专门演示 NestJS 底层大量使用的**装饰器（Decorator）模式**。理解这些装饰器模式是掌握 NestJS 框架的基础。

## 知识点

### 装饰器类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 类装饰器（Class Decorator） | 作用于类本身，可以修改类的行为或添加属性 | `@Validate()` |
| 方法装饰器（Method Decorator） | 作用于类的方法，可以包装方法执行逻辑 | `@Log()` |
| 属性装饰器（Property Decorator） | 作用于类的属性，可以修改属性行为 | `@Required()`, `@Readonly()` |
| 参数装饰器（Parameter Decorator） | 作用于方法参数，可以收集参数元数据 | `@ApiParam()` |

### NestJS 中的装饰器应用

NestJS 大量使用装饰器模式：

- `@Controller()`, `@Injectable()`, `@Module()` - 类装饰器
- `@Get()`, `@Post()`, `@Put()`, `@Delete()` - 方法装饰器
- `@Param()`, `@Query()`, `@Body()` - 参数装饰器
- `@UseGuards()`, `@UseInterceptors()` - 方法/类装饰器

NestJS 内部使用 `reflect-metadata` 库来存储和读取装饰器附加的元数据，这也是本项目需要安装该库的原因。

## 文件结构

```
src/
├── decorators/
│   ├── logger.decorator.ts      # 方法装饰器 - 日志记录
│   ├── validate.decorator.ts    # 属性装饰器 + 类装饰器 - 数据验证
│   ├── readonly.decorator.ts    # 属性装饰器 - 只读属性
│   └── api.decorator.ts         # 类装饰器 + 参数装饰器 - 元数据存储
└── index.ts                     # 主入口，演示所有装饰器
```

## 运行方式

```bash
# 安装依赖
pnpm install

# 开发模式运行（使用 ts-node）
pnpm start:dev

# 编译
pnpm build

# 运行编译后的代码
pnpm start
```
