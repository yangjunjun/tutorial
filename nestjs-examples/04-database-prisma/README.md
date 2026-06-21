# 04 - NestJS + Prisma ORM 数据库集成

## 项目简介

本项目演示如何在 NestJS 中集成 **Prisma ORM** 进行数据库操作。使用 SQLite 作为数据库（无需安装额外的数据库服务器），包含完整的商品分类管理系统。

## 核心概念

### Prisma ORM

Prisma 是一个现代化的 TypeScript ORM，具有以下特点：

- **类型安全**：自动生成的 TypeScript 类型，编译时检查
- **声明式 Schema**：使用 Prisma Schema Language 定义数据模型
- **自动迁移**：自动生成和执行数据库迁移
- **Prisma Studio**：可视化的数据库管理工具

### 数据模型设计

```
Category (分类)          Product (商品)
┌──────────────┐    ┌───────────────────┐
│ id           │    │ id                │
│ name         │───<│ categoryId        │
│ createdAt    │    │ name              │
└──────────────┘    │ description       │
                    │ price             │
                    │ stock             │
                    │ createdAt         │
                    │ updatedAt         │
                    └───────────────────┘

一对多关系：一个分类可以有多个商品
```

### Prisma 常用命令

```bash
# 生成 Prisma Client（根据 Schema 生成 TypeScript 类型和查询方法）
npx prisma generate

# 创建并应用数据库迁移
npx prisma migrate dev --name init

# 打开 Prisma Studio（可视化数据库管理）
npx prisma studio

# 重置数据库（删除所有数据并重新迁移）
npx prisma migrate reset
```

### 在 NestJS 中使用 Prisma

1. **PrismaService**：继承 PrismaClient，实现生命周期钩子
2. **PrismaModule**：全局模块，导出 PrismaService
3. **注入使用**：在 Service 中注入 PrismaService

## 文件结构

```
prisma/
└── schema.prisma               # Prisma 数据模型定义
src/
├── prisma/
│   ├── prisma.service.ts       # Prisma 服务（继承 PrismaClient）
│   └── prisma.module.ts        # Prisma 全局模块
├── categories/
│   ├── dto/
│   │   └── create-category.dto.ts
│   ├── categories.service.ts
│   ├── categories.controller.ts
│   └── categories.module.ts
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   └── update-product.dto.ts
│   ├── products.service.ts
│   ├── products.controller.ts
│   └── products.module.ts
├── app.module.ts               # 根模块
├── main.ts                     # 应用入口
└── seed.ts                     # 种子数据脚本
```

## 运行方式

```bash
# 1. 安装依赖
pnpm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 执行数据库迁移（首次运行会创建 SQLite 数据库文件）
pnpm prisma:migrate -- --name init

# 4. 填充种子数据
pnpm seed

# 5. 启动应用
pnpm start:dev
```

## 使用 Prisma Studio 探索数据

```bash
pnpm prisma:studio
# 会在浏览器中打开 http://localhost:5555
```

## API 测试

### 分类管理

```bash
# 创建分类
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "电子产品"}'

# 获取所有分类
curl http://localhost:3000/categories

# 获取单个分类（包含关联商品）
curl http://localhost:3000/categories/1
```

### 商品管理

```bash
# 创建商品（指定分类 ID）
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "MacBook Pro", "description": "M3 芯片", "price": 14999, "stock": 50, "categoryId": 1}'

# 获取所有商品（分页）
curl "http://localhost:3000/products?page=1&pageSize=10"

# 按分类筛选
curl "http://localhost:3000/products?categoryId=1"

# 获取单个商品（包含分类信息）
curl http://localhost:3000/products/1

# 更新商品
curl -X PUT http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 13999, "stock": 30}'

# 删除商品
curl -X DELETE http://localhost:3000/products/1
```
