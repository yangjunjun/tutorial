package com.example.blog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 自定义认证异常处理器（未认证）
 * <p>
 * 实现 {@link AuthenticationEntryPoint} 接口，处理**未认证**的访问请求。
 * <p>
 * 触发场景：
 * 1. 请求未携带 Token（Authorization 请求头为空）
 * 2. 携带的 Token 无效（签名错误、格式错误）
 * 3. Token 已过期
 * 4. 用户未登录就尝试访问受保护资源
 * <p>
 * 与 {@link JwtAccessDeniedHandler} 的区别：
 * - EntryPoint：用户**未认证**（没有登录或 Token 失效），对应 HTTP 401
 * - DeniedHandler：用户**已认证但无权限**（如普通用户访问管理后台），对应 HTTP 403
 * <p>
 * 注意：Spring Security 默认的异常处理会重定向到登录页或返回 HTML，
 * 在前后端分离项目中我们需要返回 JSON 格式的响应。
 * <p>
 * 注意：Spring Boot 2.5 使用 <strong>javax.servlet</strong> 命名空间。
 *
 * @author tutorial
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);

    /**
     * Jackson 对象映射器，用于将 Java 对象序列化为 JSON
     */
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 处理认证异常
     * <p>
     * 当未认证的用户尝试访问受保护资源时，此方法会被调用。
     * 我们返回一个 JSON 格式的错误响应，而非默认的 HTML 页面。
     *
     * @param request       HTTP 请求
     * @param response      HTTP 响应
     * @param authException 认证异常信息
     * @throws IOException      IO 异常
     * @throws ServletException Servlet 异常
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)
            throws IOException, ServletException {

        log.warn("未认证访问被拦截 - URI: {}, 异常: {}",
                request.getRequestURI(), authException.getMessage());

        // ========== 设置响应状态码为 401 Unauthorized ==========
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // ========== 设置响应类型为 JSON ==========
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // ========== 设置字符编码为 UTF-8 ==========
        response.setCharacterEncoding("UTF-8");

        // ========== 构造 JSON 响应体 ==========
        Map<String, Object> body = new HashMap<>();
        body.put("code", 401);
        body.put("message", "未登录或登录已过期，请重新登录");
        body.put("data", null);
        // 附加请求路径，方便前端排查
        body.put("path", request.getRequestURI());

        // 将 Map 对象序列化为 JSON 并写入响应流
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
