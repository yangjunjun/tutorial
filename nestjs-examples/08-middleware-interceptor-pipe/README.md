# 08-middleware-interceptor-pipe - 中间件、拦截器、管道深度解析

## 项目简介

本项目深入演示 NestJS 请求处理管道中的三大核心概念：中间件（Middleware）、拦截器（Interceptor）和管道（Pipe）。每个概念提供多个实际示例，帮助理解它们的作用、区别和最佳实践。

## 知识点

### 请求处理流程

```
请求 → 中间件 → 守卫 → 拦截器(前) → 管道 → Controller → 拦截器(后) → 响应
```

### 中间件（Middleware）
- **时机**：请求到达路由处理前执行
- **用途**：通用请求处理（日志、CORS、限流等）
- **特点**：可以访问 req/res，但没有 NestJS 上下文

### 拦截器（Interceptor）
- **时机**：Controller 方法执行前后都能介入
- **用途**：响应转换、缓存、重试、日志计时
- **特点**：基于 RxJS，可以操作响应数据流

### 管道（Pipe）
- **时机**：参数传递给 Controller 方法前执行
- **用途**：参数验证、类型转换、默认值
- **特点**：两个核心操作 - 转换和验证

## 各概念对比

| 特性       | 中间件     | 拦截器     | 管道       | 守卫       |
|-----------|-----------|-----------|-----------|-----------|
| 执行时机   | 最早       | Controller前后 | 参数传递前 | 路由匹配后 |
| 访问 NestJS上下文 | 否 | 是 | 是 | 是 |
| 操作响应数据 | 否 | 是 | 否 | 否 |
| 使用 RxJS | 否 | 是 | 否 | 否 |
| 典型用途   | CORS/日志 | 缓存/转换 | 验证/转换 | 认证/授权 |

## 运行步骤

```bash
pnpm install
pnpm start:dev
```

## API 测试

### 猫咪接口（演示各种装饰器组合）
```bash
# 获取猫咪列表（演示默认值管道）
curl "http://localhost:3000/cats"
curl "http://localhost:3000/cats?page=2&limit=5"

# 根据 UUID 获取猫咪（演示 UUID 管道）
curl "http://localhost:3000/cats/550e8400-e29b-41d4-a716-446655440000"

# 创建猫咪（演示 trim 管道自动去空格）
curl -X POST http://localhost:3000/cats \
  -H "Content-Type: application/json" \
  -d '{"name":"  Tom  ","age":3}'
```

### 用户接口（演示序列化拦截器）
```bash
# 获取用户列表（password 字段被排除）
curl http://localhost:3000/users

# 获取单个用户
curl http://localhost:3000/users/1
```

## 项目结构

```
src/
├── middleware/
│   ├── timing.middleware.ts      # 函数中间件：响应时间
│   ├── cors.middleware.ts        # 类中间件：CORS
│   └── rate-limit.middleware.ts  # 限流中间件
├── interceptors/
│   ├── cache.interceptor.ts      # 缓存拦截器
│   ├── serialize.interceptor.ts  # 序列化拦截器
│   └── retry.interceptor.ts      # 重试拦截器
├── pipes/
│   ├── parse-uuid.pipe.ts        # UUID 验证管道
│   ├── default-value.pipe.ts     # 默认值管道
│   └── trim.pipe.ts              # 去空格管道
├── dto/
│   └── user.dto.ts               # 用户 DTO（含 @Exclude）
├── cats/
│   ├── cats.controller.ts        # 猫咪控制器
│   ├── cats.service.ts           # 猫咪服务
│   └── cats.module.ts            # 猫咪模块
├── users/
│   ├── users.controller.ts       # 用户控制器
│   ├── users.service.ts          # 用户服务
│   └── users.module.ts           # 用户模块
├── app.module.ts                 # 根模块（中间件配置）
└── main.ts                       # 入口
```

## 性能注意事项

1. **中间件**：每个请求都会执行，保持轻量
2. **拦截器**：RxJS 操作链会累积，避免过多拦截器
3. **缓存拦截器**：注意内存泄漏，生产环境使用 Redis
4. **管道**：class-validator 验证在大数据量时可能有性能影响
