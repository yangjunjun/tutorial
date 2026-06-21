# NestJS 学习教程 — 示例项目集合

> 本仓库是 [NestJS 两个月深度学习教程](./nestjs-learning-roadmap.md) 的配套代码，共 16 个独立示例项目，覆盖从入门到部署的完整知识体系。
>
> 使用 **pnpm workspace** 统一管理依赖，每个项目都可独立运行和学习。

## 快速开始

```bash
# 克隆仓库后，进入项目目录
cd nestjs-examples

# 安装所有项目的依赖（pnpm workspace 自动处理）
pnpm install

# 进入任意项目目录运行
cd 02-nestjs-basics-crud
pnpm start:dev
```

---

## 项目总览

### 第一阶段：筑基篇（第 1-2 周）

| # | 项目 | 知识点 | 核心技术 |
|---|------|--------|---------|
| 01 | [typescript-decorators](./01-typescript-decorators) | TypeScript 装饰器模式 | 类/方法/属性/参数装饰器、Reflect Metadata |
| 02 | [nestjs-basics-crud](./02-nestjs-basics-crud) | NestJS 核心三件套 | Module、Controller、Provider、依赖注入、DTO 校验 |
| 03 | [request-lifecycle](./03-request-lifecycle) | 请求生命周期 | Middleware → Guard → Interceptor → Pipe → Controller |
| 04 | [database-prisma](./04-database-prisma) | 数据库集成 | Prisma ORM、SQLite、数据模型设计、迁移 |

### 第二阶段：核心能力篇（第 3-5 周）

| # | 项目 | 知识点 | 核心技术 |
|---|------|--------|---------|
| 05 | [jwt-auth](./05-jwt-auth) | JWT 认证 | Passport.js、JWT Strategy、Local Strategy、bcrypt |
| 06 | [rbac-permission](./06-rbac-permission) | 权限控制 | @Roles 装饰器、RolesGuard、Reflector、@CurrentUser |
| 07 | [exception-logger-config](./07-exception-logger-config) | 基础设施 | ExceptionFilter、Winston 日志、ConfigModule、文件上传 |
| 08 | [middleware-interceptor-pipe](./08-middleware-interceptor-pipe) | 高级请求处理 | 限流中间件、缓存拦截器、序列化、自定义管道 |
| 09 | [swagger-docs](./09-swagger-docs) | API 文档 | @nestjs/swagger、@ApiProperty、Swagger UI |

### 第三阶段：电商业务深入篇（第 6-7 周）

| # | 项目 | 知识点 | 核心技术 |
|---|------|--------|---------|
| 10 | [order-transaction](./10-order-transaction) | 订单与事务 | Prisma 事务、支付模拟、幂等性、定时任务 |
| 11 | [cache-queue](./11-cache-queue) | 缓存与队列 | Redis/cache-manager、Bull 消息队列、N+1 优化 |

### 第四阶段：高级主题篇（第 8-9 周）

| # | 项目 | 知识点 | 核心技术 |
|---|------|--------|---------|
| 12 | [testing](./12-testing) | 测试体系 | Jest 单元/集成/E2E 测试、Mock、supertest |
| 13 | [microservice](./13-microservice) | 微服务架构 | TCP Transport、EventPattern、MessagePattern |
| 14 | [graphql](./14-graphql) | GraphQL API | Code-First 模式、Apollo Server、Resolver |
| 15 | [websocket](./15-websocket) | 实时通信 | Socket.io Gateway、房间、命名空间、广播 |

### 第五阶段：工程化与部署篇（第 10 周）

| # | 项目 | 知识点 | 核心技术 |
|---|------|--------|---------|
| 16 | [docker-deploy](./16-docker-deploy) | 生产部署 | 多阶段 Dockerfile、CI/CD、健康检查、Prometheus 监控 |

---

## 项目结构说明

每个项目遵循统一的目录结构：

```
项目名/
├── src/                   # 源代码目录
│   ├── main.ts            # 应用入口
│   ├── app.module.ts      # 根模块
│   └── ...                # 按功能模块组织的代码
├── test/                  # 测试文件（部分项目）
├── prisma/                # Prisma Schema（使用 Prisma 的项目）
├── package.json           # 项目依赖和脚本
├── tsconfig.json          # TypeScript 配置（继承 tsconfig.base.json）
├── nest-cli.json          # NestJS CLI 配置
├── .gitignore
└── README.md              # 项目说明和学习指南
```

---

## 运行环境要求

- Node.js >= 20.x
- pnpm >= 8.x（使用 `corepack enable` 或 `npm install -g pnpm` 安装）

---

## 学习建议

1. **按顺序学习**：项目编号对应教程进度，前面的项目是后面项目的基础
2. **阅读注释**：每个源文件都有详细的中文注释解释概念
3. **动手实验**：用 curl 或 Postman 测试每个接口，修改代码观察效果
4. **阅读 README**：每个项目的 README 包含学习要点和测试命令
5. **重构练习**：学完后续项目后，回头用新知识优化前面的项目

---

## 许可证

MIT — 仅供学习使用
