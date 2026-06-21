# 13-microservice - NestJS 微服务示例

## 项目简介

本项目演示了 NestJS 微服务架构。项目包含两个独立运行的应用：

1. **API 网关 (Gateway)** - HTTP 服务器，监听 3000 端口，接收客户端请求
2. **通知微服务 (Notification Service)** - TCP 微服务，监听 3001 端口，处理通知相关逻辑

两个服务通过 TCP 传输层进行通信。

## 学习要点

### 1. 微服务通信模式

NestJS 微服务支持两种通信模式：

#### 事件模式 (Event Pattern) - Fire and Forget
```typescript
// 发送端（网关）
this.client.emit('order_created', orderData);

// 接收端（通知服务）
@EventPattern('order_created')
handleOrderCreated(@Payload() data: OrderData) {
  // 处理事件，不需要返回值
}
```
- 发送方不等待响应
- 适合：日志记录、发送通知、数据同步等不需要响应的场景
- 类似"发布/订阅"模式

#### 消息模式 (Message Pattern) - Request/Response
```typescript
// 请求端（网关）
const result = this.client.send('get_notification_count', {});

// 响应端（通知服务）
@MessagePattern('get_notification_count')
getNotificationCount(@Payload() data: any) {
  return { count: this.notificationCount }; // 必须返回响应
}
```
- 发送方等待响应（类似 HTTP 请求/响应）
- 适合：需要获取数据、需要确认操作的场景
- 基于 RxJS Observable

### 2. 传输层抽象

NestJS 支持多种传输层：

| 传输层 | 说明 | 适用场景 |
|--------|------|----------|
| TCP | 内置，无需额外依赖 | 本地开发、内网通信 |
| Redis | 使用 Redis 作为消息代理 | 需要消息持久化 |
| NATS | 轻量级消息系统 | 高性能场景 |
| MQTT | IoT 消息协议 | 物联网设备 |
| gRPC | Google RPC | 高性能二进制通信 |
| Kafka | 分布式流处理 | 大数据管道 |

### 3. 何时使用微服务

**适合使用微服务的场景：**
- 独立的业务域（如通知服务、支付服务）
- 需要独立部署和扩展的模块
- 技术栈多样化的系统

**不适合的场景：**
- 小型应用（增加复杂度但不带来收益）
- 团队较小，运维能力有限
- 对延迟极其敏感的场景（网络开销）

## 技术栈

- NestJS - 应用框架
- @nestjs/microservices - 微服务支持
- TCP Transport - 传输层

## 运行方式

```bash
# 安装依赖
pnpm install

# 先启动通知微服务（终端 1）
pnpm start:notification

# 再启动 API 网关（终端 2）
pnpm start:gateway
```

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /orders | 创建订单（会触发通知事件） |
| GET | /orders/:id/status | 获取订单状态 |
| GET | /orders/notification-count | 获取通知计数（请求-响应模式） |

## 测试

创建订单后，在通知微服务的终端中可以看到日志输出：
```
[通知服务] 收到订单创建事件: ORD-xxx
[通知服务] 正在发送订单确认邮件给 user@example.com
```
