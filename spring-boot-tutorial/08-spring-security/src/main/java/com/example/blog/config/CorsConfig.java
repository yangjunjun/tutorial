package com.example.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS 跨域配置
 * <p>
 * <strong>为什么需要 CORS 配置？</strong>
 * <p>
 * 在前后端分离的架构中，前端和后端通常运行在不同的域（协议、域名、端口任一不同即算跨域）。
 * 浏览器出于安全考虑，默认禁止跨域请求（同源策略）。
 * CORS（Cross-Origin Resource Sharing）是一种机制，
 * 允许服务器声明"哪些域可以访问我的资源"。
 * <p>
 * 典型的开发环境跨域场景：
 * <pre>
 * 前端（Vue）：http://localhost:5173
 * 后端（Spring Boot）：http://localhost:8080
 * → 协议和端口都不同，属于跨域
 * </pre>
 * <p>
 * <strong>Spring Security 6 中的 CORS 配置</strong>
 * <p>
 * 在 Spring Security 6 中，CORS 配置需要在两个地方生效：
 * 1. Spring MVC 的 CorsFilter（全局 CORS 配置）
 * 2. SecurityFilterChain 中的 http.cors()（让 Security 过滤器链感知 CORS）
 * <p>
 * 如果只在 MVC 层配置了 CORS 而 Security 层没有启用，
 * 那么 Security 的过滤器（如 JWT 过滤器）可能在 CORS 预检请求（OPTIONS）时
 * 就返回 401/403，导致跨域请求失败。
 *
 * @author tutorial
 */
@Configuration
public class CorsConfig {

    /**
     * 配置 CORS 过滤器
     * <p>
     * 使用 {@link CorsFilter} Bean 全局配置跨域策略。
     * Spring Boot 会自动将此过滤器注册到过滤器链中。
     * <p>
     * 关键配置项：
     * - allowedOriginPatterns：允许的源（域名/URL 模式）
     * - allowedMethods：允许的 HTTP 方法
     * - allowedHeaders：允许的请求头
     * - allowCredentials：是否允许携带凭证（Cookie、Authorization 等）
     * - maxAge：预检请求缓存时间
     *
     * @return CorsFilter CORS 过滤器
     */
    @Bean
    public CorsFilter corsFilter() {
        // 创建 CORS 配置对象
        CorsConfiguration config = new CorsConfiguration();

        // ========== 允许的来源 ==========
        // 使用 addAllowedOriginPattern 而非 addAllowedOrigin
        // 因为 allowCredentials = true 时，不能使用 "*" 作为 origin
        // 但可以使用模式匹配，如 "http://localhost:*"
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
        // 生产环境中替换为实际的前端域名
        // config.addAllowedOriginPattern("https://your-frontend-domain.com");

        // ========== 允许的 HTTP 方法 ==========
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("OPTIONS");  // 预检请求必须允许 OPTIONS

        // ========== 允许的请求头 ==========
        // "*" 表示允许所有请求头（包括 Authorization、Content-Type 等）
        config.addAllowedHeader("*");

        // ========== 允许携带凭证 ==========
        // 设为 true 后，前端请求可以携带 Cookie 和 Authorization 请求头
        // 对应前端的 withCredentials: true 或 axios 的默认行为
        config.setAllowCredentials(true);

        // ========== 暴露的响应头 ==========
        // 允许前端 JavaScript 读取的响应头
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Disposition");  // 文件下载时需要

        // ========== 预检请求缓存时间（秒）==========
        // 浏览器在发送实际请求前会先发一个 OPTIONS 预检请求
        // 设置缓存时间可以减少预检请求次数
        config.setMaxAge(3600L);  // 1 小时

        // ========== 注册 CORS 配置 ==========
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // "/**" 表示对所有路径应用此 CORS 配置
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
