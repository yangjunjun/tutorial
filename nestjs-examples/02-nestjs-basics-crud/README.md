# 02 - NestJS 基础 CRUD 应用

## 项目简介

本项目是一个电商商品管理的 CRUD 应用，使用内存数据存储。通过这个项目，你将学习 NestJS 最核心的三大概念：**模块（Module）**、**控制器（Controller）** 和 **提供者（Provider）**，以及**依赖注入（DI）**机制。

## 核心概念

### 模块（Module）

模块是组织代码的基本单元。每个 NestJS 应用至少有一个根模块（AppModule）。

```
@Module({
  imports: [],      // 导入其他模块
  controllers: [],  // 注册控制器
  providers: [],    // 注册提供者（服务等）
  exports: [],      // 导出提供者供其他模块使用
})
```

### 控制器（Controller）

控制器负责处理 HTTP 请求并返回响应。使用 `@Controller()` 装饰器定义。

### 提供者（Provider / Service）

提供者封装业务逻辑，通过依赖注入（DI）机制注入到控制器或其他提供者中。使用 `@Injectable()` 装饰器标记。

### 依赖注入（DI）

依赖注入是 NestJS 的核心设计模式。你不需要手动创建服务实例，框架会自动管理：

```typescript
// 不需要这样:
// const service = new ProductsService();

// 只需要在构造函数中声明:
constructor(private readonly productsService: ProductsService) {}
```

## 文件结构

```
src/
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts    # 创建商品的数据传输对象
│   │   └── update-product.dto.ts    # 更新商品的数据传输对象
│   ├── interfaces/
│   │   └── product.interface.ts     # 商品接口定义
│   ├── products.service.ts          # 商品业务逻辑（提供者）
│   ├── products.controller.ts       # 商品路由处理（控制器）
│   └── products.module.ts           # 商品模块
├── app.module.ts                    # 根模块
└── main.ts                          # 应用入口
```

## 运行方式

```bash
# 安装依赖
pnpm install

# 开发模式运行（热重载）
pnpm start:dev

# 编译
pnpm build

# 运行编译后的代码
pnpm start:prod
```

## API 测试

### 创建商品
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "TypeScript 实战", "description": "深入理解 TypeScript", "price": 99.00, "category": "编程书籍", "stock": 100}'
```

### 查询所有商品
```bash
curl http://localhost:3000/products
```

### 按分类筛选
```bash
curl "http://localhost:3000/products?category=编程书籍"
```

### 按价格范围筛选
```bash
curl "http://localhost:3000/products?minPrice=50&maxPrice=150"
```

### 查询单个商品
```bash
curl http://localhost:3000/products/{id}
```

### 更新商品
```bash
curl -X PUT http://localhost:3000/products/{id} \
  -H "Content-Type: application/json" \
  -d '{"price": 79.00, "stock": 80}'
```

### 删除商品
```bash
curl -X DELETE http://localhost:3000/products/{id}
```
