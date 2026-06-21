# 第 09 章：分页与高级查询——让博客文章列表"活"起来

> **本章目标**：掌握 MyBatis-Plus 的分页查询和条件构造器，实现文章列表的多条件筛选、排序、模糊搜索和多表联查，设计通用的分页响应 VO。
>
> **前置章节**：第 01-08 章（项目搭建、MyBatis-Plus 基础、Spring Security 配置）
>
> **本章代码目录**：`09-pagination-query/src/main/java/com/example/blog/`

---

## 目录

1. [MyBatis-Plus 分页插件配置](#1-mybatis-plus-分页插件配置)
2. [Page 对象使用方式](#2-page-对象使用方式)
3. [条件构造器 LambdaQueryWrapper 详解](#3-条件构造器-lambdaquerywrapper-详解)
4. [文章查询 DTO 设计](#4-文章查询-dto-设计)
5. [分页响应 VO 设计](#5-分页响应-vo-设计)
6. [文章列表 VO 设计（精简版）](#6-文章列表-vo-设计精简版)
7. [Mapper 层：自定义多表联查](#7-mapper-层自定义多表联查)
8. [XML 映射文件：复杂 SQL](#8-xml-映射文件复杂-sql)
9. [Service 层：分页查询逻辑](#9-service-层分页查询逻辑)
10. [Controller 层：分页接口实现](#10-controller-层分页接口实现)
11. [排序实现](#11-排序实现)
12. [模糊搜索实现](#12-模糊搜索实现)
13. [前端分页参数传递约定](#13-前端分页参数传递约定)
14. [测试各种查询场景](#14-测试各种查询场景)
15. [本章小结](#15-本章小结)

---

## 1. MyBatis-Plus 分页插件配置

### 1.1 为什么需要分页插件？

MyBatis-Plus 默认**不具备**自动分页能力。如果不配置分页插件，调用 `selectPage()` 方法时会直接返回所有记录，不会执行 `LIMIT` 分页。

分页插件的工作原理：

```
原始 SQL：
SELECT * FROM blog_article WHERE status = 1

↓ 分页插件拦截并改写

实际执行的 SQL：
-- 第一步：统计总记录数
SELECT COUNT(*) FROM blog_article WHERE status = 1
-- 第二步：查询当前页数据
SELECT * FROM blog_article WHERE status = 1 LIMIT 10 OFFSET 0
```

### 1.2 配置分页插件

**文件**：`src/main/java/com/example/blog/config/MybatisPlusConfig.java`

```java
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        // 创建 MyBatis-Plus 总拦截器
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 添加分页插件
        PaginationInnerInterceptor paginationInterceptor =
            new PaginationInnerInterceptor();

        // 设置数据库类型为 MySQL
        paginationInterceptor.setDbType(DbType.MYSQL);

        // 设置单页最大记录数上限（安全限制）
        paginationInterceptor.setMaxLimit(500L);

        // 注册到总拦截器
        interceptor.addInnerInterceptor(paginationInterceptor);

        return interceptor;
    }
}
```

### 1.3 配置要点

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `DbType` | 数据库类型，影响分页 SQL 的生成 | `DbType.MYSQL` |
| `maxLimit` | 单页最大记录数，防止一次查询过多 | `500L` |
| `overflow` | 页码溢出处理（true=返回首页） | `false` |

### 1.4 不同数据库的分页语法

| 数据库 | 分页语法 |
|--------|---------|
| MySQL | `LIMIT offset, size` |
| PostgreSQL | `LIMIT size OFFSET offset` |
| Oracle | `SELECT * FROM (...) WHERE ROWNUM BETWEEN ? AND ?` |
| SQL Server | `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY` |

设置正确的 `DbType` 后，分页插件会自动生成对应数据库的分页 SQL。

---

## 2. Page 对象使用方式

### 2.1 Page 对象核心属性

```java
// 创建 Page 对象（当前页码从 1 开始）
Page<Article> page = new Page<>(1, 10);

// 主要属性
page.getCurrent();   // 当前页码：1
page.getSize();      // 每页大小：10
page.getTotal();     // 总记录数（查询后填充）
page.getPages();     // 总页数（查询后自动计算）
page.getRecords();   // 当前页数据列表（查询后填充）
```

### 2.2 基本分页查询

```java
// 方式一：简单分页查询（单表）
Page<Article> page = new Page<>(1, 10);
LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(Article::getStatus, 1);
Page<Article> result = articleMapper.selectPage(page, wrapper);

// 方式二：自定义 SQL 分页查询（多表联查）
Page<ArticleListVO> page = new Page<>(1, 10);
IPage<ArticleListVO> result = articleMapper.selectArticlePage(
    page, categoryId, status, keyword, sortBy, sortOrder
);
```

### 2.3 Page 对象的数学关系

```
total = 156（总记录数）
size  = 10 （每页条数）
pages = 16 （总页数 = ceil(156/10)）

第 1 页：OFFSET 0,  LIMIT 10  → 记录 1-10
第 2 页：OFFSET 10, LIMIT 10  → 记录 11-20
第 16 页：OFFSET 150, LIMIT 10 → 记录 151-156（最后 6 条）
```

---

## 3. 条件构造器 LambdaQueryWrapper 详解

### 3.1 为什么用 LambdaQueryWrapper？

MyBatis-Plus 提供了两种条件构造器：

| 类型 | 示例 | 优缺点 |
|------|------|--------|
| `QueryWrapper` | `.eq("status", 1)` | 列名硬编码为字符串，容易拼写错误 |
| **`LambdaQueryWrapper`** | `.eq(Article::getStatus, 1)` | **方法引用，编译时检查，推荐** |

### 3.2 常用条件方法

```java
LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();

// ===== 等值查询 =====
wrapper.eq(Article::getStatus, 1);
// WHERE status = 1

// ===== 不等于 =====
wrapper.ne(Article::getStatus, 2);
// WHERE status != 2

// ===== 范围查询 =====
wrapper.between(Article::getViewCount, 100, 1000);
// WHERE view_count BETWEEN 100 AND 1000

// ===== 大于/小于 =====
wrapper.gt(Article::getViewCount, 100);    // > 100
wrapper.ge(Article::getViewCount, 100);    // >= 100
wrapper.lt(Article::getViewCount, 1000);   // < 1000
wrapper.le(Article::getViewCount, 1000);   // <= 1000

// ===== 模糊查询 =====
wrapper.like(Article::getTitle, "Spring");
// WHERE title LIKE '%Spring%'

wrapper.likeLeft(Article::getTitle, "指南");
// WHERE title LIKE '%指南'

wrapper.likeRight(Article::getTitle, "Spring");
// WHERE title LIKE 'Spring%'

// ===== IN 查询 =====
wrapper.in(Article::getCategoryId, 1, 2, 3);
// WHERE category_id IN (1, 2, 3)

// ===== IS NULL / IS NOT NULL =====
wrapper.isNull(Article::getCoverImage);
// WHERE cover_image IS NULL

// ===== 排序 =====
wrapper.orderByDesc(Article::getCreateTime);
// ORDER BY create_time DESC

wrapper.orderByAsc(Article::getViewCount);
// ORDER BY view_count ASC

// ===== 条件拼接（动态条件）=====
// 第二个参数为 true 时才添加该条件
wrapper.eq(categoryId != null, Article::getCategoryId, categoryId);
// 如果 categoryId 为 null，则跳过该条件
```

### 3.3 组合查询示例

```java
LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();

// 组合多个条件
wrapper.eq(Article::getStatus, 1)                   // 已发布
       .eq(Article::getCategoryId, 1)               // 分类 ID = 1
       .like(Article::getTitle, "Spring")           // 标题包含 Spring
       .orderByDesc(Article::getCreateTime)         // 按创建时间降序
       .last("LIMIT 10");                           // 追加原生 SQL

Page<Article> page = new Page<>(1, 10);
articleMapper.selectPage(page, wrapper);
```

---

## 4. 文章查询 DTO 设计

**文件**：`src/main/java/com/example/blog/dto/ArticleQueryDTO.java`

### 4.1 设计原则

查询 DTO 需要考虑：
- **参数可选性**：所有筛选条件都应该是可选的
- **合理默认值**：分页参数、排序字段要有合理的默认值
- **安全性**：排序字段需要白名单校验

### 4.2 完整字段设计

```java
@Data
public class ArticleQueryDTO {
    // ===== 分页参数 =====
    private Integer current = 1;       // 当前页码（默认第 1 页）
    private Integer size = 10;         // 每页条数（默认 10 条）

    // ===== 筛选条件 =====
    private String keyword;            // 搜索关键词
    private Long categoryId;           // 分类 ID
    private Long tagId;                // 标签 ID
    private Integer status;            // 文章状态

    // ===== 排序参数 =====
    private String sortBy = "createTime";   // 排序字段
    private String sortOrder = "desc";       // 排序方向
}
```

### 4.3 为什么排序字段需要默认值？

如果不设置默认值，当前端不传排序参数时，SQL 中的 `ORDER BY` 子句可能为 null，导致查询结果顺序不确定。设置默认值可以保证每次查询都有明确的排序规则。

---

## 5. 分页响应 VO 设计

### 5.1 为什么需要 PageVO？

MyBatis-Plus 的 `Page` 对象包含很多内部字段（如 searchCount、optimizeCountSql 等），直接返回给前端会暴露实现细节。PageVO 是一个**精简的、面向前端的**分页数据包装。

### 5.2 通用泛型设计

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageVO<T> {
    private List<T> records;   // 当前页数据
    private Long total;        // 总记录数
    private Long size;         // 每页条数
    private Long current;      // 当前页码
    private Long pages;        // 总页数
}
```

使用泛型 `<T>` 使其适用于各种分页场景：

```java
PageVO<ArticleListVO>  // 文章列表分页
PageVO<CommentVO>      // 评论列表分页
PageVO<UserVO>         // 用户列表分页
```

### 5.3 静态工厂方法

```java
// 从 MyBatis-Plus 的 Page 对象快速转换
public static <T> PageVO<T> of(Page<?> page, List<T> records) {
    return PageVO.<T>builder()
            .records(records)
            .total(page.getTotal())
            .size(page.getSize())
            .current(page.getCurrent())
            .pages(page.getPages())
            .build();
}
```

---

## 6. 文章列表 VO 设计（精简版）

### 6.1 列表页 vs 详情页

| 字段 | 列表页（ArticleListVO） | 详情页 |
|------|------------------------|--------|
| 标题 | ✅ | ✅ |
| 摘要 | ✅ | ✅ |
| 全文内容 | ❌（数据量大） | ✅ |
| 封面图 | ✅ | ✅ |
| 分类 ID | ✅ | ✅ |
| 分类名 | ✅（联查获得） | ✅ |
| 作者名 | ✅（联查获得） | ✅ |
| 标签列表 | ✅（额外查询） | ✅ |
| 浏览量/点赞数 | ✅ | ✅ |
| 创建时间 | ✅ | ✅ |

### 6.2 为什么不返回全文内容？

假设一篇文章有 5000 字（约 15KB），一页显示 10 篇文章，那么单页响应数据约 150KB——而这 150KB 中大部分是用户在列表页看不到的。分页接口应该**尽量轻量**。

---

## 7. Mapper 层：自定义多表联查

### 7.1 为什么需要自定义 SQL？

MyBatis-Plus 的 BaseMapper 只支持**单表** CRUD。文章列表需要展示：
- 分类名（来自 `blog_category` 表）
- 作者名（来自 `blog_user` 表）

这需要 JOIN 多张表，超出了 BaseMapper 的能力范围。

### 7.2 Mapper 接口定义

**文件**：`src/main/java/com/example/blog/mapper/ArticleMapper.java`

```java
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {

    /**
     * 分页查询文章列表（多表联查）
     * 注意：第一个参数是 Page 对象，分页插件会自动拦截
     */
    IPage<ArticleListVO> selectArticlePage(
        Page<ArticleListVO> page,
        @Param("categoryId") Long categoryId,
        @Param("status") Integer status,
        @Param("keyword") String keyword,
        @Param("sortBy") String sortBy,
        @Param("sortOrder") String sortOrder
    );

    /**
     * 根据标签 ID 分页查询
     */
    IPage<ArticleListVO> selectArticlePageByTagId(
        Page<ArticleListVO> page,
        @Param("tagId") Long tagId,
        @Param("status") Integer status
    );
}
```

### 7.3 关键设计决策

| 决策 | 说明 |
|------|------|
| 返回 `IPage<ArticleListVO>` | 直接返回 VO，不需要在 Service 层手动转换 |
| 使用 `@Param` 注解 | XML 中通过参数名引用，可读性好 |
| 第一个参数为 Page | MyBatis-Plus 分页插件通过拦截 Page 参数实现分页 |

---

## 8. XML 映射文件：复杂 SQL

### 8.1 多表联查 SQL 设计

**文件**：`src/main/resources/mapper/ArticleMapper.xml`

```
表关系：
blog_article (a)
  ├── LEFT JOIN blog_category (c) ON a.category_id = c.id
  ├── LEFT JOIN blog_user (u) ON a.author_id = u.id
  └── INNER JOIN blog_article_tag (at) ON a.id = at.article_id  -- 按标签查时
         └── tag_id = #{tagId}
```

### 8.2 动态条件 SQL

使用 MyBatis 的 `<where>` 和 `<if>` 标签实现动态条件拼接：

```xml
<select id="selectArticlePage" resultMap="ArticleListResultMap">
    SELECT
        a.id, a.title, a.summary, a.cover_image,
        a.category_id, c.name AS category_name,
        a.author_id, u.nickname AS author_name,
        a.view_count, a.like_count, a.comment_count,
        a.status, a.create_time, a.update_time
    FROM blog_article a
    LEFT JOIN blog_category c ON a.category_id = c.id
    LEFT JOIN blog_user u ON a.author_id = u.id
    <where>
        <if test="categoryId != null">
            AND a.category_id = #{categoryId}
        </if>
        <if test="status != null">
            AND a.status = #{status}
        </if>
        <if test="keyword != null and keyword != ''">
            AND (a.title LIKE CONCAT('%', #{keyword}, '%')
                 OR a.summary LIKE CONCAT('%', #{keyword}, '%'))
        </if>
    </where>
    ORDER BY
    <choose>
        <when test="sortBy == 'viewCount'">a.view_count</when>
        <when test="sortBy == 'likeCount'">a.like_count</when>
        <when test="sortBy == 'updateTime'">a.update_time</when>
        <otherwise>a.create_time</otherwise>
    </choose>
    <choose>
        <when test="sortOrder == 'asc'">ASC</when>
        <otherwise>DESC</otherwise>
    </choose>
</select>
```

### 8.3 为什么用 `<choose>` 而不是 `${}`？

排序字段是动态传入的，如果使用 `${sortBy}` 直接拼接 SQL：

```xml
<!-- ❌ 危险！有 SQL 注入风险 -->
ORDER BY ${sortBy} ${sortOrder}
```

攻击者可以传入 `sortBy = "id; DROP TABLE blog_article"` 来注入恶意 SQL。

使用 `<choose>` 标签做白名单匹配：

```xml
<!-- ✅ 安全！只允许预定义的字段 -->
ORDER BY
<choose>
    <when test="sortBy == 'viewCount'">a.view_count</when>
    <when test="sortBy == 'likeCount'">a.like_count</when>
    <otherwise>a.create_time</otherwise>
</choose>
```

### 8.4 按标签查询的中间表关联

```xml
<select id="selectArticlePageByTagId" resultMap="ArticleListResultMap">
    SELECT a.id, a.title, ...
    FROM blog_article a
    INNER JOIN blog_article_tag at ON a.id = at.article_id
    LEFT JOIN blog_category c ON a.category_id = c.id
    LEFT JOIN blog_user u ON a.author_id = u.id
    WHERE at.tag_id = #{tagId}
    <if test="status != null">
        AND a.status = #{status}
    </if>
    ORDER BY a.create_time DESC
</select>
```

---

## 9. Service 层：分页查询逻辑

### 9.1 核心流程

```
前端请求参数（ArticleQueryDTO）
          │
          ▼
    ┌──────────────┐
    │ 参数校验与    │  校验分页范围、排序白名单
    │ 规范化       │  处理空值、设置默认值
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ 创建 Page    │  new Page<>(current, size)
    │ 分页对象      │
    └──────┬───────┘
           │
     有 tagId？
      │         │
    Yes         No
      │         │
      ▼         ▼
┌──────────┐ ┌──────────────┐
│按标签查询 │ │ 通用分页查询  │
│(中间表)  │ │(分类/关键词) │
└─────┬────┘ └──────┬───────┘
      │              │
      └──────┬───────┘
             │
             ▼
    ┌──────────────┐
    │ 填充标签信息  │  额外查询 article_tag 表
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ 封装 PageVO  │  PageVO.of(page, records)
    └──────┬───────┘
           │
           ▼
       返回给前端
```

### 9.2 参数校验

```java
private void validateAndNormalizeParams(ArticleQueryDTO queryDTO) {
    // 分页参数
    if (queryDTO.getCurrent() == null || queryDTO.getCurrent() < 1) {
        queryDTO.setCurrent(1);
    }
    if (queryDTO.getSize() == null || queryDTO.getSize() < 1) {
        queryDTO.setSize(10);
    }
    if (queryDTO.getSize() > 100) {
        queryDTO.setSize(100);
    }

    // 排序字段白名单（防止 SQL 注入）
    Set<String> allowed = Set.of(
        "createTime", "viewCount", "likeCount", "updateTime"
    );
    if (!allowed.contains(queryDTO.getSortBy())) {
        queryDTO.setSortBy("createTime");
    }

    // 排序方向白名单
    if (!Set.of("asc", "desc").contains(
            queryDTO.getSortOrder().toLowerCase())) {
        queryDTO.setSortOrder("desc");
    }
}
```

### 9.3 公开接口 vs 管理接口

```java
// 公开接口：强制只查已发布的文章
public PageVO<ArticleListVO> getPublicArticlePage(ArticleQueryDTO queryDTO) {
    queryDTO.setStatus(1);  // 强制覆盖
    return getArticlePage(queryDTO);
}

// 管理接口：可以查看所有状态
public PageVO<ArticleListVO> getArticlePage(ArticleQueryDTO queryDTO) {
    // 不强制设置 status，由前端控制
    ...
}
```

---

## 10. Controller 层：分页接口实现

### 10.1 接口设计

| 接口 | 路径 | 权限 | 说明 |
|------|------|------|------|
| 公开列表 | `GET /api/articles/public/page` | 无需登录 | 前台展示 |
| 管理列表 | `GET /api/articles/page` | 需要登录 | 后台管理 |
| 管理员列表 | `GET /api/articles/admin/page` | 需要 ADMIN | 管理员专属 |

### 10.2 Spring MVC 自动参数绑定

Spring MVC 会自动将 URL 查询参数绑定到 DTO 对象：

```java
// GET /api/articles/public/page?current=1&size=10&keyword=Spring
@GetMapping("/public/page")
public ResponseEntity<?> getPublicArticlePage(ArticleQueryDTO queryDTO) {
    // queryDTO.getCurrent() = 1
    // queryDTO.getSize() = 10
    // queryDTO.getKeyword() = "Spring"
    // 其他未传参的字段使用默认值
}
```

不需要 `@RequestBody` 或 `@RequestParam`，Spring MVC 会自动按字段名匹配。

### 10.3 权限控制

```java
// 公开接口 — SecurityConfig 中 permitAll
@GetMapping("/public/page")
public ResponseEntity<?> getPublicArticlePage(ArticleQueryDTO queryDTO) { ... }

// 需要登录 — @PreAuthorize
@GetMapping("/page")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> getArticlePage(ArticleQueryDTO queryDTO) { ... }

// 需要管理员角色 — @PreAuthorize
@GetMapping("/admin/page")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getAdminArticlePage(ArticleQueryDTO queryDTO) { ... }
```

---

## 11. 排序实现

### 11.1 支持的排序方式

| 排序字段 | SQL 列名 | 说明 |
|---------|----------|------|
| createTime | `a.create_time` | 按发布时间排序（默认） |
| viewCount | `a.view_count` | 按浏览量排序（热门文章） |
| likeCount | `a.like_count` | 按点赞数排序 |
| updateTime | `a.update_time` | 按更新时间排序 |

### 11.2 安全的动态排序实现

排序的实现采用**双层白名单**校验：

```
第一层：Service 层 Java 白名单校验
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLOWED_SORT_FIELDS = {"createTime", "viewCount", "likeCount", "updateTime"}
ALLOWED_SORT_ORDERS = {"asc", "desc"}

第二层：Mapper XML 层 <choose> 标签校验
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<choose>
    <when test="sortBy == 'viewCount'">a.view_count</when>
    <when test="sortBy == 'likeCount'">a.like_count</when>
    <otherwise>a.create_time</otherwise>
</choose>
```

即使攻击者绕过了 Service 层校验，XML 中的 `<choose>` 也会将未知值降级为默认排序。

---

## 12. 模糊搜索实现

### 12.1 搜索策略

```
关键词："Spring Boot"
         │
         ▼
搜索范围：
  ├── 文章标题（title）— 权重高
  └── 文章摘要（summary）— 权重中
         │
         ▼
SQL 实现：
WHERE (a.title LIKE CONCAT('%', 'Spring Boot', '%')
       OR a.summary LIKE CONCAT('%', 'Spring Boot', '%'))
```

### 12.2 LIKE 语法的三种模式

| 模式 | SQL | 说明 |
|------|-----|------|
| `%keyword%` | `LIKE '%Spring%'` | 包含匹配（前后模糊） |
| `keyword%` | `LIKE 'Spring%'` | 前缀匹配（后模糊） |
| `%keyword` | `LIKE '%Spring'` | 后缀匹配（前模糊） |

我们使用 `%keyword%`（包含匹配），用户输入任意位置的关键词都能匹配到。

### 12.3 防止 LIKE 注入

使用 `#{keyword}`（预编译参数）而非 `${keyword}`（字符串替换）：

```xml
<!-- ✅ 安全：使用预编译参数 -->
AND a.title LIKE CONCAT('%', #{keyword}, '%')

<!-- ❌ 危险：直接拼接字符串 -->
AND a.title LIKE '%${keyword}%'
```

---

## 13. 前端分页参数传递约定

### 13.1 请求参数规范

```
GET /api/articles/public/page
    ?current=1          // 页码（从 1 开始）
    &size=10            // 每页条数
    &keyword=Spring     // 搜索关键词（可选）
    &categoryId=1       // 分类 ID（可选）
    &tagId=3            // 标签 ID（可选）
    &sortBy=createTime  // 排序字段（可选）
    &sortOrder=desc     // 排序方向（可选）
```

### 13.2 前端 Vue 示例

```vue
<template>
  <div>
    <!-- 搜索框 -->
    <input v-model="query.keyword" placeholder="搜索文章..."
           @keyup.enter="fetchArticles" />

    <!-- 分类筛选 -->
    <select v-model="query.categoryId" @change="fetchArticles">
      <option :value="null">全部分类</option>
      <option v-for="cat in categories" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>

    <!-- 排序选择 -->
    <select v-model="query.sortBy" @change="fetchArticles">
      <option value="createTime">最新发布</option>
      <option value="viewCount">最多浏览</option>
      <option value="likeCount">最多点赞</option>
    </select>

    <!-- 文章列表 -->
    <div v-for="article in articles" :key="article.id">
      <h3>{{ article.title }}</h3>
      <p>{{ article.summary }}</p>
      <span>{{ article.categoryName }} | {{ article.authorName }}</span>
      <span>浏览 {{ article.viewCount }} | 点赞 {{ article.likeCount }}</span>
    </div>

    <!-- 分页组件 -->
    <el-pagination
      :current-page="query.current"
      :page-size="query.size"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const query = reactive({
  current: 1,
  size: 10,
  keyword: '',
  categoryId: null,
  sortBy: 'createTime',
  sortOrder: 'desc'
})

const articles = ref([])
const total = ref(0)

const fetchArticles = async () => {
  const res = await axios.get('/api/articles/public/page', {
    params: query  // axios 会自动将对象转为 URL 查询参数
  })
  articles.value = res.data.data.records
  total.value = res.data.data.total
}

const handlePageChange = (page) => {
  query.current = page
  fetchArticles()
}

// 初始加载
fetchArticles()
</script>
```

### 13.3 Axios params 序列化

```javascript
// 传入 params 对象
axios.get('/api/articles/public/page', {
  params: { current: 1, size: 10, keyword: 'Spring', categoryId: null }
})

// Axios 自动序列化为 URL（null 值会被忽略）
// GET /api/articles/public/page?current=1&size=10&keyword=Spring
```

---

## 14. 测试各种查询场景

### 14.1 基础分页查询

```bash
# 第 1 页，每页 10 条
curl "http://localhost:8080/api/articles/public/page?current=1&size=10"
```

**预期响应**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "records": [...],
    "total": 56,
    "size": 10,
    "current": 1,
    "pages": 6
  }
}
```

### 14.2 按分类筛选

```bash
# 查询分类 ID = 1 的文章
curl "http://localhost:8080/api/articles/public/page?categoryId=1&current=1&size=10"
```

### 14.3 关键词搜索

```bash
# 搜索标题或摘要中包含 "Spring" 的文章
curl "http://localhost:8080/api/articles/public/page?keyword=Spring"
```

### 14.4 按浏览量排序（热门文章）

```bash
# 按浏览量降序排列
curl "http://localhost:8080/api/articles/public/page?sortBy=viewCount&sortOrder=desc"
```

### 14.5 按标签筛选

```bash
# 查询标签 ID = 3 的文章
curl "http://localhost:8080/api/articles/public/page?tagId=3"
```

### 14.6 组合查询

```bash
# 分类 1 + 关键词 "Boot" + 按浏览量排序 + 第 2 页
curl "http://localhost:8080/api/articles/public/page?categoryId=1&keyword=Boot&sortBy=viewCount&sortOrder=desc&current=2&size=5"
```

### 14.7 管理后台查询（需要登录）

```bash
# 先登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 查询草稿文章（status = 0）
curl "http://localhost:8080/api/articles/page?status=0&current=1&size=10" \
  -H "Authorization: Bearer $TOKEN"

# 查询所有文章（不传 status）
curl "http://localhost:8080/api/articles/page?current=1&size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 14.8 边界情况测试

```bash
# 测试超大页码（应返回空数据）
curl "http://localhost:8080/api/articles/public/page?current=9999&size=10"

# 测试 size = 0（应被修正为默认值 10）
curl "http://localhost:8080/api/articles/public/page?size=0"

# 测试非法排序字段（应使用默认排序）
curl "http://localhost:8080/api/articles/public/page?sortBy=invalid_field"

# 测试不传任何参数（使用全部默认值）
curl "http://localhost:8080/api/articles/public/page"
```

---

## 15. 本章小结

### 本章完成的工作

| 文件 | 说明 |
|------|------|
| `config/MybatisPlusConfig.java` | MyBatis-Plus 分页插件配置 |
| `dto/ArticleQueryDTO.java` | 文章查询参数 DTO |
| `vo/PageVO.java` | 通用分页响应 VO（泛型） |
| `vo/ArticleListVO.java` | 文章列表项 VO（精简版） |
| `mapper/ArticleMapper.java` | Mapper 接口（自定义分页查询方法） |
| `resources/mapper/ArticleMapper.xml` | XML 映射文件（多表联查 SQL） |
| `service/ArticleService.java` | 文章服务接口 |
| `service/impl/ArticleServiceImpl.java` | 文章服务实现（分页查询逻辑） |
| `controller/ArticleController.java` | 文章 Controller（分页接口） |

### 知识点总结

```
分页查询完整链路：
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  前端请求                                                │
│  GET /api/articles/public/page?current=1&size=10&...    │
│       │                                                  │
│       ▼                                                  │
│  ArticleController                                       │
│  - Spring MVC 自动绑定 URL 参数到 ArticleQueryDTO       │
│       │                                                  │
│       ▼                                                  │
│  ArticleServiceImpl                                      │
│  - 参数校验（分页范围、排序白名单）                       │
│  - 创建 Page 对象                                        │
│       │                                                  │
│       ▼                                                  │
│  ArticleMapper（接口）                                   │
│  - 方法参数包含 Page 对象                                │
│       │                                                  │
│       ▼                                                  │
│  MybatisPlusInterceptor（分页插件）                      │
│  - 拦截 SQL，自动添加 COUNT 和 LIMIT                    │
│       │                                                  │
│       ▼                                                  │
│  ArticleMapper.xml（SQL 定义）                           │
│  - 多表联查（article + category + user）                │
│  - 动态条件（<where> + <if>）                            │
│  - 安全排序（<choose> 白名单）                           │
│       │                                                  │
│       ▼                                                  │
│  MySQL 数据库                                            │
│  - SELECT COUNT(*) ...                                   │
│  - SELECT ... LIMIT 10 OFFSET 0                         │
│       │                                                  │
│       ▼                                                  │
│  ArticleServiceImpl                                      │
│  - 填充标签信息                                          │
│  - 封装为 PageVO                                        │
│       │                                                  │
│       ▼                                                  │
│  返回 JSON 响应                                          │
│  { records, total, size, current, pages }               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 安全要点回顾

| 安全项 | 实现方式 |
|--------|---------|
| 排序字段注入 | Service 层白名单 + XML `<choose>` 双重校验 |
| LIKE 注入 | 使用 `#{keyword}` 预编译参数 |
| 分页溢出 | `maxLimit = 500` + Service 层上限校验 |
| 状态越权 | 公开接口强制 `status = 1` |

### 下一章预告

本章实现了文章列表的分页查询，下一章我们将继续完善博客系统的其他功能模块，如：
- 文章的增删改查（CRUD）
- 分类和标签管理
- 评论系统
- 文件上传（文章封面图）

---

> **本章所有代码文件均在 `09-pagination-query/` 目录下，可直接参考。**
