package com.example.blog.config;

import com.example.blog.security.CustomUserDetailsService;
import com.example.blog.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 基础配置（第 07 章最小可用版）
 * <p>
 * <strong>版本说明：Spring Boot 2.5 自带 Spring Security 5.5.x</strong>
 * <p>
 * Security 5.5.x 的经典配置方式是<strong>继承 WebSecurityConfigurerAdapter</strong>
 * 并重写 configure 方法（这也是 Security 5.x 世代的标准写法）。
 * Spring Security 6（Spring Boot 3 世代）才移除了该适配器，改用 SecurityFilterChain Bean。
 * <p>
 * 本章只需要让 JWT 认证"跑起来"：
 * 1. 放行登录、刷新等公开接口
 * 2. 其余接口需要认证
 * 3. 注册 JWT 过滤器
 * 4. 提供 PasswordEncoder Bean（登录验证密码时需要）
 * <p>
 * 下一章（第 08 章）将在此骨架上补充 RBAC 角色权限、CORS、
 * 自定义 401/403 异常处理等完整安全体系。
 *
 * @author tutorial
 */
@Configuration
@EnableWebSecurity  // 启用 Spring Security 的 Web 安全支持
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    /**
     * 构造注入所有依赖
     * <p>
     * 使用构造注入的优势：
     * - 依赖关系明确，不可隐藏
     * - 支持 final 字段，不可变
     * - 便于单元测试时 Mock 依赖
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CustomUserDetailsService customUserDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    // ==================== 核心配置：HttpSecurity ====================

    /**
     * HTTP 安全配置
     * <p>
     * WebSecurityConfigurerAdapter 的 configure(HttpSecurity) 方法
     * 定义了过滤器链的授权规则和各项安全行为。
     * <p>
     * 配置使用经典的<strong>链式调用 + and() 连接</strong>风格
     * （Security 5.x 世代的标准写法，读起来像"并且"）：
     * <pre>
     * http.csrf().disable()                    // 禁用 CSRF
     *     .and().sessionManagement()...        // 会话管理
     *     .and().authorizeRequests()...        // 授权规则
     * </pre>
     *
     * @param http HttpSecurity 配置对象
     * @throws Exception 配置异常
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            // ==================== 1. 禁用 CSRF ====================
            // CSRF（跨站请求伪造）防护主要适用于基于 Cookie + Session 的传统 Web 应用。
            // 前后端分离项目使用 JWT Token 认证，Token 放在 Header 中，
            // 不受 Cookie 自动携带机制的影响，因此不需要 CSRF 防护。
            // 如果不禁用，POST/PUT/DELETE 请求会因为缺少 CSRF Token 而返回 403。
            .csrf().disable()

            // ==================== 2. 禁用 Session 管理 ====================
            // 使用 JWT 认证是无状态的，不需要在服务端存储 Session。
            // STATELESS 表示 Spring Security 不会创建或使用 HttpSession。
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()

            // ==================== 3. 请求授权配置 ====================
            // authorizeRequests：Security 5.x 的授权配置入口（6.x 改名为 authorizeHttpRequests）
            // antMatchers：使用 Ant 风格路径匹配（6.x 改名为 requestMatchers）
            .authorizeRequests()
            // ----- 公开接口（不需要认证）-----
            // 登录、注册、Token 刷新接口
            .antMatchers(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/refresh"
            ).permitAll()
            // 静态资源与错误页
            .antMatchers("/static/**", "/favicon.ico", "/error").permitAll()
            // ----- 其他所有接口需要认证 -----
            .anyRequest().authenticated()
            .and()

            // ==================== 4. 注册 JWT 过滤器 ====================
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
     * <p>
     * 哈希结果示例：
     * <pre>
     * $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH
     * </pre>
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
     * <p>
     * 说明：Spring Security 5.5.x 中，如果容器中已存在 UserDetailsService
     * 和 PasswordEncoder Bean，全局 AuthenticationManager 会自动使用它们，
     * 这里显式声明是为了让依赖关系一目了然。
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
