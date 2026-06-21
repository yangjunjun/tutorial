# 14-graphql - NestJS GraphQL 示例 (Code-First)

## 项目简介

本项目演示如何在 NestJS 中使用 GraphQL 构建 API。
采用 **Code-First** 方式 —— 通过 TypeScript 类和装饰器定义 GraphQL Schema，
框架自动生成 `.graphql` schema 文件。

这是一个简单的博客 API，包含文章(Post)和作者(Author)两个实体。

## 学习要点

### 1. GraphQL 核心概念

**GraphQL 是什么？**
- Facebook 开发的 API 查询语言
- 客户端可以精确指定需要的数据
- 一个端点 (`/graphql`) 处理所有请求
- 强类型系统，自动文档生成

**三种操作类型：**

| 类型 | 说明 | 类比 REST |
|------|------|-----------|
| Query | 读取数据 | GET |
| Mutation | 修改数据 | POST/PUT/PATCH/DELETE |
| Subscription | 实时推送 | WebSocket |

### 2. Code-First vs Schema-First

**Code-First（本项目使用）：**
```typescript
// TypeScript 类 + 装饰器定义 Schema
@ObjectType()
class Post {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;
}
```
- 优点：与 TypeScript 紧密集成，类型安全
- 适合：NestJS 项目

**Schema-First：**
```graphql
# 先写 .graphql 文件
type Post {
  id: Int!
  title: String!
}
```
- 优点：与语言无关
- 适合：多语言项目

### 3. NestJS GraphQL 装饰器

| 装饰器 | 用途 |
|--------|------|
| `@ObjectType()` | 定义 GraphQL 类型 |
| `@InputType()` | 定义输入类型（Mutation 参数） |
| `@Field()` | 定义字段 |
| `@Resolver()` | 标记为 GraphQL 解析器 |
| `@Query()` | 定义查询 |
| `@Mutation()` | 定义变更 |
| `@ResolveField()` | 解析关联字段 |
| `@Args()` | 获取查询参数 |

### 4. GraphQL Playground

启动项目后，访问 `http://localhost:3000/graphql` 打开 GraphQL Playground。
这是一个交互式的 GraphQL IDE，可以：
- 编写和执行查询
- 查看自动生成的文档
- 测试 Mutation

## 示例查询

### 查询所有文章
```graphql
query {
  posts {
    id
    title
    content
    tags
    createdAt
    author {
      id
      name
      email
    }
  }
}
```

### 查询单个文章
```graphql
query {
  post(id: 1) {
    id
    title
    content
    author {
      name
    }
  }
}
```

### 创建文章
```graphql
mutation {
  createPost(input: {
    title: "新文章"
    content: "这是文章内容"
    authorId: 1
    tags: ["NestJS", "GraphQL"]
  }) {
    id
    title
    createdAt
  }
}
```

### 创建作者
```graphql
mutation {
  createAuthor(input: {
    name: "张三"
    email: "zhangsan@example.com"
  }) {
    id
    name
    posts {
      title
    }
  }
}
```

### 删除文章
```graphql
mutation {
  deletePost(id: 1)
}
```

## 运行方式

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm start:dev

# 打开 GraphQL Playground
# 访问 http://localhost:3000/graphql
```
