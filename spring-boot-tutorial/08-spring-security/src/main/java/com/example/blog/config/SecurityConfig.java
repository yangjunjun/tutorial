package com.example.blog.config;

import com.example.blog.security.JwtAccessDeniedHandler;
import com.example.blog.security.JwtAuthenticationEntryPoint;
import com.example.blog.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 6 配置类
 * <p>
 * <strong>⚠️ 重要变化：Spring Security 6 vs 旧版本</strong>
 * <p>
 * Spring Boot 3 搭配 Spring Security 6，配置方式发生了根本性变化：
 * <p>
 * <strong>旧版（Spring Security 5.x / Spring Boot 2.x）</strong>：
 * <pre>
 * // ❌ 已废弃的方式
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
 * <strong>新版（Spring Security 6 / Spring Boot 3.x）</strong>：
 * <pre>
 * // ✅ 正确的配置方式
 * {@code @Configuration}
 * {@code @EnableWebSecurity}
 * public class SecurityConfig {
 *     {@code @Bean}
 *     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
 *         http.authorizeHttpRequests(auth -> auth
 *             .requestMatchers("/api/auth/**").permitAll()
 *             .anyRequest().authenticated());
 *         return http.build();
 *     }
 * }
 * </pre>
 * <p>
 * 主要变化点：
 * 1. 不再继承 WebSecurityConfigurerAdapter（已移除）
 * 2. 使用 SecurityFilterChain Bean 替代 configure 方法
 * 3. 配置方法使用 Lambda 表达式风格
 * 4. antMatchers → requestMatchers
 * 5. authorizeRequests → authorizeHttpRequests
 * 6. 默认启用 CSRF 和 Session 管理，需要显式禁用
 *
 * @author tutorial
 */
@Configuration
@EnableWebSecurity  // 启用 Spring Security 的 Web 安全支持
@EnableMethodSecurity  // 启用方法级权限控制（@PreAuthorize、@Secured 等注解）
public class SecurityConfig {

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
                          CorsConfig corsConfig) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        // 从 CorsConfig 获取 CorsFilter 中的 CorsConfigurationSource
        this.corsConfigurationSource = corsConfig.corsFilter().getCorsConfigurationSource();
    }

    // ==================== 核心配置：SecurityFilterChain ====================

    /**
     * 安全过滤器链配置
     * <p>
     * 这是 Spring Security 6 的核心配置入口，定义了整个安全框架的行为。
     * <p>
     * 过滤器链的执行顺序（简化）：
     * <pre>
     * 请求进入
     *   → CorsFilter（跨域预检）
     *   → CsrfFilter（CSRF 校验，我们已禁用）
     *   → JwtAuthenticationFilter（JWT Token 验证）
     *   → UsernamePasswordAuthenticationFilter（表单登录，我们已禁用）
     *   → ExceptionTranslationFilter（异常处理）
     *   → AuthorizationFilter（权限判断）
     *   → Controller
     * </pre>
     *
     * @param http HttpSecurity 配置对象
     * @return SecurityFilterChain 构建好的过滤器链
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ==================== 1. CORS 跨域配置 ====================
            // 启用 CORS 支持，使用 CorsConfig 中定义的配置
            // 必须放在最前面，确保 CORS 预检请求（OPTIONS）能正确处理
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // ==================== 2. 禁用 CSRF ====================
            // CSRF（跨站请求伪造）防护主要适用于基于 Cookie + Session 的传统 Web 应用。
            // 前后端分离项目使用 JWT Token 认证，Token 放在 Header 中，
            // 不受 Cookie 自动携带机制的影响，因此不需要 CSRF 防护。
            // 如果不禁用，POST/PUT/DELETE 请求会因为缺少 CSRF Token 而返回 403。
            .csrf(AbstractHttpConfigurer::disable)

            // ==================== 3. 禁用 Session 管理 ====================
            // 使用 JWT 认证是无状态的，不需要在服务端存储 Session。
            // STATELESS 表示 Spring Security 不会创建或使用 HttpSession。
            // 这意味着每个请求都必须携带完整的认证信息（JWT Token）。
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ==================== 4. 请求授权配置 ====================
            .authorizeHttpRequests(auth -> auth
                // ----- 公开接口（不需要认证）-----

                // 登录、注册、Token 刷新接口
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/refresh"
                ).permitAll()

                // Swagger / OpenAPI 文档相关路径（如果集成了 Swagger）
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()

                // 静态资源（如图片、CSS、JS 等）
                .requestMatchers(
                    "/static/**",
                    "/favicon.ico",
                    "/error"
                ).permitAll()

                // 公开的文章列表接口（只读，游客可访问）
                .requestMatchers("/api/articles/public/**").permitAll()

                // ----- 管理员接口（需要 ADMIN 角色）-----
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ----- 其他所有接口需要认证 -----
                .anyRequest().authenticated()
            )

            // ==================== 5. 异常处理配置 ====================
            .exceptionHandling(exception -> exception
                // 未认证异常处理（401）
                // 当未登录用户访问受保护资源时触发
                .authenticationEntryPoint(authenticationEntryPoint)
                // 无权限异常处理（403）
                // 当已登录用户访问没有权限的资源时触发
                .accessDeniedHandler(accessDeniedHandler)
            )

            // ==================== 6. 注册 JWT 过滤器 ====================
            // 将 JWT 过滤器添加到 UsernamePasswordAuthenticationFilter 之前
            // <p>
            // 过滤器链中的执行顺序：
            // ... → JwtAuthenticationFilter → UsernamePasswordAuthenticationFilter → ...
            // <p>
            // 这样确保在 Spring Security 处理认证之前，
            // 我们已经通过 JWT 验证了 Token 并将用户信息存入了 SecurityContext。
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        // 构建并返回过滤器链
        return http.build();
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
     * <p>
     * 哈希结果示例：
     * <pre>
     * $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH
     * │   │  │
     * │   │  └── 22 字符盐值 + 31 字符哈希值
     * │   └───── cost factor（2^10 = 1024 次迭代）
     * └───────── 算法版本标识
     * </pre>
     *
     * @return PasswordEncoder 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==================== AuthenticationManager 配置 ====================

    /**
     * 认证管理器 Bean
     * <p>
     * AuthenticationManager 是 Spring Security 的认证入口，
     * 负责验证用户凭证（用户名 + 密码）是否有效。
     * <p>
     * 在 Spring Security 6 中，获取 AuthenticationManager 的方式变了：
     * - 旧版：在 WebSecurityConfigurerAdapter 中 override authenticationManagerBean()
     * - 新版：从 AuthenticationConfiguration 中获取
     * <p>
     * 使用场景：
     * - 在登录接口中手动触发认证
     * - 自定义认证流程时使用
     *
     * @param authenticationConfiguration Spring Security 的认证配置
     * @return AuthenticationManager 认证管理器
     * @throws Exception 配置异常
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
