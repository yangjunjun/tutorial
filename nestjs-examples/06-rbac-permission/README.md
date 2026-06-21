# 06-rbac-permission - RBAC 权限控制示例

## 项目简介

本项目在 JWT 认证基础上实现基于角色的访问控制（RBAC - Role-Based Access Control）。通过自定义装饰器、守卫和 Reflector 的配合，构建灵活的权限管理系统。

## 知识点

- **RBAC 模式**：角色 → 权限映射，用户通过角色获取操作权限
- **自定义装饰器**：
  - `@Roles()` - 使用 `SetMetadata` 设置路由所需角色
  - `@CurrentUser()` - 使用 `createParamDecorator` 提取当前用户
  - `@Public()` - 标记公开路由（跳过认证）
- **Reflector 反射器**：在守卫中读取装饰器设置的元数据
- **RolesGuard**：自定义守卫实现角色检查逻辑
- **角色层级**：ADMIN > MERCHANT > USER

## RBAC 核心三角

```
@Roles('ADMIN')  →  SetMetadata  →  元数据存储在路由上
                                       ↓
RolesGuard     →  Reflector    →  读取元数据 + 检查 user.role
```

1. **装饰器**：在路由上标记所需的角色
2. **Reflector**：在运行时读取路由上的元数据
3. **Guard**：根据元数据和用户角色决定是否放行

## 角色权限矩阵

| 操作         | USER | MERCHANT | ADMIN |
|-------------|------|----------|-------|
| 浏览商品     |   Y  |    Y     |   Y   |
| 创建商品     |   N  |    Y     |   Y   |
| 编辑商品     |   N  | 仅自己   |  全部  |
| 删除商品     |   N  |    N     |   Y   |

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

### 注册不同角色的用户
```bash
# 注册普通用户
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456","email":"user@test.com","role":"USER"}'

# 注册商家
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"merchant1","password":"123456","email":"merchant@test.com","role":"MERCHANT"}'

# 注册管理员
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"123456","email":"admin@test.com","role":"ADMIN"}'
```

### 登录获取 Token
```bash
# 登录商家（获取 merchant_token）
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"merchant1","password":"123456"}'
```

### 商品操作（需要不同角色 Token）
```bash
# 浏览商品（任何登录用户）
curl http://localhost:3000/products \
  -H "Authorization: Bearer <token>"

# 创建商品（仅 MERCHANT 和 ADMIN）
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <merchant_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"iPhone 15","description":"新款手机","price":6999,"stock":100}'

# 更新商品（MERCHANT 只能更新自己的，ADMIN 可以更新所有）
curl -X PUT http://localhost:3000/products/1 \
  -H "Authorization: Bearer <merchant_token>" \
  -H "Content-Type: application/json" \
  -d '{"price":5999}'

# 删除商品（仅 ADMIN）
curl -X DELETE http://localhost:3000/products/1 \
  -H "Authorization: Bearer <admin_token>"

# 公开路由（无需认证）
curl http://localhost:3000/products/public
```

## 项目结构

```
src/
├── auth/
│   ├── decorators/
│   │   ├── roles.decorator.ts       # @Roles() 角色装饰器
│   │   └── current-user.decorator.ts # @CurrentUser() 用户装饰器
│   ├── guards/
│   │   └── jwt-auth.guard.ts        # JWT 认证守卫
│   ├── strategies/
│   │   └── jwt.strategy.ts          # JWT 策略
│   ├── dto/
│   │   ├── register.dto.ts          # 注册 DTO（含角色）
│   │   └── login.dto.ts             # 登录 DTO
│   ├── auth.service.ts              # 认证服务
│   ├── auth.controller.ts           # 认证控制器
│   └── auth.module.ts               # 认证模块
├── decorators/
│   └── public.decorator.ts          # @Public() 公开装饰器
├── guards/
│   └── roles.guard.ts               # 角色守卫
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts    # 创建商品 DTO
│   │   └── update-product.dto.ts    # 更新商品 DTO
│   ├── products.controller.ts       # 商品控制器（含权限控制）
│   ├── products.service.ts          # 商品服务
│   └── products.module.ts           # 商品模块
├── prisma/
│   ├── prisma.service.ts            # Prisma 服务
│   └── prisma.module.ts             # Prisma 模块
├── app.module.ts                    # 根模块
└── main.ts                          # 入口
```
