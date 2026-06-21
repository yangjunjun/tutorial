# 项目11：缓存与消息队列 (Cache & Queue)

## 项目简介

本项目演示了 NestJS 中缓存策略、消息队列和数据库优化的核心概念。通过实际场景（商品查询缓存、邮件异步发送、N+1问题修复），帮助你理解高性能后端系统的关键设计模式。

## 学习要点

### 1. 缓存模式 (Caching Patterns)

#### Cache-Aside（旁路缓存）— 本项目主要使用
```
读请求：查缓存 → 命中则返回 → 未命中则查数据库 → 写入缓存
写请求：更新数据库 → 删除缓存
```
- 最常用的缓存模式
- 优点：缓存只存热数据，不会被冷数据占满
- 缺点：缓存未命中时需要查数据库（首次访问较慢）

#### Write-Through（穿透写入）
```
写请求：同时写入缓存和数据库
```
- 优点：数据一致性好
- 缺点：写操作延迟增加

#### Write-Behind / Write-Back（回写缓存）
```
写请求：只写入缓存 → 异步批量写入数据库
```
- 优点：写操作极快
- 缺点：宕机可能丢失数据

### 2. 缓存失效策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| TTL（过期时间） | 缓存数据到期后自动删除 | 大部分场景 |
| 主动失效 | 数据更新时主动删除缓存 | 数据一致性要求高 |
| LRU（最近最少使用） | 淘汰最久未访问的数据 | 缓存容量有限 |

### 3. 消息队列 (Message Queue)

**为什么需要消息队列？**
- **异步处理**：邮件发送、报表生成等耗时操作不阻塞主流程
- **削峰填谷**：高并发时排队处理，防止系统被压垮
- **解耦**：生产者和消费者不需要知道彼此的存在

**Bull 队列核心概念：**
- **Producer（生产者）**：添加任务到队列（如用户注册时添加欢迎邮件任务）
- **Consumer（消费者/Processor）**：从队列取出任务并执行
- **Job（任务）**：队列中的一个工作单元
- **Priority（优先级）**：任务执行的优先顺序
- **Delay（延迟）**：任务延迟执行
- **Retry（重试）**：任务失败后自动重试（指数退避）

### 4. N+1 问题

**什么是 N+1 问题？**
```
查询 N 条订单 → 每条订单再查1次用户 → 共执行 N+1 次数据库查询
```

**解决方案：**
- Prisma 的 `include` / `select`：一次性加载关联数据
- SQL 的 `JOIN`：在一条查询中获取所有数据

### 5. 游标分页 vs 偏移分页

| 类型 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 偏移分页 (offset/limit) | 实现简单，支持跳页 | 深分页性能差，数据变动时可能重复/遗漏 | 后台管理系统 |
| 游标分页 (cursor) | 性能稳定，不会重复/遗漏 | 不支持跳页，需要有序字段 | 移动端瀑布流、实时数据流 |

## 技术栈

- NestJS 10.x
- Prisma + SQLite
- Bull (消息队列，基于 Redis，本项目使用内存模式)
- cache-manager (缓存管理)
- class-validator
- TypeScript

## 快速开始

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 填充种子数据
pnpm seed

# 启动开发服务器
pnpm start:dev
```

## API 接口

### 商品管理（带缓存）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /products | 商品列表（自动缓存） |
| GET | /products/hot | 热门商品（缓存5分钟） |
| GET | /products/search?query=xxx | 商品搜索（游标分页） |
| GET | /products/:id | 商品详情（单个缓存） |
| POST | /products | 创建商品 |
| PATCH | /products/:id | 更新商品（自动清除缓存） |
| DELETE | /products/:id | 删除商品（自动清除缓存） |

### 消息队列
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /queue/email/:userId | 发送欢迎邮件 |
| POST | /queue/order-confirmation/:orderId | 发送订单确认邮件 |
| POST | /queue/report | 生成日报表（延迟执行） |
| GET | /queue/stats | 查看队列统计 |

### 数据库优化演示
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /optimization/n-plus-one | N+1 问题演示 |
| GET | /optimization/solved | N+1 解决方案 |
| GET | /optimization/cursor-pagination | 游标分页 |
| GET | /optimization/batch | 批量操作 |

## curl 测试命令

```bash
# ===== 商品缓存演示 =====

# 1. 首次查询（缓存未命中，从数据库读取）
curl http://localhost:3000/products

# 2. 再次查询（命中缓存，速度更快）
curl http://localhost:3000/products

# 3. 查询热门商品
curl http://localhost:3000/products/hot

# 4. 搜索商品（游标分页）
curl "http://localhost:3000/products/search?query=Apple&limit=5"

# 5. 创建商品（会导致列表缓存失效）
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"新产品","price":99.9,"stock":100,"category":"electronics"}'

# ===== 消息队列演示 =====

# 6. 触发欢迎邮件（异步处理，立即返回）
curl -X POST http://localhost:3000/queue/email/1

# 7. 触发订单确认邮件
curl -X POST http://localhost:3000/queue/order-confirmation/1

# 8. 触发报表生成
curl -X POST http://localhost:3000/queue/report

# 9. 查看队列状态
curl http://localhost:3000/queue/stats

# ===== 数据库优化演示 =====

# 10. N+1 问题（查看控制台日志对比）
curl http://localhost:3000/optimization/n-plus-one

# 11. 优化后的查询
curl http://localhost:3000/optimization/solved

# 12. 游标分页
curl "http://localhost:3000/optimization/cursor-pagination?limit=5"

# 13. 批量操作
curl http://localhost:3000/optimization/batch
```

## 项目结构

```
src/
├── prisma/                    # Prisma 数据库服务
├── cache/                     # 缓存模块（内存/Redis）
├── products/                  # 商品模块（缓存策略演示）
├── queue/                     # 消息队列模块（Bull）
│   ├── email.processor.ts     # 邮件任务处理器
│   ├── report.processor.ts    # 报表任务处理器
│   └── queue.service.ts       # 队列服务（添加任务）
├── database-optimization/     # 数据库优化演示模块
├── seed.ts                    # 种子数据
├── app.module.ts              # 根模块
└── main.ts                    # 入口文件
```

## 关于 Redis

本项目默认使用内存缓存和 Bull 的内存模式，方便学习运行。如果需要连接 Redis：

1. 安装 Redis 并启动：`redis-server`
2. 安装依赖：`pnpm add cache-manager-ioredis-yet @nestjs/cache-manager bull`
3. 修改 `cache.module.ts` 和 `app.module.ts` 中的注释配置
