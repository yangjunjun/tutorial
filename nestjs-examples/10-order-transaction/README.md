# 项目10：订单交易系统 (Order Transaction)

## 项目简介

本项目是一个完整的订单交易系统示例，展示了如何在 NestJS 中实现数据库事务、支付模拟、幂等性保证以及定时任务。通过这个项目，你将学习到企业级订单系统的核心设计模式。

## 学习要点

### 1. 数据库事务 (Database Transaction)
- **什么是事务**：一组要么全部成功、要么全部失败的操作
- **ACID 特性**：原子性(Atomicity)、一致性(Consistency)、隔离性(Isolation)、持久性(Durability)
- **Prisma 交互式事务**：使用 `prisma.$transaction()` 包裹多个数据库操作
- **乐观锁 vs 悲观锁**：
  - 乐观锁：假设冲突很少发生，通过版本号或时间戳检测冲突（适合读多写少场景）
  - 悲观锁：假设冲突经常发生，通过加锁阻止其他事务访问（适合高并发写场景）
- **本项目使用**：Prisma 的交互式事务 + 库存检查（乐观并发控制）

### 2. 幂等性 (Idempotency)
- **定义**：同一操作执行一次或多次，结果相同
- **为什么重要**：网络不可靠，请求可能重试，必须保证重复请求不会造成重复扣款
- **实现方式**：通过支付单号（paymentNo）检查是否已处理

### 3. Webhook 回调处理
- **场景**：第三方支付系统异步通知支付结果
- **挑战**：可能收到重复通知、乱序通知
- **解决方案**：幂等性检查 + 状态机校验

### 4. 定时任务 (Cron Jobs)
- **Cron 表达式**：`*/5 * * * * *` 表示每5分钟执行一次
- **订单超时取消**：30分钟未支付的订单自动取消并恢复库存
- **每日统计**：每天凌晨生成销售报表

### 5. 订单状态机
```
PENDING ──支付成功──> PAID ──发货──> SHIPPED ──确认收货──> COMPLETED
   │                    │
   └──超时/用户取消──> CANCELLED <──退款──┘
```

## 技术栈

- NestJS 10.x
- Prisma + SQLite
- @nestjs/schedule (定时任务)
- class-validator (DTO 验证)
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

### 订单管理
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /orders | 创建订单 |
| GET | /orders | 订单列表（支持分页和状态过滤） |
| GET | /orders/:id | 订单详情 |
| PATCH | /orders/:id/cancel | 取消订单 |
| PATCH | /orders/:id/status | 更新订单状态（管理员） |

### 支付
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /payments/simulate/:orderId | 模拟支付 |
| POST | /payments/webhook | 模拟支付网关回调 |

## 完整订单流程演示（curl 命令）

```bash
# 1. 创建一个订单（假设用户ID=1，商品ID=1购买2件）
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 2, "quantity": 1 }
    ],
    "shippingAddress": {
      "name": "张三",
      "phone": "13800138000",
      "address": "北京市朝阳区XX路XX号"
    }
  }'

# 2. 查看订单列表
curl http://localhost:3000/orders

# 3. 查看订单详情（假设订单ID=1）
curl http://localhost:3000/orders/1

# 4. 模拟支付（触发异步支付流程）
curl -X POST http://localhost:3000/payments/simulate/1

# 5. 等待2秒后查看订单状态（应该变为 PAID）
sleep 3
curl http://localhost:3000/orders/1

# 6. 模拟支付网关回调（另一种支付方式）
curl -X POST http://localhost:3000/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "paymentNo": "PAY_xxx",
    "status": "SUCCESS"
  }'

# 7. 管理员更新订单状态为已发货
curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "SHIPPED" }'

# 8. 取消一个未支付的订单
curl -X PATCH http://localhost:3000/orders/2/cancel

# 9. 带过滤条件的订单列表
curl "http://localhost:3000/orders?status=PAID&page=1&pageSize=10"
```

## 项目结构

```
src/
├── prisma/           # Prisma 服务（全局模块）
├── orders/           # 订单模块（核心事务逻辑）
│   ├── dto/          # 数据传输对象
│   ├── orders.service.ts
│   └── orders.controller.ts
├── payments/         # 支付模块（模拟支付 + 幂等性）
├── scheduler/        # 定时任务模块（超时取消、统计）
├── seed.ts           # 种子数据
├── app.module.ts     # 根模块
└── main.ts           # 入口文件
```

## 核心概念详解

### 事务隔离级别
SQLite 默认使用 SERIALIZABLE 隔离级别，保证最严格的并发控制。在生产环境中（如 PostgreSQL），通常使用 READ COMMITTED。

### 库存扣减策略
本项目采用「下单扣库存」策略。另一种常见策略是「支付扣库存」，各有优缺点：
- 下单扣库存：用户体验好（保证有货），但可能出现大量未支付订单占用库存
- 支付扣库存：库存利用率高，但可能出现支付时库存不足的情况
