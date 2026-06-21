# 第 10 章：项目进阶功能

> 在基础 CRUD 之上，本章为项目添加过滤器链、JWT 认证和全局异常处理等企业级功能。

## 学习目标

- 实现 Filter 链模式（类似 Servlet Filter）
- 理解并实现 JWT 认证机制
- 构建全局异常处理器
- 实现分页查询

## 功能概览

### 过滤器链

```
请求 → CorsFilter → AuthFilter → LoggingFilter → Handler → 响应
```

每个过滤器可以：
- 修改请求/响应
- 拦截请求（如认证失败返回 401）
- 记录日志

### JWT 认证

无需引入 JWT 库，使用纯 Java 实现简单的 Token 机制：
- 登录获取 Token
- 请求携带 `Authorization: Bearer <token>` 头
- AuthFilter 验证 Token

## 示例代码

| 文件 | 说明 |
|------|------|
| `Filter.java` | 过滤器接口 |
| `FilterChain.java` | 过滤器链实现 |
| `CorsFilter.java` | 跨域请求处理 |
| `AuthFilter.java` | JWT 认证过滤器 |
| `GlobalExceptionHandler.java` | 全局异常处理 |
| `ApiException.java` | 自定义业务异常 |

## 测试

```bash
# 登录获取 Token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 使用 Token 访问 API
curl http://localhost:8080/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 下一章

[11 - 并发编程 →](../11-concurrency/)
