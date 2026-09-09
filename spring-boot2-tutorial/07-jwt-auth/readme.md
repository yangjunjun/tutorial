# 第 07 章：JWT 认证——为博客系统装上"门禁卡"

> **本章目标**：理解 JWT 的工作原理，在 Spring Boot 2.5.12 项目中集成 JWT 认证（使用 jjwt 0.9.1），实现无状态的用户登录与 Token 管理。
>
> **前置章节**：第 01-06 章（项目搭建、数据库、MyBatis-Plus、用户模块）
>
> **本章代码目录**：`07-jwt-auth/src/main/java/com/example/blog/`

---

## 目录

1. [什么是 JWT？为什么需要它？](#1-什么是-jwt为什么需要它)
2. [JWT 的结构详解](#2-jwt-的结构详解)
3. [为什么前后端分离项目适合 JWT](#3-为什么前后端分离项目适合-jwt)
4. [引入 jjwt 依赖](#4-引入-jjwt-依赖)
5. [JwtUtil 工具类实现](#5-jwtutil-工具类实现)
6. [登录 DTO 和响应 VO 设计](#6-登录-dto-和响应-vo-设计)
7. [认证 Service 层实现](#7-认证-service-层实现)
8. [认证 Controller 层实现](#8-认证-controller-层实现)
9. [JWT 过滤器实现](#9-jwt-过滤器实现)
10. [Spring Security 基础配置（WebSecurityConfigurerAdapter）](#10-spring-security-基础配置websecurityconfigureradapter)
11. [将用户信息存入 SecurityContext](#11-将用户信息存入-securitycontext)
12. [Token 刷新机制设计](#12-token-刷新机制设计)
13. [使用 curl 测试完整流程](#13-使用-curl-测试完整流程)
14. [Token 过期处理和最佳实践](#14-token-过期处理和最佳实践)
15. [本章小结](#15-本章小结)

---

## 1. 什么是 JWT？为什么需要它？

### 1.1 传统 Session 认证的痛点

在传统的 Web 应用中，用户登录后服务端会在内存或 Redis 中创建一个 Session，并将 Session ID 通过 Cookie 返回给浏览器。这种方式有几个明显的问题：

| 问题 | 说明 |
|------|------|
| **服务端有状态** | 需要维护 Session 存储，不利于水平扩展 |
| **跨域困难** | Cookie 默认不支持跨域，前后端分离时配置繁琐 |
| **移动端不友好** | App、小程序等客户端不方便使用 Cookie |
| **CSRF 风险** | Cookie 机制天然存在跨站请求伪造风险 |

### 1.2 JWT 是什么？

**JWT（JSON Web Token）** 是一种开放标准（RFC 7519），用于在各方之间安全地传输声明信息。它是一个经过数字签名的 JSON 对象，可以被验证和信任。

通俗地说，JWT 就像一张**数字门禁卡**：
- 用户登录成功后，服务端发给他一张"门禁卡"（Token）
- 之后每次请求，用户都出示这张"门禁卡"
- 保安（服务端）只需要验证门禁卡的真伪，不需要查访客登记表

---

## 2. JWT 的结构详解

一个 JWT Token 长这样（已缩短）：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiaWF0IjoxNzE5MDAwMDAwLCJleHAiOjE3MTkwODY0MDB9.abc123_signature_xyz
```

可以看到它由**三部分组成**，用 `.` 分隔：

```
Header.Payload.Signature
```

### 2.1 Header（头部）

声明 Token 的类型和使用的签名算法：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg`：签名算法，这里使用 HMAC SHA-256
- `typ`：Token 类型，固定为 JWT

### 2.2 Payload（载荷）

携带实际的数据，也叫 **Claims（声明）**：

```json
{
  "sub": "admin",
  "userId": 1,
  "nickname": "管理员",
  "iat": 1719000000,
  "exp": 1719086400
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `sub` | String | Subject，主题（通常存用户名） |
| `iat` | Long | Issued At，签发时间 |
| `exp` | Long | Expiration，过期时间 |
| `userId` | Long | 自定义声明：用户 ID |
| `nickname` | String | 自定义声明：用户昵称 |

> ⚠️ **注意**：Payload 只是 Base64 编码，不是加密！任何人都能解码查看。所以**不要在 JWT 中存放敏感信息**（如密码、身份证号等）。

### 2.3 Signature（签名）

签名是 JWT 安全的核心。它的计算方式如下：

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

服务端使用只有它自己知道的**密钥（Secret Key）**对前两部分进行签名。当收到 Token 时，用相同的密钥重新计算签名，对比是否一致：

- 一致 → Token 合法，数据未被篡改
- 不一致 → Token 被伪造或篡改，拒绝访问

### 2.4 整体流程图

```
┌─────────────┐                     ┌─────────────┐
│    客户端     │                     │    服务端     │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
       │  1. POST /login                   │
       │  {username, password}             │
       │ ─────────────────────────────────>│
       │                                   │  2. 验证用户名密码
       │                                   │  3. 生成 JWT Token
       │  4. 返回 Token                    │     (用密钥签名)
       │ <─────────────────────────────────│
       │                                   │
       │  5. GET /api/articles             │
       │  Header: Authorization: Bearer xxx│
       │ ─────────────────────────────────>│
       │                                   │  6. 验证 Token 签名
       │                                   │  7. 检查是否过期
       │  8. 返回数据                       │  8. 从 Token 获取用户信息
       │ <─────────────────────────────────│
       │                                   │
```

---

## 3. 为什么前后端分离项目适合 JWT

### 3.1 前后端分离的特点

在前后端分离架构中：
- 前端可能是 Vue/React 应用，部署在不同的域名
- 后端提供 RESTful API，可能被多个客户端调用（Web、App、小程序）
- 不存在"同源"的假设

### 3.2 JWT 的优势

| 特性 | 说明 |
|------|------|
| **无状态** | 服务端不存储会话信息，Token 本身就是"凭证"，方便水平扩展 |
| **跨域友好** | Token 放在 HTTP Header 中传递，不受 Cookie 跨域限制 |
| **多端适用** | Web、App、小程序都可以方便地携带 Token |
| **自包含** | Token 中包含了用户信息，减少数据库查询 |
| **标准化** | 遵循 RFC 7519 标准，各语言都有成熟的库支持 |

### 3.3 JWT 的劣势与应对

| 劣势 | 应对方案 |
|------|---------|
| 无法主动让 Token 失效（如踢人下线） | 引入 Redis 黑名单机制 |
| Token 泄露后在过期前一直有效 | 设置较短的过期时间 + Refresh Token |
| Payload 不加密，信息可见 | 不存放敏感信息，或使用 JWE 加密 |

---

## 4. 引入 jjwt 依赖

在 `pom.xml` 中添加 jjwt 依赖：

```xml
<!-- JWT 版本属性 -->
<properties>
    <jjwt.version>0.9.1</jjwt.version>
</properties>

<!-- JWT 依赖（0.9.1 是单包结构，编译期和运行期都需要） -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>${jjwt.version}</version>
</dependency>
```

### 4.1 为什么 0.9.1 只需要一个依赖？

本教程选择 **jjwt 0.9.1**，它是 JDK 8 世代最经典的 JWT 库版本。与新版 0.12.x 的对比：

| 对比项 | jjwt 0.9.1（本教程） | jjwt 0.12.x（新版） |
|--------|---------------------|--------------------|
| 依赖结构 | 单包 `jjwt`，一个依赖搞定 | 拆分为 `jjwt-api` / `jjwt-impl` / `jjwt-jackson` 三个模块 |
| 生成 Token | `signWith(SignatureAlgorithm.HS256, secret)` | `signWith(SecretKey)` |
| 解析 Token | `Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody()` | `Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload()` |
| 密钥类型 | 直接使用 String 字符串 | 必须使用 `Keys.hmacShaKeyFor()` 生成的 SecretKey 对象 |
| JDK 9+ 注意事项 | 无需额外处理 | 在 JDK 9+（缺少 JAXB 模块的 JDK）需要补 jaxb 依赖 |

> 💡 **提示**：本教程是 JDK 8 + Spring Boot 2.5.12 技术栈，选择 jjwt 0.9.1 与之配套。0.9.1 内部依赖 Jackson 与 JAXB 均可正常工作，**在 JDK 8 下不需要添加任何 jaxb 依赖**。

### 4.2 配置 application.yml

```yaml
# JWT 配置
jwt:
  # 签名密钥（生产环境请使用环境变量或配置中心）
  # 建议：密钥使用足够长的随机字符串（不少于 32 字节）
  secret: blog-tutorial-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256
  # Access Token 过期时间（毫秒），默认 24 小时
  expiration: 86400000
  # Refresh Token 过期时间（毫秒），默认 7 天
  refresh-expiration: 604800000
```

> 💡 **提示**：生产环境中，密钥应通过环境变量注入，例如：`jwt.secret: ${JWT_SECRET}`

---

## 5. JwtUtil 工具类实现

完整的 JWT 工具类代码位于 `src/main/java/com/example/blog/util/JwtUtil.java`。

### 5.1 核心方法一览

| 方法 | 说明 |
|------|------|
| `generateToken(username, userId, nickname)` | 生成 Access Token |
| `generateRefreshToken(username, userId)` | 生成 Refresh Token |
| `parseToken(token)` | 解析 Token，获取 Claims |
| `getUsernameFromToken(token)` | 从 Token 中提取用户名 |
| `getUserIdFromToken(token)` | 从 Token 中提取用户 ID |
| `isTokenExpired(token)` | 判断 Token 是否过期 |
| `validateToken(token)` | 验证 Token 是否有效 |

### 5.2 关键代码讲解（jjwt 0.9.1 API）

#### 生成 Token

```java
public String generateToken(String username, Long userId, String nickname) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", userId);
    claims.put("nickname", nickname);

    return Jwts.builder()
            .setClaims(claims)                // 自定义声明
            .setSubject(username)             // 主题（用户名）
            .setIssuedAt(new Date())          // 签发时间
            .setExpiration(new Date(System.currentTimeMillis() + expiration))  // 过期时间
            .signWith(SignatureAlgorithm.HS256, secret)  // 签名（旧风格）
            .compact();                       // 序列化为字符串
}
```

> ⚠️ **jjwt 0.9.1 的签名 API**：使用枚举 `SignatureAlgorithm.HS256` + 字符串密钥的组合。
> 新版 0.12.x 才改为 `signWith(SecretKey)`，并要求用 `Keys.hmacShaKeyFor()` 构造密钥对象。两者不要混用。

#### 解析 Token

```java
public Claims parseToken(String token) {
    return Jwts.parser()
            .setSigningKey(secret)   // 设置验证密钥（字符串）
            .parseClaimsJws(token)   // 解析并验证签名
            .getBody();              // 获取 Claims 载荷
}
```

> 注意 jjwt 不同版本的解析 API 差异：
> - **0.9.1（本教程）**：`Jwts.parser().setSigningKey(key).parseClaimsJws(token).getBody()`
> - 0.12.x 新版：`Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload()`

#### 从 Token 中取用户 ID 的小陷阱

```java
public Long getUserIdFromToken(String token) {
    Object userId = parseToken(token).get("userId");
    if (userId == null) {
        return null;
    }
    // JSON 反序列化后整数统一变成 Integer，先转字符串再转 Long 最稳妥
    return Long.valueOf(userId.toString());
}
```

如果直接写 `claims.get("userId", Long.class)`，jjwt 0.9.1 会在运行时抛出 `ClassCastException`——因为 JSON 中的数字默认被反序列化为 Integer。这是一个非常常见的坑！

---

## 6. 登录 DTO 和响应 VO 设计

### 6.1 登录请求 DTO

**文件**：`src/main/java/com/example/blog/dto/UserLoginDTO.java`

```java
@Data
public class UserLoginDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 4, max = 20, message = "用户名长度必须在 4-20 个字符之间")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度必须在 6-32 个字符之间")
    private String password;
}
```

**设计说明**：
- **DTO（Data Transfer Object）**：用于接收前端传入的请求数据
- 注意导入路径：本教程使用 **`javax.validation.constraints.NotBlank`**（Spring Boot 2.5 世代是 javax 命名空间，Spring Boot 3 才是 jakarta）
- 使用 `@NotBlank` 而非 `@NotNull`，因为它还会检查去除空格后是否为空
- `@Size` 限制输入长度，防止超长输入

### 6.2 登录响应 VO

**文件**：`src/main/java/com/example/blog/vo/LoginVO.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginVO {
    private String token;          // Access Token
    private String refreshToken;   // Refresh Token
    private String username;       // 用户名
    private String nickname;       // 昵称
    private Long userId;           // 用户 ID
}
```

**设计说明**：
- **VO（View Object）**：用于封装返回给前端的数据
- 使用 Lombok 的 `@Builder` 实现链式构建
- 不返回密码等敏感信息
- 同时返回 Access Token 和 Refresh Token

---

## 7. 认证 Service 层实现

### 7.1 接口定义

**文件**：`src/main/java/com/example/blog/service/AuthService.java`

```java
public interface AuthService {
    LoginVO login(UserLoginDTO loginDTO);
    LoginVO refreshToken(String refreshToken);
}
```

### 7.2 实现类核心逻辑

**文件**：`src/main/java/com/example/blog/service/impl/AuthServiceImpl.java`

登录方法的核心流程：

```java
@Override
public LoginVO login(UserLoginDTO loginDTO) {
    // 1. 根据用户名查询用户
    User user = userMapper.selectOne(
        new LambdaQueryWrapper<User>().eq(User::getUsername, username)
    );

    // 2. 验证用户存在性
    if (user == null) {
        throw new RuntimeException("用户名或密码错误");  // 不区分原因
    }

    // 3. BCrypt 密码验证
    if (!passwordEncoder.matches(password, user.getPassword())) {
        throw new RuntimeException("用户名或密码错误");
    }

    // 4. 检查用户状态
    if (user.getStatus() != null && user.getStatus() == 1) {
        throw new RuntimeException("用户已被禁用");
    }

    // 5. 生成 Token 对
    String accessToken = jwtUtil.generateToken(...);
    String refreshToken = jwtUtil.generateRefreshToken(...);

    // 6. 返回结果
    return LoginVO.builder()
            .token(accessToken)
            .refreshToken(refreshToken)
            .username(user.getUsername())
            .nickname(user.getNickname())
            .userId(user.getId())
            .build();
}
```

**安全要点**：
- "用户不存在"和"密码错误"返回相同的提示信息，防止用户名枚举攻击
- 使用 `PasswordEncoder` 的 `matches` 方法比对 BCrypt 哈希

---

## 8. 认证 Controller 层实现

**文件**：`src/main/java/com/example/blog/controller/AuthController.java`

### 8.1 登录接口

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody UserLoginDTO loginDTO) {
        // @Valid 触发 DTO 上的校验注解（javax.validation.Valid）
        // @RequestBody 将 JSON 请求体反序列化为 DTO 对象
        LoginVO loginVO = authService.login(loginDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "登录成功");
        response.put("data", loginVO);
        return ResponseEntity.ok(response);
    }
}
```

### 8.2 刷新 Token 接口

```java
@PostMapping("/refresh")
public ResponseEntity<Map<String, Object>> refreshToken(
        @RequestBody Map<String, String> params) {
    String refreshToken = params.get("refreshToken");
    LoginVO loginVO = authService.refreshToken(refreshToken);
    // ...返回新 Token
}
```

### 8.3 获取当前用户接口（/me）

`GET /api/auth/me` 用于验证 JWT 认证是否生效。它从 `SecurityContextHolder` 中取当前认证信息，并且使用经典的 `instanceof` 写法判断 principal 类型（JDK 8 不支持 Java 16+ 的模式匹配语法 `instanceof LoginUser loginUser`）：

```java
Object principal = authentication.getPrincipal();
if (principal instanceof com.example.blog.security.LoginUser) {
    com.example.blog.security.LoginUser loginUser =
            (com.example.blog.security.LoginUser) principal;  // 显式强转
    userInfo.put("nickname", loginUser.getNickname());
    userInfo.put("userId", loginUser.getUserId());
}
```

---

## 9. JWT 过滤器实现

**文件**：`src/main/java/com/example/blog/security/JwtAuthenticationFilter.java`

这是整个 JWT 认证机制的**核心枢纽**，它拦截每一个 HTTP 请求，检查是否携带有效的 JWT Token。

### 9.1 为什么使用 OncePerRequestFilter？

Spring 的 `OncePerRequestFilter` 保证过滤器在同一个请求中**只执行一次**，即使请求被转发（forward）或包含（include）多次。这避免了重复的 Token 解析开销。

### 9.2 过滤器工作流程

```
HTTP 请求进入
      │
      ▼
┌─────────────────────┐
│ 提取 Authorization  │
│ 请求头中的 Token     │
└──────┬──────────────┘
       │
       ▼
   Token 是否存在？
       │
  ┌────┴────┐
  │ No      │ Yes
  │         ▼
  │   SecurityContext
  │   中已有认证信息？
  │     │
  │ ┌───┴───┐
  │ │ No    │ Yes → 跳过（已登录）
  │ ▼       │
  │ 解析 Token     │
  │ 获取用户名     │
  │     │          │
  │     ▼          │
  │ Token 有效？   │
  │   │            │
  │ ┌─┴──┐        │
  │ │ No │ Yes    │
  │ │    ▼        │
  │ │  加载用户信息 │
  │ │  创建认证对象 │
  │ │  存入上下文   │
  │ │    │        │
  │ └────┼────────┘
  │      │
  ▼      ▼
继续过滤器链
```

### 9.3 核心代码

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)
        throws ServletException, IOException {

    try {
        // 第一步：从请求头提取 Token
        String jwt = extractJwtFromRequest(request);

        // 第二步：Token 不为空 且 当前未登录
        if (jwt != null &&
            SecurityContextHolder.getContext().getAuthentication() == null) {

            if (jwtUtil.validateToken(jwt)) {
                // 第三步：提取用户名
                String username = jwtUtil.getUsernameFromToken(jwt);

                // 第四步：加载用户信息
                UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

                // 第五步：创建认证对象
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // 第六步：存入 SecurityContext
                SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
            }
        }
    } catch (Exception e) {
        log.error("JWT 认证过程异常: {}", e.getMessage());
    }

    // 继续过滤器链
    filterChain.doFilter(request, response);
}
```

> ⚠️ **javax 与 jakarta 之分**：本教程是 Spring Boot 2.5.12，Filter 中使用的 `HttpServletRequest`、`HttpServletResponse`、`ServletException` 均来自 **`javax.servlet`** 包。如果你在网上看到 `jakarta.servlet` 的 import，那是 Spring Boot 3 时代的写法，在本教程中编译不过。

### 9.4 从请求头提取 Token

```java
private String extractJwtFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken)
            && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);  // 去掉 "Bearer " 前缀
    }
    return null;
}
```

请求头格式遵循 **RFC 6750** 规范：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 10. Spring Security 基础配置（WebSecurityConfigurerAdapter）

### 10.1 版本背景：Spring Boot 2.5 自带 Security 5.5.x

Spring Boot 2.5.12 对应的 Spring Security 版本是 **5.5.x**。这个世代的标准配置方式是**继承 `WebSecurityConfigurerAdapter`** 并重写 `configure` 方法。

很多新教程（基于 Spring Boot 3 / Security 6）会告诉你"WebSecurityConfigurerAdapter 已废弃"，那是 Security 6 的说法；**在 Security 5.5.x 中，它正是官方推荐的方式**。

两种写法对照（了解即可，本教程统一使用前者）：

| Security 5.5.x（本教程） | Security 6.x（仅作对照） |
|--------------------------|--------------------------|
| `extends WebSecurityConfigurerAdapter` | 声明 `SecurityFilterChain` Bean |
| `configure(HttpSecurity http)` 重写 | `http.authorizeHttpRequests(auth -> ...)` |
| `authorizeRequests()` | `authorizeHttpRequests()` |
| `antMatchers()` | `requestMatchers()` |
| `.and()` 链式连接 | Lambda 链式风格 |
| `@EnableGlobalMethodSecurity(prePostEnabled = true)` | `@EnableMethodSecurity` |

### 10.2 本章的最小安全配置

为了让 JWT 认证"跑起来"，第 07 章先提供一份**最小可用配置**（`config/SecurityConfig.java`）：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()                                  // 前后端分离，禁用 CSRF
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // 无状态
            .and()
            .authorizeRequests()
            .antMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
            .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

要点：
- `PasswordEncoder` Bean 是登录接口验证 BCrypt 密码所必需的
- `addFilterBefore` 把 JWT 过滤器插入到用户名密码过滤器之前
- 下一章（第 08 章）会在此基础上补充 RBAC 角色权限、CORS、401/403 JSON 异常处理等完整安全体系

### 10.3 配置公开接口和受保护接口

```
所有 API 接口
├── 公开接口（permitAll）—— 无需登录
│   ├── POST /api/auth/login          — 登录
│   ├── POST /api/auth/refresh        — 刷新 Token
│   └── /favicon.ico                  — 图标
│
└── 需认证接口（authenticated）—— 需要登录
    ├── GET  /api/auth/me             — 当前用户信息
    └── ...
```

> 💡 **注意**：`antMatchers` 的顺序很重要！Spring Security 按**声明顺序**匹配，先匹配的先生效。所以要把具体规则放在前面，通用规则（`anyRequest()`）放在最后。

---

## 11. 将用户信息存入 SecurityContext

### 11.1 SecurityContext 是什么？

`SecurityContext` 是 Spring Security 提供的**安全上下文**，它通过 `ThreadLocal` 存储当前请求的认证信息。在同一个请求的任何位置，都可以通过以下方式获取当前登录用户：

```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();  // 获取用户名
```

### 11.2 Authentication 对象的三个要素

```java
UsernamePasswordAuthenticationToken authentication =
    new UsernamePasswordAuthenticationToken(
        userDetails,               // Principal（主体）：用户信息
        null,                      // Credentials（凭证）：密码（认证后不需要）
        userDetails.getAuthorities()  // Authorities（权限）：角色和权限列表
    );
```

### 11.3 为什么认证后要清除密码？

将凭证（密码）设为 `null` 是一个安全最佳实践。认证成功后，密码就不需要了，清除它可以减少内存中敏感信息的暴露。

---

## 12. Token 刷新机制设计

### 12.1 为什么需要 Refresh Token？

```
Access Token 的生命周期：
━━━━━━━━━━━━━━━━━━━━━
登录 ──────> 过期（如 24h 后）
              │
              ▼
         用户被迫重新登录？ ← 体验差！

引入 Refresh Token 后：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
登录 ──────> Access Token 过期
              │
              ▼
         自动用 Refresh Token 换取新 Token ← 无感刷新
              │
              ▼
         继续使用（直到 Refresh Token 也过期，如 7 天后）
```

### 12.2 双 Token 策略

| Token 类型 | 有效期 | 用途 |
|-----------|--------|------|
| Access Token | 24 小时 | 访问 API 资源 |
| Refresh Token | 7 天 | 换取新的 Access Token |

### 12.3 前端刷新 Token 的时机

推荐在前端使用 **Axios 拦截器** 自动处理：

```javascript
// 前端 Axios 响应拦截器示例
axios.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            // Access Token 过期，尝试刷新
            const refreshToken = localStorage.getItem('refreshToken');
            try {
                const res = await axios.post('/api/auth/refresh', {
                    refreshToken
                });
                // 保存新 Token
                localStorage.setItem('token', res.data.data.token);
                localStorage.setItem('refreshToken',
                    res.data.data.refreshToken);
                // 用新 Token 重试原请求
                error.config.headers['Authorization'] =
                    'Bearer ' + res.data.data.token;
                return axios.request(error.config);
            } catch (e) {
                // Refresh Token 也过期了，跳转登录页
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
```

---

## 13. 使用 curl 测试完整流程

### 13.1 前置准备

确保 MySQL 数据库已启动，并有测试用户数据：

```sql
INSERT INTO blog_user (username, password, nickname, email, status, create_time)
VALUES ('admin', '$2a$10$...BCrypt哈希...', '管理员', 'admin@example.com', 0, NOW());
```

> 密码哈希可以通过 BCrypt 工具生成，或在注册接口中创建。

### 13.2 启动项目

```bash
cd 07-jwt-auth
mvn spring-boot:run
```

### 13.3 测试登录接口

```bash
# 发送登录请求
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

**预期成功响应**：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsIm5pY2tuYW1lIjoi566h55CG5ZGYIiwic3ViIjoiYWRtaW4iLCJpYXQiOjE3MTkwMDAwMDAsImV4cCI6MTcxOTA4NjQwMH0.xxx",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwic3ViIjoiYWRtaW4iLCJpYXQiOjE3MTkwMDAwMDAsImV4cCI6MTcxOTYwNDgwMH0.yyy",
    "username": "admin",
    "nickname": "管理员",
    "userId": 1
  }
}
```

### 13.4 测试携带 Token 访问受保护接口

```bash
# 将上面的 token 值替换到下面的命令中
TOKEN="eyJhbGciOiJIUzI1NiJ9..."

# 访问需要认证的接口
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "username": "admin",
    "authorities": [{"authority": "ROLE_USER"}],
    "nickname": "管理员",
    "userId": 1
  }
}
```

### 13.5 测试不带 Token 访问（应该失败）

```bash
curl -X GET http://localhost:8080/api/auth/me
```

**预期响应**：401 Unauthorized

### 13.6 测试 Token 刷新

```bash
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiJ9..."

curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

### 13.7 测试参数校验

```bash
# 测试空用户名
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "", "password": "123456"}'

# 测试密码过短
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123"}'
```

---

## 14. Token 过期处理和最佳实践

### 14.1 安全最佳实践清单

| 实践 | 说明 |
|------|------|
| **使用 HTTPS** | JWT 在 HTTP 下是明文传输的，必须使用 HTTPS |
| **设置合理过期时间** | Access Token 24h，Refresh Token 7d |
| **不在 Token 中存敏感信息** | Payload 只做了 Base64 编码，不是加密 |
| **密钥安全存储** | 使用环境变量或配置中心，不要硬编码在代码中 |
| **密钥长度足够** | 建议不少于 32 字节的随机字符串 |
| **Token 轮换** | 每次刷新都发放新的 Refresh Token |
| **密码安全** | 日志中不打印密码和 Token 原文 |

### 14.2 生产环境增强建议

```yaml
# 生产环境 application-prod.yml 配置示例
jwt:
  secret: ${JWT_SECRET}           # 从环境变量读取
  expiration: 3600000              # 1 小时（更短）
  refresh-expiration: 259200000    # 3 天
```

### 14.3 Token 黑名单机制（可选）

当需要主动让 Token 失效（如用户修改密码、管理员踢人下线）时：

```
方案：使用 Redis 存储已注销的 Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 用户注销时，将 Token 加入 Redis 黑名单
2. 黑名单的 TTL 设为 Token 的剩余有效期
3. JWT 过滤器中增加黑名单检查
4. Token 自然过期后自动从 Redis 中清除
```

### 14.4 异常处理一览

| 异常类型 | 触发场景 | 处理方式 |
|---------|---------|---------|
| `ExpiredJwtException` | Token 已过期 | 引导前端刷新 Token |
| `MalformedJwtException` | Token 格式错误 | 返回 401 |
| `SignatureException` | 签名验证失败 | 返回 401 |
| `UnsupportedJwtException` | 不支持的 Token 类型 | 返回 401 |

> 💡 **注意**：jjwt 0.9.1 中签名错误的异常类是 `io.jsonwebtoken.SignatureException`；jjwt 0.12.x 才改名为 `io.jsonwebtoken.security.SecurityException`。

---

## 15. 本章小结

### 本章完成的工作

| 文件 | 说明 |
|------|------|
| `pom.xml` | Spring Boot 2.5.12 + JDK 8 + jjwt 0.9.1（单包依赖）+ MyBatis-Plus 3.5.1 |
| `util/JwtUtil.java` | JWT 工具类，封装 Token 生成、解析、验证（0.9.1 旧风格 API） |
| `dto/UserLoginDTO.java` | 登录请求参数 DTO（javax.validation 校验注解） |
| `vo/LoginVO.java` | 登录响应 VO |
| `service/AuthService.java` | 认证服务接口 |
| `service/impl/AuthServiceImpl.java` | 认证服务实现（登录、刷新 Token） |
| `controller/AuthController.java` | 认证 Controller（login、refresh、me） |
| `security/JwtAuthenticationFilter.java` | JWT 过滤器（从请求头提取并验证 Token，javax.servlet） |
| `security/LoginUser.java` | 自定义 UserDetails（最小实现，下一章展开） |
| `security/CustomUserDetailsService.java` | 从数据库加载用户 |
| `config/SecurityConfig.java` | Security 最小配置（WebSecurityConfigurerAdapter 风格） |
| `entity/User.java`、`mapper/UserMapper.java` | 前置章节已创建的用户实体与 Mapper（本章编译所需） |

### 核心概念回顾

```
JWT 认证完整流程：
┌────────────────────────────────────────────────────┐
│                                                    │
│  用户登录 → 验证密码 → 生成 JWT Token → 返回前端   │
│                                                    │
│  前端请求 → 携带 Token → Filter 提取验证          │
│           → 加载用户信息 → 存入 SecurityContext     │
│           → Controller 可直接获取当前用户           │
│                                                    │
│  Token 过期 → 前端用 Refresh Token 刷新           │
│            → 获取新的 Token 对 → 继续访问          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 下一章预告

本章实现了 JWT Token 的生成和验证，以及一份"最小可用"的 Security 配置。下一章我们将把安全体系补充完整：

- 完善基于 **WebSecurityConfigurerAdapter**（Security 5.5.x）的过滤器链配置
- 实现 `UserDetailsService` 从数据库加载用户（含 RBAC 角色解析）
- 配置 CORS 跨域和 CSRF 禁用
- 实现 RBAC 角色权限控制（`antMatchers` + `hasRole` + `@PreAuthorize`）
- 处理认证和授权异常（返回 JSON 格式的 401/403）

---

> **本章所有代码文件均在 `07-jwt-auth/` 目录下，可直接参考。**
