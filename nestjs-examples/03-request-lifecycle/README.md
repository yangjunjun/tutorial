# 03 - NestJS 请求生命周期

## 项目简介

本项目通过一个完整的示例，演示 NestJS 中**请求生命周期（Request Lifecycle）**的各个阶段。每个请求都会经过一系列处理环节，每个环节都有特定的职责和执行顺序。

## 请求生命周期图

```
客户端请求 (Request)
    │
    ▼
┌─────────────────────────────────┐
│         中间件 (Middleware)       │  ← 最先执行，类似 Express 中间件
│  LoggingMiddleware               │     用于日志、CORS、认证等
│  AuthMiddleware                  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│         守卫 (Guard)             │  ← 授权检查
│  ApiKeyGuard                     │     决定请求是否可以继续
│  RolesGuard                      │     可以访问元数据（@Roles）
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│       拦截器 - 前置 (Interceptor) │  ← 请求前/后的处理
│  LoggingInterceptor              │     可以修改请求/响应
│  TransformInterceptor            │     使用 RxJS Observable
│  TimeoutInterceptor              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│         管道 (Pipe)              │  ← 数据转换和验证
│  ParsePositiveIntPipe            │     在控制器方法执行前运行
│  ValidationDetailPipe            │     对参数进行转换/验证
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     控制器 + 服务                 │  ← 业务逻辑处理
│  Controller → Service            │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│      拦截器 - 后置 (Interceptor) │  ← 处理响应数据
│  转换响应格式、记录响应时间        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│      异常过滤器 (Exception Filter)│  ← 捕获和处理异常
│  将异常转换为标准 HTTP 响应        │
└──────────────┬──────────────────┘
               │
               ▼
         响应 (Response)
```

## 核心概念

### 中间件 (Middleware)
- **位置**: 请求生命周期的第一站
- **用途**: 日志记录、请求体解析、CORS、认证 token 解析
- **两种形式**: 类中间件（实现 NestMiddleware）和函数中间件
- **注册位置**: 模块的 configure() 方法中

### 守卫 (Guard)
- **位置**: 中间件之后，拦截器之前
- **用途**: 授权/鉴权（如角色检查、API Key 验证）
- **接口**: 实现 CanActivate，返回 boolean 或 Promise<boolean>
- **注册方式**: @UseGuards() 装饰器或 APP_GUARD 全局注册

### 拦截器 (Interceptor)
- **位置**: 守卫之后、管道之前（前置），控制器之后（后置）
- **用途**: 响应转换、日志计时、缓存、超时控制
- **接口**: 实现 NestInterceptor，返回 Observable
- **特点**: 可以同时处理请求前和响应后的逻辑（使用 RxJS）

### 管道 (Pipe)
- **位置**: 控制器方法执行前（参数层面）
- **用途**: 参数转换（字符串 → 数字）和验证（DTO 验证）
- **接口**: 实现 PipeTransform
- **特点**: 只在控制器方法的参数上执行

## 文件结构

```
src/
├── middleware/
│   ├── logging.middleware.ts       # 类中间件 - 请求日志
│   └── auth.middleware.ts          # 函数中间件 - API Key 认证
├── guards/
│   ├── role.guard.ts               # 角色守卫
│   └── api-key.guard.ts            # API Key 守卫
├── decorators/
│   └── roles.decorator.ts          # @Roles() 自定义装饰器
├── interceptors/
│   ├── logging.interceptor.ts      # 日志拦截器
│   ├── transform.interceptor.ts    # 响应转换拦截器
│   └── timeout.interceptor.ts      # 超时拦截器
├── pipes/
│   ├── parse-positive-int.pipe.ts  # 正整数解析管道
│   └── validation-detail.pipe.ts   # 详细验证管道
├── dogs/
│   ├── dto/
│   │   └── create-dog.dto.ts       # 创建狗狗 DTO
│   ├── dogs.controller.ts          # 狗狗控制器
│   ├── dogs.service.ts             # 狗狗服务
│   └── dogs.module.ts              # 狗狗模块
├── app.module.ts                   # 根模块
└── main.ts                         # 应用入口
```

## 运行方式

```bash
pnpm install
pnpm start:dev
```

## API 测试

### 基础请求（需带 x-api-key 头）

```bash
# 获取所有狗狗（需要 API Key）
curl -H "x-api-key: secret-key-123" http://localhost:3000/dogs

# 创建狗狗
curl -X POST http://localhost:3000/dogs \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key-123" \
  -d '{"name": "旺财", "age": 3, "breed": "中华田园犬"}'

# 获取指定 ID 的狗狗
curl -H "x-api-key: secret-key-123" http://localhost:3000/dogs/1

# 删除狗狗（需要 admin 角色）
curl -X DELETE http://localhost:3000/dogs/1 \
  -H "x-api-key: secret-key-123" \
  -H "x-user-role: admin"
```

### 测试各种场景

```bash
# 缺少 API Key（返回 401）
curl http://localhost:3000/dogs

# 错误 ID 格式（管道验证失败）
curl -H "x-api-key: secret-key-123" http://localhost:3000/dogs/-1

# 删除时缺少 admin 角色（守卫拦截）
curl -X DELETE http://localhost:3000/dogs/1 \
  -H "x-api-key: secret-key-123"

# 验证失败（name 为空）
curl -X POST http://localhost:3000/dogs \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key-123" \
  -d '{"age": -1}'
```
