# 05-jwt-auth - JWT 认证示例

## 项目简介

本项目演示如何在 NestJS 中实现基于 JWT（JSON Web Token）的身份认证。使用 Passport.js 框架作为认证中间件，Prisma ORM + SQLite 作为数据存储。

## 知识点

- **JWT 认证流程**：理解无状态认证的完整流程（注册 → 登录 → 获取 Token → 携带 Token 访问）
- **Passport.js 策略**：
  - `LocalStrategy`：用于用户名/密码验证（登录场景）
  - `JwtStrategy`：用于 JWT Token 验证（保护路由）
- **密码安全**：使用 bcrypt 对密码进行哈希加密存储
- **Prisma ORM**：使用 Prisma 操作 SQLite 数据库
- **NestJS Guard**：使用 `AuthGuard` 保护路由

## JWT 认证流程

```
1. 用户注册 → 密码 bcrypt 加密 → 存入数据库
2. 用户登录 → 验证凭据 → 签发 JWT Token
3. 客户端携带 Token（Authorization: Bearer <token>）
4. JwtStrategy 解析验证 Token → 提取用户信息 → 注入 request.user
```

## 运行步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 生成 Prisma Client
pnpm prisma generate

# 3. 执行数据库迁移
pnpm prisma migrate dev --name init

# 4. 启动开发服务器
pnpm start:dev
```

## API 测试（curl）

### 注册用户
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","email":"test@example.com"}'
```

### 用户登录（获取 Token）
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
# 响应中包含 access_token
```

### 访问受保护路由（使用 Token）
```bash
# 获取个人信息（JWT 策略直接从 Token 提取用户）
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <你的token>"

# 获取受保护的信息
curl http://localhost:3000/protected/info \
  -H "Authorization: Bearer <你的token>"

# 获取机密数据
curl http://localhost:3000/protected/secret \
  -H "Authorization: Bearer <你的token>"
```

### 使用 Local 策略登录
```bash
curl -X POST http://localhost:3000/auth/login-local \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

## 项目结构

```
src/
├── auth/
│   ├── dto/               # 数据传输对象
│   │   ├── register.dto.ts  # 注册 DTO（含验证规则）
│   │   └── login.dto.ts     # 登录 DTO
│   ├── strategies/         # Passport 策略
│   │   ├── jwt.strategy.ts  # JWT Token 验证策略
│   │   └── local.strategy.ts # 用户名密码验证策略
│   ├── guards/             # 认证守卫
│   │   └── jwt-auth.guard.ts # JWT 认证守卫
│   ├── auth.service.ts     # 认证业务逻辑
│   ├── auth.controller.ts  # 认证接口
│   └── auth.module.ts      # 认证模块
├── prisma/
│   ├── prisma.service.ts   # Prisma 数据库服务
│   └── prisma.module.ts    # Prisma 模块（全局）
├── protected/
│   └── protected.controller.ts # 受保护的路由示例
├── app.module.ts           # 根模块
└── main.ts                 # 应用入口
```

## 核心概念

### Passport Strategy（策略模式）
Passport 使用「策略」来验证请求。每种策略对应一种认证方式：
- `LocalStrategy`：验证用户名和密码
- `JwtStrategy`：验证 JWT Token

### AuthGuard（认证守卫）
`AuthGuard('jwt')` 会自动调用 JwtStrategy 来验证请求中的 Token。

### JWT Token 结构
```json
{
  "sub": 1,          // 用户ID
  "username": "test", // 用户名
  "iat": 1234567890, // 签发时间
  "exp": 1234603890  // 过期时间
}
```
