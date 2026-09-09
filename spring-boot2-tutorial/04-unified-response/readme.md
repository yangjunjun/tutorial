# 第 04 章：统一响应与全局异常处理

> **项目背景**：个人博客系统（前后端分离）
> **技术栈**：Spring Boot 2.5.12 / JDK 8 / MyBatis-Plus 3.5.1 / MySQL 8 / Maven

---

## 4.1 为什么需要统一响应格式？

在前后端分离项目中，前端通过 HTTP 请求与后端交互，后端返回 JSON 数据。如果没有统一的响应格式，会出现以下问题：

**混乱的返回示例**：
```java
// 有的接口直接返回对象
@GetMapping("/user/1")
public UserVO getUser() { ... }

// 有的接口返回 Map
@PostMapping("/article")
public Map<String, Object> createArticle() {
    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("id", 123);
    return result;
}

// 有的接口返回 String
@DeleteMapping("/article/{id}")
public String deleteArticle() {
    return "删除成功";
}
```

前端不得不针对每个接口写不同的解析逻辑，极易出错。

**统一响应格式的好处**：
1. **前端统一处理**：前端只需写一套响应拦截器，通过 `code` 判断成功/失败
2. **错误信息规范**：所有错误都有明确的错误码和提示信息
3. **便于调试**：开发阶段可以快速定位问题
4. **接口文档清晰**：接口文档的结构统一

---

## 4.2 设计统一响应类 Result\<T\>

### 4.2.1 响应码枚举 ResultCode

首先定义响应码枚举，集中管理所有状态码：

**文件路径**：`src/main/java/com/example/blog/common/ResultCode.java`

```java
package com.example.blog.common;

public enum ResultCode {

    // ==================== 成功 ====================
    SUCCESS(200, "操作成功"),

    // ==================== 客户端错误 4xx ====================
    PARAM_ERROR(400, "请求参数错误"),
    UNAUTHORIZED(401, "未认证，请先登录"),
    FORBIDDEN(403, "没有操作权限"),
    NOT_FOUND(404, "请求的资源不存在"),

    // ==================== 服务端错误 5xx ====================
    INTERNAL_ERROR(500, "服务器内部错误，请稍后重试"),

    // ==================== 业务自定义错误码 1xxx ====================
    USERNAME_ALREADY_EXISTS(1001, "用户名已存在"),
    EMAIL_ALREADY_REGISTERED(1002, "邮箱已被注册"),
    ARTICLE_NOT_FOUND(1003, "文章不存在"),
    CATEGORY_NOT_FOUND(1004, "分类不存在"),
    CATEGORY_HAS_ARTICLES(1005, "该分类下存在文章，无法删除");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
```

**设计说明**：
- `200` — HTTP 标准码，表示成功
- `400/401/403/404/500` — 借鉴 HTTP 标准状态码，语义明确
- `1xxx` — 业务自定义错误码，按模块分段（1001-1099 用户模块，1100-1199 文章模块，以此类推）

### 4.2.2 统一响应封装类 Result

**文件路径**：`src/main/java/com/example/blog/common/Result.java`

```java
package com.example.blog.common;

import java.io.Serializable;

public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private int code;       // 响应状态码
    private String message; // 响应提示信息
    private T data;         // 响应数据

    private Result() {}

    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // ========== 成功响应 ==========

    public static Result<Void> success() {
        return new Result<Void>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<T>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    public static <T> Result<T> success(String message, T data) {
        return new Result<T>(ResultCode.SUCCESS.getCode(), message, data);
    }

    // ========== 失败响应 ==========

    public static Result<Void> fail(ResultCode resultCode) {
        return new Result<Void>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    public static Result<Void> fail(ResultCode resultCode, String message) {
        return new Result<Void>(resultCode.getCode(), message, null);
    }

    public static Result<Void> fail(int code, String message) {
        return new Result<Void>(code, message, null);
    }

    // ========== Getter / Setter ==========
    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
```

**设计要点**：
1. **泛型 `<T>`**：`data` 字段可以是任意类型 — 单个对象、列表、分页结果等
2. **静态工厂方法**：`success()` / `fail()` 简洁易用，调用方不需要 `new Result()`
3. **私有构造**：防止外部直接 `new` 出不符合规范的实例
4. **实现 `Serializable`**：支持序列化场景（Redis 缓存等）

> **JDK 8 小提示**：构造时写 `new Result<T>(...)` 而不是省略泛型的 `new Result<>(...)`，
> 两者在 JDK 8 下都合法，前者主要是为了避免在某些旧编译器/IDE 下的歧义提示，风格更保守。

---

## 4.3 自定义业务异常 BusinessException

在业务逻辑中，我们经常需要主动抛出异常来中断流程。自定义异常可以携带错误码，让全局处理器知道应该返回什么响应。

**文件路径**：`src/main/java/com/example/blog/common/BusinessException.java`

```java
package com.example.blog.common;

public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final int code;

    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public BusinessException(ResultCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(ResultCode resultCode, Throwable cause) {
        super(resultCode.getMessage(), cause);
        this.code = resultCode.getCode();
    }

    public int getCode() { return code; }
}
```

**使用示例**：
```java
// Service 层：文章不存在时抛出异常
public ArticleVO getArticle(Long id) {
    Article article = articleMapper.selectById(id);
    if (article == null) {
        throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
    }
    // ... 转换为 VO 并返回
}

// 也可以带自定义消息
if (article.getStatus() != 1) {
    throw new BusinessException(ResultCode.FORBIDDEN, "该文章已被禁用，无法查看");
}
```

---

## 4.4 全局异常处理器 GlobalExceptionHandler

### 4.4.1 核心注解说明

| 注解 | 作用 |
|------|------|
| `@RestControllerAdvice` | 组合注解 = `@ControllerAdvice` + `@ResponseBody`，表示对所有 Controller 生效，且返回值序列化为 JSON |
| `@ExceptionHandler` | 标注在方法上，指定该方法处理哪种异常 |
| `@ResponseStatus` | 设置返回的 HTTP 状态码 |

### 4.4.2 完整实现

**文件路径**：`src/main/java/com/example/blog/common/GlobalExceptionHandler.java`

```java
package com.example.blog.common;

import javax.servlet.http.HttpServletRequest;   // 注意：SB 2.5 是 javax，不是 jakarta
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("业务异常 [URI={}]: code={}, message={}",
                request.getRequestURI(), e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    /**
     * 处理 @Valid 校验异常（@RequestBody）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e,
                                                   HttpServletRequest request) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 处理表单绑定异常
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException e, HttpServletRequest request) {
        String errorMessage = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数绑定失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 兜底处理所有未知异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("系统异常 [URI={}]: {}", request.getRequestURI(), e.getMessage(), e);
        return Result.fail(ResultCode.INTERNAL_ERROR);
    }
}
```

### 4.4.3 异常处理优先级

Spring 会按照"最精确匹配"原则选择异常处理方法：

```
BusinessException         → handleBusinessException()      [精确匹配]
MethodArgumentNotValidException → handleValidationException() [精确匹配]
BindException             → handleBindException()           [精确匹配]
NullPointerException      → handleException()               [兜底匹配]
```

---

## 4.5 在 Controller 中使用

下面是一个完整的 Controller 示例，演示各种响应场景。

> **JDK 8 注意**：`Map.of(...)`、`List.of(...)` 是 JDK 9+ 才有的 API，在 JDK 8 环境下会直接编译失败。
> 本教程使用 `LinkedHashMap` / `Arrays.asList(...)` 代替，效果完全一致。

```java
package com.example.blog.controller;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Result;
import com.example.blog.common.ResultCode;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    /**
     * 场景 1：成功响应（携带数据）
     * GET /api/demo/article/1
     */
    @GetMapping("/article/{id}")
    public Result<Map<String, Object>> getArticle(@PathVariable Long id) {
        // 模拟：id <= 0 时抛出业务异常
        if (id <= 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "文章 ID 必须大于 0");
        }
        // 模拟：id == 999 时文章不存在
        if (id == 999) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // JDK 8 下没有 Map.of，使用 LinkedHashMap 构造
        Map<String, Object> article = new LinkedHashMap<>();
        article.put("id", id);
        article.put("title", "Spring Boot 2.5 实战");
        article.put("author", "张三");
        return Result.success(article);
    }

    /**
     * 场景 2：成功响应（无数据）
     * DELETE /api/demo/article/1
     */
    @DeleteMapping("/article/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        // 删除逻辑...
        return Result.success();
    }

    /**
     * 场景 3：成功响应（列表数据）
     * GET /api/demo/articles
     */
    @GetMapping("/articles")
    public Result<List<String>> listArticles() {
        // JDK 8 下没有 List.of，使用 Arrays.asList
        List<String> titles = Arrays.asList("文章一", "文章二", "文章三");
        return Result.success(titles);
    }

    /**
     * 场景 4：模拟未知异常（500）
     * GET /api/demo/error
     */
    @GetMapping("/error")
    public Result<Void> triggerError() {
        int result = 10 / 0; // 故意触发 ArithmeticException
        return Result.success();
    }
}
```

> DemoController 属于演示代码，未包含在本章 `src/` 目录中。如需运行 4.6 节的测试，
> 将上面的代码保存为 `src/main/java/com/example/blog/controller/DemoController.java` 即可。

---

## 4.6 测试各种响应场景

启动项目后，使用 `curl` 测试各种场景：

### 场景 1：成功响应

```bash
# 请求
curl -X GET http://localhost:8080/api/demo/article/1

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "title": "Spring Boot 2.5 实战",
        "author": "张三"
    }
}
```

### 场景 2：业务异常 — 参数错误

```bash
# 请求（id=-1）
curl -X GET http://localhost:8080/api/demo/article/-1

# 预期响应
{
    "code": 400,
    "message": "文章 ID 必须大于 0",
    "data": null
}
```

### 场景 3：业务异常 — 资源不存在

```bash
# 请求（id=999）
curl -X GET http://localhost:8080/api/demo/article/999

# 预期响应
{
    "code": 1003,
    "message": "文章不存在",
    "data": null
}
```

### 场景 4：未知异常（500）

```bash
# 请求
curl -X GET http://localhost:8080/api/demo/error

# 预期响应
{
    "code": 500,
    "message": "服务器内部错误，请稍后重试",
    "data": null
}
```

### 场景 5：列表数据

```bash
# 请求
curl -X GET http://localhost:8080/api/demo/articles

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": ["文章一", "文章二", "文章三"]
}
```

### 场景 6：成功响应（无数据）

```bash
# 请求
curl -X DELETE http://localhost:8080/api/demo/article/1

# 预期响应
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

---

## 4.7 前端统一处理示例

前端（以 Axios 为例）可以写一个统一的响应拦截器：

```javascript
// src/utils/request.js
import axios from 'axios'
import { Message } from 'element-ui'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // code 不为 200，视为错误
    if (res.code !== 200) {
      Message.error(res.message || '请求失败')
      // 401: 未登录，跳转登录页
      if (res.code === 401) {
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    Message.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

这样前端每个接口只需要关心 `data` 字段即可：

```javascript
// 获取文章详情
const { data } = await request.get(`/demo/article/${id}`)
console.log(data) // { id: 1, title: "...", author: "..." }
```

---

## 4.8 本章小结

| 组件 | 文件 | 作用 |
|------|------|------|
| `Result<T>` | `common/Result.java` | 统一响应封装，所有接口返回此类型 |
| `ResultCode` | `common/ResultCode.java` | 响应码枚举，集中管理所有错误码 |
| `BusinessException` | `common/BusinessException.java` | 自定义业务异常，携带错误码 |
| `GlobalExceptionHandler` | `common/GlobalExceptionHandler.java` | 全局异常处理器，捕获异常并转换为统一响应 |

**最佳实践**：
1. Controller 方法**永远**返回 `Result<T>`，不要返回裸对象
2. Service 层发现业务异常直接抛出 `BusinessException`，不要返回错误码
3. 错误码使用枚举集中管理，禁止在代码中硬编码数字
4. 未知异常的堆栈信息只记录到日志，**不要**返回给前端（安全风险）

---

## 4.9 下一步

下一章我们将学习 **参数校验** — 如何在请求到达 Controller 之前自动校验参数合法性，并在全局异常处理器中返回友好的错误提示。
