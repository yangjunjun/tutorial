# 第 12 章：接口文档 — Swagger / Springfox 3.0

> **个人博客系统** — Spring Boot 2.5 实战教程
>
> 本章源码路径：`12-swagger-doc/`

---

## 目录

- [12.1 为什么需要 API 文档](#121-为什么需要-api-文档)
- [12.2 Swagger 与 OpenAPI 简介](#122-swagger-与-openapi-简介)
- [12.3 引入依赖](#123-引入依赖)
- [12.4 application.yml 配置（重要：兼容性设置）](#124-applicationyml-配置重要兼容性设置)
- [12.5 SwaggerConfig 配置类](#125-swaggerconfig-配置类)
- [12.6 核心注解详解](#126-核心注解详解)
- [12.7 Controller 注解实战](#127-controller-注解实战)
- [12.8 DTO/VO 添加 @ApiModel 注解](#128-dtovo-添加-apimodel-注解)
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

这就是 **Swagger**（springfox 3.0.0）的价值所在。

---

## 12.2 Swagger 与 OpenAPI 简介

### 历史演进

```
Swagger 2.0（2014）
    │
    ▼
OpenAPI 3.0（2017）— Swagger 规范捐赠给 Linux 基金会后改名
    │
    ▼
Springfox 3.0.0（2020）— Spring Boot 2.x 时代的主流文档方案
    │  ← 2020 年后停止活跃维护，不支持 Spring Boot 3
    ▼
SpringDoc OpenAPI — Spring Boot 3 时代的替代方案
```

### Spring Boot 2.5.x 为什么选择 Springfox 3.0.0？

本教程面向 JDK 8 + Spring Boot 2.5.12 的存量技术栈。在这个版本组合下：

| 对比维度       | Springfox 3.0.0（本教程）    | SpringDoc OpenAPI           |
| -------------- | ---------------------------- | --------------------------- |
| Spring Boot 2.x | 支持                        | 支持                        |
| JDK 8          | 完全兼容                     | 完全兼容                    |
| OpenAPI 版本   | OAS 3.0（DocumentationType.OAS_30） | OpenAPI 3.0 / 3.1    |
| 注解风格       | `@Api` / `@ApiOperation`（Swagger 2 风格注解） | `@Tag` / `@Operation` |
| 维护状态       | 已停止活跃维护               | 活跃维护                    |
| 2.6+ 兼容性    | 需要额外的兼容配置（见 12.12） | 天然兼容                   |

> **结论**：Spring Boot 2.5 + JDK 8 项目可以使用 **springfox-boot-starter 3.0.0**，注解虽然仍是 Swagger 2 风格（`@Api`、`@ApiOperation`），但生成的文档协议已是 OpenAPI 3.0。如果将来升级到 Spring Boot 3，需要迁移到 SpringDoc 并将注解替换为 `@Tag`/`@Operation`/`@Schema`。

### Springfox 与 SpringDoc 注解对照表

| 功能         | Springfox 3.0.0（本章使用）        | SpringDoc（SB3 教程使用）   |
| ------------ | ---------------------------------- | --------------------------- |
| 类级分组     | `@Api(tags = "xxx")`               | `@Tag(name = "xxx")`        |
| 接口描述     | `@ApiOperation(value = "xxx")`     | `@Operation(summary = "xxx")` |
| 参数描述     | `@ApiParam(value = "xxx")`         | `@Parameter(description = "xxx")` |
| 模型描述     | `@ApiModel`                        | `@Schema(description)`      |
| 字段描述     | `@ApiModelProperty(value)`         | `@Schema(description)`      |
| 实体字段示例 | `@ApiModelProperty(example)`       | `@Schema(example)`          |

---

## 12.3 引入依赖

在 `pom.xml` 中添加 springfox 依赖：

```xml
<!-- Springfox Swagger 3.0 — 接口文档（含 Swagger UI） -->
<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-boot-starter</artifactId>
    <version>3.0.0</version>
</dependency>
```

> **说明**：
> - `springfox-boot-starter` 同时包含了文档生成（springfox-swagger2 / springfox-swagger-ui）和 OpenAPI 3 支持
> - 引入后即可访问 `/swagger-ui/index.html` 和 `/v3/api-docs`
> - **注意**：springfox 3.0.0 停止维护后托管在 Maven Central 的 `io.springfox` 坐标下，无需额外仓库

### 依赖兼容性

| Spring Boot 版本 | Springfox 版本 | 是否可用 |
| ---------------- | -------------- | -------- |
| 2.5.x（本教程）  | 3.0.0          | 可用（需配置 matching-strategy） |
| 2.6.x / 2.7.x    | 3.0.0          | 可用（NPE 问题更频繁，见 12.12） |
| 3.x              | 3.0.0          | 不可用（javax/jakarta 冲突） |

---

## 12.4 application.yml 配置（重要：兼容性设置）

> 完整代码见 `src/main/resources/application.yml`

```yaml
spring:
  mvc:
    pathmatch:
      # ⚠️ 关键配置：Springfox 3.0.0 依赖 AntPathMatcher 的路径元数据，
      # Spring Boot 2.6+ 默认改为 PathPatternParser 后会导致启动时 NPE。
      # Spring Boot 2.5.x 默认值虽是 ant_path_matcher，但显式声明可以：
      # 1) 防止升级 Spring Boot 小版本时文档功能突然失效
      # 2) 避免部分环境下 springfox ProviderUtils 抛 NullPointerException
      matching-strategy: ant_path_matcher

springfox:
  documentation:
    open-api:
      v3: true   # 启用 OpenAPI 3.0 格式文档
```

### 为什么需要 `matching-strategy: ant_path_matcher`？

**已知兼容问题**：Spring Boot 2.5.x + springfox 3.0.0 存在启动或访问文档时的 **NullPointerException（ProviderUtils 报错）** 兼容问题。根本原因：

1. springfox 3.0.0 内部大量使用 `AntPathMatcher` 解析请求映射路径
2. Spring Boot 2.6 起默认切到 `PathPatternParser`（2.5 已引入该选项）
3. 部分自动配置顺序变化会让 springfox 的文档插件初始化时拿到空值，抛出
   `java.lang.NullPointerException: Cannot invoke ... ProviderUtils...` 类似错误

**解决方案（本教程采用的 workaround）**：

1. 在 `application.yml` 中显式添加 `spring.mvc.pathmatch.matching-strategy: ant_path_matcher`
2. 在 `SwaggerConfig` 中使用 `WebMvcConfigurer` + `BeanPostProcessor` 兜底（见 12.5 节代码中的说明），确保使用 Ant 风格路径匹配的 `RequestMappingHandlerMapping` 不会在文档扫描时返回 null

> 即使在 Spring Boot 2.5.x（默认就是 ant_path_matcher）下，也**建议显式声明该配置**，并保留 SwaggerConfig 中的兼容处理，这是社区通用的稳定方案。

### 生产环境禁用 Swagger

Swagger UI 在生产环境中应该关闭，避免暴露接口信息：

```yaml
# application-prod.yml
springfox:
  documentation:
    swagger-ui:
      enabled: false
    open-api:
      v3: false
```

也可以通过 `@Profile({"dev","test"})` 控制 SwaggerConfig 生效的环境。

---

## 12.5 SwaggerConfig 配置类

> 完整代码见 `src/main/java/com/example/blog/config/SwaggerConfig.java`

配置类负责定义：
1. **API 基本信息**（标题、描述、版本、作者）
2. **Docket bean**（扫描规则与文档类型 OAS_30）
3. **接口分组**（按模块划分）
4. **安全认证**（JWT Token 配置）

```java
@Configuration
@EnableSwagger2 // 可选：启用 Swagger 2 风格注解支持；springfox 3.0 中若使用 OAS_30 可省略
public class SwaggerConfig {

    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.OAS_30)   // OpenAPI 3.0
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.any())
                .build()
                .securitySchemes(securitySchemes());
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("个人博客系统 API")
                .description("Spring Boot 2.5 实战教程 — 个人博客系统后端接口文档")
                .version("v1.0.0")
                .contact(new Contact("Blog Team", "https://github.com/example/blog", "blog@example.com"))
                .build();
    }
}
```

### 关于 BeanPostProcessor 兼容处理

在部分 Spring Boot 2.5.x 环境中，即使配置了 `ant_path_matcher`，springfox 启动时仍可能因为
`HandlerMapping` 的初始化顺序问题抛出 NPE。通用 workaround 是在 SwaggerConfig 中注册一个
`BeanPostProcessor`，将 `RequestMappingHandlerMapping` 的路径匹配器固定为 `AntPathMatcher`：

```java
@Bean
public static BeanPostProcessor springfoxHandlerMappingConfigurer() {
    return new BeanPostProcessor() {
        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) {
            if (bean instanceof RequestMappingHandlerMapping) {
                ((RequestMappingHandlerMapping) bean)
                        .setPathMatcher(new AntPathMatcher());
            }
            return bean;
        }
    };
}
```

> **说明**：
> - `AntPathMatcher` 来自 `org.springframework.util.AntPathMatcher`（Spring 5.3 内置）
> - 该 Bean 必须是 `static` 方法，避免过早触发宿主类的依赖注入
> - 本章的 SwaggerConfig 已包含这段兼容代码，无需再手写

---

## 12.6 核心注解详解

### Controller 层注解

| 注解           | 作用域     | 说明                               |
| -------------- | ---------- | ---------------------------------- |
| `@Api`         | 类         | 定义接口分组名称和描述             |
| `@ApiOperation`| 方法       | 定义接口的摘要和详细描述           |
| `@ApiParam`    | 参数       | 定义请求参数的描述和示例           |
| `@ApiImplicitParam` | 方法  | 以列表形式描述请求参数             |
| `@ApiImplicitParams` | 方法 | 批量定义多个 `@ApiImplicitParam`   |
| `@ApiResponse` / `@ApiResponses` | 方法 | 定义响应状态码和描述 |
| `@ApiIgnore`   | 类/方法/参数 | 隐藏接口（不在文档中显示）       |

### DTO/VO 层注解

| 注解                  | 作用域   | 说明                           |
| --------------------- | -------- | ------------------------------ |
| `@ApiModel`           | 类       | 定义数据模型的描述             |
| `@ApiModelProperty`   | 字段     | 定义字段的描述和示例值         |
| `@ApiModelProperty(hidden=true)` | 字段 | 隐藏某个字段           |

### 注解使用示例

```java
// Controller 类
@Api(tags = "文章管理", description = "文章的增删改查接口")
@RestController
public class ArticleController {

    @ApiOperation(
        value = "创建文章",
        notes = "创建一篇新的博客文章，需要登录且具备作者权限"
    )
    @PostMapping
    public Result<Long> create(
            @ApiParam(value = "文章创建参数", required = true) @RequestBody ArticleCreateDTO dto) {
        // ...
    }
}

// DTO 类
@ApiModel(description = "文章创建参数")
public class ArticleCreateDTO {

    @ApiModelProperty(value = "文章标题", example = "Spring Boot 入门", required = true)
    @NotBlank
    private String title;

    @ApiModelProperty(value = "文章内容（Markdown）", example = "# Hello\n正文内容...")
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
@Api(tags = "文章管理", description = "文章的增删改查接口")
public class ArticleController {

    @PostMapping
    @ApiOperation(value = "创建文章", notes = "创建一篇新的博客文章")
    @ApiResponses({
            @ApiResponse(code = 200, message = "创建成功，返回文章ID"),
            @ApiResponse(code = 400, message = "参数校验失败"),
            @ApiResponse(code = 401, message = "未登录")
    })
    public Result<Long> create(
            @ApiParam(value = "文章创建参数", required = true)
            @RequestBody @Valid ArticleCreateDTO dto) {
        return Result.ok(1L); // 示例返回
    }

    @GetMapping("/{id}")
    @ApiOperation(value = "获取文章详情", notes = "根据ID获取文章的完整信息")
    @ApiParam(...)
    public Result<ArticleVO> getById(
            @ApiParam(value = "文章ID", example = "1", required = true)
            @PathVariable Long id) {
        return Result.ok(new ArticleVO()); // 示例返回
    }

    // ... 其余接口见完整代码
}
```

> **注意**：springfox 3.0.0 中 `@ApiParam` 的 `example` 属性在 Swagger UI 上的展示依赖 OAS_30 文档类型，请确保 Docket 使用 `DocumentationType.OAS_30`。

---

## 12.8 DTO/VO 添加 @ApiModel 注解

### 请求 DTO 示例

```java
@Data
@ApiModel(description = "文章创建请求参数")
public class ArticleCreateDTO {

    @ApiModelProperty(value = "文章标题", example = "Spring Boot 2.5 入门指南", required = true)
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题最多100个字符")
    private String title;

    @ApiModelProperty(value = "文章摘要", example = "本文介绍 Spring Boot 2.5 的实战要点")
    @Size(max = 255)
    private String summary;

    @ApiModelProperty(value = "文章内容（Markdown 格式）", example = "# Hello Spring Boot\n\n正文内容...")
    @NotBlank(message = "内容不能为空")
    private String content;

    @ApiModelProperty(value = "分类ID", example = "1")
    private Long categoryId;

    @ApiModelProperty(value = "标签ID列表", example = "[1, 2, 3]")
    private List<Long> tagIds;

    @ApiModelProperty(value = "封面图片URL", example = "/uploads/cover/2025/01/xxx.jpg")
    private String coverUrl;

    @ApiModelProperty(value = "是否发布（false=存为草稿）", example = "true")
    private Boolean published;
}
```

### 响应 VO 示例

```java
@Data
@ApiModel(description = "文章详情响应")
public class ArticleVO {

    @ApiModelProperty(value = "文章ID", example = "1")
    private Long id;

    @ApiModelProperty(value = "文章标题", example = "Spring Boot 2.5 入门指南")
    private String title;

    @ApiModelProperty(value = "作者信息")
    private AuthorVO author;

    @ApiModelProperty(value = "阅读量", example = "1024")
    private Integer viewCount;

    @ApiModelProperty(value = "创建时间", example = "2025-01-15T10:30:00")
    private LocalDateTime createTime;
}
```

---

## 12.9 配置 JWT 认证

为了让 Swagger UI 能够调试需要登录的接口，我们需要配置 JWT 认证方案。配置后，Swagger UI 页面会出现一个 **Authorize** 按钮，输入 Token 后所有请求会自动携带 `Authorization` Header。

```java
// 在 SwaggerConfig 中定义
private List<SecurityScheme> securitySchemes() {
    ApiKey apiKey = new ApiKey("Bearer Auth", "Authorization", SwaggerConstants.HEADER);
    return Collections.singletonList(apiKey);
}

// 应用到 Docket
@Bean
public Docket createRestApi() {
    return new Docket(DocumentationType.OAS_30)
            // ...
            .securitySchemes(securitySchemes())
            .securityContexts(securityContexts());
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

通过多个 `Docket` Bean（配合 `groupName`）可以将接口按业务模块分组，方便浏览：

```java
@Bean
public Docket authApi() {
    return new Docket(DocumentationType.OAS_30)
            .groupName("1-认证接口")
            .select()
            .paths(PathSelectors.ant("/api/auth/**"))
            .build()
            .apiInfo(apiInfo());
}

@Bean
public Docket articleApi() {
    return new Docket(DocumentationType.OAS_30)
            .groupName("2-文章接口")
            .select()
            .paths(PathSelectors.ant("/api/articles/**"))
            .build()
            .apiInfo(apiInfo());
}

@Bean
public Docket fileApi() {
    return new Docket(DocumentationType.OAS_30)
            .groupName("3-文件接口")
            .select()
            .paths(PathSelectors.ant("/api/files/**"))
            .build()
            .apiInfo(apiInfo());
}

@Bean
public Docket adminApi() {
    return new Docket(DocumentationType.OAS_30)
            .groupName("4-管理后台")
            .select()
            .paths(PathSelectors.ant("/api/admin/**"))
            .build()
            .apiInfo(apiInfo());
}
```

打开 Swagger UI 后，可以通过顶部的下拉框切换不同的接口分组。

---

## 12.11 访问 Swagger UI

启动应用后，访问以下地址：

| 资源              | URL                                         |
| ----------------- | ------------------------------------------- |
| Swagger UI 页面   | `http://localhost:8080/swagger-ui/index.html` |
| 旧版 UI（兼容）   | `http://localhost:8080/swagger-ui.html`       |
| OpenAPI JSON      | `http://localhost:8080/v3/api-docs`           |
| Swagger 2 JSON    | `http://localhost:8080/v2/api-docs`           |
| 指定分组的 JSON   | `http://localhost:8080/v3/api-docs/2-文章接口`|

> **注意**：springfox 3.0.0 默认的 UI 路径是 `/swagger-ui/index.html`（或重定向 `/swagger-ui.html`），与 SpringDoc 的路径约定一致但内部实现不同。

### Swagger UI 界面功能

- **接口列表**：按 `@Api(tags)` 分组展示所有接口
- **接口详情**：点击展开，查看参数说明、请求体示例、响应体示例
- **在线调试**：点击 "Try it out"，填写参数后直接发送请求
- **Authorize**：配置 JWT Token，调试需要认证的接口

---

## 12.12 常见问题与排查

### 问题 1：启动报 `Failed to start bean 'documentationPluginsBootstrapper'` / NullPointerException（ProviderUtils）

**原因**：这是 Spring Boot 2.6+ 与 springfox 3.0.0 最著名的兼容问题。在 **Spring Boot 2.5.x** 上也会因为
`PathPatternParser` 相关的映射元数据缺失而出现 `ProviderUtils` 相关的 NPE（尤其在使用 `@PathVariable`、
复杂路径匹配时）。

**解决方案（本教程已内置）**：

1. 在 `application.yml` 中添加：

```yaml
spring:
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher
```

2. 在 `SwaggerConfig` 中添加 `BeanPostProcessor` 兜底处理（见 12.5 节），将 `RequestMappingHandlerMapping` 的 PathMatcher 固定为 `AntPathMatcher`。

两步缺一不可，这是社区验证过的稳定组合。

### 问题 2：Swagger UI 无法访问（403 Forbidden）

**原因**：Spring Security（5.5.x，`WebSecurityConfigurerAdapter` 配置方式）拦截了 Swagger 相关的 URL。

**解决方案**：在 SecurityConfig 中放行 Swagger 相关路径：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            // 放行 Swagger 相关路径
            .antMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/v2/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
            ).permitAll()
            // 其他路径...
            .anyRequest().authenticated();
}
```

### 问题 3：接口不显示在 Swagger UI 中

**排查步骤**：
1. 确认 Controller 类在 Docket 配置的 `basePackage` 包路径下
2. 确认 Controller 类上有 `@RestController` 注解
3. 确认方法上有 `@GetMapping`/`@PostMapping` 等注解
4. 检查是否有 `@ApiIgnore` 注解隐藏了接口

### 问题 4：请求体示例显示为空

**原因**：DTO 类缺少 `@ApiModelProperty` 注解，或者字段缺少 getter/setter。

**解决方案**：
- 确保 DTO 类使用 `@Data`（Lombok）或手动生成 getter/setter
- 为类添加 `@ApiModel`、字段添加 `@ApiModelProperty` 注解

### 问题 5：上传文件接口在 Swagger UI 中无法使用

**原因**：`MultipartFile` 参数需要正确的注解。

**解决方案**：

```java
@ApiOperation(value = "上传文件", notes = "multipart/form-data 提交")
@ApiImplicitParams({
        @ApiImplicitParam(name = "file", value = "文件", required = true, dataType = "__file")
})
@PostMapping("/upload")
public Result<FileVO> upload(@RequestParam("file") MultipartFile file) {
    // ...
}
```

### 问题 6：文档 JSON 正常但 UI 一直转圈

**原因**：浏览器缓存或 swagger-ui 资源被拦截。

**解决方案**：
- 清除浏览器缓存或使用无痕模式
- 确认 `/webjars/**`、`/swagger-resources/**` 在 Security 中已放行

---

## 12.13 本章小结

本章我们学习了：

| 知识点               | 要点                                                     |
| -------------------- | -------------------------------------------------------- |
| Swagger / Springfox  | Spring Boot 2.5 时代的文档方案：springfox-boot-starter 3.0.0 |
| 依赖引入             | io.springfox:springfox-boot-starter:3.0.0                |
| 兼容性 workaround    | `matching-strategy: ant_path_matcher` + BeanPostProcessor 处理 |
| SwaggerConfig        | Docket bean（DocumentationType.OAS_30）、API 信息、分组、安全方案 |
| Controller 注解      | @Api、@ApiOperation、@ApiParam、@ApiResponses            |
| DTO/VO 注解          | @ApiModel / @ApiModelProperty 描述模型字段               |
| JWT 认证             | SecurityScheme（ApiKey）配置 Bearer Token                |
| 接口分组             | 多 Docket + groupName 按模块划分                         |
| 常见问题             | NPE 兼容问题、Security 冲突、接口不显示等排查方法        |

> **迁移提示**：如果未来升级到 Spring Boot 3，需要将 springfox 整体替换为 SpringDoc OpenAPI，
> 注解对应关系见 12.2 节的对照表（`@Api` → `@Tag`、`@ApiOperation` → `@Operation`、
> `@ApiModelProperty` → `@Schema`）。

### 下一章预告

下一章我们将集成 **Redis**，实现文章详情缓存、缓存注解、热门文章排行榜等功能，提升系统性能。

---

## 附录：本章文件清单

| 文件路径 | 说明 |
| -------- | ---- |
| `config/SwaggerConfig.java` | Swagger 配置类（Docket、分组、JWT、兼容处理） |
| `controller/ArticleController.java` | 带 Swagger 注解的文章 Controller |
| `application.yml` | Swagger 相关配置（含兼容性设置） |
