# 第 12 章：接口文档 — Swagger / SpringDoc OpenAPI

> **个人博客系统** — Spring Boot 3 实战教程
>
> 本章源码路径：`12-swagger-doc/`

---

## 目录

- [12.1 为什么需要 API 文档](#121-为什么需要-api-文档)
- [12.2 SpringDoc OpenAPI 3 简介](#122-springdoc-openapi-3-简介)
- [12.3 引入依赖](#123-引入依赖)
- [12.4 application.yml 配置](#124-applicationyml-配置)
- [12.5 SwaggerConfig 配置类](#125-swaggerconfig-配置类)
- [12.6 核心注解详解](#126-核心注解详解)
- [12.7 Controller 注解实战](#127-controller-注解实战)
- [12.8 DTO/VO 添加 @Schema 注解](#128-dtovo-添加-schema-注解)
- [12.9 配置 JWT 认证](#129-配置-jwt-认证)
- [12.10 接口分组](#1210-接口分组)
- [12.11 访问 Swagger UI](#1211-访问-swagger-ui)
- [12.12 常见问题与排查](#1212-常见问题与排查)
- [12.13 本章小结](#1213-本章小结)

---

## 12.1 为什么需要 API 文档

在前后端分离的项目中，API 文档是前后端协作的桥梁。没有规范的文档会带来以下问题：

| 痛点                     | 影响                                             |
| ------------------------ | ------------------------------------------------ |
| 接口变更无法及时通知前端 | 前后端联调效率低，频繁沟通                       |
| 参数说明不完整           | 前端不知道传什么参数、什么类型、是否必填         |
| 手动维护文档成本高       | Word/YApi 文档与代码不同步，逐渐失去可信度       |
| 新成员上手困难           | 需要了解大量接口才能参与开发                     |

**理想的解决方案**：从代码中自动生成 API 文档，保证文档与代码始终同步。

这就是 **SpringDoc OpenAPI** 的价值所在。

---

## 12.2 SpringDoc OpenAPI 3 简介

### 历史演进

```
Swagger 2.0（2014）
    │
    ▼
OpenAPI 3.0（2017）— Swagger 捐赠给 Linux 基金会后改名
    │
    ▼
Springfox（Spring Boot 2.x 时代的主流库）
    │  ← 2020 年后停止维护，不兼容 Spring Boot 3
    ▼
SpringDoc OpenAPI（当前推荐）
    │  ← 完美支持 Spring Boot 3 / JDK 17+
    ▼
springdoc-openapi v2.x（当前最新版本）
```

### 为什么不用 Springfox？

| 对比维度       | Springfox            | SpringDoc OpenAPI           |
| -------------- | -------------------- | --------------------------- |
| Spring Boot 3  | 不支持               | 完美支持                    |
| JDK 17+        | 不兼容               | 完全兼容                    |
| OpenAPI 版本   | Swagger 2.0 / OAS 3.0| OpenAPI 3.0 / 3.1          |
| 维护状态       | 已停止维护           | 活跃维护                    |
| Jakarta EE     | 不支持               | 支持（jakarta.servlet）     |

> **结论**：Spring Boot 3 项目必须使用 **SpringDoc OpenAPI**，Springfox 已不可用。

---

## 12.3 引入依赖

在 `pom.xml` 中添加 SpringDoc 依赖：

```xml
<!-- SpringDoc OpenAPI 3 — WebMVC UI（包含 Swagger UI） -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

> **说明**：
> - `springdoc-openapi-starter-webmvc-ui` 同时包含了 OpenAPI JSON 生成和 Swagger UI 界面
> - 如果是 WebFlux 项目，使用 `springdoc-openapi-starter-webflux-ui`
> - 版本 2.x 对应 Spring Boot 3.x，版本 1.x 对应 Spring Boot 2.x

### 版本对应关系

| Spring Boot 版本 | SpringDoc 版本 | 依赖 artifactId                          |
| ---------------- | -------------- | ---------------------------------------- |
| 3.2+             | 2.5.x          | springdoc-openapi-starter-webmvc-ui      |
| 3.0 - 3.1        | 2.0 - 2.3      | springdoc-openapi-starter-webmvc-ui      |
| 2.x              | 1.x            | springdoc-openapi-ui                     |

---

## 12.4 application.yml 配置

> 完整代码见 `src/main/resources/application.yml`

```yaml
springdoc:
  # API 文档路径
  api-docs:
    path: /v3/api-docs          # OpenAPI JSON 文档的 URL
    enabled: true               # 是否启用 API 文档生成

  # Swagger UI 路径
  swagger-ui:
    path: /swagger-ui.html      # Swagger UI 页面的 URL
    enabled: true               # 是否启用 Swagger UI
    tags-sorter: alpha          # 分组标签排序方式：alpha（字母序）
    operations-sorter: alpha    # 接口排序方式：alpha（字母序）
    # display-request-duration: true  # 显示请求耗时（调试用）

  # 包扫描路径（可选，默认扫描所有 Controller）
  packages-to-scan: com.example.blog.controller

  # 默认消费类型（可选）
  default-consumes-media-type: application/json
  default-produces-media-type: application/json
```

### 生产环境禁用 Swagger

Swagger UI 在生产环境中应该关闭，避免暴露接口信息：

```yaml
# application-prod.yml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

---

## 12.5 SwaggerConfig 配置类

> 完整代码见 `src/main/java/com/example/blog/config/SwaggerConfig.java`

配置类负责定义：
1. **API 基本信息**（标题、描述、版本、作者）
2. **接口分组**（按模块划分）
3. **安全认证**（JWT Token 配置）

```java
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("个人博客系统 API")
                        .description("Spring Boot 3 实战教程 — 个人博客系统后端接口文档")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Blog Team")
                                .email("blog@example.com")));
    }

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("1-认证接口")
                .pathsToMatch("/api/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi articleApi() {
        return GroupedOpenApi.builder()
                .group("2-文章接口")
                .pathsToMatch("/api/articles/**")
                .build();
    }

    // ... 更多分组
}
```

---

## 12.6 核心注解详解

### Controller 层注解

| 注解          | 作用域     | 说明                               |
| ------------- | ---------- | ---------------------------------- |
| `@Tag`        | 类         | 定义接口分组名称和描述             |
| `@Operation`  | 方法       | 定义接口的摘要和详细描述           |
| `@Parameter`  | 参数       | 定义请求参数的描述和示例           |
| `@Parameters` | 方法       | 批量定义多个 `@Parameter`          |
| `@ApiResponse`| 方法       | 定义响应状态码和描述               |

### DTO/VO 层注解

| 注解                | 作用域   | 说明                           |
| ------------------- | -------- | ------------------------------ |
| `@Schema`           | 类/字段  | 定义数据模型的描述和示例值     |
| `@Schema(hidden=true)`| 字段   | 隐藏某个字段（不在文档中显示） |

### 注解使用示例

```java
// Controller 类
@Tag(name = "文章管理", description = "文章的增删改查接口")
@RestController
public class ArticleController {

    @Operation(
        summary = "创建文章",
        description = "创建一篇新的博客文章，需要登录且具备作者权限"
    )
    @PostMapping
    public Result<Long> create(
            @Parameter(description = "文章创建参数") @RequestBody ArticleCreateDTO dto) {
        // ...
    }
}

// DTO 类
@Schema(description = "文章创建参数")
public class ArticleCreateDTO {

    @Schema(description = "文章标题", example = "Spring Boot 入门", requiredMode = REQUIRED)
    @NotBlank
    private String title;

    @Schema(description = "文章内容（Markdown）", example = "# Hello\n正文内容...")
    private String content;
}
```

---

## 12.7 Controller 注解实战

> 完整代码见 `src/main/java/com/example/blog/controller/ArticleController.java`

下面是一个完整的、带有充分 Swagger 注解的文章 Controller：

```java
@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Tag(name = "文章管理", description = "文章的增删改查接口")
public class ArticleController {

    private final ArticleService articleService;

    @PostMapping
    @Operation(summary = "创建文章", description = "创建一篇新的博客文章")
    @ApiResponse(responseCode = "200", description = "创建成功，返回文章ID")
    @ApiResponse(responseCode = "401", description = "未登录")
    public Result<Long> create(
            @Parameter(description = "文章创建参数", required = true)
            @RequestBody @Valid ArticleCreateDTO dto) {
        return Result.ok(articleService.create(dto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取文章详情", description = "根据ID获取文章的完整信息")
    @ApiResponse(responseCode = "200", description = "查询成功")
    @ApiResponse(responseCode = "404", description = "文章不存在")
    public Result<ArticleVO> getById(
            @Parameter(description = "文章ID", example = "1")
            @PathVariable Long id) {
        return Result.ok(articleService.getDetail(id));
    }

    @GetMapping
    @Operation(summary = "文章列表（分页）", description = "分页查询文章列表，支持分类和标签筛选")
    public Result<Page<ArticleListVO>> page(
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量", example = "10") @RequestParam(defaultValue = "10") Integer pageSize,
            @Parameter(description = "分类ID") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "标签ID") @RequestParam(required = false) Long tagId) {
        return Result.ok(articleService.page(pageNum, pageSize, categoryId, tagId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新文章", description = "更新文章标题、内容、分类等信息")
    public Result<Void> update(
            @Parameter(description = "文章ID") @PathVariable Long id,
            @Parameter(description = "更新参数") @RequestBody @Valid ArticleUpdateDTO dto) {
        articleService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除文章", description = "根据ID删除文章（软删除）")
    public Result<Void> delete(
            @Parameter(description = "文章ID") @PathVariable Long id) {
        articleService.delete(id);
        return Result.ok();
    }
}
```

---

## 12.8 DTO/VO 添加 @Schema 注解

### 请求 DTO 示例

```java
@Data
@Schema(description = "文章创建请求参数")
public class ArticleCreateDTO {

    @Schema(description = "文章标题", example = "Spring Boot 3 入门指南", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题最多100个字符")
    private String title;

    @Schema(description = "文章摘要", example = "本文介绍 Spring Boot 3 的新特性")
    @Size(max = 255)
    private String summary;

    @Schema(description = "文章内容（Markdown 格式）", example = "# Hello Spring Boot\n\n正文内容...")
    @NotBlank(message = "内容不能为空")
    private String content;

    @Schema(description = "分类ID", example = "1")
    private Long categoryId;

    @Schema(description = "标签ID列表", example = "[1, 2, 3]")
    private List<Long> tagIds;

    @Schema(description = "封面图片URL", example = "/uploads/cover/2025/01/xxx.jpg")
    private String coverUrl;

    @Schema(description = "是否发布（false=存为草稿）", example = "true")
    private Boolean published;
}
```

### 响应 VO 示例

```java
@Data
@Schema(description = "文章详情响应")
public class ArticleVO {

    @Schema(description = "文章ID", example = "1")
    private Long id;

    @Schema(description = "文章标题", example = "Spring Boot 3 入门指南")
    private String title;

    @Schema(description = "文章摘要")
    private String summary;

    @Schema(description = "文章内容")
    private String content;

    @Schema(description = "作者信息")
    private AuthorVO author;

    @Schema(description = "分类名称", example = "后端开发")
    private String categoryName;

    @Schema(description = "标签列表")
    private List<TagVO> tags;

    @Schema(description = "阅读量", example = "1024")
    private Integer viewCount;

    @Schema(description = "点赞数", example = "56")
    private Integer likeCount;

    @Schema(description = "创建时间", example = "2025-01-15T10:30:00")
    private LocalDateTime createTime;
}
```

---

## 12.9 配置 JWT 认证

为了让 Swagger UI 能够调试需要登录的接口，我们需要配置 JWT 认证方案。配置后，Swagger UI 页面会出现一个 **Authorize** 按钮，输入 Token 后所有请求会自动携带 `Authorization` Header。

```java
// 在 SwaggerConfig 的 openAPI() 方法中添加
@Bean
public OpenAPI openAPI() {
    return new OpenAPI()
            .info(...)
            // 配置安全方案
            .addSecurityItem(new SecurityRequirement().addList("Bearer Auth"))
            .components(new Components()
                    .addSecuritySchemes("Bearer Auth",
                            new SecurityScheme()
                                    .name("Bearer Auth")
                                    .type(SecurityScheme.Type.HTTP)
                                    .scheme("bearer")
                                    .bearerFormat("JWT")
                                    .description("输入 JWT Token")));
}
```

### 使用步骤

1. 先调用登录接口获取 Token
2. 点击 Swagger UI 右上角的 **Authorize** 按钮
3. 在弹出框中输入 Token（不需要加 `Bearer ` 前缀）
4. 点击 **Authorize** 确认
5. 之后所有请求都会自动携带 `Authorization: Bearer xxx` Header

---

## 12.10 接口分组

通过 `GroupedOpenApi` 可以将接口按业务模块分组，方便浏览：

```java
@Bean
public GroupedOpenApi authApi() {
    return GroupedOpenApi.builder()
            .group("1-认证接口")
            .pathsToMatch("/api/auth/**")
            .build();
}

@Bean
public GroupedOpenApi articleApi() {
    return GroupedOpenApi.builder()
            .group("2-文章接口")
            .pathsToMatch("/api/articles/**")
            .build();
}

@Bean
public GroupedOpenApi userApi() {
    return GroupedOpenApi.builder()
            .group("3-用户接口")
            .pathsToMatch("/api/user/**", "/api/admin/users/**")
            .build();
}

@Bean
public GroupedOpenApi fileApi() {
    return GroupedOpenApi.builder()
            .group("4-文件接口")
            .pathsToMatch("/api/files/**")
            .build();
}

@Bean
public GroupedOpenApi adminApi() {
    return GroupedOpenApi.builder()
            .group("5-管理后台")
            .pathsToMatch("/api/admin/**")
            .build();
}
```

打开 Swagger UI 后，可以通过顶部的下拉框切换不同的接口分组。

---

## 12.11 访问 Swagger UI

启动应用后，访问以下地址：

| 资源              | URL                                         |
| ----------------- | ------------------------------------------- |
| Swagger UI 页面   | `http://localhost:8080/swagger-ui.html`      |
| Swagger UI (替代) | `http://localhost:8080/swagger-ui/index.html`|
| OpenAPI JSON      | `http://localhost:8080/v3/api-docs`          |
| 指定分组的 JSON   | `http://localhost:8080/v3/api-docs/2-文章接口`|

### Swagger UI 界面功能

- **接口列表**：按 `@Tag` 分组展示所有接口
- **接口详情**：点击展开，查看参数说明、请求体示例、响应体示例
- **在线调试**：点击 "Try it out"，填写参数后直接发送请求
- **Authorize**：配置 JWT Token，调试需要认证的接口

---

## 12.12 常见问题与排查

### 问题 1：Swagger UI 无法访问（403 Forbidden）

**原因**：Spring Security 拦截了 Swagger 相关的 URL。

**解决方案**：在 SecurityConfig 中放行 Swagger 相关路径：

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            // 放行 Swagger 相关路径
            .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
            ).permitAll()
            // 其他路径...
    );
    return http.build();
}
```

### 问题 2：接口不显示在 Swagger UI 中

**排查步骤**：
1. 确认 Controller 类在 `packages-to-scan` 配置的包路径下
2. 确认 Controller 类上有 `@RestController` 注解
3. 确认方法上有 `@GetMapping`/`@PostMapping` 等注解
4. 检查是否有 `@Hidden` 注解隐藏了接口

### 问题 3：请求体示例显示为空

**原因**：DTO 类缺少 `@Schema` 注解，或者字段缺少 getter/setter。

**解决方案**：
- 确保 DTO 类使用 `@Data`（Lombok）或手动生成 getter/setter
- 为类和字段添加 `@Schema` 注解

### 问题 4：上传文件接口在 Swagger UI 中无法使用

**原因**：`MultipartFile` 参数需要正确的注解。

**解决方案**：
```java
@PostMapping("/upload")
@io.swagger.v3.oas.annotations.parameters.RequestBody(
    content = @Content(mediaType = "multipart/form-data"))
public Result<FileVO> upload(@RequestParam("file") MultipartFile file) {
    // ...
}
```

### 问题 5：启动报 `Failed to start bean 'documentationPluginsBootstrapper'`

**原因**：Spring Boot 2.6+ 默认使用 `PathPatternParser`，与旧版 SpringDoc 冲突。

**解决方案**：确保使用 SpringDoc 2.x 版本（已兼容 PathPatternParser）。

---

## 12.13 本章小结

本章我们学习了：

| 知识点               | 要点                                                     |
| -------------------- | -------------------------------------------------------- |
| SpringDoc OpenAPI    | Spring Boot 3 的 API 文档方案，替代已废弃的 Springfox   |
| 依赖引入             | springdoc-openapi-starter-webmvc-ui 2.x                  |
| 配置                 | application.yml 中配置文档路径、包扫描                   |
| SwaggerConfig        | 配置 API 信息、分组、安全方案                            |
| Controller 注解      | @Tag、@Operation、@Parameter、@ApiResponse               |
| DTO/VO 注解          | @Schema 描述模型字段                                     |
| JWT 认证             | SecurityScheme 配置 Bearer Token                         |
| 接口分组             | GroupedOpenApi 按模块划分                                |
| 常见问题             | Security 冲突、接口不显示等排查方法                      |

### 下一章预告

下一章我们将集成 **Redis**，实现文章详情缓存、缓存注解、热门文章排行榜等功能，提升系统性能。

---

## 附录：本章文件清单

| 文件路径 | 说明 |
| -------- | ---- |
| `config/SwaggerConfig.java` | SpringDoc 配置类 |
| `controller/ArticleController.java` | 带 Swagger 注解的文章 Controller |
| `application.yml` | Swagger 相关配置 |
