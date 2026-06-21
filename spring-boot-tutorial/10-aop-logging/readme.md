# 第 10 章：AOP 与日志

> **个人博客系统** — Spring Boot 3 实战教程
>
> 本章源码路径：`10-aop-logging/`

---

## 目录

- [10.1 AOP 概念详解](#101-aop-概念详解)
- [10.2 Spring AOP vs AspectJ](#102-spring-aop-vs-aspectj)
- [10.3 需求分析：为什么需要操作日志](#103-需求分析为什么需要操作日志)
- [10.4 数据库表设计](#104-数据库表设计)
- [10.5 自定义注解 @OperationLog](#105-自定义注解-operationlog)
- [10.6 操作日志实体与 Mapper](#106-操作日志实体与-mapper)
- [10.7 AOP 切面实现](#107-aop-切面实现)
- [10.8 在 Controller 中使用 @OperationLog](#108-在-controller-中使用-operationlog)
- [10.9 日志查询接口](#109-日志查询接口)
- [10.10 接口耗时统计](#1010-接口耗时统计)
- [10.11 测试日志记录功能](#1011-测试日志记录功能)
- [10.12 本章小结](#1012-本章小结)

---

## 10.1 AOP 概念详解

**AOP（Aspect-Oriented Programming，面向切面编程）** 是 Spring 框架的两大核心特性之一（另一个是 IoC）。它允许我们将**横切关注点（Cross-Cutting Concern）** 从业务逻辑中分离出来，从而实现更好的模块化和代码复用。

### 什么是横切关注点？

在一个典型的 Web 应用中，以下功能会"横切"多个业务模块：

| 横切关注点     | 说明                                         |
| -------------- | -------------------------------------------- |
| 日志记录       | 几乎每个接口都需要记录操作日志               |
| 权限校验       | 大部分接口都需要检查用户权限                 |
| 事务管理       | 多个 Service 方法都需要事务控制              |
| 性能监控       | 需要统计各个接口的执行耗时                   |
| 异常处理       | 统一的异常捕获和处理                         |

如果将这些逻辑写在每个业务方法中，会导致代码大量重复且难以维护。AOP 就是解决这个问题的利器。

### AOP 核心术语

```
┌─────────────────────────────────────────────────────────┐
│                    AOP 核心概念                          │
├──────────────┬──────────────────────────────────────────┤
│ 切面(Aspect) │ 横切关注点的模块化实现，包含切点和通知。 │
│              │ 可以理解为一个"类"级别的增强。            │
├──────────────┼──────────────────────────────────────────┤
│ 连接点       │ 程序执行过程中的一个点，如方法调用、     │
│ (JoinPoint)  │ 异常抛出等。Spring AOP 中连接点仅指方法。│
├──────────────┼──────────────────────────────────────────┤
│ 切点         │ 用于匹配连接点的表达式。决定"哪些方法    │
│ (Pointcut)   │ 需要被增强"。                            │
├──────────────┼──────────────────────────────────────────┤
│ 通知(Advice) │ 在切点匹配的连接点处执行的动作。         │
│              │ 包括 Before、After、Around 等类型。       │
├──────────────┼──────────────────────────────────────────┤
│ 织入         │ 将切面应用到目标对象，创建代理对象的      │
│ (Weaving)    │ 过程。Spring 使用运行时动态代理。        │
├──────────────┼──────────────────────────────────────────┤
│ 目标对象     │ 被代理的对象，即业务逻辑所在的类。       │
│ (Target)     │                                          │
├──────────────┼──────────────────────────────────────────┤
│ 代理(Proxy)  │ AOP 框架创建的对象，包含增强后的方法。   │
└──────────────┴──────────────────────────────────────────┘
```

### 五种通知类型

| 通知类型          | 注解               | 执行时机                             |
| ----------------- | ------------------ | ------------------------------------ |
| 前置通知          | `@Before`          | 目标方法执行之前                     |
| 后置通知          | `@After`           | 目标方法执行之后（无论是否异常）     |
| 返回通知          | `@AfterReturning`  | 目标方法正常返回之后                 |
| 异常通知          | `@AfterThrowing`   | 目标方法抛出异常之后                 |
| **环绕通知**      | `@Around`          | **包裹目标方法，最强大，推荐使用**   |

> **环绕通知**是最常用的通知类型，它可以：
> - 在目标方法执行前后添加自定义逻辑
> - 决定是否执行目标方法
> - 修改方法的参数和返回值
> - 捕获并处理异常

---

## 10.2 Spring AOP vs AspectJ

| 对比维度       | Spring AOP                    | AspectJ                        |
| -------------- | ----------------------------- | ------------------------------ |
| 织入方式       | 运行时动态代理                | 编译时/加载时织入              |
| 依赖           | spring-boot-starter-aop       | aspectjweaver + aspectjtools   |
| 连接点支持     | 仅支持方法级别                | 支持方法、字段、构造器等       |
| 性能           | 运行时代理有微小性能开销      | 编译时织入，运行时无额外开销   |
| 使用复杂度     | 简单，注解驱动                | 较复杂，需要专门的编译器       |
| 适用场景       | 大多数企业应用                | 对性能要求极高的场景           |

> **本教程使用 Spring AOP**，因为它集成简单，对于博客系统的操作日志、性能监控等场景完全足够。

### Maven 依赖

在 `pom.xml` 中添加 AOP 依赖：

```xml
<!-- Spring AOP -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

该 starter 自动引入了 `spring-aop` 和 `aspectjweaver`，无需额外配置。

---

## 10.3 需求分析：为什么需要操作日志

在个人博客系统中，我们需要记录以下操作：

- 用户登录/登出
- 文章的增删改
- 评论的审核/删除
- 系统配置的修改

**传统做法**（不推荐）：在每个 Controller 方法中手动写入日志。

```java
// ❌ 不推荐：每个方法都写日志代码
@PostMapping
public Result createArticle(@RequestBody ArticleDTO dto) {
    log.info("用户{}创建文章: {}", userId, dto.getTitle());
    long start = System.currentTimeMillis();
    Result result = articleService.create(dto);
    long cost = System.currentTimeMillis() - start;
    operationLogMapper.insert(buildLog("文章管理", "创建", userId, cost, ...));
    return result;
}
```

**AOP 做法**（推荐）：只需一个注解。

```java
// ✅ 推荐：使用注解标记
@OperationLog(module = "文章管理", type = "创建", description = "创建新文章")
@PostMapping
public Result createArticle(@RequestBody ArticleDTO dto) {
    return Result.ok(articleService.create(dto));
}
```

---

## 10.4 数据库表设计

首先创建操作日志表。执行以下 SQL：

```sql
-- 文件：sql/add_operation_log.sql
CREATE TABLE `operation_log` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `module`       VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '操作模块',
    `type`         VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '操作类型',
    `description`  VARCHAR(256) NOT NULL DEFAULT '' COMMENT '操作描述',
    `method`       VARCHAR(256) NOT NULL DEFAULT '' COMMENT '请求方法（类名.方法名）',
    `request_method` VARCHAR(16) NOT NULL DEFAULT '' COMMENT 'HTTP 请求方法（GET/POST等）',
    `request_url`  VARCHAR(512) NOT NULL DEFAULT '' COMMENT '请求URL',
    `request_params` TEXT        NULL     COMMENT '请求参数（JSON）',
    `response_result` TEXT       NULL     COMMENT '响应结果（JSON）',
    `operator_id`  BIGINT       NULL     COMMENT '操作人ID',
    `operator_name` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '操作人姓名',
    `ip`           VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '操作人IP地址',
    `user_agent`   VARCHAR(512) NOT NULL DEFAULT '' COMMENT '浏览器User-Agent',
    `cost_time`    BIGINT       NOT NULL DEFAULT 0 COMMENT '耗时（毫秒）',
    `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1-成功 0-失败',
    `error_msg`    TEXT         NULL     COMMENT '错误信息',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_module` (`module`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

---

## 10.5 自定义注解 @OperationLog

> 完整代码见 `src/main/java/com/example/blog/aspect/OperationLog.java`

我们定义一个 `@OperationLog` 注解，用于标记需要记录操作日志的方法：

```java
package com.example.blog.aspect;

import java.lang.annotation.*;

/**
 * 操作日志注解
 * <p>
 * 标记在 Controller 方法上，AOP 切面会自动拦截并记录操作日志，
 * 包括操作人、操作类型、请求参数、响应结果、耗时、IP 地址等信息。
 * </p>
 *
 * <pre>
 * 使用示例：
 * {@code @OperationLog(module = "文章管理", type = "创建", description = "创建新文章")}
 * </pre>
 */
@Target(ElementType.METHOD)       // 只能标注在方法上
@Retention(RetentionPolicy.RUNTIME) // 运行时保留，AOP 需要读取
@Documented                        // 包含在 Javadoc 中
public @interface OperationLog {

    /**
     * 操作模块
     * <p>例如：文章管理、用户管理、评论管理</p>
     */
    String module() default "";

    /**
     * 操作类型
     * <p>例如：创建、修改、删除、查询、导入、导出</p>
     */
    String type() default "";

    /**
     * 操作描述
     * <p>对本次操作的详细说明</p>
     */
    String description() default "";
}
```

**设计要点**：
- `@Target(ElementType.METHOD)` — 限制注解只能用在方法上
- `@Retention(RetentionPolicy.RUNTIME)` — 保证运行时可以通过反射读取注解信息
- 三个属性 `module`、`type`、`description` 都有默认值，使用时可以按需填写

---

## 10.6 操作日志实体与 Mapper

### 10.6.1 OperationLogEntity

> 完整代码见 `src/main/java/com/example/blog/entity/OperationLogEntity.java`

```java
package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志实体类
 */
@Data
@TableName("operation_log")
public class OperationLogEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作模块 */
    private String module;

    /** 操作类型 */
    private String type;

    /** 操作描述 */
    private String description;

    /** 请求方法（类名.方法名） */
    private String method;

    /** HTTP 请求方法 */
    private String requestMethod;

    /** 请求URL */
    private String requestUrl;

    /** 请求参数（JSON） */
    private String requestParams;

    /** 响应结果（JSON） */
    private String responseResult;

    /** 操作人ID */
    private Long operatorId;

    /** 操作人姓名 */
    private String operatorName;

    /** 操作人IP */
    private String ip;

    /** 浏览器User-Agent */
    private String userAgent;

    /** 耗时（毫秒） */
    private Long costTime;

    /** 状态：1-成功 0-失败 */
    private Integer status;

    /** 错误信息 */
    private String errorMsg;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
```

### 10.6.2 OperationLogMapper

> 完整代码见 `src/main/java/com/example/blog/mapper/OperationLogMapper.java`

```java
package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.OperationLogEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 操作日志 Mapper
 */
@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLogEntity> {
    // MyBatis-Plus 的 BaseMapper 已经提供了基础的 CRUD 操作
    // 无需额外定义方法
}
```

---

## 10.7 AOP 切面实现

这是本章的**核心部分**。切面类使用 `@Aspect` 注解标注，通过 `@Around` 环绕通知拦截带有 `@OperationLog` 注解的方法。

> 完整代码见 `src/main/java/com/example/blog/aspect/OperationLogAspect.java`

### 关键实现思路

```
请求进入
    │
    ▼
┌─────────────────────────┐
│ 1. 记录开始时间          │
│ 2. 获取注解信息          │
│ 3. 获取请求信息（URL/IP）│
│ 4. 获取操作人信息        │
│ 5. 执行目标方法          │ ← proceed()
│ 6. 记录结束时间          │
│ 7. 构建日志实体          │
│ 8. 异步保存日志          │
│ 9. 返回结果              │
└─────────────────────────┘
```

### 切面核心代码

```java
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;
    private final ObjectMapper objectMapper;

    /**
     * 切点：匹配所有标注了 @OperationLog 的方法
     */
    @Pointcut("@annotation(com.example.blog.aspect.OperationLog)")
    public void operationLogPointcut() {
        // 切点定义，不需要方法体
    }

    /**
     * 环绕通知：拦截切点匹配的方法
     */
    @Around("operationLogPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取当前 HTTP 请求
        HttpServletRequest request = getRequest();
        
        // 获取注解信息
        OperationLog operationLog = getAnnotation(joinPoint);
        
        // 构建日志实体
        OperationLogEntity logEntity = new OperationLogEntity();
        logEntity.setModule(operationLog.module());
        logEntity.setType(operationLog.type());
        logEntity.setDescription(operationLog.description());
        // ... 填充更多信息
        
        Object result = null;
        try {
            // 执行目标方法
            result = joinPoint.proceed();
            logEntity.setStatus(1); // 成功
            // 记录响应结果
            logEntity.setResponseResult(toJson(result));
        } catch (Throwable ex) {
            logEntity.setStatus(0); // 失败
            logEntity.setErrorMsg(ex.getMessage());
            throw ex; // 继续抛出异常
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            logEntity.setCostTime(costTime);
            // 异步保存日志
            saveLog(logEntity);
        }
        
        return result;
    }
}
```

### IP 地址获取工具方法

获取客户端真实 IP 需要处理反向代理的情况：

```java
/**
 * 获取客户端真实IP地址
 * 需要处理 Nginx 等反向代理的情况
 */
private String getClientIp(HttpServletRequest request) {
    String ip = request.getHeader("X-Forwarded-For");
    if (StringUtils.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
        ip = request.getHeader("Proxy-Client-IP");
    }
    if (StringUtils.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
        ip = request.getHeader("X-Real-IP");
    }
    if (StringUtils.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
        ip = request.getRemoteAddr();
    }
    // 多次代理时取第一个IP
    if (ip != null && ip.contains(",")) {
        ip = ip.split(",")[0].trim();
    }
    return ip;
}
```

### 异步保存日志

为了不阻塞业务方法的返回，日志保存采用异步方式（使用 `@Async` 或直接使用 `CompletableFuture`）：

```java
/**
 * 异步保存操作日志
 */
@Async
public void saveLog(OperationLogEntity logEntity) {
    try {
        operationLogMapper.insert(logEntity);
    } catch (Exception e) {
        log.error("保存操作日志失败: {}", e.getMessage(), e);
    }
}
```

> **注意**：使用 `@Async` 需要在启动类上添加 `@EnableAsync` 注解。

---

## 10.8 在 Controller 中使用 @OperationLog

在需要记录日志的 Controller 方法上添加注解即可：

```java
@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Tag(name = "文章管理")
public class ArticleController {

    private final ArticleService articleService;

    @OperationLog(module = "文章管理", type = "创建", description = "创建新文章")
    @PostMapping
    public Result<Long> create(@RequestBody @Valid ArticleCreateDTO dto) {
        return Result.ok(articleService.create(dto));
    }

    @OperationLog(module = "文章管理", type = "修改", description = "更新文章内容")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id,
                               @RequestBody @Valid ArticleUpdateDTO dto) {
        articleService.update(id, dto);
        return Result.ok();
    }

    @OperationLog(module = "文章管理", type = "删除", description = "删除文章")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        articleService.delete(id);
        return Result.ok();
    }

    // 查询接口通常不需要记录操作日志
    @GetMapping("/{id}")
    public Result<ArticleVO> getById(@PathVariable Long id) {
        return Result.ok(articleService.getById(id));
    }
}
```

---

## 10.9 日志查询接口

> 完整代码见 `src/main/java/com/example/blog/controller/LogController.java`

提供一个管理端接口，支持分页查询、按模块筛选等操作：

```java
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@Tag(name = "操作日志管理")
public class LogController {

    private final OperationLogMapper operationLogMapper;

    /**
     * 分页查询操作日志
     */
    @GetMapping
    public Result<IPage<OperationLogEntity>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String operatorName) {

        Page<OperationLogEntity> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<OperationLogEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.isNotBlank(module),
                     OperationLogEntity::getModule, module)
               .like(StringUtils.isNotBlank(operatorName),
                     OperationLogEntity::getOperatorName, operatorName)
               .orderByDesc(OperationLogEntity::getCreateTime);

        return Result.ok(operationLogMapper.selectPage(page, wrapper));
    }

    /**
     * 查询日志详情
     */
    @GetMapping("/{id}")
    public Result<OperationLogEntity> getById(@PathVariable Long id) {
        return Result.ok(operationLogMapper.selectById(id));
    }
}
```

---

## 10.10 接口耗时统计

除了操作日志外，我们还可以利用 AOP 实现一个全局的**接口耗时统计**切面。这个切面不需要自定义注解，直接拦截所有 Controller 方法：

```java
@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    /**
     * 切点：匹配 controller 包下所有类的所有方法
     */
    @Pointcut("execution(* com.example.blog.controller..*.*(..))")
    public void controllerPointcut() {}

    @Around("controllerPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            return joinPoint.proceed();
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            if (costTime > 500) {
                // 超过 500ms 的接口打印警告
                log.warn("[慢接口] {} 耗时 {}ms", methodName, costTime);
            } else {
                log.info("[接口耗时] {} 耗时 {}ms", methodName, costTime);
            }
        }
    }
}
```

> **提示**：生产环境中，可以将慢接口的阈值写入配置文件，方便调整。也可以将耗时统计存入 Redis，配合监控系统做实时告警。

---

## 10.11 测试日志记录功能

### 10.11.1 启动应用并调用接口

启动应用后，调用任意带有 `@OperationLog` 注解的接口：

```bash
# 创建文章（触发操作日志记录）
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Spring AOP 入门",
    "content": "AOP 是面向切面编程...",
    "categoryId": 1
  }'
```

### 10.11.2 查询操作日志

```bash
# 查询操作日志列表
curl http://localhost:8080/api/admin/logs?pageNum=1&pageSize=10 \
  -H "Authorization: Bearer {token}"
```

预期响应：

```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": 1,
        "module": "文章管理",
        "type": "创建",
        "description": "创建新文章",
        "method": "ArticleController.create(..)",
        "requestMethod": "POST",
        "requestUrl": "/api/articles",
        "requestParams": "{\"title\":\"Spring AOP 入门\",...}",
        "operatorId": 1,
        "operatorName": "admin",
        "ip": "127.0.0.1",
        "costTime": 128,
        "status": 1,
        "createTime": "2025-01-15T10:30:00"
      }
    ],
    "total": 1,
    "current": 1,
    "pages": 1
  }
}
```

### 10.11.3 验证耗时统计日志

查看控制台输出，可以看到每次请求的耗时信息：

```
2025-01-15 10:30:00.123  INFO  [接口耗时] ArticleController.create(..) 耗时 128ms
2025-01-15 10:30:05.456  INFO  [接口耗时] ArticleController.getById(..) 耗时 15ms
2025-01-15 10:30:10.789  WARN  [慢接口] ArticleController.export(..) 耗时 1523ms
```

---

## 10.12 本章小结

本章我们学习了：

| 知识点               | 要点                                                       |
| -------------------- | ---------------------------------------------------------- |
| AOP 基础概念         | 切面、切点、通知、连接点、织入的含义和关系                 |
| 自定义注解           | 使用 `@interface` 定义 `@OperationLog` 注解                |
| AOP 切面实现         | `@Aspect` + `@Around` 拦截注解方法，记录完整操作日志       |
| 操作日志存储         | 数据库表设计 + MyBatis-Plus 实体映射                       |
| IP 地址获取          | 处理反向代理场景下的真实 IP 获取                           |
| 异步保存             | `@Async` 异步写入日志，不阻塞业务方法                      |
| 接口耗时统计         | 使用 `execution` 切点拦截所有 Controller 方法               |
| 日志查询             | 分页查询、条件筛选操作日志                                 |

### 下一章预告

下一章我们将实现**文件上传**功能，包括图片上传、文件类型校验、静态资源映射等，让用户可以上传头像和文章封面图片。

---

## 附录：本章文件清单

| 文件路径 | 说明 |
| -------- | ---- |
| `aspect/OperationLog.java` | 自定义操作日志注解 |
| `aspect/OperationLogAspect.java` | AOP 切面实现 |
| `entity/OperationLogEntity.java` | 操作日志实体类 |
| `mapper/OperationLogMapper.java` | 操作日志 Mapper |
| `controller/LogController.java` | 日志查询 Controller |
| `sql/add_operation_log.sql` | 建表 SQL |
