# Java 实战教程：从零构建 RESTful API 服务

> 面向有编程基础的开发者，通过纯 Java（不依赖 Spring 等框架）构建一个完整的任务管理 REST API 项目，系统掌握 Java 核心知识。

## 技术栈

- Java 17+（语言核心）
- com.sun.net.httpserver（内置 HTTP 服务器）
- Jackson（JSON 序列化/反序列化）
- SQLite + JDBC（数据库持久化）
- JUnit 5（单元测试）
- Maven（项目构建管理）

## 教程大纲

### 第一阶段：Java 基础快览

| 章节 | 目录 | 内容概要 |
|------|------|---------|
| 01 | [Java 快速入门](01-java-quickstart/) | 变量与类型、控制流、方法、字符串处理 |
| 02 | [面向对象编程](02-oop/) | 类与对象、继承、接口、多态、封装 |
| 03 | [集合与泛型](03-collections/) | List/Set/Map、泛型、迭代器、常用模式 |

### 第二阶段：Java 核心能力

| 章节 | 目录 | 内容概要 |
|------|------|---------|
| 04 | [异常处理与 IO](04-exception-io/) | 异常体系、try-with-resources、文件读写、JSON 处理 |
| 05 | [函数式编程](05-functional/) | Lambda、Stream API、Optional、函数式接口 |
| 06 | [HTTP 服务器基础](06-http-server/) | HttpServer API、请求/响应模型、路由设计 |

### 第三阶段：数据与项目

| 章节 | 目录 | 内容概要 |
|------|------|---------|
| 07 | [JDBC 数据库操作](07-jdbc/) | 连接管理、CRUD 操作、PreparedStatement、连接池 |
| 08 | [项目搭建](08-project-setup/) | Maven 项目结构、分层架构设计、模型类、服务器启动 |

### 第四阶段：项目实战

| 章节 | 目录 | 内容概要 |
|------|------|---------|
| 09 | [CRUD 功能实现](09-project-crud/) | 路由器、Handler、Service、DAO 全链路实现 |
| 10 | [项目进阶功能](10-project-advanced/) | 过滤器链、JWT 认证、全局异常处理、分页查询 |

### 第五阶段：工程化

| 章节 | 目录 | 内容概要 |
|------|------|---------|
| 11 | [并发编程](11-concurrency/) | Thread、ExecutorService、CompletableFuture、线程安全 |
| 12 | [测试与安全](12-testing/) | JUnit 5、Mock、集成测试、安全最佳实践 |

## 项目预览：任务管理 API

教程的最终项目是一个功能完整的任务管理 REST API：

```
POST   /api/tasks          创建任务
GET    /api/tasks          获取任务列表（支持分页、筛选）
GET    /api/tasks/:id      获取单个任务
PUT    /api/tasks/:id      更新任务
DELETE /api/tasks/:id      删除任务
POST   /api/auth/login     用户登录（JWT）
```

功能亮点：
- 纯 Java 实现，零框架依赖
- 三层架构（Handler → Service → DAO）
- JWT 认证与过滤器链
- SQLite 持久化存储
- 完整的单元测试与集成测试

## 快速开始

```bash
# 克隆/下载教程后
cd java-rest-api-tutorial/08-project-setup
mvn compile
mvn exec:java
# 服务器启动在 http://localhost:8080
```

每个章节都可以独立运行，进入对应目录后按照 README 指引即可。

## 学习路线建议

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12
基础    核心    数据     项目搭建    项目实战     工程化
```

建议按顺序学习前 7 章打好基础，然后从第 8 章开始跟着项目走完全流程。
