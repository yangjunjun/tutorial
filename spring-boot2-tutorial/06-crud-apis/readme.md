# 第 06 章：RESTful API 实战 — 文章 CRUD

> **项目背景**：个人博客系统（前后端分离）
> **技术栈**：Spring Boot 2.5.12 / JDK 8 / MyBatis-Plus 3.5.1 / MySQL 8 / Maven

---

## 6.1 RESTful API 设计规范

### 6.1.1 什么是 RESTful？

REST（Representational State Transfer）是一种 Web API 设计风格。RESTful API 的核心思想是：

- **资源（Resource）**：URI 表示资源，如 `/api/articles` 表示"文章集合"
- **操作（Action）**：HTTP 方法表示操作，如 GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）
- **表述（Representation）**：JSON 格式传输数据

### 6.1.2 URL 设计原则

| 原则 | 正确示例 | 错误示例 |
|------|----------|----------|
| 使用名词，不用动词 | `/api/articles` | `/api/getArticles` |
| 使用复数形式 | `/api/articles/1` | `/api/article/1` |
| 层级嵌套表示关系 | `/api/articles/1/comments` | `/api/comments?articleId=1` |
| 小写字母 + 短横线 | `/api/user-profiles` | `/api/userProfiles` |
| 使用查询参数做过滤 | `/api/articles?categoryId=1` | `/api/articles/category/1` |

### 6.1.3 HTTP 方法语义

| HTTP 方法 | 语义 | 幂等性 | 安全性 | 示例 |
|-----------|------|--------|--------|------|
| GET | 查询资源 | 是 | 是 | `GET /api/articles/1` |
| POST | 创建资源 | 否 | 否 | `POST /api/articles` |
| PUT | 全量更新资源 | 是 | 否 | `PUT /api/articles/1` |
| PATCH | 部分更新资源 | 否 | 否 | `PATCH /api/articles/1` |
| DELETE | 删除资源 | 是 | 否 | `DELETE /api/articles/1` |

- **幂等性**：多次执行结果一致（GET 同一个 URL，结果不变）
- **安全性**：不修改服务端数据（GET 不会改变数据库）

### 6.1.4 HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | 查询、更新成功 |
| 201 Created | 资源创建成功 | POST 创建成功 |
| 204 No Content | 成功但无返回内容 | DELETE 成功 |
| 400 Bad Request | 请求参数错误 | 校验失败、参数不合法 |
| 401 Unauthorized | 未认证 | 未登录或 Token 过期 |
| 403 Forbidden | 无权限 | 无操作权限 |
| 404 Not Found | 资源不存在 | ID 不存在 |
| 500 Internal Server Error | 服务器内部错误 | 未知异常 |

> **本项目的设计选择**：为了前端处理简便，所有接口统一返回 HTTP 200（业务异常）或对应的标准状态码，
> 并通过 `Result` 对象中的 `code` 字段进一步区分业务状态。

---

## 6.2 博客系统 API 设计文档

### 6.2.1 文章模块

| 方法 | 路径 | 说明 | 请求体 | 响应 data |
|------|------|------|--------|-----------|
| POST | `/api/articles` | 创建文章 | ArticleCreateDTO | Long（文章 ID） |
| GET | `/api/articles/{id}` | 获取文章详情 | — | ArticleDetailVO |
| GET | `/api/articles` | 分页查询文章列表 | — | List\<ArticleVO\> |
| PUT | `/api/articles/{id}` | 更新文章 | ArticleUpdateDTO | Void |
| DELETE | `/api/articles/{id}` | 删除文章 | — | Void |

### 6.2.2 分类模块

| 方法 | 路径 | 说明 | 请求体 | 响应 data |
|------|------|------|--------|-----------|
| GET | `/api/categories` | 查询启用分类列表 | — | List\<Category\> |
| GET | `/api/categories/{id}` | 查询分类详情 | — | Category |
| POST | `/api/categories/admin` | 创建分类 | Category | Long（分类 ID） |
| PUT | `/api/categories/admin/{id}` | 更新分类 | Category | Void |
| DELETE | `/api/categories/admin/{id}` | 删除分类 | — | Void |

### 6.2.3 通用响应格式

```json
{
    "code": 200,
    "message": "操作成功",
    "data": { ... }
}
```

---

## 6.3 项目结构

```
src/main/java/com/example/blog/
├── common/                     # 通用组件（第 04、05 章已实现）
│   ├── Result.java             # 统一响应封装
│   ├── ResultCode.java         # 响应码枚举
│   ├── BusinessException.java  # 业务异常
│   └── GlobalExceptionHandler.java  # 全局异常处理器
├── controller/                 # Controller 层
│   ├── ArticleController.java  # 文章 API
│   └── CategoryController.java # 分类 API
├── service/                    # Service 接口层
│   ├── ArticleService.java     # 文章 Service 接口
│   └── CategoryService.java    # 分类 Service 接口
├── service/impl/               # Service 实现层
│   ├── ArticleServiceImpl.java # 文章 Service 实现
│   └── CategoryServiceImpl.java # 分类 Service 实现
├── dto/                        # 数据传输对象（第 05 章已实现）
│   ├── ArticleCreateDTO.java
│   └── ArticleUpdateDTO.java
├── vo/                         # 视图对象
│   ├── ArticleVO.java          # 文章列表 VO
│   └── ArticleDetailVO.java    # 文章详情 VO
├── entity/                     # 数据库实体
│   ├── Article.java            # 文章实体
│   ├── Category.java           # 分类实体
│   └── User.java               # 用户实体
└── mapper/                     # MyBatis-Plus Mapper
    ├── ArticleMapper.java
    ├── CategoryMapper.java
    └── UserMapper.java
```

---

## 6.4 数据库表结构

### 6.4.1 文章表（article）

```sql
CREATE TABLE `article` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `title`        VARCHAR(100) NOT NULL COMMENT '文章标题',
  `content`      LONGTEXT     NOT NULL COMMENT '文章内容（Markdown）',
  `summary`      VARCHAR(300) DEFAULT NULL COMMENT '文章摘要',
  `cover_image`  VARCHAR(500) DEFAULT NULL COMMENT '封面图片 URL',
  `category_id`  BIGINT       NOT NULL COMMENT '分类 ID',
  `author_id`    BIGINT       NOT NULL COMMENT '作者 ID',
  `view_count`   INT          DEFAULT 0 COMMENT '浏览量',
  `like_count`   INT          DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT         DEFAULT 0 COMMENT '评论数',
  `status`       TINYINT      DEFAULT 1 COMMENT '状态：1-已发布，0-草稿，-1-已删除',
  `create_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`   TINYINT      DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';
```

### 6.4.2 分类表（category）

```sql
CREATE TABLE `category` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `name`        VARCHAR(50)  NOT NULL COMMENT '分类名称',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
  `sort_order`  INT          DEFAULT 0 COMMENT '排序序号',
  `status`      TINYINT      DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`  TINYINT      DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类表';
```

### 6.4.3 用户表（user）

```sql
CREATE TABLE `user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `username`    VARCHAR(50)  NOT NULL COMMENT '用户名',
  `password`    VARCHAR(100) NOT NULL COMMENT '密码（BCrypt 加密）',
  `nickname`    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
  `email`       VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `avatar`      VARCHAR(500) DEFAULT NULL COMMENT '头像 URL',
  `role`        VARCHAR(20)  DEFAULT 'user' COMMENT '角色：user/admin',
  `status`      TINYINT      DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`  TINYINT      DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 6.4.4 初始化测试数据

```sql
-- 插入测试用户
INSERT INTO `user` (username, password, nickname, email, role, status)
VALUES ('admin', '$2a$10$xxx', '管理员', 'admin@blog.com', 'admin', 1);

-- 插入测试分类
INSERT INTO `category` (name, description, sort_order, status) VALUES
('技术分享', '技术类文章', 1, 1),
('生活随笔', '生活感悟', 2, 1),
('读书笔记', '读书心得', 3, 1);

-- 插入测试文章
INSERT INTO `article` (title, content, summary, category_id, author_id, status)
VALUES
('Spring Boot 2.5 入门指南', '# Spring Boot 2.5\n\n这是一篇入门教程...', 'Spring Boot 2.5 快速上手', 1, 1, 1),
('我的 2024 年终总结', '# 2024 回顾\n\n时光飞逝...', '回顾 2024 年的成长', 2, 1, 1);
```

---

## 6.5 Entity 实体类

### 6.5.1 Article 实体

**文件**：`src/main/java/com/example/blog/entity/Article.java`（本章已创建，供 Service/Mapper 编译使用）

```java
package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("article")
public class Article {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private String content;
    private String summary;
    private String coverImage;
    private Long categoryId;
    private Long authorId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer isDeleted;

    // getter/setter 省略...
}
```

### 6.5.2 Category 实体

**文件**：`src/main/java/com/example/blog/entity/Category.java`（本章已创建）

包含 id、name、description、sortOrder、status、createTime、updateTime、isDeleted 字段。

---

## 6.6 VO 视图对象

### 6.6.1 为什么要区分 Entity、DTO、VO？

```
前端请求 → [DTO] → Controller → Service → Mapper → 数据库
数据库   → [Entity] → Service → [VO] → Controller → 前端响应
```

| 对象 | 方向 | 用途 |
|------|------|------|
| DTO（Data Transfer Object） | 前端 → 后端 | 接收前端提交的创建/更新数据 |
| Entity | 后端 ↔ 数据库 | 与数据库表一一对应 |
| VO（View Object） | 后端 → 前端 | 返回给前端展示的数据，可按需裁剪字段 |

**ArticleVO** vs **ArticleDetailVO**：
- `ArticleVO` — 列表页使用，不含 `content` 字段（减少传输量）
- `ArticleDetailVO` — 详情页使用，含 `content`、作者信息、分类名称等完整数据

### 6.6.2 ArticleVO

**文件**：`src/main/java/com/example/blog/vo/ArticleVO.java`（本章已创建）

包含文章列表展示所需的核心字段：id、title、summary、coverImage、categoryName、authorName、viewCount、createTime 等。

### 6.6.3 ArticleDetailVO

**文件**：`src/main/java/com/example/blog/vo/ArticleDetailVO.java`（本章已创建）

包含文章详情页的完整信息：content、authorNickname、authorAvatar、categoryName、tags 列表等。

---

## 6.7 DTO 到 Entity 的转换

### 6.7.1 手动转换（本项目采用）

在 `ArticleServiceImpl.createArticle()` 中：

```java
// DTO → Entity 转换
Article article = new Article();
article.setTitle(dto.getTitle());
article.setContent(dto.getContent());
article.setCategoryId(dto.getCategoryId());
article.setAuthorId(authorId);
article.setCoverImage(dto.getCoverImage());

// 自动生成摘要
// 注意：JDK 8 中 String 没有 isBlank()，使用 trim().isEmpty() 等价判断
if (dto.getSummary() != null && !dto.getSummary().trim().isEmpty()) {
    article.setSummary(dto.getSummary());
} else {
    article.setSummary(generateSummary(dto.getContent()));
}

// 设置默认值
article.setViewCount(0);
article.setLikeCount(0);
article.setCommentCount(0);
article.setStatus(1);
```

**优点**：简单直观，无额外依赖，适合中小项目。
**缺点**：字段多时代码冗长。

### 6.7.2 使用 MapStruct（进阶推荐）

MapStruct 是一个编译时代码生成器，自动生成 Bean 映射代码（JDK 8 环境推荐使用 1.5.x 版本）：

```java
// 1. 添加依赖
// <dependency>
//     <groupId>org.mapstruct</groupId>
//     <artifactId>mapstruct</artifactId>
//     <version>1.5.5.Final</version>
// </dependency>

// 2. 定义 Mapper 接口
@Mapper(componentModel = "spring")
public interface ArticleConverter {

    @Mapping(target = "id", ignore = true)           // 创建时忽略 id
    @Mapping(target = "authorId", source = "authorId")
    @Mapping(target = "viewCount", ignore = true)    // 忽略统计字段
    @Mapping(target = "likeCount", ignore = true)
    @Mapping(target = "commentCount", ignore = true)
    @Mapping(target = "createTime", ignore = true)
    @Mapping(target = "updateTime", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Article toEntity(ArticleCreateDTO dto, Long authorId);
}

// 3. 在 Service 中使用
@Autowired
private ArticleConverter articleConverter;

Article article = articleConverter.toEntity(dto, authorId);
```

> 本项目采用手动转换方式，后续如果需要重构，可以切换到 MapStruct。

---

## 6.8 Controller 层代码讲解

### 6.8.1 ArticleController 要点

```java
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    // 创建文章 — POST /api/articles
    @PostMapping
    public Result<Long> createArticle(@Validated @RequestBody ArticleCreateDTO dto) {
        Long currentUserId = 1L; // 后续从 JWT 中获取
        Long articleId = articleService.createArticle(dto, currentUserId);
        return Result.success("文章创建成功", articleId);
    }

    // 获取详情 — GET /api/articles/{id}
    @GetMapping("/{id}")
    public Result<ArticleDetailVO> getArticleDetail(@PathVariable Long id) {
        ArticleDetailVO detail = articleService.getArticleDetail(id);
        return Result.success(detail);
    }

    // 列表查询 — GET /api/articles?pageNum=1&pageSize=10&categoryId=1
    @GetMapping
    public Result<List<ArticleVO>> listArticles(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long categoryId) {
        List<ArticleVO> articles = articleService.listArticles(pageNum, pageSize, categoryId);
        return Result.success(articles);
    }

    // 更新文章 — PUT /api/articles/{id}
    @PutMapping("/{id}")
    public Result<Void> updateArticle(@PathVariable Long id,
                                      @Validated @RequestBody ArticleUpdateDTO dto) {
        dto.setId(id); // 路径参数 ID 覆盖请求体 ID
        Long currentUserId = 1L;
        articleService.updateArticle(dto, currentUserId);
        return Result.success();
    }

    // 删除文章 — DELETE /api/articles/{id}
    @DeleteMapping("/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        Long currentUserId = 1L;
        articleService.deleteArticle(id, currentUserId);
        return Result.success();
    }
}
```

**关键设计点**：
1. `@Validated @RequestBody` — 触发 DTO 上的校验注解
2. `@PathVariable Long id` — RESTful 风格的资源标识
3. `dto.setId(id)` — 确保路径 ID 与请求体 ID 一致，防止篡改
4. `currentUserId` — 暂时硬编码，后续章节通过 JWT + 拦截器自动注入

### 6.8.2 CategoryController 要点

```java
@RestController
@RequestMapping("/api/categories")
@Validated // 类级别 @Validated，支持方法参数校验
public class CategoryController {

    // GET /api/categories/{id} — 方法参数上的 @Min 校验
    @GetMapping("/{id}")
    public Result<Category> getCategoryById(
            @PathVariable @Min(value = 1, message = "分类 ID 必须大于 0") Long id) {
        Category category = categoryService.getCategoryById(id);
        if (category == null) {
            return Result.fail(404, "分类不存在");
        }
        return Result.success(category);
    }
}
```

**注意**：类上标注 `@Validated` 后，方法参数上的校验注解（如 `@Min`，来自 `javax.validation.constraints` 包）才能生效。校验失败时抛出 `javax.validation.ConstraintViolationException`，由全局异常处理器捕获。

---

## 6.9 Service 层业务逻辑讲解

### 6.9.1 创建文章流程

```
ArticleCreateDTO
      │
      ▼
  ① 校验分类是否存在 → 不存在则抛出 BusinessException
      │
      ▼
  ② DTO → Entity 转换
      │
      ▼
  ③ 自动生成摘要（如果未提供）
      │
      ▼
  ④ 设置默认值（viewCount=0, status=1）
      │
      ▼
  ⑤ articleMapper.insert(article)
      │
      ▼
  ⑥ 返回 article.getId()
```

**核心代码**：

```java
@Override
@Transactional(rollbackFor = Exception.class)
public Long createArticle(ArticleCreateDTO dto, Long authorId) {
    // 1. 校验分类
    Category category = categoryMapper.selectById(dto.getCategoryId());
    if (category == null) {
        throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
    }

    // 2. DTO → Entity
    Article article = new Article();
    article.setTitle(dto.getTitle());
    article.setContent(dto.getContent());
    article.setCategoryId(dto.getCategoryId());
    article.setAuthorId(authorId);
    article.setCoverImage(dto.getCoverImage());

    // 3. 自动摘要
    if (dto.getSummary() != null && !dto.getSummary().trim().isEmpty()) {
        article.setSummary(dto.getSummary());
    } else {
        article.setSummary(generateSummary(dto.getContent()));
    }

    // 4. 默认值
    article.setViewCount(0);
    article.setLikeCount(0);
    article.setCommentCount(0);
    article.setStatus(1);

    // 5. 插入
    articleMapper.insert(article);
    return article.getId();
}
```

### 6.9.2 查询文章详情流程

```
  ① 根据 ID 查询文章 → 不存在则抛出 BusinessException
      │
      ▼
  ② 浏览量 +1（使用 SQL 原子操作避免并发问题）
      │
      ▼
  ③ Entity → ArticleDetailVO
      │
      ▼
  ④ 关联查询分类名称
      │
      ▼
  ⑤ 关联查询作者信息（昵称、头像）
      │
      ▼
  ⑥ 返回 ArticleDetailVO
```

**浏览量原子更新**（避免并发覆盖）：

```java
LambdaUpdateWrapper<Article> updateWrapper = new LambdaUpdateWrapper<Article>();
updateWrapper.eq(Article::getId, id)
        .setSql("view_count = view_count + 1");
articleMapper.update(null, updateWrapper);
```

### 6.9.3 分页查询的 N+1 问题优化

在列表查询中，如果逐条查询每篇文章的分类和作者信息，会产生 N+1 查询问题：

```
查询文章列表       → 1 次 SQL
查询文章 1 的分类  → 1 次 SQL
查询文章 2 的分类  → 1 次 SQL
...               → N 次 SQL
总计：1 + N 次 SQL
```

**优化方案**：批量查询 + Map 映射（JDK 8 下不能使用 `var`，需显式声明 `Map` 类型）：

```java
// 1. 提取所有分类 ID（去重）
List<Long> categoryIds = articles.stream()
        .map(Article::getCategoryId)
        .distinct()
        .collect(Collectors.toList());

// 2. 批量查询分类（1 次 SQL）
List<Category> categories = categoryMapper.selectBatchIds(categoryIds);

// 3. 构建 Map（注意：JDK 8 中显式声明类型，不能写 var）
Map<Long, String> categoryMap = categories.stream()
        .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

// 4. 转换时直接从 Map 取值
vo.setCategoryName(categoryMap.getOrDefault(article.getCategoryId(), "未知分类"));
```

优化后只需 3 次 SQL：查文章 + 查分类 + 查作者。

### 6.9.4 删除文章的权限检查

```java
@Override
@Transactional(rollbackFor = Exception.class)
public void deleteArticle(Long id, Long operatorId) {
    Article article = articleMapper.selectById(id);
    if (article == null) {
        throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
    }

    // 权限检查：只有作者本人可以删除
    if (!article.getAuthorId().equals(operatorId)) {
        throw new BusinessException(ResultCode.FORBIDDEN, "只有作者本人可以删除此文章");
    }

    // 逻辑删除
    articleMapper.deleteById(id);
}
```

---

## 6.10 Entity 到 VO 的转换

### 6.10.1 列表转换（Entity → ArticleVO）

```java
// 在 Service 层完成转换
ArticleVO vo = new ArticleVO();
vo.setId(article.getId());
vo.setTitle(article.getTitle());
vo.setSummary(article.getSummary());
vo.setCoverImage(article.getCoverImage());
vo.setCategoryId(article.getCategoryId());
vo.setCategoryName(categoryMap.getOrDefault(article.getCategoryId(), "未知分类"));
vo.setAuthorId(article.getAuthorId());
vo.setAuthorName(authorMap.getOrDefault(article.getAuthorId(), "匿名用户"));
vo.setViewCount(article.getViewCount());
vo.setCreateTime(article.getCreateTime());
```

### 6.10.2 详情转换（Entity → ArticleDetailVO）

```java
// 除了基本字段，还关联查询了作者和分类信息
ArticleDetailVO vo = new ArticleDetailVO();
// ... 基本字段赋值 ...

// 关联分类
Category category = categoryMapper.selectById(article.getCategoryId());
if (category != null) {
    vo.setCategoryName(category.getName());
}

// 关联作者
User author = userMapper.selectById(article.getAuthorId());
if (author != null) {
    vo.setAuthorNickname(author.getNickname());
    vo.setAuthorAvatar(author.getAvatar());
}
```

---

## 6.11 使用 curl 测试 API

### 6.11.1 分类接口测试

**创建分类**：
```bash
# 创建"技术分享"分类
curl -X POST http://localhost:8080/api/categories/admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "技术分享",
    "description": "技术类文章分类",
    "sortOrder": 1
  }'

# 预期响应
{
    "code": 200,
    "message": "分类创建成功",
    "data": 1
}
```

**查询分类列表**：
```bash
curl -X GET http://localhost:8080/api/categories

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "技术分享",
            "description": "技术类文章分类",
            "sortOrder": 1,
            "status": 1,
            "createTime": "2024-01-01T00:00:00",
            "updateTime": "2024-01-01T00:00:00"
        }
    ]
}
```

**删除分类（分类下有文章时失败）**：
```bash
curl -X DELETE http://localhost:8080/api/categories/admin/1

# 预期响应（分类下有文章）
{
    "code": 1005,
    "message": "分类 '技术分享' 下有 3 篇文章，无法删除",
    "data": null
}
```

### 6.11.2 文章接口测试

**创建文章**：
```bash
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Boot 2.5 入门指南",
    "content": "# Spring Boot 2.5\n\n这是一篇关于 Spring Boot 2.5 的入门教程，涵盖了以下内容：\n\n1. 环境搭建\n2. 项目创建\n3. 配置文件\n4. 依赖管理\n\n## 环境搭建\n\n首先需要安装 JDK 8 和 Maven 3.6+...",
    "categoryId": 1,
    "summary": "Spring Boot 2.5 快速上手指南",
    "coverImage": "https://example.com/images/spring-boot-2.jpg"
  }'

# 预期响应
{
    "code": 200,
    "message": "文章创建成功",
    "data": 1
}
```

**创建文章 — 参数校验失败**：
```bash
# 标题为空，内容不足 10 字
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "content": "短",
    "categoryId": 1
  }'

# 预期响应
{
    "code": 400,
    "message": "文章标题不能为空; 文章内容至少需要 10 个字符",
    "data": null
}
```

**获取文章详情**：
```bash
curl -X GET http://localhost:8080/api/articles/1

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "title": "Spring Boot 2.5 入门指南",
        "content": "# Spring Boot 2.5\n\n这是一篇...",
        "summary": "Spring Boot 2.5 快速上手指南",
        "coverImage": "https://example.com/images/spring-boot-2.jpg",
        "categoryId": 1,
        "categoryName": "技术分享",
        "authorId": 1,
        "authorNickname": "管理员",
        "authorAvatar": null,
        "viewCount": 1,
        "likeCount": 0,
        "commentCount": 0,
        "tags": [],
        "status": 1,
        "createTime": "2024-01-01T10:00:00",
        "updateTime": "2024-01-01T10:00:00"
    }
}
```

**查询文章列表**：
```bash
# 查询第 1 页，每页 5 条，分类 ID=1
curl -X GET "http://localhost:8080/api/articles?pageNum=1&pageSize=5&categoryId=1"

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "title": "Spring Boot 2.5 入门指南",
            "summary": "Spring Boot 2.5 快速上手指南",
            "coverImage": "https://example.com/images/spring-boot-2.jpg",
            "categoryId": 1,
            "categoryName": "技术分享",
            "authorId": 1,
            "authorName": "管理员",
            "viewCount": 15,
            "likeCount": 3,
            "commentCount": 2,
            "status": 1,
            "createTime": "2024-01-01T10:00:00",
            "updateTime": "2024-01-01T10:00:00"
        }
    ]
}
```

**更新文章**：
```bash
curl -X PUT http://localhost:8080/api/articles/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "title": "Spring Boot 2.5 入门指南（更新版）",
    "content": "# Spring Boot 2.5\n\n更新后的完整内容...",
    "categoryId": 1,
    "summary": "更新后的摘要"
  }'

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

**删除文章**：
```bash
curl -X DELETE http://localhost:8080/api/articles/1

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

**删除不存在的文章**：
```bash
curl -X DELETE http://localhost:8080/api/articles/999

# 预期响应
{
    "code": 1003,
    "message": "文章不存在",
    "data": null
}
```

---

## 6.12 本章小结

### 6.12.1 知识点回顾

| 知识点 | 要点 |
|--------|------|
| RESTful 设计 | 名词 URI + HTTP 方法语义 + 合理状态码 |
| 三层架构 | Controller（参数接收）→ Service（业务逻辑）→ Mapper（数据库操作） |
| DTO/Entity/VO | 入参用 DTO、数据库用 Entity、出参用 VO，职责分离 |
| 参数校验 | Controller 层用 @Validated 触发，Service 层做业务校验 |
| 统一响应 | 所有接口返回 Result\<T\>，异常由 GlobalExceptionHandler 处理 |
| N+1 优化 | 批量查询关联数据 + Map 映射，减少 SQL 次数 |
| 事务管理 | 使用 @Transactional 保证数据一致性 |
| 权限检查 | Service 层校验操作人是否为资源所有者 |

### 6.12.2 核心文件清单

| 文件 | 作用 |
|------|------|
| `ArticleController.java` | 文章 CRUD 接口（5 个端点） |
| `CategoryController.java` | 分类 CRUD 接口（5 个端点） |
| `ArticleService.java` | 文章 Service 接口定义 |
| `ArticleServiceImpl.java` | 文章 Service 实现（含完整业务逻辑） |
| `CategoryService.java` | 分类 Service 接口定义 |
| `CategoryServiceImpl.java` | 分类 Service 实现 |
| `ArticleVO.java` | 文章列表展示对象 |
| `ArticleDetailVO.java` | 文章详情展示对象 |
| `Article.java` | 文章实体类（配合 Service/Mapper 编译） |
| `Category.java` | 分类实体类 |
| `User.java` | 用户实体类（最小化版本，配合关联查询） |
| `ArticleMapper.java` | 文章 Mapper 接口 |
| `CategoryMapper.java` | 分类 Mapper 接口 |
| `UserMapper.java` | 用户 Mapper 接口 |

### 6.12.3 下一步

下一章我们将实现 **统一分页查询** — 封装通用的分页响应对象，并集成 MyBatis-Plus 的分页插件，让所有列表接口都支持标准化的分页功能。
