# 09-swagger-docs - Swagger/OpenAPI 自动文档生成

## 项目简介

本项目演示如何使用 `@nestjs/swagger` 为 NestJS 应用自动生成 OpenAPI 文档。以一个完整的电商 API（商品、用户、订单）为例，展示各种 Swagger 装饰器的使用方式。

## 知识点

### Swagger 装饰器体系

| 装饰器                | 用途                          | 应用位置        |
|----------------------|-------------------------------|----------------|
| `@ApiTags()`         | 对接口进行分组                  | Controller     |
| `@ApiOperation()`    | 描述接口的功能和用途             | 方法           |
| `@ApiResponse()`     | 描述可能的响应格式               | 方法           |
| `@ApiProperty()`     | 描述 DTO/Entity 的属性         | DTO 字段       |
| `@ApiParam()`        | 描述 URL 路径参数               | 方法           |
| `@ApiQuery()`        | 描述查询参数                    | 方法           |
| `@ApiBody()`         | 描述请求体格式                   | 方法           |
| `@ApiBearerAuth()`   | 标记需要 Bearer Token 认证      | Controller/方法|
| `@ApiHeader()`       | 描述自定义请求头                 | Controller/方法|

### DocumentBuilder 配置

```typescript
new DocumentBuilder()
  .setTitle('API 标题')
  .setDescription('API 描述')
  .setVersion('1.0')
  .addTag('分组标签')
  .addBearerAuth()  // 添加 Bearer Token 认证
  .build()
```

### class-validator + Swagger 联动

当 DTO 同时使用 class-validator 和 @ApiProperty 时：
- class-validator 负责运行时验证
- @ApiProperty 负责文档展示
- 两者互补，确保 API 文档与实际行为一致

## 运行步骤

```bash
pnpm install
pnpm start:dev
```

## 访问文档

启动后访问以下地址：
- Swagger UI: http://localhost:3000/api-docs
- JSON 格式规范: http://localhost:3000/api-docs-json
- YAML 格式规范: http://localhost:3000/api-docs-yaml

## 导出 OpenAPI 规范

```bash
# 导出 JSON
curl http://localhost:3000/api-docs-json > openapi.json

# 导出 YAML
curl http://localhost:3000/api-docs-yaml > openapi.yaml
```

导出的规范可以导入到：
- Postman (Import → OpenAPI)
- Insomnia
- Apifox
- Stoplight

## 项目结构

```
src/
├── common/
│   ├── decorators/
│   │   └── api-response.decorator.ts  # 自定义响应装饰器
│   └── dto/
│       └── pagination.dto.ts          # 分页 DTO（含 Swagger 文档）
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts      # 创建商品 DTO（含验证 + 文档）
│   │   └── update-product.dto.ts      # 更新商品 DTO
│   ├── entities/
│   │   └── product.entity.ts          # 商品实体（含文档）
│   ├── products.controller.ts         # 商品控制器（完整 Swagger 标注）
│   ├── products.service.ts            # 商品服务
│   └── products.module.ts             # 商品模块
├── users/
│   ├── dto/
│   │   └── create-user.dto.ts         # 创建用户 DTO
│   ├── users.controller.ts            # 用户控制器
│   ├── users.service.ts               # 用户服务
│   └── users.module.ts                # 用户模块
├── orders/
│   ├── dto/
│   │   └── create-order.dto.ts        # 创建订单 DTO
│   ├── orders.controller.ts           # 订单控制器
│   ├── orders.service.ts              # 订单服务
│   └── orders.module.ts               # 订单模块
├── app.module.ts                      # 根模块
└── main.ts                            # 入口（Swagger 配置）
```

## Swagger 最佳实践

1. **每个 DTO 字段都加 @ApiProperty** - 包含 description 和 example
2. **每个接口都加 @ApiOperation** - 清晰的中文描述
3. **使用 @ApiResponse 描述多种响应** - 成功和失败情况
4. **DTO 复用** - 使用 PartialType、PickType 减少重复
5. **统一响应格式** - 使用自定义装饰器封装标准响应结构
