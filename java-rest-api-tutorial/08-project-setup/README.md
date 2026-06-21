# 第 08 章：项目搭建

> 从本章开始，我们将构建一个完整的任务管理 REST API 项目。本章负责项目骨架搭建，包括 Maven 配置、分层架构设计和基础代码。

## 项目架构

```
task-api/
├── src/main/java/com/tutorial/taskapi/
│   ├── Main.java              应用入口
│   ├── server/
│   │   └── HttpServerStarter.java   服务器启动与配置
│   └── model/
│       ├── Task.java          任务实体
│       └── ApiResponse.java   统一响应格式
├── src/test/java/             测试代码
├── pom.xml                    Maven 配置
└── README.md
```

## 分层架构

```
请求 → Router → Handler → Service → DAO → Database
                                        ↑
                                      Model
```

- **Handler 层**：处理 HTTP 请求/响应，参数校验
- **Service 层**：业务逻辑
- **DAO 层**：数据访问（Data Access Object）
- **Model 层**：数据实体类

## 学习目标

- 掌握 Maven 项目结构与配置
- 理解分层架构的设计思想
- 创建统一的 API 响应格式
- 搭建服务器启动流程

## 核心代码说明

### pom.xml

配置项目依赖：Jackson（JSON）和 SQLite JDBC（数据库）。

### Main.java

应用入口，负责初始化各层组件并启动服务器。

### HttpServerStarter.java

封装 HttpServer 的创建和配置，注册路由。

### Task.java

任务实体类，包含 id、title、description、completed、priority 等字段。

### ApiResponse.java

统一响应格式：`{"success": true/false, "data": ..., "error": ...}`

## 编译与运行

```bash
cd 08-project-setup
mvn clean compile
mvn exec:java -Dexec.mainClass="com.tutorial.taskapi.Main"
```

## 下一章

[09 - CRUD 功能实现 →](../09-project-crud/)
