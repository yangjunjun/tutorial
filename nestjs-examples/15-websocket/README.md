# 15-websocket - NestJS WebSocket 实时通信示例

## 项目简介

本项目演示如何使用 NestJS 的 WebSocket 网关实现实时通信。
包含三个 WebSocket 网关示例：

1. **聊天网关 (/chat)** - 实时聊天室，支持房间、消息广播
2. **通知网关 (/notification)** - 针对特定用户的推送通知
3. **事件网关 (/events)** - WebSocket 基础功能演示

## 学习要点

### 1. WebSocket vs HTTP

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 通信方式 | 请求-响应 | 双向通信 |
| 连接 | 短连接（每次请求新建连接） | 长连接 |
| 实时性 | 客户端主动轮询 | 服务端主动推送 |
| 适用场景 | REST API | 实时聊天、在线游戏、股票行情 |

### 2. Socket.io 特性

Socket.io 是 WebSocket 的增强库，提供：
- **自动重连** - 断开后自动尝试重新连接
- **房间 (Rooms)** - 将客户端分组，向特定房间广播
- **命名空间 (Namespaces)** - 在同一连接上隔离不同功能
- **广播 (Broadcasting)** - 向所有/部分客户端发送消息
- **降级机制** - WebSocket 不可用时降级为长轮询

### 3. NestJS 网关生命周期

```
客户端连接
    |
    v
afterInit()           - 网关初始化完成
    |
    v
handleConnection()    - 新客户端连接
    |
    v
@SubscribeMessage()   - 处理客户端消息
    |
    v
handleDisconnect()    - 客户端断开连接
```

### 4. 核心装饰器

| 装饰器 | 用途 |
|--------|------|
| `@WebSocketGateway()` | 标记为 WebSocket 网关 |
| `@SubscribeMessage()` | 监听客户端事件 |
| `@MessageBody()` | 获取消息数据 |
| `@ConnectedSocket()` | 获取客户端 Socket 实例 |
| `@WebSocketServer()` | 获取 Server 实例 |

### 5. 服务端推送

```typescript
// 向所有客户端广播
this.server.emit('event', data);

// 向特定房间广播
this.server.to('room-name').emit('event', data);

// 向除发送者外的所有客户端广播
client.broadcast.emit('event', data);

// 向除发送者外的特定房间广播
client.broadcast.to('room-name').emit('event', data);
```

## 运行方式

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm start:dev

# 打开聊天客户端
# 在浏览器中打开 src/public/index.html
# 或者启动静态文件服务后访问
```

## WebSocket 端点

| 命名空间 | 说明 |
|----------|------|
| `/chat` | 聊天网关 |
| `/notification` | 通知网关 |
| `/events` | 事件演示网关 |

## 聊天网关事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `join_room` | 客户端 -> 服务端 | 加入聊天室 |
| `leave_room` | 客户端 -> 服务端 | 离开聊天室 |
| `message` | 双向 | 发送/接收消息 |
| `typing` | 双向 | 正在输入指示器 |
| `user_joined` | 服务端 -> 客户端 | 用户加入通知 |
| `user_left` | 服务端 -> 客户端 | 用户离开通知 |
