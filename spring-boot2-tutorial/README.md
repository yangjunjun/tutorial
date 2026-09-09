# Spring Boot 2.5 实战教程 — 个人博客系统（前后端分离）

本教程以**个人博客系统**为项目主线，采用 Spring Boot 2.5.12 + MyBatis-Plus + MySQL + JWT + Spring Security + Redis 技术栈，从零开始逐步构建一个完整的前后端分离应用。每一章在前一章的基础上递进迭代，最终形成一个可部署上线的博客后端服务。

> 本教程是经典 **Spring Boot 2 世代**（JDK 8 + javax 生态）的完整实战教程，适用于仍需维护 JDK 8 技术栈的企业项目。

---

### 技术栈总览

| 层面 | 技术选型 |
|------|----------|
| 框架 | Spring Boot 2.5.12 (JDK 8) |
| ORM | MyBatis-Plus 3.5.1 |
| 数据库 | MySQL 8 |
| 认证 | JWT (jjwt 0.9.1) |
| 安全 | Spring Security 5.5.x |
| 缓存 | Redis (Spring Data Redis) |
| 接口文档 | Swagger (springfox 3.0.0) |
| 构建工具 | Maven |
| 部署 | Docker |

### 项目功能模块

- 用户注册 / 登录 / JWT 认证
- 文章 CRUD（标题、内容、摘要、状态）
- 分类管理
- 文件上传（头像、文章封面）
- 分页与高级搜索
- AOP 操作日志
- Swagger 在线文档
- Redis 热点数据缓存
- 单元测试与集成测试
- Docker 容器化部署

---

### 教程大纲

#### 第一部分：基础搭建

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [01](./01-environment-setup/) | 环境搭建与 Hello World | JDK 8、IDEA 配置、Spring Initializr、项目运行 |
| [02](./02-project-skeleton/) | 项目骨架与分层架构 | 包结构规划、Entity/DTO/VO、多环境配置、Lombok |
| [03](./03-database-mybatis/) | 数据库集成 — MyBatis-Plus | MySQL 建表、数据源配置、MyBatis-Plus 入门、CRUD |

#### 第二部分：核心开发

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [04](./04-unified-response/) | 统一响应与全局异常处理 | Result 封装、@RestControllerAdvice、自定义业务异常 |
| [05](./05-validation/) | 参数校验 | javax Validation、@Valid、分组校验、自定义校验器 |
| [06](./06-crud-apis/) | RESTful API 实战 | 文章 CRUD、分类 CRUD、RESTful 设计规范 |

#### 第三部分：安全与进阶

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [07](./07-jwt-auth/) | JWT 认证 | Token 生成与验证、登录接口、Filter 认证 |
| [08](./08-spring-security/) | Spring Security 权限控制 | 过滤器链、RBAC 角色、接口鉴权、CORS 配置 |
| [09](./09-pagination-query/) | 分页与高级查询 | MyBatis-Plus 分页插件、条件构造器、模糊搜索、多表联查 |

#### 第四部分：功能增强

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [10](./10-aop-logging/) | AOP 与日志 | 自定义注解、@Aspect、操作日志、接口耗时统计 |
| [11](./11-file-upload/) | 文件上传 | MultipartFile、本地存储、静态资源映射、文件大小限制 |
| [12](./12-swagger-doc/) | 接口文档 — Swagger | springfox 3.0、@Api/@ApiOperation、分组文档、认证配置 |
| [13](./13-redis-cache/) | Redis 缓存 | Spring Cache、@Cacheable/@CacheEvict、热点文章缓存、ZSet 排行榜 |

#### 第五部分：质量与部署

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [14](./14-unit-testing/) | 单元测试与集成测试 | JUnit 5、MockMvc、@SpringBootTest、Mockito |
| [15](./15-docker-deploy/) | Docker 部署 | Dockerfile、docker-compose、MySQL/Redis 容器编排、多环境配置 |

---

### 与 Spring Boot 3 教程的差异

如果之前学习过 Spring Boot 3 教程，请注意本教程（2.5.12 世代）的以下差异：

| 项目 | Spring Boot 2.5.12（本教程） | Spring Boot 3.x |
|------|------------------------------|-----------------|
| JDK 要求 | JDK 8+ | JDK 17+ |
| 包名空间 | `javax.*`（javax.validation、javax.servlet） | `jakarta.*` |
| 参数校验 | javax Validation API 2.0 | Jakarta Validation 3.0 |
| 接口文档 | springfox 3.0.0（Swagger 2） | SpringDoc OpenAPI（Swagger 3） |
| Spring Security | 5.5.x（WebSecurityConfigurerAdapter） | 6.x（SecurityFilterChain 声明式） |
| JWT 库 | jjwt 0.9.1 | jjwt 0.12.x |
| Spring 官方支持 | 2023-08 已停止 OSS 维护 | 持续维护中 |

---

### 如何使用本教程

1. 按顺序阅读各章的 `readme.md`，每章包含知识点讲解、代码示例和运行说明
2. 每章的 `src/` 目录包含该阶段的关键源码文件
3. 每章的 `sql/` 目录（如有）包含数据库变更脚本
4. 建议跟着教程逐步编写代码，而非直接复制

### 前置要求

- JDK 8+
- IntelliJ IDEA（推荐）或 VS Code
- MySQL 8.0+
- Maven 3.6+
- 基本的 Java 和 HTTP 知识

### 项目最终目录结构

```
blog-api/
├── src/main/java/com/example/blog/
│   ├── BlogApplication.java
│   ├── config/          # 配置类
│   ├── controller/      # 控制器
│   ├── service/         # 业务逻辑
│   ├── mapper/          # MyBatis Mapper
│   ├── entity/          # 数据库实体
│   ├── dto/             # 请求数据传输对象
│   ├── vo/              # 响应视图对象
│   ├── common/          # 公共组件（响应封装、异常等）
│   ├── security/        # 安全相关
│   ├── aspect/          # AOP 切面
│   └── util/            # 工具类
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
├── sql/                 # 数据库脚本
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

---

> 开始学习 → [第 01 章：环境搭建与 Hello World](./01-environment-setup/)
