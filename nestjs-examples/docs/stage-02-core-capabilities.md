## 第二阶段：核心能力篇 / Stage 2: Core Capabilities (Week 3-5)

### 概述 / Overview

**中文：**
第二阶段是 NestJS 学习路线中最关键的部分。在这个阶段，你将掌握构建企业级应用所需的的核心能力：用户认证（JWT）、权限控制（RBAC）、异常处理与日志系统、中间件/拦截器/管道的高级用法，以及自动化的 API 文档生成。这五个项目层层递进，每一个都建立在前一个的基础之上。完成本阶段后，你将具备独立开发一个完整的、带有认证授权、日志监控和 API 文档的后端服务的能力。

**English:**
Stage 2 is the most critical part of the NestJS learning path. In this stage, you will master the core capabilities needed to build enterprise-grade applications: JWT authentication, Role-Based Access Control (RBAC), exception handling and logging, advanced usage of middleware/interceptors/pipes, and automated API documentation generation. These five projects are progressive -- each builds upon the foundation of the previous one. After completing this stage, you will be capable of independently developing a complete backend service with authentication, authorization, logging, and API documentation.

**学习路线 / Learning Path:**
```
Week 3: 05-jwt-auth → 06-rbac-permission
Week 4: 07-exception-logger-config → 08-middleware-interceptor-pipe
Week 5: 09-swagger-docs + Review
```

---

### 项目 05: JWT 认证 / Project 05: JWT Authentication

#### JWT 工作原理 / How JWT Works

**中文：**
JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全地传输声明信息。它由三部分组成，以点号 `.` 分隔：

1. **Header（头部）**：声明 Token 类型和签名算法。例如 `{"alg": "HS256", "typ": "JWT"}`。经过 Base64Url 编码后成为第一段。
2. **Payload（载荷）**：携带实际数据，包含标准声明（如 `sub`、`iat`、`exp`）和自定义声明（如 `username`、`role`）。经过 Base64Url 编码后成为第二段。**注意：Payload 只是编码，不是加密，任何人都可以解码查看，因此不要存放敏感信息（如密码）。**
3. **Signature（签名）**：使用 Header 中声明的算法和密钥对前两部分进行签名。例如 `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`。签名确保 Token 不被篡改。

**Token 生命周期（Token Lifecycle）：**
- **签发（Issue）**：用户登录成功后，服务器使用密钥生成 JWT 并返回给客户端。
- **使用（Use）**：客户端在后续请求的 `Authorization` 头中携带 `Bearer <token>`。
- **验证（Verify）**：服务器收到请求后验证签名和过期时间。
- **过期（Expire）**：Token 超过 `exp` 时间后失效，客户端需要重新登录或使用 Refresh Token。
- **刷新（Refresh）**：使用长期有效的 Refresh Token 获取新的 Access Token，实现无感续期。

**English:**
JWT (JSON Web Token) is an open standard (RFC 7519) for securely transmitting claims between parties. It consists of three parts separated by dots:

1. **Header**: Declares the token type and signing algorithm. Example: `{"alg": "HS256", "typ": "JWT"}`. Base64Url encoded as the first segment.
2. **Payload**: Carries actual data including standard claims (`sub`, `iat`, `exp`) and custom claims (`username`, `role`). Base64Url encoded as the second segment. **Important: Payload is only encoded, not encrypted -- anyone can decode and read it, so never store sensitive data like passwords.**
3. **Signature**: Signs the first two parts using the algorithm declared in the header and a secret key. The signature ensures the token has not been tampered with.

**Token Lifecycle:**
- **Issue**: After successful login, the server generates a JWT using a secret and returns it to the client.
- **Use**: The client includes `Bearer <token>` in the `Authorization` header of subsequent requests.
- **Verify**: The server validates the signature and expiration time upon receiving each request.
- **Expire**: The token becomes invalid after the `exp` time; the client must re-authenticate or use a Refresh Token.
- **Refresh**: A long-lived Refresh Token is used to obtain a new Access Token without user interaction.

**安全提示 / Security Tips:**
- 永远不要在 JWT payload 中存放密码或敏感个人信息 / Never put passwords or sensitive PII in JWT payloads
- 使用足够长的随机密钥（至少 32 字符）/ Use a sufficiently long random secret (at least 32 characters)
- Access Token 有效期建议设为 15 分钟到 1 小时 / Set Access Token expiry to 15 minutes - 1 hour
- 在生产环境中始终使用 HTTPS 传输 Token / Always transmit tokens over HTTPS in production

---

#### Passport.js 策略模式 / Passport.js Strategy Pattern

**中文：**
Passport.js 是 Node.js 生态中最成熟的认证中间件。它的核心概念是 **Strategy（策略）**-- 一种可插拔的认证逻辑封装。每个 Strategy 负责一种认证方式（JWT、用户名密码、OAuth 等），NestJS 通过 `@nestjs/passport` 包将其无缝集成到框架中。

**策略模式工作流程：**
```
请求 → Guard 触发 Strategy → Strategy 提取凭据 → Strategy 验证凭据 → validate() → req.user
```

**JwtStrategy（JWT 策略）：** 负责从请求中提取 JWT Token，验证签名和过期时间，然后调用 `validate()` 方法做进一步的用户查询。

来源文件 / Source: `05-jwt-auth/src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      // 从 "Authorization: Bearer <token>" 中提取 Token
      // Extract JWT from "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 不忽略过期（生产环境必须为 false）
      // Do not ignore expiration (must be false in production)
      ignoreExpiration: false,

      // 签名密钥，必须和 JwtModule.register() 中的一致
      // Signing secret, must match the one in JwtModule.register()
      secretOrKey: 'jwt-secret-key-change-in-production',
    });
  }

  // Token 验证通过后调用，返回值挂载到 request.user
  // Called after token verification; return value is attached to request.user
  async validate(payload: any) {
    const user = await this.authService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    return user;
  }
}
```

**关键概念解读 / Key Concepts:**
- `PassportStrategy(Strategy)`: NestJS 对 Passport 策略的封装基类 / NestJS wrapper base class for Passport strategies
- `ExtractJwt.fromAuthHeaderAsBearerToken()`: 从标准 Bearer 头提取 Token / Extracts token from the standard Bearer header
- `validate(payload)`: 签名验证通过后调用，payload 是解码后的 JWT 载荷 / Called after signature verification; payload is the decoded JWT payload
- 返回值自动挂载到 `request.user` / Return value is automatically attached to `request.user`

**LocalStrategy（本地策略）：** 处理传统的用户名/密码登录。

来源文件 / Source: `05-jwt-auth/src/auth/strategies/local.strategy.ts`

```typescript
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // 可以自定义字段名：super({ usernameField: 'email' })
    // You can customize field names: super({ usernameField: 'email' })
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}
```

**English:**
Passport.js is the most mature authentication middleware in the Node.js ecosystem. Its core concept is the **Strategy** -- a pluggable encapsulation of authentication logic. Each Strategy handles one authentication method (JWT, username/password, OAuth, etc.), and NestJS seamlessly integrates it through the `@nestjs/passport` package.

The **JwtStrategy** extracts the JWT from the request, verifies the signature and expiration, then calls `validate()` for additional user lookup. The **LocalStrategy** handles traditional username/password login by reading credentials from the request body and delegating validation to the AuthService.

---

#### 注册与密码加密 / Registration and Password Hashing

**中文：**
密码存储的安全性是认证系统的基石。**永远不要以明文存储密码。** 本项目使用 `bcrypt` 库进行密码哈希，它内置了盐值（salt）和工作因子（work factor），能有效抵御彩虹表攻击和暴力破解。

**bcrypt 工作流程：**
1. **注册时**：`bcrypt.hash(password, saltRounds)` -- 生成随机盐值，与密码混合后进行多轮哈希计算。`saltRounds = 10` 意味着 2^10 = 1024 轮计算，在当前硬件条件下兼顾安全性和性能。
2. **登录时**：`bcrypt.compare(password, hash)` -- 从存储的哈希中提取盐值，对输入的密码执行相同的哈希运算，然后比较结果。

来源文件 / Source: `05-jwt-auth/src/auth/auth.service.ts`

```typescript
async register(username: string, password: string, email: string) {
  // 检查用户名或邮箱是否已存在
  // Check if username or email already exists
  const existingUser = await this.prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    throw new ConflictException(
      existingUser.username === username ? '用户名已存在' : '邮箱已被注册',
    );
  }

  // bcrypt 加密密码，saltRounds=10 是推荐的安全值
  // Hash password with bcrypt, saltRounds=10 is the recommended security value
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await this.prisma.user.create({
    data: { username, password: hashedPassword, email },
  });

  // 返回用户信息时排除密码字段
  // Exclude password field when returning user info
  const { password: _, ...result } = user;
  return result;
}

async validateUser(username: string, password: string) {
  const user = await this.prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new UnauthorizedException('用户名或密码错误');
  }

  // bcrypt.compare 比对密码哈希值
  // bcrypt.compare checks the password against the stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('用户名或密码错误');
  }

  const { password: _, ...result } = user;
  return result;
}
```

**常见错误 / Common Mistakes:**
- 使用 MD5 或 SHA256 做密码哈希（不安全，缺少盐值和计算强度）/ Using MD5 or SHA256 for password hashing (insecure, lacks salt and work factor)
- saltRounds 设得太低（低于 8）/ Setting saltRounds too low (below 8)
- 在错误信息中区分「用户名不存在」和「密码错误」（暴露用户枚举信息）/ Distinguishing between "user not found" and "wrong password" in error messages (exposes user enumeration)

**English:**
Password storage security is the foundation of any authentication system. **Never store passwords in plaintext.** This project uses the `bcrypt` library for password hashing, which incorporates built-in salt and work factor to resist rainbow table attacks and brute force cracking. During registration, `bcrypt.hash()` generates a random salt and performs multiple rounds of hashing. During login, `bcrypt.compare()` extracts the salt from the stored hash, performs the same operation on the input password, and compares the results.

---

#### JWT 模块配置 / JWT Module Configuration

**中文：**
`JwtModule.register()` 是配置 JWT 签发参数的核心。它接受一个配置对象，包含密钥和签发选项。

来源文件 / Source: `05-jwt-auth/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // 生产环境必须使用环境变量！
      // Must use environment variable in production!
      secret: 'jwt-secret-key-change-in-production',
      signOptions: {
        // Token 有效期。安全建议：短期 Token + Refresh Token
        // Token expiry. Security recommendation: short-lived Token + Refresh Token
        expiresIn: '1h',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**配置说明 / Configuration Notes:**
- `secret`: 签名密钥。生产环境应使用 `ConfigService` 从环境变量注入 / Signing secret. In production, inject from environment variables via `ConfigService`
- `expiresIn`: 支持 `'15m'`、`'1h'`、`'7d'` 等格式 / Supports formats like `'15m'`, `'1h'`, `'7d'`
- `PassportModule.register({ defaultStrategy: 'jwt' })`: 设置默认策略，这样 `AuthGuard()` 不带参数时默认使用 JWT / Sets the default strategy so `AuthGuard()` without arguments defaults to JWT

**English:**
`JwtModule.register()` is the core configuration point for JWT signing parameters. It accepts a configuration object containing the secret and signing options. In production, the secret should always come from environment variables rather than being hardcoded. The `PassportModule.register()` call sets the default authentication strategy, so when `AuthGuard()` is used without arguments, it defaults to JWT.

---

#### 保护路由 / Protecting Routes

**中文：**
`AuthGuard` 是 NestJS 提供的内置守卫，它会自动调用对应的 Passport Strategy 进行验证。你可以继承它创建自定义守卫类，便于在多处复用。

来源文件 / Source: `05-jwt-auth/src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // AuthGuard('jwt') 自动查找名为 'jwt' 的 Passport Strategy
  // AuthGuard('jwt') automatically finds the Passport Strategy named 'jwt'
}
```

**在控制器中使用 / Usage in Controller:**

来源文件 / Source: `05-jwt-auth/src/auth/auth.controller.ts`

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  // req.user 由 JwtStrategy.validate() 设置
  // req.user is set by JwtStrategy.validate()
  return { message: '认证成功！', data: req.user };
}
```

**AuthGuard 执行流程 / AuthGuard Execution Flow:**
1. 从 `Authorization` 头提取 Bearer Token / Extract Bearer Token from the `Authorization` header
2. 验证 Token 签名和过期时间 / Verify token signature and expiration
3. 调用 `JwtStrategy.validate(payload)` / Call `JwtStrategy.validate(payload)`
4. 返回值挂载到 `request.user` / Attach return value to `request.user`
5. 任何一步失败抛出 401 Unauthorized / Any failure throws 401 Unauthorized

**English:**
`AuthGuard` is NestJS's built-in guard that automatically invokes the corresponding Passport Strategy for verification. You can extend it to create a reusable custom guard class. When applied to a route via `@UseGuards(JwtAuthGuard)`, it ensures that only requests with valid JWT tokens can access the handler. The verified user object from `JwtStrategy.validate()` is automatically attached to `request.user`.

---

### 项目 06: RBAC 权限控制 / Project 06: RBAC Permission Control

#### RBAC 概念 / RBAC Concepts

**中文：**
RBAC（Role-Based Access Control，基于角色的访问控制）是最常用的权限管理模型。其核心思想是：不直接给用户分配权限，而是给用户分配角色，角色再关联权限。

**角色层级设计 / Role Hierarchy:**
```
ADMIN（管理员）
  ├── 所有权限：用户管理、商品管理、订单管理、系统设置
  ├── Can do everything: user mgmt, product mgmt, order mgmt, system settings
  │
MERCHANT（商家）
  ├── 商品 CRUD（仅限自己的）、订单查看
  ├── Product CRUD (own only), order viewing
  │
USER（普通用户）
  └── 浏览商品、下单购买、查看自己的订单
  └── Browse products, place orders, view own orders
```

**权限矩阵 / Permission Matrix:**

| 操作 / Action | ADMIN | MERCHANT | USER |
|---|---|---|---|
| 查看商品列表 / List Products | 全部 / All | 自己的 / Own | 全部 / All |
| 创建商品 / Create Product | Yes | Yes | No |
| 编辑商品 / Edit Product | 全部 / All | 自己的 / Own | No |
| 删除商品 / Delete Product | Yes | No | No |
| 浏览公开数据 / Browse Public | Yes | Yes | Yes |

**English:**
RBAC (Role-Based Access Control) is the most widely used permission management model. Its core idea is: instead of assigning permissions directly to users, you assign roles to users, and roles are associated with permissions. This project implements a three-tier role system: ADMIN (full access), MERCHANT (can manage own products), and USER (can browse and purchase). The permission matrix defines exactly what each role can do for every endpoint.

---

#### 自定义装饰器 / Custom Decorators

**中文：**
NestJS 中装饰器的本质是「在类或方法上贴标签」-- 通过 `SetMetadata` 附加自定义数据，后续由 Guard 读取。`@Roles()` 装饰器就是一个典型例子。

来源文件 / Source: `06-rbac-permission/src/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

// 使用常量避免硬编码字符串 / Use constants to avoid hardcoded strings
export const ROLES_KEY = 'roles';

/**
 * SetMetadata(ROLES_KEY, roles) 做的事情：
 * 在目标方法的元数据中设置 { 'roles': ['ADMIN', 'MERCHANT'] }
 * What SetMetadata does:
 * Sets { 'roles': ['ADMIN', 'MERCHANT'] } in the target method's metadata
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**使用方式 / Usage:**
```typescript
@Roles('ADMIN')            // 仅管理员 / Admin only
@Roles('MERCHANT', 'ADMIN') // 商家和管理员 / Merchant and Admin
```

**English:**
In NestJS, decorators are essentially "labels attached to classes or methods" -- they attach custom metadata via `SetMetadata` that can later be read by Guards. The `@Roles()` decorator is a prime example: it stores an array of allowed role strings in the route metadata, which the `RolesGuard` then reads to make authorization decisions.

---

#### RolesGuard 实现 / RolesGuard Implementation

**中文：**
RolesGuard 实现了 `CanActivate` 接口，使用 `Reflector` 读取 `@Roles()` 设置的元数据，然后比对用户角色与所需角色。

来源文件 / Source: `06-rbac-permission/src/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // getAllAndOverride: 同时检查方法级和类级装饰器，方法级优先
    // getAllAndOverride: checks both method-level and class-level, method takes priority
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 没有 @Roles() 装饰器则默认放行
    // No @Roles() decorator means allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('未认证，无法访问');
    }

    // ADMIN 可以访问所有路由（超级管理员）
    // ADMIN can access all routes (super admin)
    const hasRole = user.role === 'ADMIN' || requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `需要以下角色之一: ${requiredRoles.join(', ')}。当前角色: ${user.role}`,
      );
    }
    return true;
  }
}
```

**守卫链执行顺序 / Guard Chain Execution Order:**
```
@UseGuards(JwtAuthGuard, RolesGuard)
          ↓              ↓
    身份认证(AuthN)   权限检查(AuthZ)
```
JwtAuthGuard 先执行验证身份，通过后再由 RolesGuard 检查权限。如果 JwtAuthGuard 失败，RolesGuard 不会执行。

**English:**
The `RolesGuard` implements the `CanActivate` interface and uses `Reflector` to read the metadata set by `@Roles()`. It compares the user's role against the required roles. The guard chain execution order matters: `JwtAuthGuard` runs first for authentication, then `RolesGuard` runs for authorization. If authentication fails, the authorization guard never executes. A special rule gives ADMIN role universal access to all routes.

---

#### @CurrentUser 参数装饰器 / @CurrentUser Parameter Decorator

**中文：**
`createParamDecorator` 用于创建自定义参数装饰器，类似内置的 `@Body()`、`@Param()`。它从请求对象中提取数据并注入到控制器方法参数中。

来源文件 / Source: `06-rbac-permission/src/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // Set by JwtStrategy.validate()
    // @CurrentUser('id') 只返回 user.id / Only return user.id
    // @CurrentUser() 返回完整 user 对象 / Return full user object
    return data ? user?.[data] : user;
  },
);
```

**使用示例 / Usage Examples:**
```typescript
@Get()
findAll(@CurrentUser() user) { ... }         // 完整用户对象 / Full user object

@Get()
findAll(@CurrentUser('id') userId: number) { ... } // 只获取 ID / Only user ID
```

**ExecutionContext 的抽象层设计 / ExecutionContext Abstraction:**
- `ctx.switchToHttp()` -- HTTP 请求上下文 / HTTP request context
- `ctx.switchToWs()` -- WebSocket 上下文 / WebSocket context
- `ctx.switchToRpc()` -- RPC 上下文 / RPC context

**English:**
`createParamDecorator` creates custom parameter decorators that extract data from the request object and inject it into controller method parameters. The `@CurrentUser()` decorator reads `request.user` (set by `JwtStrategy.validate()`) and can optionally extract a specific field. The `ExecutionContext` abstraction supports HTTP, WebSocket, and RPC contexts, making the decorator reusable across different transport layers.

---

#### @Public 装饰器 / @Public Decorator

**中文：**
某些路由（如商品公开列表、登录、注册）不需要认证。`@Public()` 装饰器在路由上标记 `IS_PUBLIC_KEY` 元数据，JwtAuthGuard 检查此标记并跳过认证。

来源文件 / Source: `06-rbac-permission/src/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**JwtAuthGuard 中的 @Public() 检查 / @Public() Check in JwtAuthGuard:**

来源文件 / Source: `06-rbac-permission/src/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 公开路由直接放行 / Public routes bypass authentication
    if (isPublic) {
      return true;
    }

    // 非公开路由执行标准 JWT 验证 / Non-public routes go through standard JWT verification
    return super.canActivate(context);
  }
}
```

**全局守卫注册 / Global Guard Registration:**

来源文件 / Source: `06-rbac-permission/src/app.module.ts`

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // 全局 JWT 守卫 / Global JWT guard
  },
],
```

使用 `APP_GUARD` 注册全局守卫后，所有路由默认需要认证，只有标记 `@Public()` 的路由例外。这是一种「默认安全」的设计理念。

**English:**
The `@Public()` decorator marks routes that do not require authentication (e.g., public product listings, login, registration). The enhanced `JwtAuthGuard` checks for this metadata before performing JWT verification. When registered as a global guard via `APP_GUARD`, all routes require authentication by default -- only routes explicitly marked with `@Public()` are exempt. This follows a "secure by default" design philosophy.

---

#### 所有权检查 / Ownership Checking

**中文：**
角色检查只能控制「谁能调用哪个接口」，但无法控制「谁能操作哪个资源」。所有权检查在 Service 层实现，确保商家只能操作自己创建的资源。

来源文件 / Source: `06-rbac-permission/src/products/products.service.ts`

```typescript
async update(id: number, updateProductDto: UpdateProductDto, user: any) {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`商品 #${id} 不存在`);
  }

  // 所有权检查：商家只能修改自己的商品
  // Ownership check: merchants can only edit their own products
  if (user.role !== 'ADMIN' && product.ownerId !== user.id) {
    throw new ForbiddenException('你只能修改自己的商品');
  }

  return this.prisma.product.update({
    where: { id },
    data: updateProductDto,
  });
}
```

**权限控制层次 / Permission Control Layers:**
1. **Guard 层**：`@Roles('MERCHANT', 'ADMIN')` -- 只有商家和管理员能调用此接口
2. **Service 层**：`product.ownerId !== user.id` -- 商家只能操作自己的资源
3. **ADMIN 豁免**：管理员可以操作任何资源

**English:**
Role checks control "who can call which endpoint," but cannot control "who can operate on which resource." Ownership checking is implemented in the Service layer to ensure merchants can only operate on resources they created. ADMIN users bypass ownership checks. This creates a two-layer permission system: the Guard layer controls endpoint access, and the Service layer controls resource-level access.

---

### 项目 07: 异常处理、日志与配置 / Project 07: Exception Handling, Logging & Config

#### ExceptionFilter 异常过滤器

**中文：**
ExceptionFilter 是 NestJS 的错误处理层。它捕获控制器和服务中抛出的异常，将其转换为统一的 HTTP 响应格式。NestJS 内置了 `HttpException` 及其子类（如 `NotFoundException`、`BadRequestException`），但实际应用中你还需要处理非 HTTP 异常（如数据库连接失败、内存溢出等）。

**异常过滤器层级（从内到外） / Filter Hierarchy (innermost to outermost):**
```
方法级 @UseFilters() → 控制器级 @UseFilters() → 全局级 app.useGlobalFilters()
```
更内层的过滤器优先执行。如果内层过滤器已处理异常，外层不会再触发。

来源文件 / Source: `07-exception-logger-config/src/common/filters/http-exception.filter.ts`

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // 不带参数，捕获所有异常 / No argument = catch all exceptions
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      // NestJS 内置的 HTTP 异常 / Built-in NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;
    } else {
      // 非 HTTP 异常（数据库错误、内存溢出等）
      // Non-HTTP exceptions (DB errors, out of memory, etc.)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      this.logger.error(
        `未预期异常: ${exception}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    // 统一格式的响应 / Unified response format
    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
```

**ArgumentsHost 解读 / Understanding ArgumentsHost:**
- `host.switchToHttp()` -- 获取 HTTP 的 request/response 对象 / Get HTTP request/response objects
- `host.switchToWs()` -- 获取 WebSocket 的 client/data / Get WebSocket client/data
- `host.switchToRpc()` -- 获取 RPC 的 data/context / Get RPC data/context

**English:**
ExceptionFilter is NestJS's error handling layer. It catches exceptions thrown from controllers and services and transforms them into unified HTTP response formats. The `@Catch()` decorator without arguments catches all exceptions (both `HttpException` subclasses and unknown errors). The filter hierarchy runs from innermost to outermost: method-level filters execute first, then controller-level, then global-level. For non-HTTP exceptions, the filter logs detailed error information but returns a generic "Internal Server Error" message to the client to avoid leaking implementation details.

---

#### 自定义业务异常 / Custom Business Exceptions

**中文：**
在实际项目中，HTTP 状态码不足以表达所有业务错误。例如「库存不足」和「余额不足」都是 400 Bad Request，但前端需要不同的处理方式。自定义业务异常通过 `businessCode` 字段解决这个问题。

来源文件 / Source: `07-exception-logger-config/src/common/exceptions/business.exception.ts`

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

// 异常继承体系 / Exception inheritance hierarchy:
// HttpException → BusinessException → InsufficientStockException
//                                    → OrderNotFoundException
//                                    → InsufficientBalanceException

export class BusinessException extends HttpException {
  constructor(
    message: string,
    private readonly businessCode: string = 'BUSINESS_ERROR',
    private readonly details?: any,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, businessCode, details }, status);
  }
}

// 具体业务异常 / Specific business exceptions
export class InsufficientStockException extends BusinessException {
  constructor(productName: string, requested: number, available: number) {
    super(
      `商品「${productName}」库存不足：需要 ${requested} 件，当前库存 ${available} 件`,
      'INSUFFICIENT_STOCK',
      { productName, requested, available },
    );
  }
}

export class OrderNotFoundException extends BusinessException {
  constructor(orderId: string) {
    super(`订单 ${orderId} 不存在`, 'ORDER_NOT_FOUND', { orderId }, HttpStatus.NOT_FOUND);
  }
}
```

**设计理念 / Design Philosophy:**
- 前端可以根据 `businessCode` 做条件渲染 / Frontend can conditionally render based on `businessCode`
- 日志系统可以按 `businessCode` 分类统计 / Logging systems can categorize by `businessCode`
- 新增业务异常只需继承 `BusinessException` / Adding new business exceptions just requires extending `BusinessException`

**English:**
HTTP status codes alone are insufficient for expressing all business errors. Custom business exceptions solve this by adding a `businessCode` field that the frontend can use for conditional rendering. The exception inheritance hierarchy allows creating specific exception classes for different business scenarios while maintaining a unified structure. For example, `InsufficientStockException` and `OrderNotFoundException` both extend `BusinessException` but carry different codes and details.

---

#### Winston 日志系统 / Winston Logging System

**中文：**
Winston 是 Node.js 最流行的日志库，NestJS 通过 `nest-winston` 适配器将其集成为框架的 `LoggerService`。Winston 的核心概念是 **Transport（传输通道）**-- 每个 Transport 定义一个日志输出目标。

**日志级别（从低到高） / Log Levels (low to high):**
```
error → warn → info → http → verbose → debug → silly
```
设置某个级别后，只有该级别及以上的日志会被输出。例如设置 `info` 级别后，`debug` 和 `verbose` 不会输出。

来源文件 / Source: `07-exception-logger-config/src/logger/winston.logger.ts`

```typescript
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import * as path from 'path';

export const winstonLogger = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'debug',

  transports: [
    // 控制台传输：彩色输出，开发友好
    // Console transport: colored output, developer-friendly
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const ctx = context || 'Application';
          return `[${timestamp}] ${level} [${ctx}] ${message}`;
        }),
      ),
    }),

    // 综合日志文件：JSON 格式，便于日志分析工具处理
    // Combined log file: JSON format for log analysis tools
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB 后轮转 / Rotate after 10MB
      maxFiles: 5,                // 保留最近 5 个 / Keep last 5 files
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // 错误日志文件：只记录 error 级别
    // Error log file: only error level
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
```

**生产环境日志建议 / Production Logging Best Practices:**
- 控制台使用人类可读格式，文件使用 JSON 格式 / Use human-readable format for console, JSON for files
- 错误日志单独存放，便于告警系统监控 / Store error logs separately for alerting systems
- 使用 `maxsize` 和 `maxFiles` 防止磁盘被日志撑满 / Use `maxsize` and `maxFiles` to prevent disk exhaustion
- 将日志级别通过环境变量配置，生产环境用 `info` 或 `warn` / Configure log level via environment variables; use `info` or `warn` in production

**English:**
Winston is the most popular logging library for Node.js. NestJS integrates it as the framework's `LoggerService` through the `nest-winston` adapter. Winston's core concept is the **Transport** -- each transport defines a log output destination. This project configures three transports: Console (colored, developer-friendly), File for all logs (JSON format for analysis tools), and File for errors only (for alerting systems). Log rotation via `maxsize` and `maxFiles` prevents disk exhaustion.

---

#### ConfigModule 配置管理

**中文：**
`ConfigModule` 是 NestJS 官方的配置管理模块，它负责加载 `.env` 文件、提供 `ConfigService` 用于读取配置值，并支持在应用启动时校验环境变量。

**配置工厂函数 / Configuration Factory:**

来源文件 / Source: `07-exception-logger-config/src/config/configuration.ts`

```typescript
export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./dev.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: '1h',
  },
  log: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
```

**Joi 验证模式 / Joi Validation Schema:**

来源文件 / Source: `07-exception-logger-config/src/config/config.schema.ts`

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().default('sqlite:./dev.db'),
  JWT_SECRET: Joi.string().required(), // 必填 / Required
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('debug'),
});
```

**模块注册 / Module Registration:**

来源文件 / Source: `07-exception-logger-config/src/app.module.ts`

```typescript
ConfigModule.forRoot({
  isGlobal: true,           // 全局可用 / Globally available
  load: [configuration],    // 加载配置工厂 / Load configuration factory
  validationSchema,         // Joi 校验 / Joi validation
  envFilePath: ['.env'],    // 环境变量文件 / Environment file path
}),
```

**使用 ConfigService 读取配置 / Reading Config with ConfigService:**
```typescript
const port = configService.get<number>('app.port', 3000);   // 嵌套读取 / Nested access
const secret = configService.get<string>('jwt.secret');
```

**English:**
`ConfigModule` is NestJS's official configuration management module. It loads `.env` files, provides `ConfigService` for reading configuration values, and supports validation at startup using Joi schemas. The configuration factory function groups related settings (app, database, jwt, log) into a structured object. Joi validation ensures required environment variables are present and have correct types before the application starts -- this prevents runtime crashes caused by misconfiguration. Setting `isGlobal: true` makes `ConfigService` available throughout the application without importing the module in every feature module.

---

#### 文件上传 / File Upload

**中文：**
NestJS 使用 `multer` 中间件处理文件上传，通过 `FileInterceptor` 拦截器简化配置。`ParseFilePipe` 配合验证器可以实现文件类型和大小的校验。

来源文件 / Source: `07-exception-logger-config/src/demo/demo.controller.ts`

```typescript
@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        // 时间戳 + 随机数 + 原扩展名，避免文件名冲突
        // Timestamp + random + original extension to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
  }),
)
uploadFile(
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        new MaxFileSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB
          message: '文件大小不能超过 5MB',
        }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  return {
    code: 200,
    message: '文件上传成功',
    data: {
      originalName: file.originalname,
      fileName: file.filename,
      size: file.size,
      url: `/uploads/${file.filename}`,
    },
  };
}
```

**文件上传安全提示 / File Upload Security Tips:**
- 始终验证文件类型（检查 MIME 类型和文件扩展名）/ Always validate file type (check both MIME type and extension)
- 限制文件大小，防止 DoS 攻击 / Limit file size to prevent DoS attacks
- 使用随机文件名，防止路径遍历攻击 / Use random filenames to prevent path traversal
- 将上传文件存储在非公开目录，通过受控的 API 提供访问 / Store uploads in non-public directories, serve via controlled APIs
- 考虑使用 CDN 或对象存储（如 AWS S3）存储生产环境文件 / Consider CDN or object storage (e.g., AWS S3) for production files

**English:**
NestJS handles file uploads using `multer` middleware, simplified through the `FileInterceptor` decorator. `ParseFilePipe` combined with `FileTypeValidator` and `MaxFileSizeValidator` provides file type and size validation. The `diskStorage` configuration allows custom file naming with timestamps and random suffixes to prevent filename collisions. Security best practices include always validating file types, limiting file sizes, using random filenames, and storing uploads in non-public directories.

---

### 项目 08: 中间件、拦截器与管道深入 / Project 08: Middleware, Interceptors & Pipes Deep Dive

#### 限流中间件 / Rate Limiting Middleware

**中文：**
限流是保护 API 免受滥用的重要手段。本项目实现了一个基于内存的固定窗口限流中间件。其核心思路是：用一个 Map 记录每个 IP 在时间窗口内的请求次数，超过阈值则返回 429 Too Many Requests。

来源文件 / Source: `08-middleware-interceptor-pipe/src/middleware/rate-limit.middleware.ts`

```typescript
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 60 * 1000; // 1 分钟窗口 / 1-minute window
  private readonly maxRequests = 100;     // 最大请求数 / Max requests per window
  private readonly store = new Map<string, RateLimitRecord>();

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = this.store.get(clientIp);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.store.set(clientIp, record);
    }

    record.count++;

    // 设置限流响应头 / Set rate limit headers
    const remaining = Math.max(0, this.maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      throw new HttpException(
        { code: 429, message: `请求过于频繁，请在 ${retryAfter} 秒后重试` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
```

**中间件注册 / Middleware Registration:**

来源文件 / Source: `08-middleware-interceptor-pipe/src/app.module.ts`

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET }) // 排除健康检查
      .forRoutes('*');
  }
}
```

**生产环境改进 / Production Improvements:**
- 使用 Redis 替代内存 Map，支持多实例部署 / Use Redis instead of in-memory Map for multi-instance deployments
- 使用 `@nestjs/throttler` 官方限流模块 / Use the official `@nestjs/throttler` module
- 结合用户 ID 进行限流（不仅仅是 IP）/ Rate limit by user ID in addition to IP
- 实现滑动窗口算法替代固定窗口 / Implement sliding window algorithm instead of fixed window

**English:**
Rate limiting is crucial for protecting APIs from abuse. This project implements an in-memory fixed-window rate limiting middleware. It uses a Map to track request counts per IP within a time window, returning 429 Too Many Requests when the threshold is exceeded. Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`) inform clients about their current quota. In production, replace the in-memory Map with Redis for multi-instance support and use the official `@nestjs/throttler` module.

---

#### 缓存拦截器 / Cache Interceptor

**中文：**
缓存拦截器利用 RxJS 的 `of()` 操作符在缓存命中时跳过控制器方法执行，直接返回缓存数据。它只对 GET 请求生效（幂等操作），写操作（POST/PUT/DELETE）不受影响。

来源文件 / Source: `08-middleware-interceptor-pipe/src/interceptors/cache.interceptor.ts`

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  expiry: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttl = 60 * 1000; // 60 秒 TTL / 60-second TTL

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // 只缓存 GET 请求 / Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = request.originalUrl; // URL + 查询参数作为 key
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      // 缓存命中：of() 创建一个立即完成的 Observable，跳过 Controller
      // Cache hit: of() creates an immediately-completing Observable, skipping the Controller
      return of(cached.data);
    }

    // 缓存未命中：执行 Controller 并将结果存入缓存
    // Cache miss: execute Controller and store result in cache
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, { data, expiry: Date.now() + this.ttl });
      }),
    );
  }
}
```

**RxJS 要点 / RxJS Key Points:**
- `of(data)`: 创建一个立即发出 `data` 并完成的 Observable / Creates an Observable that immediately emits `data` and completes
- `tap(callback)`: 在数据流通过时执行副作用（不修改数据）/ Executes a side effect as data flows through (does not modify data)
- 拦截器必须返回 Observable / Interceptors must return an Observable

**English:**
The cache interceptor leverages RxJS's `of()` operator to return cached data directly when a cache hit occurs, completely bypassing controller execution. It only applies to GET requests (idempotent operations). The cache key is generated from the full URL including query parameters. The `tap()` operator stores responses in the cache as they flow through. In production, replace the in-memory Map with Redis and use the official `@nestjs/cache-manager` module with proper cache invalidation strategies.

---

#### 序列化拦截器 / Serialize Interceptor

**中文：**
序列化拦截器使用 `class-transformer` 库将控制器返回的数据转换为指定的 DTO 类型。通过在 DTO 上使用 `@Exclude()` 和 `@Expose()` 装饰器，可以精确控制哪些字段出现在 API 响应中。

来源文件 / Source: `08-middleware-interceptor-pipe/src/interceptors/serialize.interceptor.ts`

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassConstructor, plainToInstance } from 'class-transformer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<any>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // plainToInstance 将响应数据转为 DTO 类实例
        // excludeExtraneousValues: true 时只保留 @Expose() 标记的字段
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: false,
        });
      }),
    );
  }
}
```

**使用方式 / Usage:**
```typescript
// DTO 定义 / DTO definition
class UserResponseDto {
  @Expose() id: number;
  @Expose() username: string;
  @Expose() email: string;
  @Exclude() password: string;  // 永远不会出现在响应中 / Never appears in response
}

// 控制器中使用 / In controller
@UseInterceptors(new SerializeInterceptor(UserResponseDto))
@Get('profile')
getProfile() { ... }
```

**English:**
The serialize interceptor uses the `class-transformer` library to transform controller responses into specified DTO types. By using `@Exclude()` and `@Expose()` decorators on DTO fields, you can precisely control which fields appear in API responses. This is essential for hiding sensitive fields like passwords or internal IDs from API consumers. The `plainToInstance()` function converts plain objects into class instances, applying the decorator-based transformation rules.

---

#### 自定义管道集锦 / Custom Pipes Collection

**中文：**
管道（Pipe）有两个主要用途：转换和验证。NestJS 内置了 `ParseIntPipe`、`ParseUUIDPipe`、`ValidationPipe` 等，但实际项目中经常需要自定义管道来处理特殊需求。

**TrimPipe -- 去除字符串前后空格 / TrimPipe -- Trim Whitespace:**

来源文件 / Source: `08-middleware-interceptor-pipe/src/pipes/trim.pipe.ts`

```typescript
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    return this.trimObject(value);
  }

  private trimObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimObject(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const trimmed: any = {};
      for (const key of Object.keys(obj)) {
        trimmed[key] = this.trimObject(obj[key]);
      }
      return trimmed;
    }
    if (typeof obj === 'string') {
      return obj.trim();
    }
    return obj;
  }
}
```

**ParseUuidPipe -- UUID 格式验证 / ParseUuidPipe -- UUID Validation:**

```typescript
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  transform(value: string): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(
        `"${value}" 不是有效的 UUID 格式。` +
        `正确格式: 550e8400-e29b-41d4-a716-446655440000`,
      );
    }
    return value.toLowerCase();
  }
}
```

**DefaultValuePipe -- 查询参数默认值 / DefaultValuePipe -- Query Parameter Defaults:**

```typescript
@Injectable()
export class DefaultValuePipe implements PipeTransform {
  constructor(private readonly defaultValue: any, private readonly toNumber: boolean = false) {}

  transform(value: any) {
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }
    if (this.toNumber) {
      const num = Number(value);
      return isNaN(num) ? this.defaultValue : num;
    }
    return value;
  }
}
```

**使用示例 / Usage Example:**
```typescript
@Get()
findAll(
  @Query('page', new DefaultValuePipe(1, true)) page: number,
  @Query('limit', new DefaultValuePipe(10, true)) limit: number,
) { ... }
// GET /items          → page=1, limit=10
// GET /items?page=3   → page=3, limit=10
```

**English:**
Pipes serve two main purposes: transformation and validation. This project demonstrates three custom pipes: **TrimPipe** recursively trims whitespace from all string values in request bodies (preventing issues like `"  admin  "` usernames), **ParseUuidPipe** validates UUID format and normalizes to lowercase, and **DefaultValuePipe** provides default values for missing query parameters with optional type conversion to numbers.

---

#### Middleware vs Guard vs Interceptor: 何时用哪个？/ When to Use What?

**中文：**

| 特性 / Feature | Middleware | Guard | Interceptor |
|---|---|---|---|
| 执行时机 / Timing | 最先执行 / Runs first | Middleware 之后 / After middleware | Guard 之后 / After guards |
| 能否访问路由元数据 / Route metadata | 不能 / No | 能（Reflector）/ Yes | 能（Reflector）/ Yes |
| 能否操作响应 / Modify response | 不能 / No | 不能 / No | 能（map/tap）/ Yes |
| 能否终止请求 / Terminate request | 能（next 不调用）/ Yes | 能（返回 false）/ Yes | 能（of(empty)）/ Yes |
| 适用场景 / Use cases | CORS, 日志, 限流 | 认证, 授权 | 缓存, 序列化, 重试 |

**决策矩阵 / Decision Matrix:**
- 需要处理请求体解析之前的逻辑？ --> **Middleware** / Logic before body parsing? --> **Middleware**
- 需要决定是否允许访问某个路由？ --> **Guard** / Need to decide route access? --> **Guard**
- 需要在响应返回前修改数据？ --> **Interceptor** / Need to modify response data? --> **Interceptor**
- 需要转换或验证输入参数？ --> **Pipe** / Need to transform or validate input? --> **Pipe**

**NestJS 请求生命周期完整流程 / Full NestJS Request Lifecycle:**
```
请求 Request
  → Middleware（全局 → 模块级）
    → Guard（全局 → 控制器级 → 方法级）
      → Interceptor（前置逻辑 before handle）
        → Pipe（参数转换和验证）
          → Controller 方法执行
        → Interceptor（后置逻辑 after handle，操作 Observable）
      → ExceptionFilter（如果有异常）
    → Response 响应
```

**English:**
Understanding when to use Middleware, Guards, Interceptors, or Pipes is crucial for writing clean NestJS code. Middleware runs first and is ideal for generic request processing (CORS, logging, rate limiting). Guards run after middleware and specialize in authentication and authorization decisions. Interceptors can modify both the incoming request and outgoing response, making them perfect for caching, serialization, and retry logic. Pipes handle input transformation and validation. The full request lifecycle flows through these layers in order, with ExceptionFilter catching any errors along the way.

---

### 项目 09: Swagger 文档 / Project 09: Swagger Documentation

#### OpenAPI/Swagger 概念

**中文：**
OpenAPI 规范（前身为 Swagger）是描述 RESTful API 的行业标准。它用 JSON 或 YAML 格式定义 API 的所有信息：端点路径、请求方法、参数、请求体、响应格式、认证方式等。Swagger UI 是 OpenAPI 规范的可视化工具，将 JSON 规范渲染为交互式的 HTML 页面。

**为什么需要自动生成文档 / Why Auto-Generate Documentation:**
- 手动维护的文档总是过时 / Manually maintained documentation is always outdated
- 代码即文档，装饰器与实现保持同步 / Code-as-documentation: decorators stay in sync with implementation
- 前端开发者可以自助探索 API / Frontend developers can explore APIs independently
- QA 可以直接在 Swagger UI 中测试接口 / QA can test endpoints directly in Swagger UI
- 新团队成员可以快速理解系统接口 / New team members can quickly understand system endpoints

**English:**
The OpenAPI Specification (formerly Swagger) is the industry standard for describing RESTful APIs. It defines everything about an API in JSON or YAML format: endpoint paths, HTTP methods, parameters, request bodies, response formats, and authentication methods. Swagger UI is a visualization tool that renders the JSON specification into an interactive HTML page. Auto-generating documentation from code decorators ensures the documentation always matches the actual implementation, eliminating the common problem of outdated API docs.

---

#### DocumentBuilder 配置

**中文：**
`DocumentBuilder` 使用建造者模式（Builder Pattern）配置 OpenAPI 文档的基础元数据。

来源文件 / Source: `09-swagger-docs/src/main.ts`

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const swaggerConfig = new DocumentBuilder()
  .setTitle('电商 API 文档')                     // 文档标题 / Document title
  .setDescription('## 电商系统 RESTful API\n...') // 描述（支持 Markdown）/ Description (Markdown)
  .setVersion('1.0')                              // API 版本 / API version
  .addTag('商品管理', '商品的增删改查接口')         // 标签 / Tags
  .addTag('用户管理', '用户注册和信息查询接口')
  .addTag('订单管理', '订单创建、查询和状态管理接口')
  .addBearerAuth({                                // Bearer Token 认证 / Bearer Token auth
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: '请输入 JWT Token',
  })
  .setContact('API 支持团队', 'https://example.com', 'support@example.com')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3000', '本地开发服务器')
  .build();

const document = SwaggerModule.createDocument(app, swaggerConfig);

SwaggerModule.setup('api-docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,       // 刷新页面后保留 Token / Persist token after refresh
    docExpansion: 'list',            // 默认展开到列表级别 / Default expand to list level
    tagsSorter: 'alpha',             // 按字母排序标签 / Sort tags alphabetically
    displayRequestDuration: true,    // 显示请求耗时 / Display request duration
    filter: true,                    // 启用搜索过滤 / Enable search filter
  },
  customCss: '.swagger-ui .topbar { display: none }', // 隐藏默认顶部栏 / Hide default top bar
  customSiteTitle: '电商 API 文档',                    // 自定义页面标题 / Custom page title
});
```

**访问地址 / Access URLs:**
- Swagger UI: `http://localhost:3000/api-docs`
- JSON 规范 / JSON spec: `http://localhost:3000/api-docs-json`
- YAML 规范 / YAML spec: `http://localhost:3000/api-docs-yaml`

**English:**
`DocumentBuilder` uses the Builder Pattern to configure OpenAPI document metadata including title, description, version, tags, authentication scheme, contact information, and license. The `SwaggerModule.setup()` method mounts the Swagger UI at a specified route prefix with customizable options. Key options include `persistAuthorization` (keeps the Bearer token after page refresh), `docExpansion` (controls default expansion level), and `displayRequestDuration` (shows response time). The document is also available in raw JSON and YAML formats for code generation tools.

---

#### 装饰器详解 / Decorator Reference

**中文：**
NestJS Swagger 模块提供了一系列装饰器，用于从代码中提取 API 文档信息。

**控制器级装饰器 / Controller-Level Decorators:**

来源文件 / Source: `09-swagger-docs/src/products/products.controller.ts`

```typescript
@ApiTags('商品管理')     // 分组标签 / Group tag
@ApiBearerAuth()         // 需要 Bearer Token / Requires Bearer Token
@Controller('products')
export class ProductsController {

  @Get()
  @ApiOperation({
    summary: '获取商品列表',           // 简短摘要 / Short summary
    description: '支持分页、排序和分类筛选', // 详细描述 / Detailed description
  })
  @ApiResponse({ status: 200, description: '查询成功', type: [ProductEntity] })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['电子产品', '服装', '食品', '图书', '家居', '其他'],
  })
  findAll(@Query() paginationDto: PaginationDto) { ... }

  @Get(':id')
  @ApiParam({ name: 'id', description: '商品 ID', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '商品信息', type: ProductEntity })
  @ApiResponse({ status: 404, description: '商品不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) { ... }
}
```

**DTO 级装饰器 / DTO-Level Decorators:**

来源文件 / Source: `09-swagger-docs/src/products/dto/create-product.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: '商品名称，必填',
    example: 'iPhone 15 Pro Max 256GB',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '商品描述，支持 HTML 格式',
    example: '全新 A17 Pro 芯片，钛金属设计',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '商品价格（元），精确到分',
    example: 9999.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: '商品分类',
    example: '电子产品',
    enum: ['电子产品', '服装', '食品', '图书', '家居', '其他'],
  })
  category: string;

  @ApiPropertyOptional({
    description: '商品图片 URL 列表',
    example: ['https://example.com/img1.jpg'],
    type: [String],
  })
  images?: string[];
}
```

**装饰器速查表 / Decorator Quick Reference:**

| 装饰器 / Decorator | 位置 / Location | 用途 / Purpose |
|---|---|---|
| `@ApiTags()` | Controller | 接口分组 / Group endpoints |
| `@ApiOperation()` | Method | 接口描述 / Describe endpoint |
| `@ApiResponse()` | Method | 响应格式 / Response format |
| `@ApiParam()` | Method | URL 路径参数 / URL path parameters |
| `@ApiQuery()` | Method | 查询参数 / Query parameters |
| `@ApiBearerAuth()` | Controller/Method | Bearer Token 认证 / Bearer auth |
| `@ApiProperty()` | DTO field | 字段描述 / Field description |
| `@ApiPropertyOptional()` | DTO field | 可选字段 / Optional field |

**English:**
NestJS Swagger decorators extract API documentation directly from code. Controller-level decorators like `@ApiTags()` and `@ApiBearerAuth()` set metadata for entire controller groups. Method-level decorators like `@ApiOperation()`, `@ApiResponse()`, `@ApiParam()`, and `@ApiQuery()` describe individual endpoints. DTO-level decorators `@ApiProperty()` and `@ApiPropertyOptional()` document request/response schemas with examples, types, and validation constraints. This decorator-based approach ensures documentation stays synchronized with the actual API implementation.

---

#### 自定义 Swagger 装饰器 / Custom Swagger Decorators

**中文：**
当多个接口共享相同的响应格式时，可以封装自定义装饰器来减少重复代码。`applyDecorators` 函数将多个装饰器合并为一个。

来源文件 / Source: `09-swagger-docs/src/common/decorators/api-response.decorator.ts`

```typescript
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

// 标准响应格式装饰器 / Standard response format decorator
export function ApiStandardResponse<T extends Type<any>>(
  statusCode: number,
  description: string,
  dataType?: T,
) {
  const decorators = [
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        type: 'object',
        properties: {
          code: { type: 'number', example: statusCode },
          message: { type: 'string', example: description },
          data: dataType ? { $ref: getSchemaPath(dataType) } : { type: 'object' },
        },
      },
    }),
  ];
  if (dataType) {
    decorators.push(ApiExtraModels(dataType) as any);
  }
  return applyDecorators(...decorators);
}

// 分页响应装饰器 / Paginated response decorator
export function ApiPaginatedResponse<T extends Type<any>>(
  description: string,
  dataType: T,
) {
  return applyDecorators(
    ApiExtraModels(dataType),
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: getSchemaPath(dataType) } },
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
  );
}
```

**使用方式 / Usage:**
```typescript
@Get()
@ApiPaginatedResponse('商品列表查询成功', ProductEntity)
findAll() { ... }

@Get(':id')
@ApiStandardResponse(200, '商品详情', ProductEntity)
findOne() { ... }
```

**English:**
When multiple endpoints share the same response format, custom Swagger decorators can reduce repetitive code. Using `applyDecorators()` from NestJS, you can compose multiple Swagger decorators into a single reusable decorator. The `ApiStandardResponse` decorator wraps responses in a unified `{ code, message, data }` format, while `ApiPaginatedResponse` generates documentation for paginated list endpoints with `items`, `total`, `page`, and `limit` fields. The `getSchemaPath()` utility creates proper `$ref` references to entity schemas.

---

#### Swagger UI 自定义 / Customizing Swagger UI

**中文：**
Swagger UI 提供了丰富的自定义选项，可以通过 `swaggerOptions` 和 `customCss` 进行调整。

**常用自定义选项 / Common Customization Options:**

| 选项 / Option | 说明 / Description | 推荐值 / Recommended |
|---|---|---|
| `persistAuthorization` | 刷新后保留 Token / Persist token after refresh | `true` |
| `docExpansion` | 默认展开级别 / Default expansion | `'list'` |
| `displayRequestDuration` | 显示请求耗时 / Show request duration | `true` |
| `filter` | 搜索过滤 / Search filter | `true` |
| `tagsSorter` | 标签排序 / Tag sorting | `'alpha'` |
| `operationsSorter` | 操作排序 / Operation sorting | `'alpha'` |

**自定义 CSS 示例 / Custom CSS Examples:**
```typescript
customCss: `
  .swagger-ui .topbar { display: none }          /* 隐藏顶部栏 / Hide top bar */
  .swagger-ui .info { margin: 20px 0 }           /* 调整信息区间距 / Adjust info spacing */
  .swagger-ui .scheme-container { display: none } /* 隐藏 scheme 选择器 / Hide scheme selector */
`
```

**English:**
Swagger UI provides extensive customization through `swaggerOptions` and `customCss`. Key options include `persistAuthorization` for keeping the Bearer token across page refreshes, `docExpansion` to control the default fold state (`'list'` shows endpoints grouped but collapsed, `'full'` expands everything, `'none'` collapses all), and `displayRequestDuration` to show response times. Custom CSS can hide unwanted UI elements, adjust spacing, and match your organization's branding.

---

### 阶段总结 / Stage Summary

**中文：**
恭喜你完成了第二阶段的学习！让我们回顾一下你掌握的核心能力：

**项目 05 - JWT 认证：**
- 理解 JWT 的三段式结构（Header.Payload.Signature）和签名验证原理
- 掌握 Passport.js 的策略模式（JwtStrategy、LocalStrategy）
- 学会使用 bcrypt 安全地存储和验证密码
- 能够配置 JwtModule 并使用 AuthGuard 保护路由

**项目 06 - RBAC 权限控制：**
- 理解 RBAC 模型中角色和权限的关系
- 能够使用 `SetMetadata` 和 `Reflector` 创建自定义装饰器和守卫
- 掌握 `@Roles()`、`@CurrentUser()`、`@Public()` 等实用装饰器的实现
- 理解多层权限控制（Guard 层 + Service 层所有权检查）

**项目 07 - 异常处理、日志与配置：**
- 能够创建统一的异常过滤器处理 HttpException 和业务异常
- 掌握 Winston 日志系统的配置（多 Transport、日志轮转、分级存储）
- 学会使用 ConfigModule + Joi 管理环境变量
- 理解文件上传的完整流程（multer + ParseFilePipe）

**项目 08 - 中间件、拦截器与管道：**
- 能够实现限流中间件（固定窗口算法）
- 掌握缓存拦截器的实现（RxJS of/tap）
- 理解序列化拦截器（class-transformer）
- 能够创建自定义管道（TrimPipe、ParseUuidPipe、DefaultValuePipe）
- 清楚 Middleware/Guard/Interceptor/Pipe 的职责边界和使用场景

**项目 09 - Swagger 文档：**
- 掌握 DocumentBuilder 配置和 SwaggerModule.setup()
- 熟练使用 @ApiTags、@ApiOperation、@ApiResponse、@ApiProperty 等装饰器
- 能够封装自定义 Swagger 装饰器减少重复代码
- 理解 Swagger UI 的自定义选项

**下一步：** 进入第三阶段（进阶能力篇），你将学习缓存与队列、自动化测试、微服务架构和 GraphQL。

**English:**
Congratulations on completing Stage 2! Here is a summary of the core capabilities you have mastered:

- **Project 05 (JWT Auth):** JWT structure and verification, Passport.js strategy pattern, bcrypt password hashing, JwtModule configuration, and route protection with AuthGuard.
- **Project 06 (RBAC):** Role-based access control model, custom decorators with SetMetadata/Reflector, guard chains (JwtAuthGuard + RolesGuard), and ownership checking in the service layer.
- **Project 07 (Exception/Logger/Config):** Unified exception filters, Winston logging with multiple transports, ConfigModule with Joi validation, and file upload with multer.
- **Project 08 (Middleware/Interceptor/Pipe):** Rate limiting middleware, caching interceptor with RxJS, serialization with class-transformer, custom pipes collection, and clear understanding of when to use each layer.
- **Project 09 (Swagger):** DocumentBuilder configuration, comprehensive decorator usage, custom Swagger decorators for reusable response formats, and Swagger UI customization.

**Next:** Proceed to Stage 3 (Advanced Capabilities) where you will learn caching and queues, automated testing, microservice architecture, and GraphQL.

---

> **学习建议 / Study Tips:**
> 1. 每个项目都动手跑一遍，不要只看代码 / Run every project hands-on, do not just read the code
> 2. 尝试修改代码观察效果变化 / Try modifying code and observe the effects
> 3. 用 Postman 或 Swagger UI 测试每个接口 / Test every endpoint with Postman or Swagger UI
> 4. 用自己的话写出每个概念的解释 / Write explanations of each concept in your own words
> 5. 遇到不理解的地方，查阅 NestJS 官方文档 / When confused, consult the NestJS official documentation
