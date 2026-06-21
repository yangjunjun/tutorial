## 第三阶段：电商业务深入篇 / Stage 3: E-commerce Deep Dive (Week 6-7)

### 概述 / Overview

**中文：**
在前两个阶段中，我们已经掌握了 NestJS 的核心概念——依赖注入、模块化架构、RESTful API 设计以及数据库 ORM 的基本用法。第三阶段将深入真实的电商业务场景，这是每个后端工程师都必须面对的经典领域。我们将通过两个紧密关联的项目，系统性地学习：如何在高并发场景下保证数据一致性（事务管理）、如何设计健壮的订单状态机、如何模拟真实的支付回调流程、如何利用缓存和消息队列提升系统性能，以及如何识别并解决数据库性能瓶颈。这些不是纸上谈兵的理论知识，而是每一个生产级应用都必须解决的核心问题。

**English:**
In the previous stages, we mastered the core concepts of NestJS — dependency injection, modular architecture, RESTful API design, and fundamental database ORM usage. Stage 3 takes us into real-world e-commerce scenarios, a classic domain that every backend engineer must confront. Through two closely related projects, we will systematically learn: how to guarantee data consistency under high concurrency (transaction management), how to design robust order state machines, how to simulate real payment callback flows, how to leverage caching and message queues to boost system performance, and how to identify and resolve database performance bottlenecks. These are not theoretical exercises — they are core problems that every production-grade application must solve.

**学习目标 / Learning Objectives:**

| 目标 / Objective | 涉及项目 / Project |
|---|---|
| 掌握数据库事务与 ACID 属性 / Master database transactions & ACID properties | 10 |
| 设计订单状态机与防重机制 / Design order state machines & idempotency | 10 |
| 实现定时任务处理过期订单 / Implement scheduled tasks for expired orders | 10 |
| 理解缓存策略与失效机制 / Understand caching strategies & invalidation | 11 |
| 使用消息队列进行异步处理 / Use message queues for async processing | 11 |
| 识别并解决 N+1 查询问题 / Identify and solve N+1 query problems | 11 |
| 实现游标分页替代偏移分页 / Implement cursor pagination over offset pagination | 11 |

---

### 项目 10: 订单系统与事务管理 / Project 10: Order System & Transaction Management

#### 订单系统设计 / Order System Design

**中文：**
订单系统是电商平台的脊柱。一个设计不良的订单系统会导致超卖、重复扣款、状态不一致等灾难性问题。我们从数据模型开始，逐步构建一个可靠的订单系统。

核心数据模型包含四个关键实体：

- **Order（订单）**：聚合根，包含订单号、总金额、状态、时间戳等核心信息。订单号必须是全局唯一的，通常使用雪花算法或带前缀的时间戳生成。
- **OrderItem（订单项）**：记录每个商品在购买时的快照信息，包括当时的价格、数量。为什么要快照价格？因为商品可能随时调价，但用户下单时的价格不应改变。
- **ShippingAddress（收货地址）**：独立的实体而非嵌套字段，便于后续修改和管理。
- **Payment（支付记录）**：记录支付流水，包括支付渠道、交易号、金额、状态。一个订单可能对应多条支付记录（用户可能先尝试微信支付失败，再用支付宝成功）。

**English:**
The order system is the spine of any e-commerce platform. A poorly designed order system leads to catastrophic issues: overselling, duplicate charges, state inconsistencies. We start from the data model and progressively build a reliable order system.

The core data model contains four key entities:

- **Order**: The aggregate root, containing order number, total amount, status, timestamps, and other core information. The order number must be globally unique, typically generated using snowflake algorithms or timestamp-based strategies with prefixes.
- **OrderItem**: Records a snapshot of each product at the time of purchase, including the price and quantity at that moment. Why snapshot the price? Because product prices may change at any time, but the price at the moment the user placed the order should never change.
- **ShippingAddress**: An independent entity rather than a nested field, making it easier to modify and manage later.
- **Payment**: Records payment transactions, including payment channel, transaction ID, amount, and status. One order may correspond to multiple payment records (a user might first try WeChat Pay, fail, then succeed with Alipay).

**Prisma Schema 设计 / Prisma Schema Design:**

```prisma
enum OrderStatus {
  PENDING    // 待支付 / Awaiting payment
  PAID       // 已支付 / Payment confirmed
  SHIPPED    // 已发货 / Shipped
  COMPLETED  // 已完成 / Completed
  CANCELLED  // 已取消 / Cancelled
  REFUNDED   // 已退款 / Refunded
}

model Order {
  id              String         @id @default(cuid())
  orderNo         String         @unique        // 业务订单号 / Business order number
  userId          String
  user            User           @relation(fields: [userId], references: [id])
  status          OrderStatus    @default(PENDING)
  totalAmount     Decimal        @db.Decimal(10, 2)
  note            String?
  paidAt          DateTime?
  shippedAt       DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  items           OrderItem[]
  shippingAddress ShippingAddress?
  payments        Payment[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([userId, status])       // 用户查订单 / User queries orders
  @@index([status, createdAt])    // 后台管理查询 / Admin queries
  @@index([orderNo])              // 订单号查询 / Order number lookup
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  productName String              // 快照：商品名称 / Snapshot: product name
  price       Decimal @db.Decimal(10, 2)  // 快照：下单时价格 / Snapshot: price at order time
  quantity    Int
  subtotal    Decimal @db.Decimal(10, 2)  // price * quantity

  @@index([orderId])
  @@index([productId])
}

model ShippingAddress {
  id           String @id @default(cuid())
  orderId      String @unique
  order        Order  @relation(fields: [orderId], references: [id])
  recipient    String
  phone        String
  province     String
  city         String
  district     String
  detail       String
  postalCode   String?
}

model Payment {
  id              String        @id @default(cuid())
  orderId         String
  order           Order         @relation(fields: [orderId], references: [id])
  paymentNo       String        @unique   // 支付流水号 / Payment transaction number
  channel         String                  // 支付渠道：alipay, wechat, stripe / Payment channel
  amount          Decimal       @db.Decimal(10, 2)
  status          PaymentStatus @default(PENDING)
  channelTradeNo  String?                 // 第三方交易号 / Third-party trade number
  paidAt          DateTime?
  rawNotification Json?                   // 原始回调数据（用于排查问题） / Raw callback data
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([orderId])
  @@index([paymentNo])
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
```

**中文：**
注意上述 schema 中的几个设计决策：(1) `OrderItem` 中冗余存储了 `productName` 和 `price`，这是刻意为之的快照设计——即使原商品后来改名或调价，历史订单不应受到影响。(2) `Payment` 中保存了 `rawNotification`，这是调试支付问题的关键——当支付出现争议时，你需要原始的第三方回调数据作为证据。(3) 索引设计基于实际查询模式：用户按状态查自己的订单、后台按时间和状态查全部订单、按订单号精确查询。

**English:**
Notice several design decisions in the schema above: (1) `OrderItem` redundantly stores `productName` and `price` — this is a deliberate snapshot design. Even if a product is later renamed or repriced, historical orders should not be affected. (2) `Payment` preserves `rawNotification`, which is critical for debugging payment issues — when payment disputes arise, you need the original third-party callback data as evidence. (3) Index design is based on actual query patterns: users query their own orders by status, admins query all orders by time and status, and precise lookups by order number.

---

#### 订单状态机 / Order State Machine

**中文：**
订单状态机是订单系统的心脏。非法的状态转换必须被严格禁止——你不能把一个已取消的订单标记为已发货，也不能对一个未支付的订单执行退款。以下是合法的状态转换：

```
PENDING  ──────► PAID ──────► SHIPPED ──────► COMPLETED
   │                                               │
   │                                               ▼
   └──────────► CANCELLED                     REFUNDED
```

**English:**
The order state machine is the heart of the order system. Illegal state transitions must be strictly prohibited — you cannot mark a cancelled order as shipped, nor can you refund an unpaid order. Here are the legal state transitions:

```
PENDING  ──────► PAID ──────► SHIPPED ──────► COMPLETED
   │                                               │
   │                                               ▼
   └──────────► CANCELLED                     REFUNDED
```

**状态转换实现 / State Transition Implementation:**

```typescript
// order-state-machine.ts

// 定义合法的状态转换 / Define legal state transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]:      [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]:   [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
  [OrderStatus.COMPLETED]: [],  // 终态 / Terminal state
  [OrderStatus.CANCELLED]: [],  // 终态 / Terminal state
  [OrderStatus.REFUNDED]:  [],  // 终态 / Terminal state
};

export function validateTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): void {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new BadRequestException(
      `非法状态转换 / Illegal state transition: ${currentStatus} → ${targetStatus}. ` +
      `允许的目标状态 / Allowed targets: ${allowed?.join(', ') || 'none'}`
    );
  }
}

// 在 Service 中使用 / Usage in Service
async updateOrderStatus(orderId: string, targetStatus: OrderStatus) {
  const order = await this.prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });

  validateTransition(order.status, targetStatus);

  // 根据目标状态设置对应的时间戳 / Set corresponding timestamp based on target
  const timestampField = {
    [OrderStatus.PAID]: { paidAt: new Date() },
    [OrderStatus.SHIPPED]: { shippedAt: new Date() },
    [OrderStatus.COMPLETED]: { completedAt: new Date() },
    [OrderStatus.CANCELLED]: { cancelledAt: new Date() },
  }[targetStatus] || {};

  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: targetStatus, ...timestampField },
  });
}
```

---

#### 数据库事务 / Database Transactions

**中文：**
事务是保证数据一致性的核心机制。想象创建订单的场景：你需要同时创建订单记录、创建多个订单项、扣减多个商品的库存、创建收货地址。如果这些操作中任何一个失败了，所有操作都必须回滚——否则就会出现"订单创建了但库存没扣"或者"库存扣了但订单没生成"的灾难性不一致。

ACID 属性是事务的四大保证：
- **原子性 (Atomicity)**：事务中的所有操作要么全部成功，要么全部失败。不存在"做了一半"的情况。
- **一致性 (Consistency)**：事务前后，数据库始终处于一致状态。例如，库存不会变成负数。
- **隔离性 (Isolation)**：并发执行的事务互不干扰。两个用户同时购买最后一件商品时，只有一个能成功。
- **持久性 (Durability)**：一旦事务提交，其结果就是永久的，即使系统崩溃也不会丢失。

Prisma 提供了两种方式执行事务：

**English:**
Transactions are the core mechanism for guaranteeing data consistency. Consider the order creation scenario: you need to simultaneously create the order record, create multiple order items, decrease stock for multiple products, and create a shipping address. If any of these operations fail, ALL must be rolled back — otherwise you get catastrophic inconsistencies like "order created but stock not deducted" or "stock deducted but no order generated."

ACID properties are the four guarantees of transactions:
- **Atomicity**: All operations in a transaction either all succeed or all fail. There is no "half-done" state.
- **Consistency**: Before and after a transaction, the database is always in a consistent state. For example, stock never becomes negative.
- **Isolation**: Concurrently executing transactions do not interfere with each other. When two users simultaneously try to buy the last item, only one can succeed.
- **Durability**: Once a transaction is committed, its results are permanent and will not be lost even if the system crashes.

Prisma provides two ways to execute transactions:

**方式一：批量事务（自动批处理）/ Method 1: Batch Transactions (auto-batching)**

```typescript
// 适用于操作之间没有依赖关系的场景 / Suitable when operations have no dependencies
const [order, ...items] = await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  ...orderItems.map(item => prisma.orderItem.create({ data: item })),
  prisma.shippingAddress.create({ data: addressData }),
]);
```

**方式二：交互式事务（推荐用于复杂逻辑）/ Method 2: Interactive Transactions (recommended for complex logic)**

```typescript
// order.service.ts

async createOrder(dto: CreateOrderDto, userId: string) {
  // 第一步：事务外验证（失败不需要回滚）
  // Step 1: Validation outside transaction (no rollback needed on failure)
  const products = await this.prisma.product.findMany({
    where: { id: { in: dto.items.map(i => i.productId) } },
  });

  if (products.length !== dto.items.length) {
    throw new BadRequestException('部分商品不存在 / Some products not found');
  }

  // 第二步：计算总金额 / Step 2: Calculate total amount
  const productMap = new Map(products.map(p => [p.id, p]));
  let totalAmount = new Decimal(0);
  const orderItems = dto.items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) throw new BadRequestException(`商品不存在 / Product not found: ${item.productId}`);
    if (product.stock < item.quantity) {
      throw new BadRequestException(`库存不足 / Insufficient stock: ${product.name}`);
    }
    const subtotal = product.price.mul(item.quantity);
    totalAmount = totalAmount.add(subtotal);
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal,
    };
  });

  // 第三步：在单个事务中执行所有写操作 / Step 3: Execute all writes in a single transaction
  return this.prisma.$transaction(async (tx) => {
    // 3a. 创建订单 / Create order
    const order = await tx.order.create({
      data: {
        orderNo: this.generateOrderNo(),
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
      },
    });

    // 3b. 创建订单项 / Create order items
    await tx.orderItem.createMany({
      data: orderItems.map(item => ({
        orderId: order.id,
        ...item,
      })),
    });

    // 3c. 扣减库存（带乐观锁）/ Decrease stock (with optimistic locking)
    for (const item of dto.items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },  // 乐观锁：只有库存足够时才更新 / Optimistic lock: only update if stock is sufficient
        },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
        },
      });

      if (result.count === 0) {
        // 库存不足或已被其他事务扣减 / Insufficient stock or already deducted by another transaction
        throw new ConflictException(
          `商品库存不足，请减少购买数量 / Insufficient stock, please reduce quantity: ${item.productId}`
        );
      }
    }

    // 3d. 创建收货地址 / Create shipping address
    await tx.shippingAddress.create({
      data: {
        orderId: order.id,
        ...dto.shippingAddress,
      },
    });

    // 返回完整订单 / Return complete order
    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        shippingAddress: true,
      },
    });
  }, {
    // 事务超时设置 / Transaction timeout settings
    maxWait: 5000,     // 等待获取事务锁的最长时间 / Max wait time to acquire transaction lock
    timeout: 10000,    // 事务执行的最长时间 / Max execution time for the transaction
  });
}
```

**中文：**
上面的代码展示了几个关键实践：

1. **事务外预验证**：在进入事务之前先做数据验证。这样验证失败时不会占用事务资源，也不会导致不必要的锁等待。
2. **乐观锁扣减库存**：`updateMany` 中的 `where: { stock: { gte: item.quantity } }` 就是乐观锁的实现。如果两个事务同时尝试扣减同一商品的库存，只有库存足够的那个事务会成功。这比悲观锁（`SELECT ... FOR UPDATE`）性能更好，因为不会阻塞其他事务。
3. **事务超时设置**：`maxWait` 控制等待获取数据库连接的时间，`timeout` 控制事务本身的执行时间。设置合理的超时是防止事务长时间占用数据库连接的关键。

**English:**
The code above demonstrates several key practices:

1. **Pre-validation outside the transaction**: Data validation happens before entering the transaction. This way, validation failures don't consume transaction resources or cause unnecessary lock waits.
2. **Optimistic locking for stock deduction**: The `where: { stock: { gte: item.quantity } }` in `updateMany` is the optimistic lock implementation. If two transactions simultaneously try to deduct stock for the same product, only the one where stock is sufficient will succeed. This performs better than pessimistic locking (`SELECT ... FOR UPDATE`) because it doesn't block other transactions.
3. **Transaction timeout settings**: `maxWait` controls the time to wait for acquiring a database connection, while `timeout` controls the transaction's own execution time. Setting reasonable timeouts is crucial to prevent transactions from holding database connections for too long.

**乐观锁 vs 悲观锁 / Optimistic vs Pessimistic Locking:**

| 特性 / Feature | 乐观锁 / Optimistic | 悲观锁 / Pessimistic |
|---|---|---|
| 实现方式 / Implementation | WHERE 条件检查 / WHERE clause check | SELECT ... FOR UPDATE |
| 并发性能 / Concurrency | 高（不阻塞）/ High (non-blocking) | 低（会阻塞）/ Low (blocking) |
| 冲突处理 / Conflict handling | 需要重试 / Requires retry | 自动排队 / Auto-queuing |
| 适用场景 / Best for | 冲突概率低 / Low conflict probability | 冲突概率高 / High conflict probability |
| 电商库存 / E-commerce stock | 适合（热点商品除外）/ Suitable (except hot items) | 适合秒杀场景 / Suitable for flash sales |

---

#### 支付模拟与 Webhook / Payment Simulation & Webhook

**中文：**
在真实项目中，支付流程是这样的：用户在前端选择支付方式后，后端调用支付渠道（如支付宝、Stripe）的 API 创建支付订单，用户跳转到支付页面完成支付，支付渠道将结果通过 Webhook（回调通知）推送到我们的服务器。

Webhook 模式的核心挑战：

1. **网络不可靠**：支付渠道的回调可能因为网络问题而丢失，所以它们会重试。
2. **重复通知**：同一笔支付的成功通知可能到达多次（渠道的重试机制）。
3. **顺序不保证**：在某些极端情况下，退款通知可能比支付成功通知先到达。
4. **安全性**：回调可能被伪造，必须验证签名。

幂等性（Idempotency）是 Webhook 处理的第一原则：无论同一个通知到达多少次，系统的处理结果都应该与只处理一次相同。

**English:**
In real projects, the payment flow works like this: after the user selects a payment method on the frontend, the backend calls the payment channel's API (e.g., Alipay, Stripe) to create a payment order. The user is redirected to the payment page to complete payment. The payment channel then pushes the result to our server via Webhook (callback notification).

Core challenges of the Webhook pattern:

1. **Unreliable networks**: Payment channel callbacks may be lost due to network issues, so they retry.
2. **Duplicate notifications**: The same payment success notification may arrive multiple times (the channel's retry mechanism).
3. **Order not guaranteed**: In extreme cases, a refund notification may arrive before the payment success notification.
4. **Security**: Callbacks can be forged; signatures must be verified.

Idempotency is the first principle of Webhook handling: no matter how many times the same notification arrives, the system's processing result should be identical to processing it just once.

```typescript
// payment.service.ts

async handlePaymentWebhook(dto: PaymentWebhookDto) {
  const { paymentNo, channelTradeNo, status, rawNotification } = dto;

  // 第一步：查找支付记录 / Step 1: Find payment record
  const payment = await this.prisma.payment.findUnique({
    where: { paymentNo },
    include: { order: true },
  });

  if (!payment) {
    this.logger.warn(`未知的支付通知 / Unknown payment notification: ${paymentNo}`);
    return { received: true };  // 返回成功防止渠道继续重试 / Return success to prevent channel retries
  }

  // 第二步：幂等性检查——如果已经处理过，直接返回 / Step 2: Idempotency check — if already processed, return immediately
  if (payment.status !== PaymentStatus.PENDING) {
    this.logger.log(
      `支付已处理，忽略重复通知 / Payment already processed, ignoring duplicate: ${paymentNo}, ` +
      `当前状态 / current status: ${payment.status}`
    );
    return { received: true };
  }

  // 第三步：在事务中更新支付和订单状态 / Step 3: Update payment and order status in a transaction
  return this.prisma.$transaction(async (tx) => {
    // 更新支付记录 / Update payment record
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        channelTradeNo,
        paidAt: status === 'SUCCESS' ? new Date() : null,
        rawNotification,  // 保存原始数据用于排查 / Save raw data for debugging
      },
    });

    // 如果支付成功，更新订单状态 / If payment succeeded, update order status
    if (status === 'SUCCESS') {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 发送订单确认事件 / Emit order confirmed event
      this.eventEmitter.emit('order.paid', { orderId: payment.orderId });
    }

    return { received: true };
  });
}
```

**中文：**
注意 `rawNotification` 字段的保存——这是生产环境中非常重要的实践。当支付出现争议（用户声称已付款但系统显示未付款），你需要原始回调数据来与支付渠道对账。不保存原始数据就像丢弃了唯一的证据。

**English:**
Notice the saving of the `rawNotification` field — this is a critically important practice in production environments. When payment disputes arise (user claims to have paid but system shows unpaid), you need the raw callback data to reconcile with the payment channel. Not saving raw data is like discarding the only piece of evidence.

---

#### 定时任务 / Scheduled Tasks

**中文：**
定时任务是自动化运维和业务逻辑的重要工具。在电商系统中，常见的定时任务场景包括：自动取消超时未支付的订单、生成每日销售统计报告、定期清理过期数据等。

NestJS 通过 `@nestjs/schedule` 包提供了对定时任务的原生支持，底层使用 `cron` 库。Cron 表达式是一种时间调度语言，格式为 `秒 分 时 日 月 周`。

**English:**
Scheduled tasks are important tools for automated operations and business logic. In e-commerce systems, common scheduled task scenarios include: auto-cancelling unpaid orders that have timed out, generating daily sales statistics reports, and periodically cleaning up expired data.

NestJS provides native support for scheduled tasks through the `@nestjs/schedule` package, built on top of the `cron` library. A Cron expression is a time scheduling language with the format `second minute hour day-of-month month day-of-week`.

```
┌────────── 秒 / Second (0-59)
│ ┌──────── 分 / Minute (0-59)
│ │ ┌────── 时 / Hour (0-23)
│ │ │ ┌──── 日 / Day of month (1-31)
│ │ │ │ ┌── 月 / Month (1-12)
│ │ │ │ │ ┌ 周 / Day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │ │
* * * * * *

常用示例 / Common examples:
'0 */5 * * * *'  → 每5分钟 / Every 5 minutes
'0 0 2 * * *'    → 每天凌晨2点 / Every day at 2 AM
'0 0 * * * 1-5'  → 工作日每小时 / Every hour on weekdays
'0 0 0 1 * *'    → 每月1号 / 1st of every month
```

**自动取消过期未支付订单 / Auto-cancel Expired Unpaid Orders:**

```typescript
// order-scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  // 订单过期时间：30分钟 / Order expiration: 30 minutes
  private readonly ORDER_TIMEOUT_MS = 30 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 每5分钟检查一次超时未支付的订单
   * Check for timed-out unpaid orders every 5 minutes
   */
  @Cron('*/5 * * * *')
  async cancelExpiredOrders() {
    const expiryTime = new Date(Date.now() - this.ORDER_TIMEOUT_MS);

    this.logger.log(`检查 ${expiryTime.toISOString()} 之前创建的未支付订单...`);
    this.logger.log(`Checking unpaid orders created before ${expiryTime.toISOString()}...`);

    // 查找所有超时的待支付订单 / Find all timed-out pending orders
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: expiryTime },
      },
      include: { items: true },
    });

    if (expiredOrders.length === 0) {
      this.logger.log('没有超时订单 / No expired orders found');
      return;
    }

    this.logger.log(`发现 ${expiredOrders.length} 个超时订单 / Found ${expiredOrders.length} expired orders`);

    // 逐个处理（每个订单是一个独立事务，避免一个失败影响其他）
    // Process individually (each order is an independent transaction to avoid one failure affecting others)
    for (const order of expiredOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 更新订单状态为取消 / Update order status to cancelled
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
              cancelReason: '超时未支付，系统自动取消 / Auto-cancelled: payment timeout',
            },
          });

          // 恢复库存 / Restore stock
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                salesCount: { decrement: item.quantity },
              },
            });
          }
        });

        this.logger.log(`已取消订单 / Cancelled order: ${order.orderNo}`);
      } catch (error) {
        this.logger.error(
          `取消订单失败 / Failed to cancel order: ${order.orderNo}`,
          error.stack,
        );
        // 继续处理下一个订单 / Continue processing next order
      }
    }
  }

  /**
   * 每天凌晨2点生成前一天的销售统计
   * Generate previous day's sales statistics every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailySalesReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    this.logger.log(`生成 ${yesterday.toDateString()} 的销售统计...`);
    this.logger.log(`Generating sales statistics for ${yesterday.toDateString()}...`);

    // 聚合查询 / Aggregate query
    const stats = await this.prisma.order.aggregate({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED] },
        paidAt: { gte: yesterday, lt: today },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    });

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          paidAt: { gte: yesterday, lt: today },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // 保存统计报告 / Save statistics report
    await this.prisma.dailyReport.create({
      data: {
        date: yesterday,
        totalOrders: stats._count.id,
        totalRevenue: stats._sum.totalAmount ?? 0,
        averageOrderValue: stats._avg.totalAmount ?? 0,
        topProducts: topProducts as any,
      },
    });

    this.logger.log(
      `日报生成完成 / Daily report generated: ${stats._count.id} 笔订单 / orders, ` +
      `总收入 / total revenue: ${stats._sum.totalAmount}`
    );
  }
}
```

**中文：**
关于定时任务的重要注意事项：(1) 每个订单的取消使用独立事务，这样单个失败不会影响其他订单的处理。(2) 定时任务在多实例部署时可能重复执行，生产环境中应使用分布式锁（如 Redis 的 `SET NX`）或 Bull 的 `repeat` 功能来确保只执行一次。(3) 所有定时任务都应有完善的日志记录，便于排查问题。

**English:**
Important considerations for scheduled tasks: (1) Each order cancellation uses an independent transaction, so a single failure won't affect the processing of other orders. (2) Scheduled tasks may execute multiple times in multi-instance deployments; in production, use distributed locks (e.g., Redis `SET NX`) or Bull's `repeat` feature to ensure single execution. (3) All scheduled tasks should have comprehensive logging for troubleshooting.

---

### 项目 11: 缓存、队列与性能优化 / Project 11: Caching, Queues & Performance

#### 缓存策略 / Caching Strategies

**中文：**
缓存是提升系统性能最直接的手段之一。核心思想很简单：把频繁访问但不经常变化的数据存储在快速存储（如内存或 Redis）中，避免每次都查询数据库。但缓存引入了一个新问题——数据一致性。缓存中的数据可能与数据库中的实际数据不同步，这就是"缓存失效"问题。

常见的缓存策略有三种：

1. **Cache-Aside（旁路缓存）**：最常用也最容易理解的策略。读数据时，先查缓存，命中则直接返回；未命中则查数据库，将结果写入缓存后返回。写数据时，先更新数据库，再删除（而非更新）缓存。为什么是删除而不是更新缓存？因为并发写入时，更新缓存可能导致数据不一致，而删除缓存让下次读取时自然重建是更安全的选择。

2. **Write-Through（穿透写入）**：写入时同时更新缓存和数据库。优点是缓存始终与数据库一致，缺点是写入延迟增加。

3. **Write-Behind（异步写入）**：写入时只更新缓存，数据库更新异步批量执行。性能最高但数据丢失风险也最高。

对于电商系统，Cache-Aside 是最安全的选择。

**English:**
Caching is one of the most direct ways to improve system performance. The core idea is simple: store frequently accessed but infrequently changing data in fast storage (e.g., memory or Redis) to avoid querying the database every time. But caching introduces a new problem — data consistency. Data in the cache may become out of sync with the actual data in the database; this is the "cache invalidation" problem.

There are three common caching strategies:

1. **Cache-Aside**: The most commonly used and easiest to understand. When reading data, check the cache first; if hit, return directly; if missed, query the database, write the result to cache, then return. When writing data, update the database first, then delete (not update) the cache. Why delete rather than update the cache? Because during concurrent writes, updating the cache can cause data inconsistency, while deleting the cache and letting the next read naturally rebuild it is a safer choice.

2. **Write-Through**: When writing, simultaneously update both cache and database. Advantage: cache is always consistent with database. Disadvantage: increased write latency.

3. **Write-Behind**: When writing, only update the cache; database updates are executed asynchronously in batches. Highest performance but also highest data loss risk.

For e-commerce systems, Cache-Aside is the safest choice.

```typescript
// cache.service.ts
import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;  // Unix timestamp in milliseconds
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  // 内存缓存（开发/学习用，生产环境请使用 Redis）
  // In-memory cache (for development/learning, use Redis in production)
  private readonly store = new Map<string, CacheEntry<any>>();

  /**
   * 获取缓存数据，未命中则调用 loader 加载
   * Get cached data; on miss, call loader to load
   */
  async get<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number = 60 * 1000,  // 默认60秒 / Default 60 seconds
  ): Promise<T> {
    const entry = this.store.get(key);

    // 缓存命中且未过期 / Cache hit and not expired
    if (entry && entry.expiresAt > Date.now()) {
      this.logger.debug(`缓存命中 / Cache HIT: ${key}`);
      return entry.data as T;
    }

    // 缓存未命中或已过期 / Cache miss or expired
    this.logger.debug(`缓存未命中 / Cache MISS: ${key}`);
    const data = await loader();

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });

    return data;
  }

  /**
   * 删除缓存（用于数据更新后失效缓存）
   * Delete cache (for invalidating after data updates)
   */
  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
    this.logger.debug(`缓存已失效 / Cache INVALIDATED: ${key}`);
  }

  /**
   * 按前缀批量删除（如删除某用户的所有缓存）
   * Batch delete by prefix (e.g., delete all caches for a user)
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.logger.debug(`按前缀失效 / Prefix invalidation: ${prefix}, count: ${count}`);
    return count;
  }

  /** 获取缓存统计信息 / Get cache statistics */
  getStats() {
    return {
      totalEntries: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        expiresAt: new Date(entry.expiresAt).toISOString(),
        isExpired: entry.expiresAt <= Date.now(),
      })),
    };
  }
}
```

**在商品服务中使用缓存 / Using Cache in Product Service:**

```typescript
// product.service.ts

async getProductById(id: string) {
  // 使用缓存键 "product:{id}"，TTL 5分钟
  // Use cache key "product:{id}", TTL 5 minutes
  return this.cacheService.get(
    `product:${id}`,
    async () => {
      // loader 函数：仅在缓存未命中时执行
      // loader function: only executed on cache miss
      return this.prisma.product.findUniqueOrThrow({
        where: { id },
        include: { category: true },
      });
    },
    5 * 60 * 1000,  // 5 分钟 / 5 minutes
  );
}

async updateProduct(id: string, dto: UpdateProductDto) {
  // 先更新数据库 / Update database first
  const product = await this.prisma.product.update({
    where: { id },
    data: dto,
  });

  // 然后删除缓存 / Then invalidate cache
  await this.cacheService.invalidate(`product:${id}`);
  // 也删除商品列表缓存 / Also invalidate product list caches
  await this.cacheService.invalidateByPrefix('product:list:');

  return product;
}

async getProductList(query: ProductQueryDto) {
  // 列表缓存：键包含查询参数，确保不同筛选条件使用不同缓存
  // List cache: key includes query params to ensure different filters use different caches
  const cacheKey = `product:list:${JSON.stringify(query)}`;

  return this.cacheService.get(cacheKey, async () => {
    return this.prisma.product.findMany({
      where: this.buildWhere(query),
      include: { category: true },
      take: query.pageSize,
      skip: (query.page - 1) * query.pageSize,
    });
  }, 2 * 60 * 1000);  // 2 分钟 / 2 minutes
}
```

**中文：**
缓存的 TTL（Time To Live，生存时间）设置是一门艺术。商品详情可以缓存较长时间（5-10分钟），因为商品信息不会频繁变化。但库存数量不应缓存（或只缓存极短时间），因为它变化频繁且对准确性要求极高。一个好的经验法则是：数据变化越频繁、对准确性要求越高的字段，TTL 应该越短。

**English:**
Setting cache TTL (Time To Live) is an art. Product details can be cached for longer periods (5-10 minutes) since product information doesn't change frequently. But stock quantities should not be cached (or only cached for very short periods) because they change frequently and have high accuracy requirements. A good rule of thumb: the more frequently data changes and the higher the accuracy requirement, the shorter the TTL should be.

---

#### 消息队列 / Message Queues

**中文：**
在订单支付成功后，系统需要执行很多后续操作：发送确认邮件、发送短信通知、通知仓库准备发货、更新用户积分等。如果在支付回调中同步执行所有这些操作，用户会等待很久才收到响应。更糟糕的是，如果邮件服务暂时不可用，整个支付流程就会失败。

消息队列解决的正是这个问题：将耗时的、非核心的操作从主流程中解耦出来，异步执行。

Bull/BullMQ 是 NestJS 生态中最流行的消息队列库，底层基于 Redis。核心概念：

- **Producer（生产者）**：创建任务并放入队列。例如，支付成功后创建"发送邮件"任务。
- **Consumer（消费者）**：从队列中取出任务并执行。例如，邮件处理器从队列中取出任务并发送邮件。
- **Job（任务）**：队列中的一个工作单元，包含数据和状态。

**English:**
After a successful payment, the system needs to perform many follow-up operations: send confirmation emails, send SMS notifications, notify the warehouse to prepare shipment, update user loyalty points, etc. If all these operations are executed synchronously in the payment callback, the user will wait a long time for a response. Worse, if the email service is temporarily unavailable, the entire payment flow fails.

Message queues solve exactly this problem: decoupling time-consuming, non-core operations from the main flow and executing them asynchronously.

Bull/BullMQ is the most popular message queue library in the NestJS ecosystem, built on Redis. Core concepts:

- **Producer**: Creates jobs and puts them into the queue. For example, after payment success, creates a "send email" job.
- **Consumer**: Takes jobs from the queue and executes them. For example, the email processor takes jobs from the queue and sends emails.
- **Job**: A unit of work in the queue, containing data and status.

```typescript
// email.processor.ts
import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

interface OrderConfirmationEmailJob {
  orderId: string;
  orderNo: string;
  userEmail: string;
  userName: string;
  totalAmount: number;
  items: Array<{ productName: string; quantity: number; price: number }>;
}

@Processor('email')  // 队列名称 / Queue name
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  /**
   * 处理订单确认邮件任务
   * Process order confirmation email job
   */
  @Process('order-confirmation')  // 任务名称 / Job name
  async handleOrderConfirmation(job: Job<OrderConfirmationEmailJob>) {
    const { orderId, orderNo, userEmail, userName, totalAmount, items } = job.data;

    this.logger.log(`处理邮件任务 / Processing email job: order ${orderNo}`);

    // 模拟发送邮件（真实项目中使用 nodemailer/SendGrid/SES）
    // Simulate sending email (use nodemailer/SendGrid/SES in real projects)
    await this.sendEmail({
      to: userEmail,
      subject: `订单确认 / Order Confirmation: ${orderNo}`,
      html: this.buildOrderConfirmationTemplate({
        userName,
        orderNo,
        totalAmount,
        items,
      }),
    });

    this.logger.log(`邮件发送成功 / Email sent successfully: ${orderNo}`);
    return { sent: true, orderId };
  }

  /**
   * 任务失败处理 / Job failure handler
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `邮件任务失败 / Email job failed: ${job.id}, ` +
      `尝试次数 / attempts: ${job.attemptsMade}/${job.opts.attempts}, ` +
      `错误 / error: ${error.message}`,
    );
  }

  /**
   * 任务完成处理 / Job completion handler
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`邮件任务完成 / Email job completed: ${job.id}, result: ${JSON.stringify(result)}`);
  }

  private async sendEmail(options: { to: string; subject: string; html: string }) {
    // 实际实现 / Actual implementation
    await new Promise(resolve => setTimeout(resolve, 1000));  // 模拟网络延迟 / Simulate network delay
  }

  private buildOrderConfirmationTemplate(data: any): string {
    return `<h1>订单确认</h1><p>订单号: ${data.orderNo}</p>...`;
  }
}
```

**生产者——在支付成功后创建任务 / Producer — Creating Jobs After Payment:**

```typescript
// order-event.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class OrderEventHandler {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  @OnEvent('order.paid')
  async handleOrderPaid(payload: { orderId: string }) {
    // 并行创建多个异步任务 / Create multiple async jobs in parallel
    const [emailJob, smsJob, pointsJob] = await Promise.all([
      // 发送确认邮件 / Send confirmation email
      this.emailQueue.add('order-confirmation', emailData, {
        priority: 1,           // 高优先级 / High priority
        attempts: 3,           // 最多重试3次 / Max 3 retries
        backoff: {
          type: 'exponential', // 指数退避：1s, 2s, 4s / Exponential backoff: 1s, 2s, 4s
          delay: 1000,
        },
        removeOnComplete: 100, // 保留最近100个已完成任务 / Keep last 100 completed jobs
        removeOnFail: 50,      // 保留最近50个失败任务 / Keep last 50 failed jobs
      }),

      // 发送短信通知 / Send SMS notification
      this.notificationQueue.add('send-sms', smsData, {
        priority: 2,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }),

      // 延迟任务：24小时后提醒评价 / Delayed job: remind to review after 24 hours
      this.notificationQueue.add('review-reminder', reminderData, {
        delay: 24 * 60 * 60 * 1000,  // 24小时延迟 / 24 hour delay
        attempts: 2,
      }),
    ]);

    // 任务 ID 可用于查询状态 / Job IDs can be used to query status
    return { emailJobId: emailJob.id, smsJobId: smsJob.id, pointsJobId: pointsJob.id };
  }
}
```

**队列监控与统计 / Queue Monitoring and Statistics:**

```typescript
// queue-stats.controller.ts
@Controller('admin/queues')
export class QueueStatsController {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  @Get('email/stats')
  async getEmailQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,    // 等待处理的任务数 / Jobs waiting to be processed
      active,     // 正在处理的任务数 / Jobs currently being processed
      completed,  // 已完成的任务数 / Completed jobs
      failed,     // 失败的任务数 / Failed jobs
      delayed,    // 延迟中的任务数 / Delayed jobs
    };
  }

  @Post('email/retry-failed')
  async retryFailedJobs() {
    const failedJobs = await this.emailQueue.getFailed();
    await Promise.all(failedJobs.map(job => job.retry()));
    return { retried: failedJobs.length };
  }
}
```

**中文：**
消息队列的关键配置选项：`attempts` 控制任务的最大执行次数（失败后会重试），`backoff` 控制重试间隔策略（指数退避意味着每次重试等待时间翻倍），`priority` 控制任务优先级（数字越小优先级越高），`delay` 控制延迟执行时间。这些选项让你能够精细地控制异步任务的行为。

**English:**
Key configuration options for message queues: `attempts` controls the maximum number of job executions (retries after failure), `backoff` controls the retry interval strategy (exponential backoff means the wait time doubles with each retry), `priority` controls job priority (lower number = higher priority), `delay` controls delayed execution time. These options let you finely control the behavior of async jobs.

---

#### N+1 查询问题 / N+1 Query Problem

**中文：**
N+1 查询是数据库性能问题中最常见、也最容易被忽视的陷阱。它的模式是这样的：首先执行 1 次查询获取 N 条记录的列表，然后对每条记录再执行 1 次查询获取关联数据，总共执行 1 + N 次查询。

想象一个商品列表页面，展示 20 个商品及其分类名称和评论数量：

**English:**
The N+1 query is the most common and most easily overlooked database performance trap. The pattern is this: first, execute 1 query to get a list of N records, then for each record execute 1 more query to get related data, resulting in a total of 1 + N queries.

Imagine a product list page showing 20 products with their category names and comment counts:

```typescript
// 糟糕的实现——N+1 问题 / BAD implementation — N+1 problem
async getProductListBad() {
  // 第 1 次查询：获取所有商品 / Query 1: Get all products
  const products = await this.prisma.product.findMany({ take: 20 });

  // 接下来的 20 次查询：为每个商品获取分类 / Next 20 queries: Get category for each product
  const results = [];
  for (const product of products) {
    const category = await this.prisma.category.findUnique({
      where: { id: product.categoryId },
    });
    // 再来 20 次查询：获取每个商品的评论数 / Another 20 queries: Get comment count for each product
    const commentCount = await this.prisma.comment.count({
      where: { productId: product.id },
    });
    results.push({ ...product, category, commentCount });
  }

  // 总查询次数：1 + 20 + 20 = 41 次！
  // Total queries: 1 + 20 + 20 = 41!
  return results;
}

// 正确的实现——使用 include 预加载 / CORRECT implementation — eager loading with include
async getProductListGood() {
  // 只有 2 次查询（Prisma 优化后）
  // Only 2 queries (after Prisma optimization)
  const products = await this.prisma.product.findMany({
    take: 20,
    include: {
      category: true,              // 自动 JOIN 分类表 / Auto JOIN category table
      comments: { select: { id: true } },  // 只取 ID 用于计数 / Only fetch IDs for counting
    },
  });

  return products.map(product => ({
    ...product,
    commentCount: product.comments.length,
    comments: undefined,  // 移除不需要的详细数据 / Remove unnecessary detailed data
  }));

  // 总查询次数：2 次（商品+分类、评论）
  // Total queries: 2 (products+categories, comments)
}
```

**中文：**
N+1 问题在开发环境中往往不易察觉，因为开发数据库通常只有少量数据。但一旦上线，面对成千上万条数据时，API 响应时间会从毫秒级暴涨到秒级。上例中，41 次查询 vs 2 次查询的差异在大数据量下可能是 2000ms vs 50ms 的性能差距。

Prisma 的 `include` 选项会自动生成高效的 JOIN 查询或批量查询来加载关联数据。始终使用 `include` 或显式的 `select` 来避免 N+1 问题。如果你不确定是否有 N+1 问题，可以启用 Prisma 的查询日志 (`log: ['query']`) 来监控实际执行的 SQL 语句数量。

**English:**
The N+1 problem is often hard to notice in development environments because dev databases typically have small amounts of data. But once deployed, facing thousands of records, API response times can skyrocket from milliseconds to seconds. In the example above, the difference between 41 queries vs 2 queries could mean a performance gap of 2000ms vs 50ms with large data volumes.

Prisma's `include` option automatically generates efficient JOIN queries or batch queries to load related data. Always use `include` or explicit `select` to avoid N+1 problems. If you're unsure whether you have N+1 issues, enable Prisma's query logging (`log: ['query']`) to monitor the actual number of SQL statements executed.

---

#### 游标分页 / Cursor-Based Pagination

**中文：**
分页是 API 设计中的基本需求，但实现方式的选择对性能有重大影响。

**偏移分页（Offset Pagination）** 是最直觉的方式：`skip=20, take=20` 获取第 2 页。但它有一个严重的性能问题——`OFFSET` 操作需要数据库扫描并跳过前 N 行，然后才返回结果。当偏移量很大时（比如第 1000 页），数据库需要扫描 20000 行然后丢弃前 19980 行，这极其低效。

此外，偏移分页在实时数据流中还有一个正确性问题：如果在翻页过程中有新数据插入，用户可能会看到重复数据或遗漏数据。

**游标分页（Cursor Pagination）** 使用上一页最后一条记录的唯一标识作为起点，直接定位下一页的数据，无需跳过任何行。

**English:**
Pagination is a fundamental requirement in API design, but the choice of implementation has a significant impact on performance.

**Offset Pagination** is the most intuitive approach: `skip=20, take=20` to get page 2. But it has a serious performance problem — the `OFFSET` operation requires the database to scan and skip the first N rows before returning results. When the offset is large (e.g., page 1000), the database needs to scan 20,000 rows and discard the first 19,980, which is extremely inefficient.

Additionally, offset pagination has a correctness issue with real-time data streams: if new data is inserted during pagination, users may see duplicate data or miss data.

**Cursor Pagination** uses the unique identifier of the last record from the previous page as the starting point, directly locating the next page's data without skipping any rows.

```typescript
// pagination.service.ts

interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

async getOrdersByCursor(
  userId: string,
  cursor?: string,      // 上一页的游标 / Cursor from previous page
  take: number = 20,    // 每页数量 / Items per page
  direction: 'next' | 'prev' = 'next',
): Promise<CursorPaginationResult<Order>> {
  // 构建查询参数 / Build query parameters
  const queryArgs: any = {
    where: { userId },
    take: direction === 'next' ? take + 1 : -(take + 1),  // 多取一条用于判断是否有下一页 / Fetch one extra to determine if there's a next page
    orderBy: { createdAt: 'desc' },
    include: {
      items: { select: { productName: true, quantity: true, price: true } },
      _count: { select: { items: true } },
    },
  };

  // 如果有游标，从游标位置开始 / If cursor provided, start from cursor position
  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1;  // 跳过游标本身 / Skip the cursor itself
  }

  const results = await this.prisma.order.findMany(queryArgs);

  // 判断是否有更多数据 / Determine if there are more results
  const hasMore = results.length > take;
  if (hasMore) {
    results.pop();  // 移除多余的一条 / Remove the extra item
  }

  // 如果方向是"上一页"，反转结果 / If direction is "previous", reverse results
  if (direction === 'prev') {
    results.reverse();
  }

  return {
    data: results,
    pagination: {
      hasNextPage: direction === 'next' ? hasMore : true,
      hasPreviousPage: direction === 'prev' ? hasMore : !!cursor,
      startCursor: results.length > 0 ? results[0].id : null,
      endCursor: results.length > 0 ? results[results.length - 1].id : null,
    },
  };
}
```

**API 使用示例 / API Usage Example:**

```
GET /api/orders?take=20
→ 返回第一页 + endCursor: "order_abc123"
→ Returns first page + endCursor: "order_abc123"

GET /api/orders?take=20&cursor=order_abc123
→ 返回第二页 + endCursor: "order_def456"
→ Returns second page + endCursor: "order_def456"

GET /api/orders?take=20&cursor=order_def456
→ 返回第三页 + hasNextPage: false
→ Returns third page + hasNextPage: false
```

**中文：**
游标分页的关键优势：无论翻到第几页，查询性能都是恒定的 O(log N)（利用索引直接定位），而偏移分页的性能是 O(N) 且随页码线性退化。代价是用户不能直接跳转到任意页码（如"跳到第 50 页"），但这在移动端 API 和无限滚动场景中通常不是问题。

**English:**
The key advantage of cursor pagination: regardless of which page you're on, query performance is constant O(log N) (using indexes for direct positioning), while offset pagination performance is O(N) and degrades linearly with page number. The tradeoff is that users cannot jump directly to arbitrary page numbers (like "go to page 50"), but this is usually not an issue in mobile APIs and infinite scroll scenarios.

---

#### 数据库优化清单 / Database Optimization Checklist

**中文：**
以下是每个电商后端项目都应该检查的数据库优化清单：

**English:**
Here is a database optimization checklist that every e-commerce backend project should review:

| 优化项 / Optimization | 说明 / Description | 影响 / Impact |
|---|---|---|
| **索引 / Indexing** | 为频繁查询的字段创建索引：`WHERE`、`ORDER BY`、`JOIN` 中使用的字段 / Create indexes for frequently queried fields: those used in `WHERE`, `ORDER BY`, `JOIN` | 查询速度提升 10-100x / Query speed improvement 10-100x |
| **批量操作 / Batch Operations** | 使用 `createMany`、`updateMany` 代替循环中的单条操作 / Use `createMany`, `updateMany` instead of single operations in loops | 减少数据库往返 / Reduce database round-trips |
| **连接池 / Connection Pooling** | 配置合理的连接池大小（通常为 CPU 核心数 * 2 + 1）/ Configure appropriate pool size (typically CPU cores * 2 + 1) | 防止连接耗尽 / Prevent connection exhaustion |
| **查询选择性 / Selectivity** | 使用 `select` 只获取需要的字段，避免 `SELECT *` / Use `select` to fetch only needed fields, avoid `SELECT *` | 减少网络传输和内存使用 / Reduce network transfer and memory usage |
| **复合索引顺序 / Composite Index Order** | 将最具选择性的字段放在复合索引的最前面 / Place the most selective field first in composite indexes | 提高索引效率 / Improve index efficiency |
| **分页优化 / Pagination** | 大表使用游标分页代替偏移分页 / Use cursor pagination instead of offset for large tables | 恒定查询时间 / Constant query time |
| **慢查询监控 / Slow Query Monitoring** | 启用慢查询日志，定期检查和分析 / Enable slow query log, review and analyze regularly | 持续发现性能问题 / Continuously discover performance issues |
| **读写分离 / Read Replicas** | 读操作使用只读副本，写操作使用主库 / Use read replicas for reads, primary for writes | 分散负载 / Distribute load |

```typescript
// Prisma 连接池配置示例 / Prisma connection pool configuration example
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 连接池参数在 URL 中配置 / Pool parameters configured in URL:
  // postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
}

// 批量操作示例 / Batch operation example
// 不好 / Bad: N 次数据库往返 / N database round-trips
for (const item of orderItems) {
  await prisma.orderItem.create({ data: item });
}

// 好 / Good: 1 次数据库往返 / 1 database round-trip
await prisma.orderItem.createMany({
  data: orderItems,
  skipDuplicates: true,  // 忽略重复记录 / Skip duplicate records
});
```

---

### 阶段总结 / Stage Summary

**中文：**
第三阶段的两个项目覆盖了电商后端开发中最核心的技能：

1. **事务管理**是数据一致性的基石。通过 `createOrder` 的完整流程，我们学会了如何在单个事务中协调多个写操作，如何使用乐观锁处理并发库存扣减，以及如何设置合理的事务超时。

2. **支付 Webhook 处理**教会了我们幂等性设计——在不可靠的网络环境中，确保同一事件被多次通知时不会产生副作用。保存原始回调数据是生产环境中的重要调试手段。

3. **定时任务**让我们能够自动化处理过期订单和生成统计报告。关键是错误隔离——单个任务失败不应影响其他任务的处理。

4. **缓存策略**显著提升了读性能。Cache-Aside 模式简单易用，但需要注意缓存失效和 TTL 设置。记住：库存等高频变化的数据不适合长时间缓存。

5. **消息队列**实现了业务逻辑的解耦。支付成功后的邮件、短信、积分更新等操作不再阻塞主流程，同时通过重试机制保证了最终一致性。

6. **N+1 查询**是最隐蔽的性能杀手。始终使用 Prisma 的 `include` 预加载关联数据，并通过查询日志监控实际执行的 SQL 数量。

7. **游标分页**在大数据集上提供了恒定的查询性能，是移动端 API 和无限滚动场景的首选方案。

这些不是孤立的知识点——它们共同构成了一个生产级电商后端的核心能力。在下一阶段中，我们将进入微服务架构和部署运维的领域。

**English:**
The two projects in Stage 3 cover the most core skills in e-commerce backend development:

1. **Transaction Management** is the cornerstone of data consistency. Through the complete `createOrder` flow, we learned how to coordinate multiple write operations in a single transaction, how to use optimistic locking for concurrent stock deduction, and how to set reasonable transaction timeouts.

2. **Payment Webhook Handling** taught us idempotency design — ensuring that in unreliable network environments, duplicate notifications of the same event produce no side effects. Saving raw callback data is an important debugging technique in production.

3. **Scheduled Tasks** enabled us to automate expired order processing and statistics report generation. The key is error isolation — a single task failure should not affect the processing of other tasks.

4. **Caching Strategies** significantly boosted read performance. The Cache-Aside pattern is simple to use, but requires attention to cache invalidation and TTL settings. Remember: frequently changing data like stock quantities is not suitable for long-term caching.

5. **Message Queues** achieved decoupling of business logic. Post-payment operations like emails, SMS, and loyalty point updates no longer block the main flow, while retry mechanisms guarantee eventual consistency.

6. **N+1 Queries** are the most insidious performance killer. Always use Prisma's `include` to eagerly load related data, and monitor the actual number of SQL statements executed through query logging.

7. **Cursor Pagination** provides constant query performance on large datasets, making it the preferred choice for mobile APIs and infinite scroll scenarios.

These are not isolated knowledge points — together they form the core capabilities of a production-grade e-commerce backend. In the next stage, we will enter the realm of microservice architecture and deployment operations.

---

**延伸阅读 / Further Reading:**

- [Prisma Transactions Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [NestJS Task Scheduling](https://docs.nestjs.com/techniques/task-scheduling)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Martin Fowler - Enterprise Application Architecture: Optimistic/Pessimistic Locking](https://martinfowler.com/eaaCatalog/)
- [Slack Engineering - Cursor-Based Pagination](https://slack.engineering/evolving-api-pagination-at-slack/)
