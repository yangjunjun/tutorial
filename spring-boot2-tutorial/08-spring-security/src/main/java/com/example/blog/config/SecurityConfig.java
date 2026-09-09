package com.example.blog.config;

import com.example.blog.security.JwtAccessDeniedHandler;
import com.example.blog.security.JwtAuthenticationEntryPoint;
import com.example.blog.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 5.5 完整配置类
 * <p>
 * <strong>⚠️ 版本说明：Spring Boot 2.5 自带 Spring Security 5.5.x</strong>
 * <p>
 * Spring Security 5.x 世代的标准配置方式是<strong>继承 WebSecurityConfigurerAdapter</strong>。
 * 很多老项目、老教程里看到的"Security 6 新写法"对照关系如下：
 * <p>
 * <strong>Security 5.5.x（本教程使用，✅ 正确方式）</strong>：
 * <pre>
 * {@code @Configuration}
 * {@code @EnableWebSecurity}
 * public class SecurityConfig extends WebSecurityConfigurerAdapter {
 *     {@code @Override}
 *     protected void configure(HttpSecurity http) throws Exception {
 *         http.authorizeRequests()
 *             .antMatchers("/api/auth/**").permitAll()
 *             .anyRequest().authenticated();
 *     }
 * }
 * </pre>
 * <p>
 * <strong>Security 6.x（Spring Boot 3 世代，此处仅作对照，勿在本教程中混用）</strong>：
 * <pre>
 * // 使用 SecurityFilterChain Bean 配置
 * {@code @Configuration}
 * {@code @EnableWebSecurity}
 * public class SecurityConfig {
 *     {@code @Bean}
 *     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
 *         http.authorizeHttpRequests(auth -> auth
 *             .requestMatchers("/api/auth/**").permitAll()
 *             .anyRequest().authenticated());
 *         return http.build();
 *     }
 * }
 * </pre>
 * <p>
 * 关键 API 对照一览（5.5.x → 6.x）：
 * <pre>
 * extends WebSecurityConfigurerAdapter   →  SecurityFilterChain Bean
 * authorizeRequests()                    →  authorizeHttpRequests()
 * antMatchers()                          →  requestMatchers()
 * .and() 链式调用                         →  Lambda 表达式风格
 * @EnableGlobalMethodSecurity             →  @EnableMethodSecurity
 * </pre>
 *
 * @author tutorial
 */
@Configuration
@EnableWebSecurity  // 启用 Spring Security 的 Web 安全支持
@EnableGlobalMethodSecurity(prePostEnabled = true)  // 启用方法级权限控制（@PreAuthorize、@PostAuthorize 等注解）
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * 构造注入所有依赖
     * <p>
     * 使用构造注入的优势：
     * - 依赖关系明确，不可隐藏
     * - 支持 final 字段，不可变
     * - 便于单元测试时 Mock 依赖
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          JwtAuthenticationEntryPoint authenticationEntryPoint,
                          JwtAccessDeniedHandler accessDeniedHandler,
                          CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    // ==================== 核心配置：HttpSecurity ====================

    /**
     * HTTP 安全配置（Security 5.5.x 核心入口）
     * <p>
     * 定义了整个安全框架的行为，包括过滤器链的授权规则、CORS、CSRF、
     * 会话管理、异常处理以及自定义 JWT 过滤器的注册位置。
     * <p>
     * 过滤器链的执行顺序（简化）：
     * <pre>
     * 请求进入
     *   → CorsFilter（跨域预检）
     *   → CsrfFilter（CSRF 校验，我们已禁用）
     *   → JwtAuthenticationFilter（JWT Token 验证）
     *   → UsernamePasswordAuthenticationFilter（表单登录，我们已禁用）
     *   → ExceptionTranslationFilter（异常处理）
     *   → FilterSecurityInterceptor（权限判断）
     *   → Controller
     * </pre>
     *
     * @param http HttpSecurity 配置对象
     * @throws Exception 配置异常
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            // ==================== 1. CORS 跨域配置 ====================
            // 启用 CORS 支持，使用 CorsConfig 中定义的配置
            // 必须放在最前面，确保 CORS 预检请求（OPTIONS）能正确处理
            .cors().configurationSource(corsConfigurationSource)
            .and()

            // ==================== 2. 禁用 CSRF ====================
            // CSRF 防护主要适用于基于 Cookie + Session 的传统 Web 应用。
            // 前后端分离项目使用 JWT Token 认证，Token 放在 Header 中，
            // 不受 Cookie 自动携带机制的影响，因此不需要 CSRF 防护。
            // 如果不禁用，POST/PUT/DELETE 请求会因为缺少 CSRF Token 而返回 403。
            .csrf().disable()

            // ==================== 3. 禁用 Session 管理 ====================
            // 使用 JWT 认证是无状态的，不需要在服务端存储 Session。
            // STATELESS 表示 Spring Security 不会创建或使用 HttpSession。
            // 这意味着每个请求都必须携带完整的认证信息（JWT Token）。
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()

            // ==================== 4. 请求授权配置 ====================
            // authorizeRequests：Security 5.x 的授权配置入口
            // antMatchers：Ant 风格路径匹配，支持 ? * ** 通配符
            //
            // ⚠️ 规则匹配按声明顺序进行，先匹配的先生效。
            // 具体规则要放在前面，通用规则（anyRequest()）必须放在最后。
            .authorizeRequests()
            // ----- 公开接口（不需要认证）-----

            // 登录、注册、Token 刷新接口
            .antMatchers(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/refresh"
            ).permitAll()

            // Swagger 文档相关路径（如果集成了 Swagger）
            .antMatchers(
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/v2/api-docs",
                "/v3/api-docs/**",
                "/swagger-resources/**",
                "/webjars/**"
            ).permitAll()

            // 静态资源（如图片、CSS、JS 等）
            .antMatchers(
                "/static/**",
                "/favicon.ico",
                "/error"
            ).permitAll()

            // 公开的文章列表接口（只读，游客可访问）
            .antMatchers("/api/articles/public/**").permitAll()

            // ----- 管理员接口（需要 ADMIN 角色）-----
            // hasRole("ADMIN") 会自动匹配 "ROLE_ADMIN" 权限标识
            .antMatchers("/api/admin/**").hasRole("ADMIN")

            // ----- 其他所有接口需要认证 -----
            .anyRequest().authenticated()
            .and()

            // ==================== 5. 异常处理配置 ====================
            // 未认证异常处理（401）：当未登录用户访问受保护资源时触发
            // 无权限异常处理（403）：当已登录用户访问没有权限的资源时触发
            .exceptionHandling()
            .authenticationEntryPoint(authenticationEntryPoint)
            .accessDeniedHandler(accessDeniedHandler)
            .and()

            // ==================== 6. 注册 JWT 过滤器 ====================
            // 将 JWT 过滤器添加到 UsernamePasswordAuthenticationFilter 之前
            //
            // 过滤器链中的执行顺序：
            // ... → JwtAuthenticationFilter → UsernamePasswordAuthenticationFilter → ...
            //
            // 这样确保在 Spring Security 处理认证之前，
            // 我们已经通过 JWT 验证了 Token 并将用户信息存入了 SecurityContext。
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );
    }

    // ==================== 密码编码器配置 ====================

    /**
     * 密码编码器 Bean
     * <p>
     * 使用 {@link BCryptPasswordEncoder} 进行密码加密和验证。
     * <p>
     * BCrypt 是目前最推荐的密码哈希算法之一，优势：
     * - 自带盐值（Salt），不需要单独存储
     * - 计算成本可调（通过 strength 参数），抵抗暴力破解
     * - 相同密码每次哈希结果不同（因为盐值随机）
     *
     * @return PasswordEncoder 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==================== 用户详情服务与认证管理器 ====================

    /**
     * 配置认证管理器使用的用户详情服务与密码编码器
     * <p>
     * 告诉 Spring Security：加载用户用 customUserDetailsService，
     * 验证密码用上面定义的 BCrypt PasswordEncoder。
     *
     * @param auth AuthenticationManagerBuilder 认证管理器构建器
     * @throws Exception 配置异常
     */
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(customUserDetailsService)
            .passwordEncoder(passwordEncoder());
    }

    /**
     * 认证管理器 Bean
     * <p>
     * AuthenticationManager 是 Spring Security 的认证入口，
     * 负责验证用户凭证（用户名 + 密码）是否有效。
     * <p>
     * 在 WebSecurityConfigurerAdapter 风格下，暴露 AuthenticationManager
     * 的方式是重写 authenticationManagerBean() 方法并标注 @Bean。
     * （Security 6 中改为从 AuthenticationConfiguration 中获取。）
     * <p>
     * 使用场景：
     * - 在登录接口中手动触发认证
     * - 自定义认证流程时使用
     *
     * @return AuthenticationManager 认证管理器
     * @throws Exception 配置异常
     */
    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }
}
