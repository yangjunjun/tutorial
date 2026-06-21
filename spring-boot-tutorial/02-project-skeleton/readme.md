# 第 02 章：项目骨架与分层架构

> **本章目标**：规划个人博客系统的分层架构，理解各层职责，掌握 DTO/VO 的设计思想，学习 Lombok 注解的使用，并搭建多环境配置体系。

---

## 目录

- [2.1 为什么需要分层架构](#21-为什么需要分层架构)
- [2.2 经典三层架构详解](#22-经典三层架构详解)
- [2.3 DTO 与 VO：为什么要做数据分层](#23-dto-与-vo为什么要做数据分层)
- [2.4 完整包结构规划](#24-完整包结构规划)
- [2.5 Lombok 常用注解详解](#25-lombok-常用注解详解)
- [2.6 实体类设计](#26-实体类设计)
  - [2.6.1 User 实体](#261-user-实体)
  - [2.6.2 Article 实体](#262-article-实体)
- [2.7 DTO 与 VO 示例](#27-dto-与-vo-示例)
  - [2.7.1 UserLoginDTO](#271-userlogindto)
  - [2.7.2 ArticleVO](#272-articlevo)
- [2.8 多环境配置](#28-多环境配置)
  - [2.8.1 配置文件加载机制](#281-配置文件加载机制)
  - [2.8.2 application.yml 主配置](#282-applicationyml-主配置)
  - [2.8.3 application-dev.yml 开发环境](#283-application-devyml-开发环境)
  - [2.8.4 @Profile 注解](#284-profile-注解)
- [2.9 YAML 配置语法要点](#29-yaml-配置语法要点)
- [2.10 本章小结](#210-本章小结)

---

## 2.1 为什么需要分层架构

在正式写代码之前，我们先来思考一个问题：为什么不把所有代码都写在一个类里？

想象一下，如果我们要实现"用户登录"功能，最原始的做法是在一个方法里完成所有事情：

```java
// 反面示例：所有逻辑揉在一起
public String login(String username, String password) {
    // 1. 参数校验
    if (username == null || password == null) return "参数错误";

    // 2. 连接数据库
    Connection conn = DriverManager.getConnection("jdbc:mysql://...");

    // 3. 查询用户
    PreparedStatement stmt = conn.prepareStatement("SELECT * FROM user WHERE username=?");
    stmt.setString(1, username);
    ResultSet rs = stmt.executeQuery();

    // 4. 验证密码
    if (rs.next() && rs.getString("password").equals(password)) {
        // 5. 生成 Token
        // 6. 记录登录日志
        // 7. 更新最后登录时间
        return "登录成功";
    }
    return "登录失败";
}
```

这种做法有很多问题：
- **耦合度高**：数据库连接、SQL 语句、业务逻辑全部混在一起
- **难以维护**：修改一处可能影响到其他逻辑
- **无法复用**：其他功能无法复用"查询用户"的逻辑
- **无法测试**：很难对某一层单独做单元测试

**分层架构的核心思想**就是"关注点分离"（Separation of Concerns），每一层只负责自己的事情。

---

## 2.2 经典三层架构详解

在 Spring Boot 项目中，最经典的分层架构是三层模型：

```
客户端请求（HTTP）
       |
       v
┌──────────────┐
│  Controller  │  ← 控制层：接收请求、参数校验、调用 Service、返回响应
│   (控制层)    │
└──────┬───────┘
       |  调用
       v
┌──────────────┐
│   Service    │  ← 业务层：核心业务逻辑、事务管理、数据组装
│   (业务层)    │
└──────┬───────┘
       |  调用
       v
┌──────────────┐
│   Mapper /   │  ← 持久层：与数据库交互、执行 SQL、数据映射
│   DAO 层     │
└──────┬───────┘
       |
       v
   数据库 (MySQL)
```

### Controller 层（控制层）

- **职责**：接收 HTTP 请求，做基本的参数校验，调用 Service 层处理业务，将结果返回给客户端
- **注解**：`@RestController`、`@GetMapping`、`@PostMapping` 等
- **原则**：Controller 不应该包含业务逻辑，它只是一个"调度员"
- **包路径**：`com.example.blog.controller`

### Service 层（业务层）

- **职责**：实现核心业务逻辑，如用户注册时的密码加密、文章发布时的内容处理、事务管理等
- **注解**：`@Service`（标注在实现类上）、`@Transactional`（事务管理）
- **原则**：Service 层是项目的核心，所有业务规则都应该在这里实现
- **接口与实现**：通常定义接口 `UserService` + 实现类 `UserServiceImpl`
- **包路径**：`com.example.blog.service` / `com.example.blog.service.impl`

### Mapper 层（持久层 / DAO 层）

- **职责**：直接与数据库交互，执行增删改查操作
- **注解**：`@Mapper`（MyBatis）或通过 `@MapperScan` 统一扫描
- **技术**：本项目使用 MyBatis-Plus，提供了大量内置 CRUD 方法
- **包路径**：`com.example.blog.mapper`

### 各层之间的数据流转

```
客户端 --JSON--> Controller --DTO--> Service --Entity--> Mapper --> 数据库
数据库 --> Mapper --Entity--> Service --VO--> Controller --JSON--> 客户端
```

**数据流向说明**：
1. 客户端发送 JSON 请求 → Controller 接收并反序列化为 DTO
2. Controller 将 DTO 传给 Service → Service 转换为 Entity 进行持久化操作
3. Mapper 从数据库查询得到 Entity → Service 将 Entity 转换为 VO
4. Controller 将 VO 序列化为 JSON 返回给客户端

---

## 2.3 DTO 与 VO：为什么要做数据分层

很多初学者会问：为什么不直接把 Entity（实体类）返回给前端？

### Entity（实体类）

Entity 是数据库表的 Java 映射，它的字段与数据库列一一对应。例如 `User` 实体包含 `password`（密码哈希值）。

### DTO（Data Transfer Object）—— 数据传输对象

DTO 用于**接收前端传来的请求数据**。

为什么需要 DTO？

1. **安全**：前端注册时传入 `username` 和 `password`，但 `User` 实体中还有 `role`（角色）字段。如果直接用 Entity 接收，恶意用户可以伪造 `role=ADMIN` 的字段进行越权操作。
2. **解耦**：API 请求参数的结构可能与数据库表结构不一致。
3. **校验**：DTO 上可以添加参数校验注解（如 `@NotBlank`、`@Email`），而 Entity 上通常不加。

### VO（View Object）—— 视图对象

VO 用于**向前端返回响应数据**。

为什么需要 VO？

1. **安全**：`User` 实体包含 `password` 字段，你绝对不希望把密码哈希值返回给前端。
2. **精简**：前端可能只需要 `username`、`nickname`、`avatar` 三个字段，没必要把整个 Entity 都返回。
3. **扩展**：VO 可以包含 Entity 中没有的字段，比如文章详情中需要附带"作者昵称"，这个字段在 `Article` 表中不存在。

### 三者的关系

```
前端请求 --JSON--> DTO（接收参数）
                      |
                      v
               Entity（数据库映射）
                      |
                      v
               VO（返回结果） --JSON--> 前端响应
```

> **小贴士**：在小型项目中，如果某张表的数据不需要脱敏也不需要扩展，也可以直接返回 Entity，不必拘泥于形式。但在中大型项目中，DTO/VO 的分离是非常有必要的。

---

## 2.4 完整包结构规划

在开始编码之前，我们先规划好整个项目的包结构。一个清晰的包结构有助于项目的长期维护和团队协作：

```
com.example.blog
├── BlogApplication.java          # 应用入口类
│
├── controller/                   # 控制层：接收 HTTP 请求，返回响应
│   ├── HelloController.java      #   Hello World 测试接口
│   ├── UserController.java       #   用户相关接口（注册、登录、个人信息）
│   ├── ArticleController.java    #   文章相关接口（发布、查询、列表）
│   ├── CategoryController.java   #   分类相关接口
│   └── TagController.java        #   标签相关接口
│
├── service/                      # 业务层：接口定义
│   ├── UserService.java          #   用户服务接口
│   ├── ArticleService.java       #   文章服务接口
│   └── impl/                     # 业务层：接口实现
│       ├── UserServiceImpl.java  #   用户服务实现
│       └── ArticleServiceImpl.java # 文章服务实现
│
├── mapper/                       # 持久层：与数据库交互
│   ├── UserMapper.java           #   用户数据访问
│   ├── ArticleMapper.java        #   文章数据访问
│   └── CategoryMapper.java       #   分类数据访问
│
├── entity/                       # 实体层：数据库表的 Java 映射
│   ├── User.java                 #   用户实体
│   ├── Article.java              #   文章实体
│   └── Category.java             #   分类实体
│
├── dto/                          # 数据传输对象：接收前端请求参数
│   ├── UserLoginDTO.java         #   登录请求参数
│   ├── UserRegisterDTO.java      #   注册请求参数
│   └── ArticleCreateDTO.java     #   发布文章请求参数
│
├── vo/                           # 视图对象：返回给前端的响应数据
│   ├── UserVO.java               #   用户信息响应
│   └── ArticleVO.java            #   文章详情响应
│
├── common/                       # 公共模块：全局通用的类
│   ├── Result.java               #   统一响应结果封装
│   ├── PageResult.java           #   分页结果封装
│   └── ErrorCode.java            #   错误码枚举
│
├── config/                       # 配置类：Spring Boot 配置
│   ├── MyBatisPlusConfig.java    #   MyBatis-Plus 配置（分页插件等）
│   ├── CorsConfig.java           #   跨域配置
│   └── WebMvcConfig.java         #   Web MVC 配置
│
└── util/                         # 工具类：通用工具方法
    └── JwtUtil.java              #   JWT 工具类
```

**包结构规划原则**：

1. **按功能分包**：每个包对应一个明确的职责
2. **命名规范**：包名全部小写，类名大驼峰
3. **渐进式构建**：不需要一次性创建所有类，随着教程推进逐步添加

---

## 2.5 Lombok 常用注解详解

Lombok 是一个 Java 库，通过注解在编译期自动生成代码，大大减少了样板代码（boilerplate code）。下面详解本项目中最常用的几个注解。

### @Data

`@Data` 是最常用的注解，它是一个"全家桶"注解，等价于同时使用以下注解：

- `@Getter`：为所有非 static 字段生成 getter 方法
- `@Setter`：为所有非 static、非 final 字段生成 setter 方法
- `@ToString`：生成 toString() 方法，包含所有字段
- `@EqualsAndHashCode`：生成 equals() 和 hashCode() 方法
- `@RequiredArgsConstructor`：为所有 final 字段和 @NonNull 字段生成有参构造器

```java
@Data
public class User {
    private Long id;
    private String username;
    // Lombok 自动生成：
    // getId(), setId(), getUsername(), setUsername()
    // toString(), equals(), hashCode()
}
```

### @Getter 和 @Setter

如果不想用 `@Data` 的全家桶，可以单独使用 `@Getter` 和 `@Setter`：

```java
@Getter
@Setter
public class User {
    private String username;
    // 只生成 getUsername(), setUsername()
}
```

也可以标注在单个字段上：

```java
public class User {
    @Getter  // 只给 username 生成 getter
    private String username;

    private String password;  // 不生成任何方法
}
```

### @Builder

`@Builder` 生成建造者模式，适用于参数较多的对象创建场景：

```java
@Builder
public class Article {
    private String title;
    private String content;
    private Long authorId;
}

// 使用 Builder 创建对象（链式调用，可读性好）
Article article = Article.builder()
    .title("Spring Boot 入门")
    .content("这是文章内容...")
    .authorId(1L)
    .build();
```

### @NoArgsConstructor 和 @AllArgsConstructor

```java
@NoArgsConstructor       // 生成无参构造器（很多框架要求必须有无参构造器）
@AllArgsConstructor      // 生成包含所有参数的构造器
public class User {
    private Long id;
    private String username;
    private String email;
}

// 使用无参构造器 + setter（常见于 ORM 框架填充数据）
User user = new User();
user.setUsername("admin");

// 使用全参构造器（注意参数顺序必须与字段声明顺序一致）
User user2 = new User(1L, "admin", "admin@example.com");
```

### @Slf4j

`@Slf4j` 自动生成一个名为 `log` 的日志对象：

```java
@Slf4j
public class UserServiceImpl {
    public void register(String username) {
        // 不需要手动创建 Logger，@Slf4j 自动生成 log 变量
        // 等价于：private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);
        log.info("用户注册：{}", username);
        log.warn("用户名可能重复：{}", username);
        log.error("注册失败", new RuntimeException("用户名已存在"));
    }
}
```

### @ToString

`@ToString` 生成 toString() 方法，方便调试时打印对象内容：

```java
@ToString
public class User {
    private Long id;
    private String username;
    // 自动生成：User(id=1, username=admin)
}
```

可以使用 `@ToString.Exclude` 排除敏感字段（如密码）：

```java
@ToString
public class User {
    private Long id;
    private String username;

    @ToString.Exclude  // toString 中不包含密码
    private String password;
}
```

### 常用注解组合速查表

| 场景 | 推荐注解组合 |
|------|-------------|
| Entity 实体类 | `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` |
| DTO 请求对象 | `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` |
| VO 响应对象 | `@Data`, `@Builder`, `@NoArgsConstructor` |
| Service 实现类 | `@Slf4j`, `@Service` |
| 工具类 | `@Slf4j`（加上私有构造器防止实例化） |

---

## 2.6 实体类设计

实体类（Entity）是数据库表在 Java 中的映射对象。每个实体类的字段对应数据库表的一列。

### 2.6.1 User 实体

`User` 实体对应 `user` 表，包含用户的基本信息：

```java
package com.example.blog.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户实体类 —— 对应数据库 user 表
 *
 * 包含用户的基本信息，如用户名、密码、昵称、邮箱、头像等。
 * 在后续章节中，我们会为这个类添加 MyBatis-Plus 的注解（@TableName、@TableId 等）。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /** 用户 ID（主键，自增） */
    private Long id;

    /** 用户名（唯一，用于登录） */
    private String username;

    /** 密码（存储 BCrypt 加密后的哈希值） */
    private String password;

    /** 昵称（显示在页面上的名称） */
    private String nickname;

    /** 邮箱地址 */
    private String email;

    /** 头像 URL */
    private String avatar;

    /**
     * 角色
     * - ADMIN：管理员
     * - USER：普通用户
     */
    private String role;

    /**
     * 账号状态
     * - 0：正常
     * - 1：禁用
     */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 最后更新时间 */
    private LocalDateTime updateTime;
}
```

**设计说明**：

- 使用 `LocalDateTime` 而非 `Date`，因为 `LocalDateTime` 是 Java 8+ 的线程安全时间类
- `password` 字段存储加密后的哈希值，永远不要存储明文密码
- `role` 和 `status` 字段后续可以改为枚举类型
- `@Data` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor` 是 Entity 类的标准注解组合

### 2.6.2 Article 实体

`Article` 实体对应 `article` 表，存储博客文章信息：

```java
package com.example.blog.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文章实体类 —— 对应数据库 article 表
 *
 * 存储博客文章的核心信息，包括标题、正文、摘要、分类、作者等。
 * 注意：这里只存储文章元数据，文章内容（content）可能很长，
 * 在数据库中使用 LONGTEXT 类型存储。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    /** 文章 ID（主键，自增） */
    private Long id;

    /** 文章标题 */
    private String title;

    /** 文章正文（Markdown 格式） */
    private String content;

    /** 文章摘要（用于列表展示，一般取正文前 200 字符） */
    private String summary;

    /** 所属分类 ID（关联 category 表） */
    private Long categoryId;

    /** 作者 ID（关联 user 表） */
    private Long authorId;

    /** 封面图片 URL */
    private String coverImage;

    /**
     * 文章状态
     * - 0：草稿
     * - 1：已发布
     * - 2：已下架
     */
    private Integer status;

    /** 浏览量 */
    private Long viewCount;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 最后更新时间 */
    private LocalDateTime updateTime;
}
```

**设计说明**：

- `content` 使用 Markdown 格式存储，前端渲染为 HTML 展示
- `summary` 是文章摘要，用于列表页展示，避免加载完整文章内容
- `categoryId` 和 `authorId` 是外键关联字段，在应用层处理关联关系
- `viewCount` 使用 `Long` 类型，因为浏览量可能很大
- `status` 使用整数编码，比字符串更节省存储空间

---

## 2.7 DTO 与 VO 示例

### 2.7.1 UserLoginDTO

DTO（Data Transfer Object）用于封装前端发送的请求参数：

```java
package com.example.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户登录请求 DTO
 *
 * 当前端调用 POST /api/auth/login 接口时，
 * 请求体中的 JSON 数据会被反序列化为这个对象。
 *
 * 为什么不直接用 User 实体接收？
 * 1. 登录只需要 username 和 password，不需要 User 的其他字段
 * 2. 后续可以在 DTO 上添加校验注解（如 @NotBlank）
 * 3. DTO 与 Entity 解耦，前端接口格式变化不会影响数据库模型
 *
 * 请求示例：
 * {
 *     "username": "admin",
 *     "password": "123456"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginDTO {

    /** 用户名 */
    private String username;

    /** 密码（明文，后端负责验证） */
    private String password;
}
```

### 2.7.2 ArticleVO

VO（View Object）用于封装返回给前端的响应数据：

```java
package com.example.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文章详情响应 VO
 *
 * 当前端调用 GET /api/articles/{id} 接口时，
 * 返回的 JSON 数据由此对象序列化而来。
 *
 * 为什么不直接返回 Article 实体？
 * 1. VO 中包含 authorName（作者昵称），这是从 User 表关联查询来的，
 *    Article 实体中只有 authorId
 * 2. VO 中包含 categoryName（分类名称），同理
 * 3. 可以控制返回字段，避免暴露不必要的数据
 * 4. 前端和后端可以独立演进，互不影响
 *
 * 响应示例：
 * {
 *     "id": 1,
 *     "title": "Spring Boot 入门教程",
 *     "content": "...",
 *     "authorName": "张三",
 *     "categoryName": "后端开发",
 *     ...
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleVO {

    /** 文章 ID */
    private Long id;

    /** 文章标题 */
    private String title;

    /** 文章正文（Markdown 格式） */
    private String content;

    /** 文章摘要 */
    private String summary;

    /** 封面图片 URL */
    private String coverImage;

    /** 作者昵称（从 User 表关联查询，Article 实体中没有此字段） */
    private String authorName;

    /** 作者头像（从 User 表关联查询） */
    private String authorAvatar;

    /** 分类名称（从 Category 表关联查询，Article 实体中没有此字段） */
    private String categoryName;

    /** 浏览量 */
    private Long viewCount;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 最后更新时间 */
    private LocalDateTime updateTime;
}
```

---

## 2.8 多环境配置

在实际开发中，我们的项目会运行在不同的环境中：

| 环境 | 说明 | 配置文件 |
|------|------|----------|
| 开发环境 (dev) | 本地开发调试使用 | application-dev.yml |
| 测试环境 (test) | 测试服务器部署 | application-test.yml |
| 生产环境 (prod) | 线上正式运行 | application-prod.yml |

每个环境的数据库地址、密码、端口等配置往往不同。Spring Boot 提供了优雅的多环境配置机制。

### 2.8.1 配置文件加载机制

Spring Boot 的配置文件加载规则：

1. **始终加载** `application.yml`（或 `application.properties`）—— 这是主配置文件
2. 通过 `spring.profiles.active` 指定激活的环境配置
3. 如果激活了 `dev` 环境，则**额外加载** `application-dev.yml`
4. **环境配置会覆盖主配置**中的同名属性

```
application.yml          ← 始终加载（公共配置）
application-dev.yml      ← spring.profiles.active=dev 时加载
application-prod.yml     ← spring.profiles.active=prod 时加载
```

### 2.8.2 application.yml 主配置

主配置文件存放所有环境**共享的公共配置**：

```yaml
# 主配置文件：application.yml
# 存放所有环境共享的公共配置

spring:
  application:
    name: blog-api

  # 激活的环境配置
  # - dev：开发环境
  # - prod：生产环境
  # 可以在启动时通过命令行覆盖：
  #   java -jar app.jar --spring.profiles.active=prod
  profiles:
    active: dev

# 服务器配置
server:
  port: 8080
```

### 2.8.3 application-dev.yml 开发环境

开发环境的配置独立到 `application-dev.yml` 中：

```yaml
# 开发环境配置：application-dev.yml
# 仅当 spring.profiles.active=dev 时生效

spring:
  datasource:
    # 开发环境数据库连接信息
    url: jdbc:mysql://localhost:3306/blog_dev?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root123456
    driver-class-name: com.mysql.cj.jdbc.Driver

# 开发环境可以在不同端口运行
server:
  port: 8080

# 开发环境显示详细日志
logging:
  level:
    com.example.blog: debug
    org.springframework.web: info
```

### 2.8.4 @Profile 注解

除了在配置文件中区分环境，我们还可以在 Java 配置类上使用 `@Profile` 注解，让某些 Bean 只在特定环境下生效：

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("dev")  // 只在开发环境下生效的配置类
public class DevConfig {
    // 开发环境特有的 Bean 配置
    // 例如：初始化测试数据、启用 Swagger 文档等
}

@Configuration
@Profile("prod")  // 只在生产环境下生效
public class ProdConfig {
    // 生产环境特有的 Bean 配置
    // 例如：启用缓存、配置 HTTPS 等
}
```

**切换环境的方式**：

```bash
# 方式 1：在 application.yml 中修改 spring.profiles.active
# spring.profiles.active: prod

# 方式 2：启动时通过命令行参数指定（优先级最高）
java -jar blog-api.jar --spring.profiles.active=prod

# 方式 3：通过环境变量
export SPRING_PROFILES_ACTIVE=prod

# 方式 4：通过 JVM 参数
java -Dspring.profiles.active=prod -jar blog-api.jar
```

---

## 2.9 YAML 配置语法要点

YAML 是 Spring Boot 推荐的配置格式，下面总结一些常见语法：

### 基本语法

```yaml
# 1. 键值对（冒号后必须有空格）
server:
  port: 8080

# 2. 字符串（可以不加引号，包含特殊字符时加引号）
name: blog-api
description: "这是'个人博客'系统"

# 3. 布尔值
debug: true
enabled: false

# 4. 数字
port: 8080
timeout: 30

# 5. 数组 / 列表
tags:
  - Java
  - Spring Boot
  - MyBatis

# 或者使用行内写法
tags: [Java, Spring Boot, MyBatis]

# 6. 对象 / Map
datasource:
  url: jdbc:mysql://localhost:3306/blog
  username: root
  password: root123

# 7. 多行字符串（保留换行符）
description: |
  这是第一行
  这是第二行
  这是第三行

# 8. 引用变量
base-path: /api
user-path: ${base-path}/users
```

### 配置优先级（从高到低）

1. 命令行参数 `--key=value`
2. 环境变量
3. `application-{profile}.yml`（profile 特定配置）
4. `application.yml`（主配置）
5. `@PropertySource` 引入的配置

### 常见配置示例

```yaml
# MyBatis-Plus 配置
mybatis-plus:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

# 文件上传配置
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

# Jackson 日期格式化
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
```

---

## 2.10 本章小结

在本章中，我们完成了以下工作：

1. **理解分层架构**：掌握了 Controller → Service → Mapper 三层架构的设计思想和各层职责
2. **DTO/VO 分离**：理解了为什么要将请求参数（DTO）和响应数据（VO）与 Entity 分离
3. **包结构规划**：规划了完整的项目包结构，为后续开发奠定基础
4. **Lombok 使用**：掌握了 `@Data`、`@Builder`、`@NoArgsConstructor`、`@AllArgsConstructor`、`@Slf4j` 等常用注解
5. **实体类设计**：设计了 `User` 和 `Article` 两个核心实体类
6. **多环境配置**：配置了 dev/prod 多环境，理解了配置加载机制和优先级
7. **YAML 语法**：掌握了 YAML 的核心语法和 Spring Boot 常见配置

### 下一章预告

在第 03 章中，我们将集成 MyBatis-Plus 持久层框架，连接 MySQL 数据库，实现真正的数据增删改查操作。我们将学习 MyBatis-Plus 的注解、Mapper 接口、Service 层封装，并通过 Controller 接口验证 CRUD 功能。

---

> **本章源码**：参见 `02-project-skeleton/` 目录下的完整文件。
