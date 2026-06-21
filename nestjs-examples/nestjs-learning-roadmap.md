## NestJS 两个月深度学习教程规划

> **前置要求**：Node.js 基础（npm/yarn、Express 概念、异步编程）、前端基础（HTTP 协议、RESTful 概念、基本 JS/TS 语法）
>
> **学习节奏**：每天 1-2 小时，周末可适当加量用于项目实战
>
> **实战主线**：电商平台 API（贯穿全程，从零搭建到生产部署）

---

### 第一阶段：筑基篇（第 1-2 周）

#### 第 1 周：TypeScript 进阶 + NestJS 入门

**TypeScript 补充知识**（2 天）

NestJS 重度依赖 TypeScript 的高级特性，在正式开始前需要补齐以下知识点：装饰器（Decorator）的原理与自定义、接口与类型别名的深入用法、泛型在框架中的应用场景、`class-validator` 和 `class-transformer` 的基本使用。建议直接对照 NestJS 源码中的装饰器用法来学习，比单纯看 TS 文档更高效。

**NestJS 核心三件套**（5 天）

从 `@nestjs/cli` 创建第一个项目开始，逐步理解 NestJS 的三大基石：

| 概念 | 重点内容 | 练习 |
|------|---------|------|
| **Module** | `@Module` 装饰器、模块导入导出、共享模块、动态模块初探 | 拆分电商项目的商品模块、用户模块 |
| **Controller** | 路由装饰器 `@Controller`/`@Get`/`@Post`、请求参数获取、响应状态码控制 | 实现商品列表、商品详情 API |
| **Provider** | `@Injectable`、依赖注入原理、构造器注入、自定义 Provider | 编写 ProductService，实现数据查询逻辑 |

**本周实战目标**：搭建电商项目骨架，实现商品模块的基础 CRUD 接口（内存数据即可）。

#### 第 2 周：请求生命周期 + 数据库接入

**请求处理机制**（3 天）

深入理解一个请求从进入到返回的完整链路：Middleware → Guard → Interceptor → Pipe → Controller → Service。重点关注 `@nestjs/common` 中内置的中间件和管道，学会用 `ValidationPipe` 配合 DTO 做请求参数校验。

**数据库集成**（4 天）

NestJS 最常用的两种 ORM 方案对比：

| 方案 | 优势 | 适用场景 |
|------|------|---------|
| **TypeORM** | 与 NestJS 官方深度集成、Active Record + Data Mapper 双模式 | 快速开发、中小型项目 |
| **Prisma** | 类型安全极佳、Schema 声明式定义、迁移管理优秀 | 中大型项目、类型安全要求高 |

建议两个都了解，实战中选择一个深入（推荐 Prisma，生态更新且类型推导更好）。

**本周实战目标**：接入 PostgreSQL（或 MySQL），用 Prisma/TypeORM 定义商品、分类的数据模型，完成数据库迁移，将 CRUD 接口切换到真实数据库。

---

### 第二阶段：核心能力篇（第 3-5 周）

#### 第 3 周：认证与权限体系

**JWT 认证**（3 天）

学习 `@nestjs/passport` 和 `@nestjs/jwt`，实现完整的认证流程：用户注册（密码加密）→ 登录签发 JWT → 请求携带 Token → Guard 校验。理解 Passport 的 Strategy 模式，能编写自定义策略。

**RBAC 权限控制**（2 天）

基于角色的访问控制是电商系统的刚需。实现自定义 `@Roles()` 装饰器 + `RolesGuard`，支持角色分级（普通用户 / 商家 / 管理员）。学习 `Reflector` 在元数据读取中的作用。

**Casl 权限库**（2 天，进阶选学）

如果需要更细粒度的权限控制（如"用户只能编辑自己的商品"），了解 `@casl/ability` 与 NestJS 的集成方案。

**本周实战目标**：实现电商项目的用户注册/登录、角色权限体系。买家可以浏览和下单，商家可以管理自己的商品，管理员可以管理所有数据。

#### 第 4 周：异常处理、日志、配置管理

**异常处理**（2 天）

自定义异常过滤器（`ExceptionFilter`），统一 API 错误响应格式。区分业务异常和系统异常，实现全局异常捕获与局部异常覆盖。

**日志系统**（2 天）

从内置 `Logger` 到集成 `winston` 或 `pino`。实现请求日志（结合 Interceptor 记录耗时）、错误日志（结合 ExceptionFilter）、业务日志分级输出。

**配置管理**（1 天）

`@nestjs/config` 模块的使用，`.env` 文件加载、配置校验（用 `joi` 或 `class-validator`）、多环境配置切换（开发 / 测试 / 生产）。

**文件上传**（2 天）

使用 `@nestjs/platform-express` 的 `FileInterceptor` 处理文件上传，集成云存储（如阿里云 OSS 或 AWS S3）实现商品图片上传与管理。

**本周实战目标**：完善电商项目的基础设施——统一错误格式、结构化日志、环境配置分离、商品图片上传功能。

#### 第 5 周：中间件、拦截器与高级请求处理

**深入 Middleware**（2 天）

函数式中间件 vs 类中间件的区别与选择，中间件的执行顺序，全局 vs 路由级中间件。实现请求限流（rate limiting）、CORS 配置等。

**深入 Interceptor**（2 天）

拦截器的典型应用场景：响应数据转换（`map` 操作符）、缓存拦截器、超时控制。理解 RxJS 在拦截器中的角色。

**深入 Pipe**（1 天）

自定义管道编写，`ParseIntPipe` / `ParseUUIDPipe` 等内置管道的源码学习。实现一个通用的参数转换管道。

**Swagger 文档**（2 天）

使用 `@nestjs/swagger` 自动生成 API 文档。学习 `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等装饰器，为电商项目的所有接口生成可交互的 Swagger UI。

**本周实战目标**：为电商项目加上完整的 API 文档、请求限流、响应数据统一包装（`{ code, message, data }` 格式）。

---

### 第三阶段：电商业务深入篇（第 6-7 周）

#### 第 6 周：订单系统与事务管理

**订单模块设计**（3 天）

设计订单相关的数据库模型：Order、OrderItem、ShippingAddress。实现下单流程——校验库存 → 计算价格 → 创建订单 → 扣减库存，重点学习数据库事务在 NestJS 中的使用（Prisma 的 `$transaction` 或 TypeORM 的 `queryRunner`）。

**支付集成**（2 天）

模拟支付流程的设计（不需要真实对接，但要理解 webhook 模式）。实现支付状态回调接口，学习幂等性处理——同一笔支付通知可能到达多次。

**定时任务**（2 天）

使用 `@nestjs/schedule` 实现定时任务：超时未支付自动取消订单、每日销售统计。了解 `Cron` 表达式在 NestJS 中的用法。

**本周实战目标**：实现完整的下单 → 模拟支付 → 订单状态流转链路，处理事务一致性和定时任务。

#### 第 7 周：缓存、队列与性能优化

**缓存策略**（3 天）

使用 `@nestjs/cache-manager` 集成 Redis。实现商品列表缓存、热门商品缓存、缓存失效策略（写操作时清除相关缓存）。学习 Cache-Aside 和 Write-Through 等缓存模式。

**消息队列**（2 天）

使用 `@nestjs/bull`（基于 Bull/BullMQ）实现异步任务处理：订单创建后异步发送通知邮件、异步生成销售报表。理解 Producer / Consumer 模式。

**数据库优化**（2 天）

N+1 查询问题及解决方案（Prisma 的 `include` vs 手动 join）、分页查询优化（cursor-based pagination）、索引设计。为商品列表接口实现高性能分页。

**本周实战目标**：为电商项目加入 Redis 缓存层、消息队列异步处理、数据库查询优化。

---

### 第四阶段：高级主题篇（第 8-9 周）

#### 第 8 周：测试体系

**单元测试**（3 天）

使用 Jest 测试 Service 层逻辑，学习 NestJS 的 `TestingModule` 创建测试专用模块。Mock 外部依赖（数据库、第三方服务），掌握 `jest.fn()` / `jest.mock()` 的使用。

**集成测试**（2 天）

使用 `supertest` 进行端到端接口测试，搭建测试数据库（Docker 快速启停），实现完整请求链路的测试。

**E2E 测试**（2 天）

`@nestjs/testing` 的 E2E 测试方案，测试完整的用户下单流程。学习测试的组织方式——`describe` / `beforeEach` / `afterAll` 的合理使用。

**本周实战目标**：为电商项目的核心业务（下单、支付回调、权限校验）编写覆盖充分的测试。

#### 第 9 周：微服务与高级通信

**微服务基础**（3 天）

NestJS 微服务架构概览，理解 Transporter 抽象层。学习 TCP / Redis / RabbitMQ 等传输策略，将电商项目中的通知服务拆分为独立微服务。

**GraphQL 入门**（2 天，选学）

`@nestjs/graphql` 的 Code-First 和 Schema-First 两种模式。将商品查询接口改造为 GraphQL Schema，体验前端按需查询的优势。

**WebSocket 实时通信**（2 天）

使用 `@nestjs/websockets`（基于 Socket.io）实现实时功能：订单状态实时推送、商家后台实时数据看板。

**本周实战目标**：将通知服务拆分出去，为电商项目加上 WebSocket 实时订单状态推送。

---

### 第五阶段：工程化与部署篇（第 10 周）

#### 第 10 周：生产级工程实践

**项目结构优化**（1 天）

从按功能模块组织到按业务领域组织（DDD 风格），Feature Module 设计原则，共享库（Library）的抽取与管理。

**Docker 容器化**（2 天）

编写多阶段 Dockerfile 优化镜像体积，`docker-compose` 编排完整开发环境（应用 + PostgreSQL + Redis + RabbitMQ）。

**CI/CD**（2 天）

使用 GitHub Actions 搭建自动化流水线：代码检查（ESLint + Prettier）→ 单元测试 → 构建 → Docker 镜像推送 → 部署。

**监控与可观测性**（1 天）

集成 Prometheus 指标采集（`@nestjs/terminus` 健康检查）、结构化日志输出、基本的 APM 概念。

**本周实战目标**：将电商项目 Docker 化，搭建 CI/CD 流水线，实现一键部署。

---

### 推荐学习资源

**官方文档**（永远的第一手资料）
- [NestJS 官方文档](https://docs.nestjs.com) — 质量极高，几乎是所有 NestJS 知识的源头
- [Prisma 官方文档](https://www.prisma.io/docs) — 数据库 ORM 部分参考
- [Passport.js 文档](http://www.passportjs.org/docs/) — 认证策略理解

**视频课程**
- Udemy 上的 "NestJS: The Complete TypeScript Framework" 系列（评分 4.5+）
- YouTube 搜索 "NestJS Crash Course 2024" 可找到最新的免费入门教程
- B 站搜索 "NestJS 教程" 有不少中文系列，适合快速入门

**书籍与专栏**
- 《NestJS 开发指南》（掘金/知乎小册）— 中文社区有不少优质付费专栏
- "Node.js 设计模式" 第三版 — 虽然不是专门讲 NestJS，但设计模式部分非常契合

**实践参考**
- GitHub 上搜索 "nestjs-starter" 或 "nestjs-boilerplate" 参考成熟项目结构
- [NestJS Samples](https://github.com/nestjs/nest/tree/master/sample) — 官方示例代码库
- [Prisma Examples](https://github.com/prisma/prisma-examples) — Prisma + NestJS 集成示例

**源码阅读**
- NestJS 本身就是 TypeScript 项目的最佳实践范本，建议在学习中期开始阅读 `@nestjs/core` 和 `@nestjs/common` 的源码，理解 IoC 容器和依赖注入的底层实现
- GitHub 上的 `nestjs/awesome-nestjs` 仓库收录了大量优质资源，Discord 社区（通过官网进入）提问响应很快

---

### 项目里程碑检查清单

| 阶段 | 完成时间 | 交付物 | 核心能力验证 |
|------|---------|--------|-------------|
| 第一阶段结束 | 第 2 周末 | 商品 CRUD + 数据库 | 能用 NestJS 写出规范的 RESTful API |
| 第二阶段结束 | 第 5 周末 | 认证 + 权限 + 文档 | 能设计安全的 API 并自动生成文档 |
| 第三阶段结束 | 第 7 周末 | 订单 + 缓存 + 队列 | 能处理复杂业务和性能优化 |
| 第四阶段结束 | 第 9 周末 | 测试 + 微服务 + WS | 能编写可靠代码并架构分布式系统 |
| 第五阶段结束 | 第 10 周末 | Docker + CI/CD | 能将项目推向生产环境 |

---

### 每日学习建议

工作日保持 1-2 小时的学习量，建议按 **"30 分钟理论 + 60 分钟编码"** 的比例分配。周末拿出整块时间（3-4 小时）用于项目实战和回顾总结。每完成一个阶段后，花半天时间重构和优化之前的代码，这比一味往前赶进度收获更大。

遇到卡壳时，优先查阅官方文档和源码，其次是 Stack Overflow 和 GitHub Issues。NestJS 的社区非常活跃，绝大多数常见问题都能找到高质量的解答。

祝你学习顺利，两个月后成为 NestJS 高手！
