# 第 08 章：Spring Security 权限控制——为博客系统构建安全防线

> **本章目标**：掌握 Spring Security 5.5.x（Spring Boot 2.5.12 自带版本）的经典配置方式——继承 `WebSecurityConfigurerAdapter`，实现完整的认证授权体系，包括 JWT 过滤器集成、RBAC 角色权限、CORS 跨域、异常处理等。
>
> **前置章节**：第 07 章（JWT 认证）
>
> **本章代码目录**：`08-spring-security/src/main/java/com/example/blog/`

---

## 目录

1. [Spring Security 5.5 核心概念](#1-spring-security-55-核心概念)
2. [Spring Boot 2.5 + Spring Security 5.5 配置方式](#2-spring-boot-25--spring-security-55-配置方式)
3. [HttpSecurity 配置详解](#3-httpsecurity-配置详解)
4. [配置公开接口和受保护接口](#4-配置公开接口和受保护接口)
5. [将 JWT 过滤器集成到 Security 过滤器链](#5-将-jwt-过滤器集成到-security-过滤器链)
6. [UserDetailsService 实现](#6-userdetailsservice-实现)
7. [LoginUser 自定义 UserDetails](#7-loginuser-自定义-userdetails)
8. [PasswordEncoder 配置（BCrypt）](#8-passwordencoder-配置bcrypt)
9. [RBAC 角色权限设计](#9-rbac-角色权限设计)
10. [方法级权限控制（@PreAuthorize）](#10-方法级权限控制preauthorize)
11. [CORS 跨域配置](#11-cors-跨域配置)
12. [CSRF 禁用（前后端分离不需要）](#12-csrf-禁用前后端分离不需要)
13. [自定义认证/授权异常处理](#13-自定义认证授权异常处理)
14. [测试不同角色的权限控制](#14-测试不同角色的权限控制)
15. [本章小结](#15-本章小结)

---

## 1. Spring Security 5.5 核心概念

### 1.1 过滤器链（Filter Chain）

Spring Security 的核心是一组**安全过滤器**，它们组成了一条"过滤器链"。每个 HTTP 请求都要经过这条链的层层检查，才能到达 Controller：

```
客户端请求
    │
    ▼
┌─────────────────────────────────────────┐
│  CorsFilter                             │  ← 处理跨域预检
│  CsrfFilter                             │  ← CSRF Token 校验
│  LogoutFilter                           │  ← 处理注销请求
│  JwtAuthenticationFilter（自定义）       │  ← 验证 JWT Token
│  UsernamePasswordAuthenticationFilter   │  ← 处理表单登录
│  DefaultLoginPageGeneratingFilter       │  ← 生成默认登录页
│  BasicAuthenticationFilter              │  ← 处理 Basic 认证
│  ExceptionTranslationFilter             │  ← 异常转换
│  FilterSecurityInterceptor              │  ← 权限判断
└─────────────────────────────────────────┘
    │
    ▼
 Controller（业务逻辑）
```

### 1.2 SecurityContext（安全上下文）

`SecurityContext` 是一个 ThreadLocal 变量，存储当前请求的**认证信息**：

```java
// 在任何地方获取当前登录用户
Authentication auth = SecurityContextHolder.getContext().getAuthentication();

String username = auth.getName();              // 用户名
Object principal = auth.getPrincipal();        // 用户详情（LoginUser）
Collection<?> authorities = auth.getAuthorities(); // 权限列表
```

### 1.3 Authentication 与 Authorization

| 概念 | 含义 | 通俗理解 |
|------|------|---------|
| **Authentication**（认证） | 验证"你是谁" | 刷门禁卡，确认你是楼里的人 |
| **Authorization**（授权） | 验证"你能做什么" | 检查你的门禁卡能进哪些楼层 |

```
用户请求 → 认证（验证 Token/密码）→ 授权（检查角色/权限）→ 执行业务
           │                        │
           ▼                        ▼
        401 Unauthorized         403 Forbidden
        （未登录/Token失效）     （权限不足）
```

---

## 2. Spring Boot 2.5 + Spring Security 5.5 配置方式

### 2.1 版本背景说明

Spring Boot 2.5.12 由 Spring Security **5.5.x** 提供支持（不需要在 pom.xml 里额外声明 Security 版本，`spring-boot-starter-security` 会自动带上 5.5.x）。

**Security 5.5.x 的官方标准配置方式**：继承 `WebSecurityConfigurerAdapter`，重写 `configure(HttpSecurity)` 方法。这也是几乎所有 Spring Boot 2 世代项目在生产中使用的写法。

（如果你在 Spring Boot 3 的新教程中看到"必须声明 SecurityFilterChain Bean"，那是 Security 6 的要求；Security 6 已彻底移除了 `WebSecurityConfigurerAdapter`。两代 API 不能混用。）

### 2.2 新旧配置方式对照（了解即可）

**Security 5.5.x（本教程使用，✅ 正确方式）**：

```java
// Security 5.x 世代的标准写法
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
            .and()
            .csrf().disable();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder());
    }
}
```

**Security 6.x（仅作对照，Spring Boot 3 世代）**：

```java
// Security 6 的声明式写法（本教程不使用）
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
```

### 2.3 关键 API 对照一览

| 本教程：Security 5.5.x | 对照：Security 6.x（SB3） |
|------------------------|--------------------------|
| `extends WebSecurityConfigurerAdapter` | 使用 `SecurityFilterChain` Bean |
| `authorizeRequests()` | `authorizeHttpRequests()` |
| `antMatchers()` | `requestMatchers()` |
| `.and()` 链式调用 | Lambda 表达式风格 |
| `csrf().disable()` | `csrf(AbstractHttpConfigurer::disable)` |
| `@EnableGlobalMethodSecurity(prePostEnabled = true)` | `@EnableMethodSecurity` |
| 重写 `authenticationManagerBean()` 暴露 AuthenticationManager | 从 `AuthenticationConfiguration` 获取 |

---

## 3. HttpSecurity 配置详解

`configure(HttpSecurity)` 是 Security 5.5.x 的核心配置入口，它定义了完整的安全策略：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
        // 1. CORS 配置
        .cors().configurationSource(corsConfigurationSource)
        .and()

        // 2. 禁用 CSRF
        .csrf().disable()

        // 3. 无状态 Session
        .sessionManagement()
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        .and()

        // 4. 请求授权规则
        .authorizeRequests()
        .antMatchers("/api/auth/**").permitAll()
        .antMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
        .and()

        // 5. 异常处理
        .exceptionHandling()
        .authenticationEntryPoint(authenticationEntryPoint)
        .accessDeniedHandler(accessDeniedHandler)
        .and()

        // 6. 注册 JWT 过滤器
        .addFilterBefore(jwtAuthenticationFilter,
            UsernamePasswordAuthenticationFilter.class);
}
```

### 3.1 Session 管理策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| `ALWAYS` | 始终创建 Session | 传统 Web 应用 |
| `IF_REQUIRED` | 需要时创建（默认） | 传统 Web 应用 |
| `NEVER` | 不主动创建，但使用已有的 | 混合场景 |
| **`STATELESS`** | **完全不使用 Session** | **JWT / RESTful API** |

我们使用 `STATELESS`，因为 JWT 认证是无状态的。

---

## 4. 配置公开接口和受保护接口

### 4.1 接口分类策略

```
所有 API 接口
├── 公开接口（permitAll）—— 无需登录
│   ├── POST /api/auth/login          — 登录
│   ├── POST /api/auth/register       — 注册
│   ├── POST /api/auth/refresh        — 刷新 Token
│   ├── GET  /api/articles/public/**  — 公开文章列表
│   ├── /swagger-ui/**                — API 文档
│   └── /favicon.ico                  — 图标
│
├── 需认证接口（authenticated）—— 需要登录
│   ├── GET  /api/auth/me             — 当前用户信息
│   ├── POST /api/articles            — 发布文章
│   ├── PUT  /api/articles/{id}       — 修改文章
│   └── ...
│
└── 管理员接口（hasRole("ADMIN")）—— 需要管理员角色
    ├── GET  /api/admin/users         — 用户管理
    ├── DELETE /api/articles/{id}     — 删除文章
    └── ...
```

### 4.2 配置代码

```java
.authorizeRequests()
    // 登录、注册、Token 刷新 — 公开访问
    .antMatchers(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh"
    ).permitAll()

    // Swagger 文档 — 公开访问
    .antMatchers("/swagger-ui/**", "/v2/api-docs").permitAll()

    // 管理后台接口 — 仅管理员
    .antMatchers("/api/admin/**").hasRole("ADMIN")

    // 其他所有接口 — 需要认证
    .anyRequest().authenticated()
```

> 💡 **注意**：`antMatchers` 的顺序很重要！Spring Security 按**声明顺序**匹配，先匹配的先生效。所以要把具体规则放在前面，通用规则（`anyRequest()`）放在最后。

---

## 5. 将 JWT 过滤器集成到 Security 过滤器链

### 5.1 为什么需要注册 JWT 过滤器？

第 07 章我们创建了 `JwtAuthenticationFilter`，但它还不会自动生效。需要将其注册到 Security 过滤器链中，指定它在哪个过滤器之前执行。

### 5.2 注册位置和原因

```java
.addFilterBefore(
    jwtAuthenticationFilter,
    UsernamePasswordAuthenticationFilter.class
)
```

将 JWT 过滤器放在 `UsernamePasswordAuthenticationFilter` **之前**：

```
请求进入
  → ... → JwtAuthenticationFilter（我们自定义的）
        → UsernamePasswordAuthenticationFilter（Spring Security 内置）
        → ... → Controller
```

**原因**：
- JWT 过滤器从 Header 提取 Token，设置 SecurityContext
- 后续的 Security 过滤器才能感知到"这个请求已经认证了"
- 如果放在后面，Security 会认为请求未认证，直接返回 401

### 5.3 JWT 过滤器回顾

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(...) {
        // 1. 从 Authorization 请求头提取 Token
        String jwt = extractJwtFromRequest(request);

        // 2. 验证 Token 有效性
        if (jwt != null && jwtUtil.validateToken(jwt)) {
            // 3. 获取用户名
            String username = jwtUtil.getUsernameFromToken(jwt);

            // 4. 加载用户信息
            UserDetails userDetails =
                userDetailsService.loadUserByUsername(username);

            // 5. 创建认证对象，存入 SecurityContext
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## 6. UserDetailsService 实现

### 6.1 UserDetailsService 是什么？

`UserDetailsService` 是 Spring Security 提供的接口，用于**根据用户名加载用户详情**。它是连接 Spring Security 和数据库的桥梁。

```
认证流程中的位置：
JWT Token → 解析出用户名 → UserDetailsService.loadUserByUsername()
                              ↓
                        查询数据库 → 返回 UserDetails（LoginUser）
                              ↓
                        存入 SecurityContext → 后续权限判断
```

### 6.2 实现代码

**文件**：`src/main/java/com/example/blog/security/CustomUserDetailsService.java`

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;

    public CustomUserDetailsService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        // 从数据库查询用户
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
        );

        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        // 包装为自定义的 LoginUser
        return new LoginUser(user);
    }
}
```

**要点**：
- 找不到用户时**必须**抛出 `UsernameNotFoundException`，不能返回 null
- 返回的 `LoginUser` 包含了密码（用于验证）和权限列表（用于授权）

---

## 7. LoginUser 自定义 UserDetails

### 7.1 为什么需要自定义 UserDetails？

Spring Security 默认的 `User` 类只包含基本认证信息。我们的业务需要携带额外字段（如 userId、nickname），并且需要从数据库的 `role` 字段动态生成权限列表。

### 7.2 核心实现

**文件**：`src/main/java/com/example/blog/security/LoginUser.java`

```java
public class LoginUser implements UserDetails {
    private final Long userId;
    private final String username;
    private final String password;
    private final String nickname;
    private final String role;
    private final Integer status;
    private final Collection<? extends GrantedAuthority> authorities;

    public LoginUser(User user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.nickname = user.getNickname();
        this.role = user.getRole();
        this.status = user.getStatus();

        // 构建权限列表
        this.authorities = buildAuthorities(user.getRole());
    }

    private Collection<? extends GrantedAuthority> buildAuthorities(String role) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (role != null) {
            for (String r : role.split(",")) {
                String trimmed = r.trim();
                if (!trimmed.startsWith("ROLE_")) {
                    trimmed = "ROLE_" + trimmed.toUpperCase();
                }
                authorities.add(new SimpleGrantedAuthority(trimmed));
            }
        }
        return authorities;
    }

    // UserDetails 接口方法
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() {
        return status == null || status == 0;
    }
}
```

### 7.3 UserDetails 接口方法说明

| 方法 | 说明 | 本项目的实现 |
|------|------|-------------|
| `getAuthorities()` | 获取权限列表 | 从 role 字段动态生成 |
| `getPassword()` | 获取密码 | 返回 BCrypt 哈希值 |
| `getUsername()` | 获取用户名 | 返回 username 字段 |
| `isAccountNonExpired()` | 账户是否未过期 | 始终 true |
| `isAccountNonLocked()` | 账户是否未锁定 | 始终 true |
| `isCredentialsNonExpired()` | 凭证是否未过期 | 始终 true |
| `isEnabled()` | 账户是否可用 | 根据 status 判断 |

---

## 8. PasswordEncoder 配置（BCrypt）

### 8.1 为什么使用 BCrypt？

| 算法 | 安全性 | 说明 |
|------|--------|------|
| MD5 | ❌ 不安全 | 容易被彩虹表攻击，已不推荐使用 |
| SHA-256 | ⚠️ 一般 | 哈希速度快，容易被暴力破解 |
| **BCrypt** | **✅ 推荐** | **自带盐值，计算成本可调** |
| Argon2 | ✅ 最新 | 内存密集型，但 Java 生态支持较少 |

### 8.2 配置 Bean

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### 8.3 使用方式

```java
// 注册时：加密密码
String hashedPassword = passwordEncoder.encode("123456");
// 结果：$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH

// 登录时：验证密码
boolean matches = passwordEncoder.matches("123456", hashedPassword);
// 结果：true
```

### 8.4 BCrypt 哈希结构

```
$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH
│   │  │                                                    │
│   │  ├── 22 字符盐值（Salt）                               │
│   │  │                                                    │
│   ├── Cost Factor（2^10 = 1024 次迭代）                    │
│   │                                                       │
│   └───────────────────────────────────────────────────────┘
│                                                           │
└── 算法版本标识（2a = BCrypt）       31 字符哈希值 ─────────┘
```

> 💡 **特点**：相同的明文密码，每次 `encode()` 生成的哈希值不同（因为盐值随机），但 `matches()` 仍能正确验证。

---

## 9. RBAC 角色权限设计

### 9.1 什么是 RBAC？

**RBAC（Role-Based Access Control）** 基于角色的访问控制，是最常用的权限管理模型：

```
用户 ──→ 角色 ──→ 权限
User     Role     Permission
```

### 9.2 本项目的角色设计

| 角色 | 标识 | 权限说明 |
|------|------|---------|
| 管理员 | `ROLE_ADMIN` | 所有操作权限（CRUD、用户管理、系统设置） |
| 普通用户 | `ROLE_USER` | 基本操作权限（发布/编辑自己的文章、评论） |
| 游客 | 无 | 只读权限（浏览公开文章） |

### 9.3 数据库设计

```sql
-- 用户表中的 role 字段
ALTER TABLE blog_user ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- 插入管理员用户
UPDATE blog_user SET role = 'admin' WHERE username = 'admin';

-- 插入普通用户
UPDATE blog_user SET role = 'user' WHERE username = 'zhangsan';
```

### 9.4 在 configure(HttpSecurity) 中配置角色

```java
.authorizeRequests()
    // 仅管理员可访问
    .antMatchers("/api/admin/**").hasRole("ADMIN")

    // 需要登录（任何角色）
    .anyRequest().authenticated()
```

### 9.5 权限判断流程

```
请求 /api/admin/users
      │
      ▼
JWT 过滤器验证 Token → 提取用户信息
      │
      ▼
FilterSecurityInterceptor 检查权限
      │
      ├── 用户角色包含 ROLE_ADMIN？
      │     │
      │     ├── Yes → 放行，到达 Controller
      │     │
      │     └── No → 检查用户是否已认证？
      │           │
      │           ├── 已认证 → 返回 403（权限不足）
      │           │
      │           └── 未认证 → 返回 401（未登录）
      │
```

---

## 10. 方法级权限控制（@PreAuthorize）

### 10.1 启用方法级权限

在配置类上添加 `@EnableGlobalMethodSecurity` 注解（这是 Security 5.x 的注解，Security 6 中才改名为 `@EnableMethodSecurity`）：

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)  // ← 启用方法级权限控制
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    // ...
}
```

### 10.2 使用 @PreAuthorize 注解

```java
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    // 任何登录用户都可以访问
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<?> createArticle() {
        // ...
    }

    // 仅管理员可以访问
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable Long id) {
        // ...
    }
}
```

### 10.3 常用表达式一览

| 表达式 | 说明 |
|--------|------|
| `isAuthenticated()` | 已登录 |
| `isAnonymous()` | 匿名用户（未登录） |
| `hasRole('ADMIN')` | 拥有 ADMIN 角色（自动加 ROLE_ 前缀） |
| `hasAuthority('ROLE_ADMIN')` | 拥有指定权限（需要完整名称） |
| `hasAnyRole('ADMIN', 'USER')` | 拥有任一角色 |
| `#变量名` | 引用方法参数（SpEL 表达式） |
| `authentication.principal` | 获取当前用户对象 |

---

## 11. CORS 跨域配置

### 11.1 为什么前后端分离需要 CORS？

```
浏览器同源策略：
┌──────────────────────────────┐
│ 前端 http://localhost:8081    │  ──X──>  ┌────────────────────────────┐
│ (Vue/React)                  │          │ 后端 http://localhost:8080  │
└──────────────────────────────┘          │ (Spring Boot)              │
       不同端口 = 跨域！                    └────────────────────────────┘
```

浏览器默认阻止跨域请求。CORS 是服务器告诉浏览器"我允许这个域访问我"的机制。

### 11.2 配置实现

**文件**：`src/main/java/com/example/blog/config/CorsConfig.java`

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 允许的源（支持模式匹配）
        config.addAllowedOriginPattern("http://localhost:*");

        // 允许的 HTTP 方法
        config.addAllowedMethod("*");

        // 允许所有请求头
        config.addAllowedHeader("*");

        // 允许携带凭证（Cookie、Authorization Header）
        config.setAllowCredentials(true);

        // 预检请求缓存时间
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
```

### 11.3 在 configure(HttpSecurity) 中启用 CORS

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.cors().configurationSource(corsConfigurationSource);
    // ...
}
```

> ⚠️ **重要**：如果只在 MVC 层配置 CORS 而不在 Security 层启用，那么 Security 过滤器会在 CORS 预检请求（OPTIONS）时就返回 401/403，导致跨域请求失败。

### 11.4 CORS 预检请求流程

```
浏览器发送实际请求前：

1. 浏览器发送 OPTIONS 预检请求
   OPTIONS /api/articles
   Origin: http://localhost:8081
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Authorization, Content-Type

2. 服务器返回允许的跨域信息
   Access-Control-Allow-Origin: http://localhost:8081
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   Access-Control-Allow-Headers: *
   Access-Control-Max-Age: 3600

3. 浏览器确认后，发送实际请求
   POST /api/articles
   Authorization: Bearer xxx
```

---

## 12. CSRF 禁用（前后端分离不需要）

### 12.1 什么是 CSRF？

**CSRF（Cross-Site Request Forgery）** 跨站请求伪造：攻击者诱导用户在已登录的 Web 应用中执行非预期操作。

### 12.2 CSRF 攻击原理

```
1. 用户登录了银行网站 → 浏览器保存了 Session Cookie
2. 用户打开了恶意网站
3. 恶意网站发起请求：
   <img src="http://bank.com/transfer?to=hacker&amount=1000">
4. 浏览器自动携带 Cookie 发送请求
5. 银行服务器认为这是用户的合法操作 → 转账成功！
```

### 12.3 为什么前后端分离不需要 CSRF？

| 传统 Web 应用 | 前后端分离 |
|--------------|-----------|
| 使用 Cookie 存储 Session ID | 使用 JWT Token |
| Cookie 会被浏览器自动携带 | Token 需要手动放入 Header |
| 攻击者可以利用 Cookie 自动携带 | 攻击者无法获取 Token |
| 需要 CSRF Token 防护 | 不需要 CSRF 防护 |

### 12.4 禁用 CSRF

```java
.csrf().disable()
```

> ⚠️ **如果不禁用**，所有 POST、PUT、DELETE 请求都会因为没有 CSRF Token 而返回 403。

---

## 13. 自定义认证/授权异常处理

### 13.1 为什么需要自定义异常处理？

Spring Security 默认的异常响应是 HTML 页面（如重定向到登录页），在前后端分离项目中我们需要返回 JSON。

### 13.2 两类异常对应两个处理器

| 异常类型 | HTTP 状态码 | 处理器 |
|---------|------------|--------|
| 未认证（未登录/Token失效） | 401 | `JwtAuthenticationEntryPoint` |
| 无权限（角色不匹配） | 403 | `JwtAccessDeniedHandler` |

### 13.3 未认证异常处理（401）

**文件**：`src/main/java/com/example/blog/security/JwtAuthenticationEntryPoint.java`

```java
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)
            throws IOException, ServletException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new HashMap<>();
        body.put("code", 401);
        body.put("message", "未登录或登录已过期，请重新登录");
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
```

> ⚠️ **javax 命名空间**：这里的 `HttpServletRequest`、`HttpServletResponse`、`ServletException` 都来自 **`javax.servlet`** 包（Spring Boot 2.5），而不是 Spring Boot 3 的 `jakarta.servlet`。

### 13.4 无权限异常处理（403）

**文件**：`src/main/java/com/example/blog/security/JwtAccessDeniedHandler.java`

```java
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException)
            throws IOException, ServletException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new HashMap<>();
        body.put("code", 403);
        body.put("message", "权限不足，无法访问该资源");
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
```

### 13.5 在 configure(HttpSecurity) 中注册

```java
.exceptionHandling()
.authenticationEntryPoint(authenticationEntryPoint)  // 401 处理
.accessDeniedHandler(accessDeniedHandler)            // 403 处理
.and()
```

---

## 14. 测试不同角色的权限控制

### 14.1 准备测试数据

```sql
-- 管理员用户（密码：admin123）
INSERT INTO blog_user (username, password, nickname, role, status)
VALUES ('admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '系统管理员', 'admin', 0);

-- 普通用户（密码：user123）
INSERT INTO blog_user (username, password, nickname, role, status)
VALUES ('zhangsan',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '张三', 'user', 0);
```

### 14.2 测试场景一：管理员访问管理接口

```bash
# 1. 管理员登录
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo "Admin Token: $ADMIN_TOKEN"

# 2. 管理员访问管理接口（应该成功）
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期：200 OK
```

### 14.3 测试场景二：普通用户访问管理接口

```bash
# 1. 普通用户登录
USER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"user123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. 普通用户访问管理接口（应该被拒绝）
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期：403 Forbidden
# {
#   "code": 403,
#   "message": "权限不足，无法访问该资源"
# }
```

### 14.4 测试场景三：未登录访问受保护接口

```bash
curl -X GET http://localhost:8080/api/auth/me

# 预期：401 Unauthorized
# {
#   "code": 401,
#   "message": "未登录或登录已过期，请重新登录"
# }
```

### 14.5 测试场景四：公开接口无需认证

```bash
curl -X GET http://localhost:8080/api/articles/public/list

# 预期：200 OK（公开接口不需要 Token）
```

### 14.6 测试场景五：使用过期 Token

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer 已过期的Token"

# 预期：401 Unauthorized
# {
#   "code": 401,
#   "message": "未登录或登录已过期，请重新登录"
# }
```

---

## 15. 本章小结

### 本章完成的工作

| 文件 | 说明 |
|------|------|
| `config/SecurityConfig.java` | Security 核心配置（WebSecurityConfigurerAdapter、PasswordEncoder、AuthenticationManager） |
| `config/CorsConfig.java` | CORS 跨域配置（CorsConfigurationSource Bean） |
| `security/LoginUser.java` | 自定义 UserDetails 实现（包装 User 实体） |
| `security/CustomUserDetailsService.java` | UserDetailsService 实现（从数据库加载用户） |
| `security/JwtAuthenticationEntryPoint.java` | 未认证异常处理器（返回 401 JSON） |
| `security/JwtAccessDeniedHandler.java` | 无权限异常处理器（返回 403 JSON） |

### 安全架构全景图

```
┌──────────────────────────────────────────────────────────────┐
│                    Spring Security 安全架构                   │
│                                                              │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ 客户端   │───>│ CorsFilter   │───>│ JwtAuthFilter   │    │
│  │(浏览器)  │    │ (跨域处理)   │    │ (Token 验证)    │    │
│  └─────────┘    └──────────────┘    └────────┬────────┘    │
│                                              │               │
│                                              ▼               │
│                                    ┌─────────────────┐      │
│                                    │ SecurityContext │      │
│                                    │ (存储认证信息)   │      │
│                                    └────────┬────────┘      │
│                                              │               │
│  ┌──────────────────────────────────────────┐│               │
│  │           请求授权层                      ││               │
│  │                                          ▼│               │
│  │  permitAll ───> 直接放行                 ││               │
│  │  authenticated ──> 需要认证              ││               │
│  │  hasRole("ADMIN") ──> 需要管理员角色     ││               │
│  │  @PreAuthorize ──> 方法级权限控制        ││               │
│  │                                          ││               │
│  │  认证失败 ──> EntryPoint (401)           ││               │
│  │  授权失败 ──> DeniedHandler (403)        ││               │
│  └──────────────────────────────────────────┘│               │
│                                              │               │
│                                              ▼               │
│                                      ┌──────────────┐       │
│                                      │  Controller  │       │
│                                      │  (业务逻辑)  │       │
│                                      └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### 下一章预告

本章完善了安全体系，接下来我们将聚焦**数据查询**——实现文章列表的分页查询和高级筛选：

- MyBatis-Plus 3.5.1 分页插件配置（`PaginationInnerInterceptor`）
- LambdaQueryWrapper 条件构造器
- 多条件筛选（分类、标签、关键词）
- 多表联查（文章 + 分类 + 作者）
- 排序和模糊搜索

---

> **本章所有代码文件均在 `08-spring-security/` 目录下，可直接参考。**
