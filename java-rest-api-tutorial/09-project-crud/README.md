# 第 09 章：CRUD 功能实现

> 本章是项目实战的核心。我们将实现完整的任务管理 CRUD 功能，贯通 Router → Handler → Service → DAO 全链路。

## 学习目标

- 实现完整的路由分发机制
- 逐层实现 Handler、Service、DAO
- 掌握 RESTful API 的 CRUD 全链路
- 学会 JSON 序列化与反序列化（Jackson）

## 架构全览

```
HTTP 请求
  ↓
Router (路由匹配 + 参数提取)
  ↓
TaskHandler (请求解析 + 响应构建)
  ↓
TaskService (业务逻辑 + 数据校验)
  ↓
TaskDao (数据库操作)
  ↓
SQLite
```

## API 接口

| 方法 | 路径 | 说明 | 状态码 |
|------|------|------|--------|
| GET | /api/tasks | 获取任务列表 | 200 |
| GET | /api/tasks/:id | 获取单个任务 | 200 / 404 |
| POST | /api/tasks | 创建任务 | 201 / 400 |
| PUT | /api/tasks/:id | 更新任务 | 200 / 404 |
| DELETE | /api/tasks/:id | 删除任务 | 200 / 404 |

## 示例代码

| 文件 | 说明 |
|------|------|
| `Router.java` | 路由器：路径匹配、方法分发、参数提取 |
| `TaskHandler.java` | 处理器：请求解析、调用 Service、构建响应 |
| `TaskService.java` | 服务层：业务逻辑、参数校验 |
| `TaskDao.java` | 数据层：JDBC 增删改查 |

## 测试

```bash
# 获取所有任务
curl http://localhost:8080/api/tasks

# 获取单个任务
curl http://localhost:8080/api/tasks/1

# 创建任务
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"新任务","priority":3}'

# 更新任务
curl -X PUT http://localhost:8080/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新后的标题","completed":true}'

# 删除任务
curl -X DELETE http://localhost:8080/api/tasks/1
```

## 下一章

[10 - 项目进阶功能 →](../10-project-advanced/)
