# 第 05 章：参数校验

> **项目背景**：个人博客系统（前后端分离）
> **技术栈**：Spring Boot 3.2+ / JDK 17 / MyBatis-Plus / MySQL 8 / Maven

---

## 5.1 Jakarta Validation 简介

### 5.1.1 从 javax 到 jakarta

Spring Boot 3 基于 Jakarta EE 9+，因此包名从 `javax.validation` 变更为 `jakarta.validation`。如果你之前使用过 Spring Boot 2.x，需要注意 import 语句的变化：

```java
// Spring Boot 2.x（已过时）
import javax.validation.constraints.NotBlank;

// Spring Boot 3.x（正确）
import jakarta.validation.constraints.NotBlank;
```

### 5.1.2 为什么需要参数校验？

在没有参数校验的情况下，恶意或错误的数据可能直达 Service 层甚至数据库层：

```java
// 没有校验：任何数据都能入库
@PostMapping("/register")
public Result<?> register(@RequestBody UserRegisterDTO dto) {
    // dto.getUsername() 可能为 null、空字符串、超长字符串...
    userService.register(dto);
    return Result.success();
}
```

手动写校验代码既繁琐又容易遗漏：

```java
// 手动校验：代码冗余、可读性差
if (dto.getUsername() == null || dto.getUsername().isBlank()) {
    return Result.fail(ResultCode.PARAM_ERROR, "用户名不能为空");
}
if (dto.getUsername().length() < 4 || dto.getUsername().length() > 20) {
    return Result.fail(ResultCode.PARAM_ERROR, "用户名长度必须在 4~20 之间");
}
// ... 还有更多校验
```

**Jakarta Validation** 通过注解声明式地完成校验，代码简洁且语义清晰。

---

## 5.2 引入依赖

在 `pom.xml` 中添加 `spring-boot-starter-validation`：

```xml
<dependencies>
    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- 参数校验（Jakarta Validation 实现） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- 其他依赖... -->
</dependencies>
```

`spring-boot-starter-validation` 会自动引入：
- `jakarta.validation-api` — 校验规范 API
- `hibernate-validator` — Jakarta Validation 的参考实现

---

## 5.3 常用校验注解

### 5.3.1 基础注解一览

| 注解 | 适用类型 | 作用 | 示例 |
|------|----------|------|------|
| `@NotNull` | 所有类型 | 值不能为 null | `@NotNull(message = "ID 不能为空") Long id` |
| `@Null` | 所有类型 | 值必须为 null | 用于确保某些字段不被传入 |
| `@NotBlank` | String | 不能为 null、空字符串或纯空格 | `@NotBlank(message = "标题不能为空") String title` |
| `@NotEmpty` | String/Collection/Map/Array | 不能为 null 或空 | `@NotEmpty List<String> tags` |
| `@Size` | String/Collection/Map/Array | 长度/大小范围 | `@Size(min=1, max=100) String name` |
| `@Min` | 数值类型 | 最小值 | `@Min(value=1, message="页码最小为1") int page` |
| `@Max` | 数值类型 | 最大值 | `@Max(value=100) int pageSize` |
| `@Email` | String | 邮箱格式 | `@Email(message="邮箱格式不正确") String email` |
| `@Pattern` | String | 正则匹配 | `@Pattern(regexp="^[a-z]+$") String code` |
| `@Positive` | 数值类型 | 必须为正数 | `@Positive Long id` |
| `@PositiveOrZero` | 数值类型 | 正数或零 | `@PositiveOrZero int count` |
| `@Past` | 日期类型 | 必须是过去的时间 | `@Past LocalDateTime birthday` |
| `@Future` | 日期类型 | 必须是未来的时间 | `@Future LocalDateTime deadline` |

### 5.3.2 @NotNull vs @NotBlank vs @NotEmpty

这三个注解容易混淆，它们的区别如下：

```java
// @NotNull — 不能为 null，但可以是空字符串 ""
@NotNull String name;
// null   → 校验失败 ✗
// ""     → 校验通过 ✓
// "  "   → 校验通过 ✓
// "张三"  → 校验通过 ✓

// @NotEmpty — 不能为 null 且不能为空字符串 ""
@NotEmpty String name;
// null   → 校验失败 ✗
// ""     → 校验失败 ✗
// "  "   → 校验通过 ✓（纯空格可以通过）
// "张三"  → 校验通过 ✓

// @NotBlank — 不能为 null、不能为空、不能为纯空格（最严格）
@NotBlank String name;
// null   → 校验失败 ✗
// ""     → 校验失败 ✗
// "  "   → 校验失败 ✗
// "张三"  → 校验通过 ✓
```

**经验法则**：对于字符串字段，一般使用 `@NotBlank`；对于数值、对象等字段使用 `@NotNull`。

---

## 5.4 在 DTO 中使用校验注解

### 5.4.1 用户注册 DTO

**文件**：`src/main/java/com/example/blog/dto/UserRegisterDTO.java`

```java
package com.example.blog.dto;

import jakarta.validation.constraints.*;

public class UserRegisterDTO {

    // 分组标记接口
    public interface Create {}
    public interface Update {}

    @NotBlank(message = "用户名不能为空", groups = {Create.class, Update.class})
    @Size(min = 4, max = 20, message = "用户名长度必须在 4~20 个字符之间",
          groups = {Create.class, Update.class})
    @Pattern(regexp = "^[a-zA-Z0-9_]+$",
             message = "用户名只能包含字母、数字和下划线",
             groups = {Create.class, Update.class})
    private String username;

    @NotBlank(message = "密码不能为空", groups = Create.class)
    @Size(min = 6, max = 20, message = "密码长度必须在 6~20 个字符之间",
          groups = Create.class)
    private String password;

    @NotBlank(message = "确认密码不能为空", groups = Create.class)
    private String confirmPassword;

    @NotBlank(message = "邮箱不能为空", groups = {Create.class, Update.class})
    @Email(message = "邮箱格式不正确", groups = {Create.class, Update.class})
    private String email;

    @Size(min = 2, max = 20, message = "昵称长度必须在 2~20 个字符之间")
    private String nickname;

    // getter/setter 省略...
}
```

### 5.4.2 创建文章 DTO

**文件**：`src/main/java/com/example/blog/dto/ArticleCreateDTO.java`

```java
package com.example.blog.dto;

import jakarta.validation.constraints.*;

public class ArticleCreateDTO {

    @NotBlank(message = "文章标题不能为空")
    @Size(max = 100, message = "文章标题不能超过 100 个字符")
    private String title;

    @NotBlank(message = "文章内容不能为空")
    @Size(min = 10, message = "文章内容至少需要 10 个字符")
    private String content;

    @NotNull(message = "请选择文章分类")
    private Long categoryId;

    @Size(max = 200, message = "文章摘要不能超过 200 个字符")
    private String summary;

    @Size(max = 500, message = "封面图片 URL 过长")
    private String coverImage;

    // getter/setter 省略...
}
```

### 5.4.3 更新文章 DTO

**文件**：`src/main/java/com/example/blog/dto/ArticleUpdateDTO.java`

```java
package com.example.blog.dto;

import jakarta.validation.constraints.*;

public class ArticleUpdateDTO {

    @NotNull(message = "文章 ID 不能为空")
    private Long id;

    @NotBlank(message = "文章标题不能为空")
    @Size(max = 100, message = "文章标题不能超过 100 个字符")
    private String title;

    @NotBlank(message = "文章内容不能为空")
    @Size(min = 10, message = "文章内容至少需要 10 个字符")
    private String content;

    @NotNull(message = "请选择文章分类")
    private Long categoryId;

    @Size(max = 200, message = "文章摘要不能超过 200 个字符")
    private String summary;

    @Size(max = 500, message = "封面图片 URL 过长")
    private String coverImage;

    // getter/setter 省略...
}
```

---

## 5.5 Controller 中使用 @Valid 和 @Validated

### 5.5.1 基本用法

在 Controller 方法参数前添加 `@Valid` 或 `@Validated` 注解即可触发校验：

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    /**
     * 用户注册 — 使用 @Valid 触发校验
     */
    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody UserRegisterDTO dto) {
        // 如果校验失败，会自动抛出 MethodArgumentNotValidException
        // 由全局异常处理器捕获并返回错误信息
        // 如果校验通过，才会执行下面的业务逻辑
        userService.register(dto);
        return Result.success();
    }
}
```

### 5.5.2 @Valid vs @Validated

| 特性 | @Valid | @Validated |
|------|--------|------------|
| 来源 | Jakarta Validation 规范 | Spring 框架扩展 |
| 支持分组校验 | 不支持 | 支持 |
| 支持嵌套校验 | 支持（标注在嵌套对象字段上） | 不支持嵌套 |
| 可用位置 | 方法参数、字段、构造方法 | 类、方法、方法参数 |

**推荐做法**：
- 需要分组校验时使用 `@Validated`
- 不需要分组时使用 `@Valid`（更通用）
- 两者在触发校验的效果上等价

### 5.5.3 分组校验的使用

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    /**
     * 创建用户（注册）— 触发 Create 分组
     * 会校验 username、password、confirmPassword、email
     */
    @PostMapping("/register")
    public Result<Void> register(
            @Validated(UserRegisterDTO.Create.class) @RequestBody UserRegisterDTO dto) {
        userService.register(dto);
        return Result.success();
    }

    /**
     * 更新用户信息 — 触发 Update 分组
     * 只校验 username、email，不校验 password、confirmPassword
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(
            @Validated(UserRegisterDTO.Update.class) @RequestBody UserRegisterDTO dto) {
        userService.updateProfile(dto);
        return Result.success();
    }
}
```

---

## 5.6 分组校验详解

### 5.6.1 为什么需要分组校验？

同一个 DTO 在不同场景下可能需要不同的校验规则。以用户注册为例：

| 字段 | 注册（Create） | 修改资料（Update） |
|------|---------------|-------------------|
| username | 必填，4~20 位 | 必填，4~20 位 |
| password | 必填，6~20 位 | 不校验 |
| confirmPassword | 必填 | 不校验 |
| email | 必填，邮箱格式 | 必填，邮箱格式 |
| nickname | 可选 | 可选 |

如果不用分组，就需要定义两个 DTO（`UserCreateDTO` 和 `UserUpdateDTO`），字段大量重复。

### 5.6.2 实现步骤

**第一步**：在 DTO 中定义分组标记接口

```java
public class UserRegisterDTO {
    // 标记接口 — 无需任何方法，仅作类型标识
    public interface Create {}
    public interface Update {}

    // ...
}
```

**第二步**：在校验注解中指定分组

```java
// 仅在 Create 分组时校验密码
@NotBlank(message = "密码不能为空", groups = Create.class)
@Size(min = 6, max = 20, message = "密码长度必须在 6~20 之间", groups = Create.class)
private String password;

// 在 Create 和 Update 分组时都校验用户名
@NotBlank(message = "用户名不能为空", groups = {Create.class, Update.class})
@Size(min = 4, max = 20, message = "用户名长度必须在 4~20 之间", groups = {Create.class, Update.class})
private String username;
```

**第三步**：在 Controller 中使用 `@Validated` 指定分组

```java
// 注册 — 触发 Create 分组的所有校验
@PostMapping("/register")
public Result<?> register(
        @Validated(UserRegisterDTO.Create.class) @RequestBody UserRegisterDTO dto) { ... }

// 修改资料 — 触发 Update 分组的所有校验
@PutMapping("/profile")
public Result<?> update(
        @Validated(UserRegisterDTO.Update.class) @RequestBody UserRegisterDTO dto) { ... }
```

> **注意**：使用 `@Validated` 指定分组时，**没有指定 groups 的注解不会生效**。
> 例如 `nickname` 字段上的 `@Size` 没有指定 groups，在 `@Validated(Create.class)` 时不会校验。
> 如果希望它在所有分组中都校验，需要显式添加 groups 或使用 `@Valid`。

---

## 5.7 自定义校验注解

内置注解无法满足所有需求（如"用户名是否已存在"需要查数据库）。我们可以创建自定义校验注解。

### 5.7.1 定义注解 @UniqueUsername

**文件**：`src/main/java/com/example/blog/common/validation/UniqueUsername.java`

```java
package com.example.blog.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = UniqueUsernameValidator.class) // 指定校验器
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface UniqueUsername {

    String message() default "该用户名已被注册";  // 默认错误消息

    Class<?>[] groups() default {};             // 分组（规范要求）

    Class<? extends Payload>[] payload() default {}; // 负载（规范要求）
}
```

### 5.7.2 实现校验器 UniqueUsernameValidator

**文件**：`src/main/java/com/example/blog/common/validation/UniqueUsernameValidator.java`

```java
package com.example.blog.common.validation;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class UniqueUsernameValidator implements ConstraintValidator<UniqueUsername, String> {

    @Autowired
    private UserMapper userMapper;

    @Override
    public void initialize(UniqueUsername annotation) {
        // 无需额外初始化
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null 值不做校验，交给 @NotBlank 处理
        if (value == null || value.isBlank()) {
            return true;
        }

        try {
            LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(User::getUsername, value);
            Long count = userMapper.selectCount(queryWrapper);
            return count == 0; // count == 0 表示用户名唯一
        } catch (Exception e) {
            return false; // 数据库异常时保守处理
        }
    }
}
```

### 5.7.3 使用自定义注解

```java
public class UserRegisterDTO {

    @UniqueUsername(message = "该用户名已被注册", groups = Create.class)
    @NotBlank(message = "用户名不能为空", groups = {Create.class, Update.class})
    @Size(min = 4, max = 20, message = "用户名长度必须在 4~20 个字符之间",
          groups = {Create.class, Update.class})
    private String username;

    // ...
}
```

### 5.7.4 自定义注解的通用模板

任何自定义校验注解都遵循以下模板：

```java
// 1. 定义注解
@Constraint(validatedBy = XxxValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Xxx {
    String message() default "校验失败";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. 实现校验器
public class XxxValidator implements ConstraintValidator<Xxx, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // 校验逻辑，返回 true 表示通过，false 表示失败
    }
}
```

---

## 5.8 全局异常处理器中处理校验错误

在第 04 章的全局异常处理器基础上，我们增强了对校验异常的处理能力：

**文件**：`src/main/java/com/example/blog/common/GlobalExceptionHandler.java`

### 5.8.1 需要处理的校验异常类型

| 异常类 | 触发场景 | 示例 |
|--------|----------|------|
| `MethodArgumentNotValidException` | `@Valid/@Validated` + `@RequestBody` | `@PostMapping register(@Valid @RequestBody DTO dto)` |
| `BindException` | `@Valid` + 表单参数绑定 | `@PostMapping create(@Valid @ModelAttribute DTO dto)` |
| `ConstraintViolationException` | `@Validated` + `@RequestParam`/`@PathVariable` | 类上标注 `@Validated`，参数上标注 `@Min` |

### 5.8.2 核心处理方法

```java
/**
 * 处理 @Valid + @RequestBody 校验失败
 */
@ExceptionHandler(MethodArgumentNotValidException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public Result<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e,
                                                           HttpServletRequest request) {
    // 提取所有字段的校验错误，拼接为一条完整提示
    String errorMessage = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining("; "));
    log.warn("参数校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
    return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
}
```

**返回示例**：当多个字段校验同时失败时：
```json
{
    "code": 400,
    "message": "用户名不能为空; 密码长度必须在 6~20 个字符之间; 邮箱格式不正确",
    "data": null
}
```

---

## 5.9 测试各种校验场景

启动项目后，使用 `curl` 测试：

### 场景 1：所有字段校验通过

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "password": "123456",
    "confirmPassword": "123456",
    "email": "zhangsan@example.com",
    "nickname": "张三"
  }'

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

### 场景 2：用户名为空

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "",
    "password": "123456",
    "confirmPassword": "123456",
    "email": "zhangsan@example.com"
  }'

# 预期响应
{
    "code": 400,
    "message": "用户名不能为空",
    "data": null
}
```

### 场景 3：多个字段校验失败

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "12",
    "confirmPassword": "",
    "email": "invalid-email"
  }'

# 预期响应
{
    "code": 400,
    "message": "用户名长度必须在 4~20 个字符之间; 密码长度必须在 6~20 个字符之间; 确认密码不能为空; 邮箱格式不正确",
    "data": null
}
```

### 场景 4：JSON 格式错误

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# 预期响应
{
    "code": 400,
    "message": "请求体 JSON 格式不正确",
    "data": null
}
```

### 场景 5：分组校验 — 更新时不校验密码

```bash
# Update 分组不校验 password 和 confirmPassword
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan_new",
    "email": "new@example.com"
  }'

# 预期响应 — 校验通过
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

### 场景 6：用户名包含非法字符

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "张三!@#",
    "password": "123456",
    "confirmPassword": "123456",
    "email": "test@example.com"
  }'

# 预期响应
{
    "code": 400,
    "message": "用户名只能包含字母、数字和下划线",
    "data": null
}
```

---

## 5.10 本章小结

| 知识点 | 要点 |
|--------|------|
| 引入依赖 | `spring-boot-starter-validation`（内含 Hibernate Validator） |
| 包名 | Spring Boot 3 使用 `jakarta.validation.*`（不是 `javax.validation`） |
| 触发校验 | Controller 参数前加 `@Valid` 或 `@Validated` |
| 分组校验 | 定义标记接口 + `groups` 属性 + `@Validated(Group.class)` |
| 自定义注解 | `@Constraint` + `ConstraintValidator` 实现 |
| 异常处理 | `MethodArgumentNotValidException` / `BindException` / `ConstraintViolationException` |
| 错误信息 | `message` 属性定义每个字段的校验失败提示 |

**最佳实践**：
1. DTO 字段校验使用 `@NotBlank`（字符串）/ `@NotNull`（其他类型），不要用 `@NotNull` 校验字符串
2. 校验消息要具体，指明哪个字段有什么问题，如 "文章标题不能超过 100 个字符"
3. 自定义校验注解处理需要查数据库的校验逻辑（如唯一性校验）
4. 分组校验避免创建大量重复的 DTO 类
5. 全局异常处理器统一格式化校验错误，前端只需要处理一种错误响应结构

---

## 5.11 下一步

下一章我们将综合运用统一响应、全局异常处理和参数校验，实战完成 **文章 CRUD RESTful API** 的完整实现。
