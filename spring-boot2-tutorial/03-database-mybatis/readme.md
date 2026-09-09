# 第 03 章：数据库集成 — MyBatis-Plus

> **本章目标**：集成 MyBatis-Plus 持久层框架，连接 MySQL 数据库，实现完整的 CRUD（增删改查）操作，并通过 REST 接口验证数据库操作。

---

## 目录

- [3.1 为什么选择 MyBatis-Plus](#31-为什么选择-mybatis-plus)
- [3.2 创建数据库与数据表](#32-创建数据库与数据表)
  - [3.2.1 创建数据库](#321-创建数据库)
  - [3.2.2 建表语句详解](#322-建表语句详解)
  - [3.2.3 插入示例数据](#323-插入示例数据)
- [3.3 引入 MyBatis-Plus 依赖](#33-引入-mybatis-plus-依赖)
- [3.4 配置数据源](#34-配置数据源)
- [3.5 Entity 实体类与注解](#35-entity-实体类与注解)
  - [3.5.1 @TableName 注解](#351-tablename-注解)
  - [3.5.2 @TableId 注解](#352-tableid-注解)
  - [3.5.3 @TableField 注解](#353-tablefield-注解)
  - [3.5.4 User 实体类](#354-user-实体类)
  - [3.5.5 Article 实体类](#355-article-实体类)
  - [3.5.6 Category 实体类](#356-category-实体类)
- [3.6 Mapper 接口](#36-mapper-接口)
  - [3.6.1 BaseMapper 提供的内置方法](#361-basemapper-提供的内置方法)
  - [3.6.2 自定义 Mapper 接口](#362-自定义-mapper-接口)
- [3.7 Service 层](#37-service-层)
  - [3.7.1 IService 接口与 ServiceImpl](#371-iservice-接口与-serviceimpl)
  - [3.7.2 UserService 实现](#372-userservice-实现)
  - [3.7.3 ArticleService 实现](#373-articleservice-实现)
- [3.8 Controller 测试接口](#38-controller-测试接口)
- [3.9 常用 CRUD 操作演示](#39-常用-crud-操作演示)
- [3.10 启动应用与测试](#310-启动应用与测试)
- [3.11 代码生成器简介（可选）](#311-代码生成器简介可选)
- [3.12 本章小结](#312-本章小结)

---

## 3.1 为什么选择 MyBatis-Plus

在 Java 持久层框架中，最常见的选择有 JPA（Hibernate）和 MyBatis。MyBatis-Plus 是在 MyBatis 基础上的增强工具，我们选择它的原因如下：

| 特性 | 说明 |
|------|------|
| **内置 CRUD** | 继承 BaseMapper 即可获得基本的增删改查能力，无需编写 XML |
| **条件构造器** | 通过 LambdaQueryWrapper 等工具类，用 Java 代码构建 SQL 查询条件 |
| **分页插件** | 内置分页支持，只需简单配置即可使用 |
| **自动填充** | 自动填充 createTime、updateTime 等公共字段 |
| **代码生成器** | 一键生成 Entity、Mapper、Service、Controller 代码 |
| **兼容 MyBatis** | 完全兼容原生 MyBatis 的所有功能（XML 映射、自定义 SQL 等） |

与 JPA 相比，MyBatis-Plus 的优势在于**对 SQL 的精细控制**，适合需要复杂查询的项目。

> **注意**：本项目使用 `mybatis-plus-boot-starter`（Spring Boot 2.x 专用 Starter），并显式指定版本 `3.5.1`。Spring Boot 2.5.12 的依赖管理 BOM 并不包含 MyBatis-Plus，因此**必须在 `pom.xml` 中手动指定版本号**。另外，请勿使用 `mybatis-plus-spring-boot3-starter`——那是 Spring Boot 3（jakarta.* 生态）专用的版本，在 Spring Boot 2.5 中无法工作。

---

## 3.2 创建数据库与数据表

### 3.2.1 创建数据库

首先，我们需要在 MySQL 中创建博客系统的数据库。打开 MySQL 命令行或 Navicat、DBeaver 等数据库客户端工具，执行以下 SQL：

```sql
-- 创建开发环境数据库
CREATE DATABASE IF NOT EXISTS blog_dev
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- 切换到 blog_dev 数据库
USE blog_dev;
```

**参数说明**：
- `utf8mb4`：MySQL 的 UTF-8 字符集，支持存储 Emoji 表情等 4 字节字符（普通的 `utf8` 只支持 3 字节）
- `utf8mb4_unicode_ci`：Unicode 排序规则，支持多语言正确排序

### 3.2.2 建表语句详解

完整的建表 SQL 文件见 `03-database-mybatis/sql/init.sql`。这里我们逐表讲解：

#### user 表（用户表）

```sql
CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '用户ID',
    `username`    VARCHAR(50)  NOT NULL                 COMMENT '用户名',
    `password`    VARCHAR(100) NOT NULL                 COMMENT '密码（BCrypt加密）',
    `nickname`    VARCHAR(50)  NOT NULL DEFAULT ''      COMMENT '昵称',
    `email`       VARCHAR(100) NOT NULL DEFAULT ''      COMMENT '邮箱',
    `avatar`      VARCHAR(255) NOT NULL DEFAULT ''      COMMENT '头像URL',
    `role`        VARCHAR(20)  NOT NULL DEFAULT 'USER'  COMMENT '角色：ADMIN/USER',
    `status`      TINYINT      NOT NULL DEFAULT 0       COMMENT '状态：0正常 1禁用',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

**设计要点**：
- `BIGINT AUTO_INCREMENT`：主键使用长整型自增，足以支撑大规模数据
- `UNIQUE KEY uk_username`：用户名唯一索引，防止重复注册
- `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`：MySQL 自动维护更新时间
- `ENGINE=InnoDB`：使用 InnoDB 存储引擎，支持事务和外键

#### article 表（文章表）

```sql
CREATE TABLE `article` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '文章ID',
    `title`       VARCHAR(200) NOT NULL                 COMMENT '文章标题',
    `content`     LONGTEXT     NOT NULL                 COMMENT '文章正文（Markdown）',
    `summary`     VARCHAR(500) NOT NULL DEFAULT ''      COMMENT '文章摘要',
    `category_id` BIGINT       NOT NULL DEFAULT 0       COMMENT '分类ID',
    `author_id`   BIGINT       NOT NULL                 COMMENT '作者ID',
    `cover_image` VARCHAR(255) NOT NULL DEFAULT ''      COMMENT '封面图片URL',
    `status`      TINYINT      NOT NULL DEFAULT 0       COMMENT '状态：0草稿 1已发布 2已下架',
    `view_count`  BIGINT       NOT NULL DEFAULT 0       COMMENT '浏览量',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_author_id` (`author_id`),
    KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';
```

**设计要点**：
- `content LONGTEXT`：文章正文可能很长，使用 LONGTEXT 最大支持 4GB 文本
- `idx_author_id`：为作者 ID 创建普通索引，加速"查询某用户所有文章"的查询
- `idx_category_id`：为分类 ID 创建索引，加速按分类查询

#### 其他表

完整 SQL 中还包含以下表，详见 `sql/init.sql` 文件：

| 表名 | 说明 |
|------|------|
| `category` | 文章分类表（id, name, description, sort） |
| `tag` | 标签表（id, name） |
| `article_tag` | 文章-标签关联表（多对多关系） |
| `comment` | 评论表（id, article_id, user_id, content, parent_id） |

### 3.2.3 插入示例数据

在 `init.sql` 中已经包含了示例数据，执行后数据库中将有：
- 2 个用户（admin 管理员 + zhangsan 普通用户）
- 3 个文章分类（Java 后端、前端开发、技术随笔）
- 4 篇文章
- 4 个标签
- 若干文章-标签关联记录
- 2 条评论

---

## 3.3 引入 MyBatis-Plus 依赖

在 `pom.xml` 中新增以下依赖（完整 pom.xml 见项目文件）：

```xml
<!-- MyBatis-Plus Spring Boot 2.x Starter -->
<!-- 注意：Spring Boot 2.x 必须使用 mybatis-plus-boot-starter -->
<!-- 注意：Spring Boot 2.5.12 的 BOM 不管理 MyBatis-Plus，必须显式指定版本 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.1</version>
</dependency>

<!-- MySQL JDBC 驱动 -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```

**依赖说明**：

| 依赖 | 说明 |
|------|------|
| `mybatis-plus-boot-starter` | MyBatis-Plus 的 Spring Boot 自动配置 Starter。Spring Boot 2.x 使用此坐标，且**必须手动写 version**（本教程统一为 3.5.1） |
| `mysql-connector-java` | MySQL 官方 JDBC 驱动程序。`scope=runtime` 表示只在运行时使用，编译期不需要。Spring Boot 2.5.12 的 BOM 已管理其版本（8.0.x 系列），**无需手动写版本号** |

> **常见错误 1**：如果误用了 `mybatis-plus-spring-boot3-starter`（Spring Boot 3 专用），在 Spring Boot 2.5 中会因缺少 `jakarta.*` 相关依赖而报错或自动配置失效。请记住对应关系：**Spring Boot 2.x → `mybatis-plus-boot-starter`；Spring Boot 3.x → `mybatis-plus-spring-boot3-starter`**。
>
> **常见错误 2**：MySQL 驱动的坐标。Spring Boot 2.5.12 管理的是旧坐标 `mysql:mysql-connector-java`（groupId 为 `mysql`）；而 Spring Boot 3 使用的则是新坐标 `com.mysql:mysql-connector-j`。如果在 2.5.12 中写 `com.mysql:mysql-connector-j` 且不指定版本，Maven 将报"missing version"错误。
>
> **版本提示**：MyBatis-Plus 3.5.1 对 JDK 8 完全兼容。若后续有升级计划，请注意 MyBatis-Plus 从 3.5.4 起将 Spring Boot 2/3 的支持拆分为两个 Starter，升级时需要同步修改坐标。

---

## 3.4 配置数据源

在 `application-dev.yml` 中配置数据库连接信息：

```yaml
spring:
  datasource:
    # 数据库连接 URL
    url: jdbc:mysql://localhost:3306/blog_dev?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
    # 数据库用户名
    username: root
    # 数据库密码
    password: root123456
    # JDBC 驱动类名（Spring Boot 可以自动识别，这里显式指定更清晰）
    driver-class-name: com.mysql.cj.jdbc.Driver
```

**URL 参数详解**：

| 参数 | 值 | 说明 |
|------|------|------|
| `useUnicode` | true | 使用 Unicode 字符集 |
| `characterEncoding` | utf-8 | 字符编码 |
| `serverTimezone` | Asia/Shanghai | 时区设置，避免时间偏差 |
| `allowPublicKeyRetrieval` | true | 允许获取 MySQL 公钥（`caching_sha2_password` 认证方式需要） |
| `useSSL` | false | 是否使用 SSL 连接（开发环境关闭，生产环境建议开启） |

---

## 3.5 Entity 实体类与注解

MyBatis-Plus 通过注解将 Java 实体类与数据库表进行映射。

### 3.5.1 @TableName 注解

`@TableName` 标注在类上，指定实体类对应的数据库表名：

```java
@TableName("user")  // 对应数据库中的 user 表
public class User {
    // ...
}
```

**什么时候需要 @TableName？**
- 表名与类名不一致时（如类名 `User`，表名 `sys_user`）
- 表名使用了 MySQL 保留字（如 `order`）

**可以省略的情况**：
- 如果类名与表名完全一致（如类名 `User`，表名 `user`），MyBatis-Plus 会自动映射，可以不加 `@TableName`

**驼峰映射**：
- MyBatis-Plus 默认开启驼峰命名映射：Java 的 `createTime` 自动映射到数据库的 `create_time`

### 3.5.2 @TableId 注解

`@TableId` 标注在主键字段上，指定主键生成策略：

```java
@TableId(type = IdType.AUTO)  // 使用数据库自增策略
private Long id;
```

**常用主键策略**：

| IdType | 说明 | 适用场景 |
|--------|------|----------|
| `AUTO` | 数据库自增 | 最常用，适合单体应用 |
| `ASSIGN_ID` | 雪花算法（默认） | 分布式系统，生成全局唯一 ID |
| `INPUT` | 手动输入 | 需要自定义 ID 生成规则时 |
| `NONE` | 无策略 | 跟随全局配置 |

### 3.5.3 @TableField 注解

`@TableField` 标注在非主键字段上，用于处理字段映射和特殊行为：

```java
// 1. 字段名与列名不一致时指定映射
@TableField("cover_image")
private String coverImage;  // Java 驼峰 -> 数据库下划线（默认已自动映射）

// 2. 标记该字段不存在于数据库表中
@TableField(exist = false)
private String extraInfo;

// 3. 自动填充策略（配合 MetaObjectHandler 使用）
@TableField(fill = FieldFill.INSERT)
private LocalDateTime createTime;

@TableField(fill = FieldFill.INSERT_UPDATE)
private LocalDateTime updateTime;
```

### 3.5.4 User 实体类

带 MyBatis-Plus 注解的完整 User 实体（见 `entity/User.java`）：

```java
package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户实体类 —— 对应数据库 user 表
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("user")  // 指定表名
public class User {

    @TableId(type = IdType.AUTO)  // 主键，数据库自增
    private Long id;

    private String username;   // 用户名
    private String password;   // 密码（BCrypt 加密）
    private String nickname;   // 昵称
    private String email;      // 邮箱
    private String avatar;     // 头像 URL
    private String role;       // 角色：ADMIN / USER
    private Integer status;    // 状态：0 正常，1 禁用

    @TableField(fill = FieldFill.INSERT)  // 插入时自动填充
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)  // 插入和更新时自动填充
    private LocalDateTime updateTime;
}
```

### 3.5.5 Article 实体类

带 MyBatis-Plus 注解的完整 Article 实体（见 `entity/Article.java`）：

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("article")
public class Article {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;       // 文章标题
    private String content;     // 正文（Markdown）
    private String summary;     // 摘要
    private Long categoryId;    // 分类 ID
    private Long authorId;      // 作者 ID
    private String coverImage;  // 封面图片
    private Integer status;     // 状态：0草稿 1发布 2下架
    private Long viewCount;     // 浏览量

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

### 3.5.6 Category 实体类

新增的 Category 分类实体（见 `entity/Category.java`）：

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("category")
public class Category {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;         // 分类名称
    private String description;  // 分类描述
    private Integer sort;        // 排序值（数字越小越靠前）

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

---

## 3.6 Mapper 接口

Mapper 接口是 MyBatis-Plus 中最核心的部分，它负责与数据库进行交互。

### 3.6.1 BaseMapper 提供的内置方法

MyBatis-Plus 的 `BaseMapper<T>` 接口内置了丰富的 CRUD 方法：

| 方法 | 说明 | SQL 示例 |
|------|------|----------|
| `insert(T entity)` | 插入一条记录 | `INSERT INTO user (...) VALUES (...)` |
| `deleteById(Serializable id)` | 根据 ID 删除 | `DELETE FROM user WHERE id = ?` |
| `deleteByMap(Map)` | 根据列名条件删除 | `DELETE FROM user WHERE username = ?` |
| `delete(Wrapper)` | 根据条件构造器删除 | `DELETE FROM user WHERE age > ?` |
| `deleteBatchIds(Collection)` | 批量删除 | `DELETE FROM user WHERE id IN (1,2,3)` |
| `updateById(T entity)` | 根据 ID 更新 | `UPDATE user SET ... WHERE id = ?` |
| `update(T entity, Wrapper)` | 根据条件更新 | `UPDATE user SET ... WHERE ...` |
| `selectById(Serializable id)` | 根据 ID 查询 | `SELECT * FROM user WHERE id = ?` |
| `selectBatchIds(Collection)` | 批量查询 | `SELECT * FROM user WHERE id IN (1,2,3)` |
| `selectByMap(Map)` | 根据列名条件查询 | `SELECT * FROM user WHERE role = ?` |
| `selectList(Wrapper)` | 条件查询列表 | `SELECT * FROM user WHERE ...` |
| `selectOne(Wrapper)` | 条件查询单条 | `SELECT * FROM user WHERE ... LIMIT 1` |
| `selectCount(Wrapper)` | 查询总数 | `SELECT COUNT(*) FROM user WHERE ...` |

### 3.6.2 自定义 Mapper 接口

创建 Mapper 接口只需继承 `BaseMapper<T>` 即可，**不需要写任何方法**就能获得上述所有 CRUD 能力：

```java
package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据访问接口
 * 继承 BaseMapper<User> 后自动获得基本 CRUD 方法
 * 如需自定义复杂 SQL，可在同目录下的 UserMapper.xml 中编写
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 此处无需编写任何代码
    // BaseMapper 已提供：insert, selectById, updateById, deleteById 等方法
}
```

> **@Mapper 注解**：标注在接口上，告诉 MyBatis 为这个接口创建动态代理对象。也可以在启动类上使用 `@MapperScan("com.example.blog.mapper")` 统一扫描所有 Mapper 接口。

---

## 3.7 Service 层

### 3.7.1 IService 接口与 ServiceImpl

MyBatis-Plus 不仅提供了 Mapper 层的封装，还提供了 Service 层的封装：

- `IService<T>`：Service 层接口，提供了比 BaseMapper 更丰富的方法（如批量操作）
- `ServiceImpl<M, T>`：Service 层实现类，内部注入了 Mapper 对象

**IService 额外提供的常用方法**：

| 方法 | 说明 |
|------|------|
| `save(T entity)` | 插入一条记录（等价于 Mapper.insert） |
| `saveBatch(Collection)` | **批量插入**（Mapper 层没有此方法） |
| `saveOrUpdate(T entity)` | 有 ID 则更新，无 ID 则插入 |
| `removeById(Serializable id)` | 根据 ID 删除 |
| `updateById(T entity)` | 根据 ID 更新 |
| `getById(Serializable id)` | 根据 ID 查询 |
| `list()` | 查询所有记录 |
| `list(Wrapper)` | 条件查询列表 |
| `count()` | 查询总记录数 |
| `page(Page)` | 分页查询 |

### 3.7.2 UserService 实现

**Service 接口**（`service/UserService.java`）：

```java
package com.example.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.blog.entity.User;

/**
 * 用户服务接口
 * 继承 IService<User> 获得丰富的 CRUD 方法声明
 */
public interface UserService extends IService<User> {
    // 可以在这里声明自定义的业务方法
    // 例如：User getByUsername(String username);
}
```

**Service 实现**（`service/impl/UserServiceImpl.java`）：

```java
package com.example.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import com.example.blog.service.UserService;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现类
 * ServiceImpl<UserMapper, User> 的含义：
 * - 第一个泛型 UserMapper：对应的 Mapper 接口
 * - 第二个泛型 User：对应的实体类
 *
 * ServiceImpl 内部已经注入了 UserMapper 对象（变量名为 baseMapper）
 * 可以直接使用 baseMapper.insert()、baseMapper.selectById() 等方法
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    // 此处无需编写任何代码即可获得基本 CRUD 能力
    // 自定义业务逻辑可以在此添加
}
```

### 3.7.3 ArticleService 实现

与 UserService 类似，ArticleService 同样继承 IService 体系：

```java
// ArticleService.java
public interface ArticleService extends IService<Article> {
}

// ArticleServiceImpl.java
@Service
public class ArticleServiceImpl extends ServiceImpl<ArticleMapper, Article> implements ArticleService {
}
```

---

## 3.8 Controller 测试接口

为了验证 MyBatis-Plus 的 CRUD 功能是否正常，我们编写一个简单的 `UserController`：

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // 新增用户
    @PostMapping
    public User create(@RequestBody User user) { ... }

    // 根据 ID 查询用户
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) { ... }

    // 查询所有用户
    @GetMapping
    public List<User> list() { ... }

    // 更新用户
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) { ... }

    // 删除用户
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { ... }
}
```

完整的 Controller 代码见 `controller/UserController.java`，其中包含了详细的注释和每个接口的 curl 测试命令。

---

## 3.9 常用 CRUD 操作演示

以下是通过 Controller 接口测试的完整 CRUD 流程：

### 1. 新增用户（INSERT）

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wangwu",
    "password": "abc123",
    "nickname": "王五",
    "email": "wangwu@example.com",
    "role": "USER",
    "status": 0
  }'
```

### 2. 根据 ID 查询（SELECT）

```bash
curl http://localhost:8080/api/users/1
```

### 3. 查询所有用户（SELECT LIST）

```bash
curl http://localhost:8080/api/users
```

### 4. 更新用户（UPDATE）

```bash
curl -X PUT http://localhost:8080/api/users/3 \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "王五（已修改）",
    "email": "wangwu_new@example.com"
  }'
```

### 5. 删除用户（DELETE）

```bash
curl -X DELETE http://localhost:8080/api/users/3
```

### 在 Service 层使用条件查询

除了基本 CRUD，MyBatis-Plus 的条件构造器（Wrapper）功能非常强大：

```java
// 查询所有角色为 USER 的用户
List<User> users = userService.list(
    new LambdaQueryWrapper<User>()
        .eq(User::getRole, "USER")
);

// 查询用户名包含 "admin" 的用户
List<User> admins = userService.list(
    new LambdaQueryWrapper<User>()
        .like(User::getUsername, "admin")
);

// 组合条件查询：角色为 USER 且状态为正常的用户
List<User> activeUsers = userService.list(
    new LambdaQueryWrapper<User>()
        .eq(User::getRole, "USER")
        .eq(User::getStatus, 0)
        .orderByDesc(User::getCreateTime)
);
```

---

## 3.10 启动应用与测试

### 步骤一：执行 SQL 初始化脚本

```bash
mysql -u root -p < sql/init.sql
```

或在 Navicat / DBeaver 中打开 `sql/init.sql` 执行。

### 步骤二：修改数据库密码

确保 `application-dev.yml` 中的数据库密码与你的 MySQL 密码一致。

### 步骤三：启动应用

在 IDEA 中运行 `BlogApplication`，或使用命令行：

```bash
mvn spring-boot:run
```

### 步骤四：测试接口

启动成功后，依次测试以下接口：

```bash
# 1. 查询所有用户（应返回 init.sql 中插入的示例用户）
curl http://localhost:8080/api/users

# 2. 根据 ID 查询用户
curl http://localhost:8080/api/users/1

# 3. 新增用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","nickname":"测试用户","role":"USER","status":0}'

# 4. 再次查询所有用户（应多了一条新记录）
curl http://localhost:8080/api/users

# 5. 更新用户
curl -X PUT http://localhost:8080/api/users/3 \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户（已修改）"}'

# 6. 删除用户
curl -X DELETE http://localhost:8080/api/users/3
```

### 预期结果

如果一切正常，你应该看到：
1. 查询接口返回 JSON 格式的用户列表
2. 新增接口返回带有自动生成的 `id` 的用户对象
3. 更新接口返回修改后的用户对象
4. 删除后再次查询，该用户不存在

---

## 3.11 代码生成器简介（可选）

MyBatis-Plus 提供了代码生成器（AutoGenerator），可以根据数据库表自动生成 Entity、Mapper、Service、Controller 代码。

### 引入代码生成器依赖

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>3.5.1</version>
</dependency>

<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity-engine-core</artifactId>
    <version>2.3</version>
</dependency>
```

### 基本用法

```java
// 代码生成器配置示例（放在 test 目录下）
FastAutoGenerator.create(url, username, password)
    // 全局配置
    .globalConfig(builder -> builder
        .author("Spring Boot 2.5 Tutorial")
        .outputDir("src/main/java")
    )
    // 包配置
    .packageConfig(builder -> builder
        .parent("com.example.blog")
    )
    // 策略配置
    .strategyConfig(builder -> builder
        .addInclude("user", "article", "category")  // 需要生成的表
        .entityBuilder()
            .enableLombok()
    )
    .execute();
```

> **建议**：代码生成器适合快速原型开发，但在教程学习中，建议手写代码以加深理解。

---

## 3.12 本章小结

在本章中，我们完成了以下工作：

1. **创建数据库**：建立了 blog_dev 数据库和 6 张核心数据表
2. **引入依赖**：添加了 MyBatis-Plus Starter（3.5.1，显式指定版本）和 MySQL 驱动（由 Spring Boot BOM 管理）
3. **配置数据源**：在 application-dev.yml 中配置了 MySQL 连接信息
4. **实体类映射**：使用 `@TableName`、`@TableId`、`@TableField` 注解完成 Entity 与数据表的映射
5. **Mapper 层**：继承 `BaseMapper<T>` 获得内置 CRUD 方法
6. **Service 层**：继承 `IService<T>` / `ServiceImpl<M, T>` 获得业务层封装
7. **Controller 层**：编写 RESTful 接口验证 CRUD 功能
8. **测试验证**：通过 curl 命令完成了增删改查全流程测试

### 下一章预告

在第 04 章中，我们将实现统一响应结果封装（Result）、全局异常处理（GlobalExceptionHandler），以及参数校验（Validation），让 API 接口更加规范、健壮。

---

> **本章源码**：参见 `03-database-mybatis/` 目录下的完整文件。
