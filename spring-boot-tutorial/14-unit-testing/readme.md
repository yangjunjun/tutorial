# 第 14 章：单元测试与集成测试

> 本章源码目录：`14-unit-testing/`

## 本章导读

在前面的章节中，我们已经完成了博客系统的核心功能开发——用户认证、文章管理、分类标签、文件上传等等。但一个真正可靠的应用，除了"能跑"之外，还必须"跑得对"。本章将系统讲解如何为 Spring Boot 应用编写测试，从最基础的单元测试到完整的集成测试，帮助你建立可靠的测试体系。

**本章你将学到：**
- 测试金字塔的核心理念
- JUnit 5 的核心用法
- Mockito 模拟依赖
- Service 层单元测试实战
- Controller 层集成测试实战
- JWT 认证测试
- 测试覆盖率分析

---

## 14.1 测试金字塔概念

在软件工程中，测试金字塔（Test Pyramid）是一个经典的测试策略模型，由 Mike Cohn 提出。它将测试分为三个层次：

```
         /  E2E  \          ← 少量端到端测试（成本高、速度慢）
        / 集成测试 \         ← 适量集成测试（中等成本）
       /  单元测试   \       ← 大量单元测试（成本低、速度快）
      ——————————————————
```

### 各层测试的特点

| 测试类型 | 数量 | 执行速度 | 覆盖范围 | 维护成本 |
|---------|------|---------|---------|---------|
| 单元测试 | 最多 | 毫秒级 | 单个方法/类 | 低 |
| 集成测试 | 适中 | 秒级 | 多个组件协作 | 中 |
| E2E 测试 | 最少 | 分钟级 | 完整用户流程 | 高 |

### 为什么需要分层测试？

1. **单元测试**：验证最小单元（如一个方法）的逻辑是否正确。运行极快，编写简单，是测试体系的基石。
2. **集成测试**：验证多个组件（如 Controller + Service + Database）协作是否正常。能发现单元测试覆盖不到的交互问题。
3. **E2E 测试**：模拟真实用户操作，验证完整业务流程。通常由前端团队或 QA 团队负责，本章不做深入讨论。

**我们的策略**：以大量的单元测试为基础，辅以关键的集成测试，确保博客系统的核心功能正确可靠。

---

## 14.2 Spring Boot 测试支持概述

Spring Boot 提供了丰富的测试支持，主要包括：

### 核心注解一览

```java
@SpringBootTest        // 加载完整的 Spring 应用上下文（集成测试）
@WebMvcTest            // 只加载 Controller 层相关 Bean（Web 层测试）
@DataJpaTest           // 只加载 JPA 相关 Bean（数据层测试）
@MybatisPlusTest       // 只加载 MyBatis-Plus 相关 Bean（自定义）
@JsonTest              // 只加载 JSON 序列化/反序列化相关 Bean
@MockBean              // 用 Mock 对象替换 Spring 容器中的 Bean
@SpyBean               // 用 Spy 对象包装 Spring 容器中的 Bean
@AutoConfigureMockMvc  // 自动配置 MockMvc（不需要 @WebMvcTest 也能用）
```

### 测试依赖

Spring Boot 的测试支持已经包含在 `spring-boot-starter-test` 中，它传递依赖了：

- **JUnit 5**：单元测试框架
- **Mockito**：Mock 框架
- **AssertJ**：流式断言库
- **Hamcrest**：匹配器库
- **JSONassert**：JSON 断言
- **JsonPath**：JSON 路径解析
- **MockMvc**：Web 层测试工具

我们只需要在 `pom.xml` 中添加：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- H2 内存数据库，用于集成测试 -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

> 完整的 `pom.xml` 请参考本章附带的 `pom.xml` 文件。

---

## 14.3 JUnit 5 基础

JUnit 5 是 Java 生态中最主流的测试框架。相比 JUnit 4，它提供了更现代、更灵活的 API。

### 14.3.1 基本注解

```java
import org.junit.jupiter.api.*;

class BasicTestDemo {

    // @BeforeEach：每个测试方法执行前都会调用
    @BeforeEach
    void setUp() {
        System.out.println("每个测试前执行");
    }

    // @AfterEach：每个测试方法执行后都会调用
    @AfterEach
    void tearDown() {
        System.out.println("每个测试后执行");
    }

    // @BeforeAll：所有测试方法执行前调用一次（必须是 static）
    @BeforeAll
    static void beforeAll() {
        System.out.println("所有测试前执行一次");
    }

    // @AfterAll：所有测试方法执行后调用一次（必须是 static）
    @AfterAll
    static void afterAll() {
        System.out.println("所有测试后执行一次");
    }

    // @Test：标记一个测试方法
    @Test
    void simpleTest() {
        assertEquals(2, 1 + 1);
    }

    // @DisplayName：自定义测试名称，提高可读性
    @Test
    @DisplayName("1 + 1 应该等于 2")
    void additionTest() {
        assertEquals(2, 1 + 1);
    }

    // @Disabled：跳过某个测试
    @Test
    @Disabled("暂时跳过")
    void disabledTest() {
        fail("这个测试不会执行");
    }
}
```

### 14.3.2 常用断言

JUnit 5 的断言方法都在 `org.junit.jupiter.api.Assertions` 中：

```java
import static org.junit.jupiter.api.Assertions.*;

class AssertionsDemo {

    @Test
    void assertionsDemo() {
        // 基本断言
        assertEquals(4, 2 + 2, "2+2 应该等于 4");
        assertNotEquals(5, 2 + 2);
        assertTrue(2 > 1);
        assertFalse(2 < 1);
        assertNull(null);
        assertNotNull("hello");

        // 异常断言
        Exception exception = assertThrows(
            IllegalArgumentException.class,
            () -> { throw new IllegalArgumentException("参数非法"); }
        );
        assertEquals("参数非法", exception.getMessage());

        // 组合断言
        String name = "Spring Boot";
        assertAll("字符串检查",
            () -> assertTrue(name.startsWith("Spring")),
            () -> assertTrue(name.endsWith("Boot")),
            () -> assertEquals(11, name.length())
        );
    }

    @Test
    void timeoutDemo() {
        // 超时断言：方法必须在 1 秒内执行完
        assertTimeout(Duration.ofSeconds(1), () -> {
            Thread.sleep(500);
        });
    }
}
```

### 14.3.3 @Nested 嵌套测试

`@Nested` 可以将相关的测试用例组织在一起，形成层次化的测试结构：

```java
@DisplayName("文章服务测试")
class ArticleServiceTest {

    @Nested
    @DisplayName("创建文章")
    class CreateArticle {
        @Test
        void shouldCreateArticleSuccessfully() { /* ... */ }

        @Test
        void shouldThrowWhenTitleIsEmpty() { /* ... */ }
    }

    @Nested
    @DisplayName("删除文章")
    class DeleteArticle {
        @Test
        void shouldDeleteExistingArticle() { /* ... */ }

        @Test
        void shouldThrowWhenArticleNotFound() { /* ... */ }
    }
}
```

---

## 14.4 Mockito 基础

在实际的单元测试中，我们不想依赖真实的数据库、网络等外部资源。Mockito 允许我们创建模拟对象（Mock），精确控制它们的行为并验证它们是否被正确调用。

### 14.4.1 核心概念

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)  // 启用 Mockito 支持
class MockitoDemo {

    @Mock
    private ArticleMapper articleMapper;  // 模拟的 Mapper

    @InjectMocks
    private ArticleService articleService;  // 自动注入上面的 Mock

    @Test
    void mockitoDemo() {
        // 1. 定义 Mock 行为：当调用 selectById(1L) 时，返回指定对象
        Article mockArticle = new Article();
        mockArticle.setId(1L);
        mockArticle.setTitle("测试文章");

        when(articleMapper.selectById(1L)).thenReturn(mockArticle);

        // 2. 调用被测方法
        Article result = articleService.getById(1L);

        // 3. 验证结果
        assertNotNull(result);
        assertEquals("测试文章", result.getTitle());

        // 4. 验证 Mock 对象的方法是否被调用
        verify(articleMapper, times(1)).selectById(1L);  // 被调用 1 次
        verify(articleMapper, never()).selectById(999L);  // 从未被调用
    }
}
```

### 14.4.2 常用 Mockito API

```java
// 定义行为
when(mock.method()).thenReturn(value);          // 返回指定值
when(mock.method()).thenThrow(new Exception()); // 抛出异常
when(mock.method()).thenReturn(v1, v2, v3);     // 依次返回不同值

// 参数匹配器
when(mock.method(any())).thenReturn(value);         // 匹配任意参数
when(mock.method(anyLong())).thenReturn(value);     // 匹配任意 long
when(mock.method(anyString())).thenReturn(value);   // 匹配任意 String
when(mock.method(eq(1L))).thenReturn(value);        // 精确匹配

// 验证调用
verify(mock).method(arg);                    // 验证调用了 1 次
verify(mock, times(2)).method(arg);          // 验证调用了 2 次
verify(mock, never()).method(arg);           // 验证从未调用
verify(mock, atLeastOnce()).method(arg);     // 至少调用 1 次
verifyNoMoreInteractions(mock);              // 没有其他交互

// void 方法的 Mock
doNothing().when(mock).deleteById(anyLong());
doThrow(new RuntimeException()).when(mock).deleteById(anyLong());
```

---

## 14.5 Service 层单元测试

Service 层是业务逻辑的核心。对 Service 层进行单元测试时，我们通常 **Mock 掉 Mapper（数据访问层）**，专注于测试业务逻辑本身。

### 14.5.1 ArticleService 单元测试

下面是一个完整的 ArticleService 单元测试示例。假设我们的 ArticleService 包含文章的 CRUD 操作：

> 完整代码：`src/test/java/com/example/blog/service/ArticleServiceTest.java`

```java
package com.example.blog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.entity.Article;
import com.example.blog.entity.User;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.ArticleMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("文章服务 - 单元测试")
class ArticleServiceTest {

    @Mock
    private ArticleMapper articleMapper;

    @InjectMocks
    private ArticleServiceImpl articleService;

    private Article testArticle;

    @BeforeEach
    void setUp() {
        testArticle = new Article();
        testArticle.setId(1L);
        testArticle.setTitle("Spring Boot 入门教程");
        testArticle.setContent("这是文章内容...");
        testArticle.setAuthorId(1L);
        testArticle.setStatus(1); // 1=已发布
    }

    @Nested
    @DisplayName("获取文章详情")
    class GetArticleById {

        @Test
        @DisplayName("根据 ID 查询 - 文章存在时应返回文章")
        void shouldReturnArticleWhenExists() {
            // Arrange：定义 Mock 行为
            when(articleMapper.selectById(1L)).thenReturn(testArticle);

            // Act：调用被测方法
            Article result = articleService.getById(1L);

            // Assert：验证结果
            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("Spring Boot 入门教程", result.getTitle());

            // 验证 Mapper 方法被调用
            verify(articleMapper).selectById(1L);
        }

        @Test
        @DisplayName("根据 ID 查询 - 文章不存在时应返回 null")
        void shouldReturnNullWhenNotExists() {
            when(articleMapper.selectById(999L)).thenReturn(null);

            Article result = articleService.getById(999L);

            assertNull(result);
            verify(articleMapper).selectById(999L);
        }
    }

    @Nested
    @DisplayName("创建文章")
    class CreateArticle {

        @Test
        @DisplayName("创建文章 - 参数正确时应成功创建")
        void shouldCreateArticleSuccessfully() {
            when(articleMapper.insert(any(Article.class))).thenReturn(1);

            Article newArticle = new Article();
            newArticle.setTitle("新文章");
            newArticle.setContent("新内容");
            newArticle.setAuthorId(1L);

            boolean result = articleService.save(newArticle);

            assertTrue(result);
            verify(articleMapper).insert(any(Article.class));
        }
    }

    @Nested
    @DisplayName("删除文章")
    class DeleteArticle {

        @Test
        @DisplayName("删除文章 - 文章存在且是当前用户的应成功删除")
        void shouldDeleteArticleWhenOwnerMatches() {
            when(articleMapper.selectById(1L)).thenReturn(testArticle);
            when(articleMapper.deleteById(1L)).thenReturn(1);

            boolean result = articleService.removeByIdAndAuthor(1L, 1L);

            assertTrue(result);
            verify(articleMapper).selectById(1L);
            verify(articleMapper).deleteById(1L);
        }

        @Test
        @DisplayName("删除文章 - 非作者本人应抛出异常")
        void shouldThrowExceptionWhenNotOwner() {
            when(articleMapper.selectById(1L)).thenReturn(testArticle);

            assertThrows(BusinessException.class, () -> {
                articleService.removeByIdAndAuthor(1L, 999L); // 999L 不是作者
            });

            verify(articleMapper).selectById(1L);
            verify(articleMapper, never()).deleteById(anyLong());
        }
    }
}
```

**代码要点解析：**

1. `@ExtendWith(MockitoExtension.class)`：启用 Mockito 注解支持，替代手动在 `@BeforeEach` 中调用 `MockitoAnnotations.openMocks(this)`。
2. `@Mock`：创建一个 Mock 对象，模拟 ArticleMapper 的行为。
3. `@InjectMocks`：自动创建 ArticleServiceImpl 实例，并将 @Mock 标注的 Mapper 注入进去。
4. `@Nested`：按功能分组测试用例，使测试结构清晰。
5. `@DisplayName`：为测试用例提供中文描述，方便阅读。

### 14.5.2 AuthService 单元测试

认证服务涉及密码校验、JWT 生成与验证等关键逻辑，需要重点测试。

> 完整代码：`src/test/java/com/example/blog/service/AuthServiceTest.java`

```java
package com.example.blog.service;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.entity.User;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.UserMapper;
import com.example.blog.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("认证服务 - 单元测试")
class AuthServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("admin");
        testUser.setPassword("$2a$10$encodedPassword");
        testUser.setEmail("admin@example.com");
        testUser.setRole("ROLE_ADMIN");
        testUser.setStatus(1); // 正常状态
    }

    @Nested
    @DisplayName("用户登录")
    class Login {

        @Test
        @DisplayName("正确的用户名和密码 - 应返回 Token")
        void shouldReturnTokenWhenCredentialsAreCorrect() {
            // Arrange
            LoginRequest request = new LoginRequest("admin", "password123");
            when(userMapper.selectByUsername("admin")).thenReturn(testUser);
            when(passwordEncoder.matches("password123", "$2a$10$encodedPassword"))
                .thenReturn(true);
            when(jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN"))
                .thenReturn("mock-jwt-token");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertNotNull(response);
            assertEquals("mock-jwt-token", response.getToken());
            assertEquals("admin", response.getUsername());

            // 验证各方法被调用
            verify(userMapper).selectByUsername("admin");
            verify(passwordEncoder).matches("password123", "$2a$10$encodedPassword");
            verify(jwtUtil).generateToken(1L, "admin", "ROLE_ADMIN");
        }

        @Test
        @DisplayName("用户名不存在 - 应抛出异常")
        void shouldThrowWhenUsernameNotFound() {
            LoginRequest request = new LoginRequest("unknown", "password");
            when(userMapper.selectByUsername("unknown")).thenReturn(null);

            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request)
            );
            assertEquals("用户名或密码错误", exception.getMessage());
        }

        @Test
        @DisplayName("密码错误 - 应抛出异常")
        void shouldThrowWhenPasswordIsWrong() {
            LoginRequest request = new LoginRequest("admin", "wrongPassword");
            when(userMapper.selectByUsername("admin")).thenReturn(testUser);
            when(passwordEncoder.matches("wrongPassword", "$2a$10$encodedPassword"))
                .thenReturn(false);

            assertThrows(BusinessException.class, () -> authService.login(request));

            // Token 不应被生成
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("账号被禁用 - 应抛出异常")
        void shouldThrowWhenAccountIsDisabled() {
            testUser.setStatus(0); // 禁用状态
            LoginRequest request = new LoginRequest("admin", "password123");
            when(userMapper.selectByUsername("admin")).thenReturn(testUser);
            when(passwordEncoder.matches("password123", "$2a$10$encodedPassword"))
                .thenReturn(true);

            assertThrows(BusinessException.class, () -> authService.login(request));
        }
    }
}
```

---

## 14.6 Controller 层集成测试（@WebMvcTest + MockMvc）

Controller 层测试关注 HTTP 请求/响应的处理过程。使用 `@WebMvcTest` 注解，Spring Boot 只加载 Web 层相关的 Bean（Controller、@ControllerAdvice、Filter 等），不会加载 Service、Mapper 等，因此需要用 `@MockBean` 模拟 Service 层。

### 14.6.1 MockMvc 简介

MockMvc 是 Spring 提供的 Web 层测试工具，它模拟 HTTP 请求，无需真正启动 Web 服务器：

```java
mockMvc.perform(get("/api/articles/1")      // 模拟 GET 请求
        .header("Authorization", "Bearer token"))  // 添加请求头
    .andExpect(status().isOk())              // 期望状态码 200
    .andExpect(jsonPath("$.id").value(1))    // 期望 JSON 字段值
    .andExpect(jsonPath("$.title").value("Spring Boot 入门教程"));
```

### 14.6.2 ArticleController 集成测试

> 完整代码：`src/test/java/com/example/blog/controller/ArticleControllerTest.java`

```java
package com.example.blog.controller;

import com.example.blog.entity.Article;
import com.example.blog.service.ArticleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ArticleController.class)
@AutoConfigureMockMvc(addFilters = false) // 关闭 Security Filter，简化测试
@DisplayName("文章控制器 - 集成测试")
class ArticleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ArticleService articleService;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("GET /api/articles/{id} - 获取文章详情")
    class GetArticle {

        @Test
        @DisplayName("文章存在 - 应返回 200 和文章数据")
        void shouldReturnArticleWhenExists() throws Exception {
            Article article = new Article();
            article.setId(1L);
            article.setTitle("Spring Boot 入门");
            article.setContent("教程内容...");
            article.setAuthorId(1L);

            when(articleService.getById(1L)).thenReturn(article);

            mockMvc.perform(get("/api/articles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").value("Spring Boot 入门"));

            verify(articleService).getById(1L);
        }

        @Test
        @DisplayName("文章不存在 - 应返回 404")
        void shouldReturn404WhenArticleNotFound() throws Exception {
            when(articleService.getById(999L)).thenReturn(null);

            mockMvc.perform(get("/api/articles/999"))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/articles - 创建文章")
    class CreateArticle {

        @Test
        @DisplayName("参数正确 - 应成功创建文章")
        void shouldCreateArticleSuccessfully() throws Exception {
            Article article = new Article();
            article.setTitle("新文章");
            article.setContent("新内容");

            when(articleService.save(any(Article.class))).thenReturn(true);

            mockMvc.perform(post("/api/articles")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(article)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

            verify(articleService).save(any(Article.class));
        }
    }

    @Nested
    @DisplayName("DELETE /api/articles/{id} - 删除文章")
    class DeleteArticle {

        @Test
        @DisplayName("删除成功 - 应返回 200")
        void shouldDeleteArticleSuccessfully() throws Exception {
            when(articleService.removeByIdAndAuthor(eq(1L), anyLong())).thenReturn(true);

            mockMvc.perform(delete("/api/articles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        }
    }
}
```

### 14.6.3 AuthController 测试

> 完整代码：`src/test/java/com/example/blog/controller/AuthControllerTest.java`

```java
package com.example.blog.controller;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("认证控制器 - 集成测试")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/auth/login - 正确凭据应返回 Token")
    void loginShouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest("admin", "password123");
        LoginResponse response = new LoginResponse("jwt-token-xxx", "admin", "ROLE_ADMIN");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.token").value("jwt-token-xxx"))
            .andExpect(jsonPath("$.data.username").value("admin"));
    }

    @Test
    @DisplayName("POST /api/auth/login - 参数为空应返回 400")
    void loginShouldReturn400WhenParamsEmpty() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }
}
```

---

## 14.7 @SpringBootTest 完整集成测试

`@SpringBootTest` 会加载完整的应用上下文，包括所有 Bean。它适合测试组件之间的集成是否正确。

### 14.7.1 上下文加载测试

最基本的集成测试——验证应用上下文能否正常加载：

> 完整代码：`src/test/java/com/example/blog/BlogApplicationTests.java`

```java
package com.example.blog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // 使用 application-test.yml 配置
@DisplayName("应用上下文加载测试")
class BlogApplicationTests {

    @Test
    @DisplayName("Spring 应用上下文应正常加载")
    void contextLoads() {
        // 如果上下文加载失败，这个测试会自动报错
        // 这是最基本的集成测试，确保所有 Bean 能正常注入
    }
}
```

### 14.7.2 使用 @Sql 导入测试数据

`@Sql` 注解可以在测试执行前导入 SQL 脚本，准备测试数据：

```java
package com.example.blog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import com.example.blog.service.ArticleService;
import com.example.blog.entity.Article;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("文章服务 - 完整集成测试")
class ArticleServiceIntegrationTest {

    @Autowired
    private ArticleService articleService;

    @Test
    @DisplayName("集成测试 - 完整的文章 CRUD 流程")
    @Sql(scripts = "/sql/test-articles.sql",
         executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
    @Sql(scripts = "/sql/cleanup.sql",
         executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
    void testArticleCrud() {
        // 1. 查询由 SQL 脚本插入的测试数据
        Article article = articleService.getById(100L);
        assertNotNull(article);
        assertEquals("测试文章", article.getTitle());

        // 2. 更新文章
        article.setTitle("修改后的标题");
        articleService.updateById(article);

        Article updated = articleService.getById(100L);
        assertEquals("修改后的标题", updated.getTitle());

        // 3. 删除文章
        articleService.removeById(100L);
        assertNull(articleService.getById(100L));
    }
}
```

对应的 SQL 脚本 `src/test/resources/sql/test-articles.sql`：

```sql
-- 插入测试文章数据
INSERT INTO article (id, title, content, author_id, status, create_time, update_time)
VALUES (100, '测试文章', '这是测试内容', 1, 1, NOW(), NOW());

INSERT INTO article (id, title, content, author_id, status, create_time, update_time)
VALUES (101, '草稿文章', '这是草稿', 1, 0, NOW(), NOW());
```

清理脚本 `src/test/resources/sql/cleanup.sql`：

```sql
DELETE FROM article WHERE id IN (100, 101);
```

---

## 14.8 测试 JWT 认证流程

JWT 认证是博客系统安全的核心，需要专门测试 Token 的生成、验证和拦截逻辑。

### 14.8.1 JwtUtil 单元测试

```java
package com.example.blog.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JWT 工具类测试")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        // 使用测试密钥初始化
        jwtUtil = new JwtUtil("test-secret-key-for-unit-testing-only-32chars!!", 3600000L);
    }

    @Test
    @DisplayName("生成 Token - 应返回非空字符串")
    void generateTokenShouldReturnNonEmptyString() {
        String token = jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("解析 Token - 应能正确提取用户信息")
    void parseTokenShouldExtractUserInfo() {
        String token = jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN");

        // 解析 Token
        assertTrue(jwtUtil.validateToken(token));
        assertEquals(1L, jwtUtil.getUserIdFromToken(token));
        assertEquals("admin", jwtUtil.getUsernameFromToken(token));
    }

    @Test
    @DisplayName("过期 Token - 验证应失败")
    void expiredTokenShouldFailValidation() {
        // 使用极短的过期时间
        JwtUtil shortLivedJwt = new JwtUtil(
            "test-secret-key-for-unit-testing-only-32chars!!", 1L);
        String token = shortLivedJwt.generateToken(1L, "admin", "ROLE_ADMIN");

        // 等待 Token 过期
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}

        assertFalse(shortLivedJwt.validateToken(token));
    }

    @Test
    @DisplayName("非法 Token - 验证应失败")
    void invalidTokenShouldFailValidation() {
        assertFalse(jwtUtil.validateToken("invalid.token.here"));
        assertFalse(jwtUtil.validateToken(""));
        assertFalse(jwtUtil.validateToken(null));
    }
}
```

### 14.8.2 测试带认证的 Controller

```java
@Test
@DisplayName("未携带 Token - 应返回 401")
void shouldReturn401WithoutToken() throws Exception {
    mockMvc.perform(get("/api/articles/me"))
        .andExpect(status().isUnauthorized());
}

@Test
@DisplayName("携带有效 Token - 应返回当前用户文章")
void shouldReturnArticlesWithValidToken() throws Exception {
    String token = jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN");

    mockMvc.perform(get("/api/articles/me")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
}

@Test
@DisplayName("携带过期 Token - 应返回 401")
void shouldReturn401WithExpiredToken() throws Exception {
    mockMvc.perform(get("/api/articles/me")
            .header("Authorization", "Bearer expired-token"))
        .andExpect(status().isUnauthorized());
}
```

---

## 14.9 测试配置（H2 内存数据库）

为了隔离测试环境，我们使用 H2 内存数据库替代 MySQL，避免测试对真实数据库的依赖。

### 14.9.1 application-test.yml

> 完整配置：`src/test/resources/application-test.yml`

```yaml
# 测试环境配置 - 使用 H2 内存数据库
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql

  data:
    redis:
      host: localhost
      port: 6379
      # 测试时可以使用内嵌 Redis 或 Mock

# MyBatis-Plus 配置
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

# JWT 测试配置
jwt:
  secret: test-secret-key-for-unit-testing-only-32chars!!
  expiration: 3600000

# 日志级别
logging:
  level:
    com.example.blog: DEBUG
```

**关键配置说明：**

| 配置项 | 说明 |
|--------|------|
| `jdbc:h2:mem:testdb` | 使用 H2 内存数据库，名为 testdb |
| `MODE=MySQL` | H2 兼容 MySQL 语法 |
| `DB_CLOSE_DELAY=-1` | 连接关闭后不自动删除数据库 |
| `StdOutImpl` | 打印 SQL 日志，方便调试 |

### 14.9.2 H2 与 MySQL 的差异注意

H2 虽然兼容 MySQL 语法，但仍有一些差异需要注意：

```sql
-- H2 不支持的 MySQL 语法（需要调整）：
-- 1. ENGINE=InnoDB 语法
-- 2. 某些 MySQL 特有函数
-- 3. 自增策略差异

-- 建议：提供一个专门的 schema.sql 给测试使用
CREATE TABLE IF NOT EXISTS article (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id BIGINT NOT NULL,
    status INT DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 14.9.3 Testcontainers 简介（进阶）

如果你希望测试使用真实的 MySQL，可以使用 Testcontainers：

```java
// 使用 Testcontainers 启动真实的 MySQL 容器
@SpringBootTest
@Testcontainers
class MysqlIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("blog_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }
}
```

> Testcontainers 需要本地安装 Docker，适合对测试环境真实性要求较高的场景。

---

## 14.10 测试覆盖率工具（JaCoCo）

测试覆盖率衡量测试代码对生产代码的覆盖程度。JaCoCo（Java Code Coverage）是最常用的 Java 覆盖率工具。

### 14.10.1 配置 JaCoCo

在 `pom.xml` 中添加 JaCoCo 插件：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 14.10.2 生成覆盖率报告

```bash
# 运行测试并生成覆盖率报告
mvn test jacoco:report

# 报告生成位置
# target/site/jacoco/index.html
```

### 14.10.3 覆盖率指标解读

| 指标 | 说明 | 建议目标 |
|------|------|---------|
| Instruction Coverage | 字节码指令覆盖率 | >= 70% |
| Branch Coverage | 分支覆盖率（if/else） | >= 60% |
| Line Coverage | 行覆盖率 | >= 70% |
| Method Coverage | 方法覆盖率 | >= 80% |

**实践建议：**
- Service 层的覆盖率目标应高于 Controller 层
- 100% 覆盖率是不现实的，专注于关键业务逻辑
- 关注分支覆盖，而不仅仅是行覆盖

---

## 14.11 运行测试

### 14.11.1 使用 Maven 运行

```bash
# 运行所有测试
mvn test

# 运行指定测试类
mvn test -Dtest=ArticleServiceTest

# 运行指定测试方法
mvn test -Dtest=ArticleServiceTest#shouldReturnArticleWhenExists

# 运行特定 Profile 的测试
mvn test -Dspring.profiles.active=test

# 跳过测试（仅编译打包）
mvn package -DskipTests

# 生成测试报告
mvn surefire-report:report
```

### 14.11.2 使用 IntelliJ IDEA 运行

1. **运行单个测试类**：右键点击测试类名 → Run 'ClassName'
2. **运行单个测试方法**：右键点击 @Test 方法 → Run 'methodName'
3. **运行所有测试**：右键点击 `src/test` 目录 → Run 'All Tests'
4. **调试测试**：右键 → Debug，可以设置断点逐步调试

IDEA 还提供了测试覆盖率功能：
- 右键测试类 → Run 'ClassName' with Coverage
- 在代码左侧可以看到绿色/红色的覆盖标记

### 14.11.3 测试执行顺序

JUnit 5 默认使用确定但不可预测的顺序执行测试。如果需要指定顺序：

```java
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderedTest {

    @Test @Order(1)
    void firstTest() { /* 先执行 */ }

    @Test @Order(2)
    void secondTest() { /* 后执行 */ }
}
```

---

## 14.12 测试最佳实践

### 命名规范

```java
// 测试类命名：被测类名 + Test
ArticleService → ArticleServiceTest

// 测试方法命名：should + 预期行为 + When + 条件
shouldReturnArticleWhenExists()
shouldThrowExceptionWhenNotOwner()
```

### AAA 模式（Arrange-Act-Assert）

```java
@Test
void testExample() {
    // Arrange：准备数据和 Mock 行为
    when(mapper.selectById(1L)).thenReturn(article);

    // Act：调用被测方法
    Article result = service.getById(1L);

    // Assert：验证结果和行为
    assertNotNull(result);
    verify(mapper).selectById(1L);
}
```

### 测试独立性

```java
// 错误：测试之间有依赖
@Test void test1() { service.save(article); }
@Test void test2() { service.delete(article); }  // 依赖 test1 的数据

// 正确：每个测试独立
@BeforeEach
void setUp() {
    // 每个测试前重新初始化数据
    testData = createTestData();
}
```

---

## 14.13 本章小结

| 测试类型 | 注解 | 用途 | 依赖处理 |
|---------|------|------|---------|
| 单元测试 | `@ExtendWith(MockitoExtension.class)` | 测试单个类的逻辑 | Mock 所有依赖 |
| Web 层测试 | `@WebMvcTest` | 测试 Controller 层 | MockBean 模拟 Service |
| 集成测试 | `@SpringBootTest` | 测试完整上下文 | 真实 Bean + 测试配置 |
| 数据准备 | `@Sql` | 导入测试 SQL | 配合 H2 使用 |

**下一步**：在下一章中，我们将学习如何使用 Docker 将整个博客系统容器化部署。

---

## 附：本章文件清单

```
14-unit-testing/
├── pom.xml
├── readme.md
└── src/test/
    ├── java/com/example/blog/
    │   ├── BlogApplicationTests.java
    │   ├── controller/
    │   │   ├── ArticleControllerTest.java
    │   │   └── AuthControllerTest.java
    │   └── service/
    │       ├── ArticleServiceTest.java
    │       └── AuthServiceTest.java
    └── resources/
        └── application-test.yml
```
