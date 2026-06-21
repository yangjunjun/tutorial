package com.example.blog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 自定义权限异常处理器（无权限）
 * <p>
 * 实现 {@link AccessDeniedHandler} 接口，处理**已认证但无权限**的访问请求。
 * <p>
 * 触发场景：
 * 1. 普通用户（ROLE_USER）访问管理员接口（需要 ROLE_ADMIN）
 * 2. 使用 @PreAuthorize 注解限制的接口，用户不满足条件
 * 3. 使用 .hasRole("ADMIN") 配置的路径，用户角色不匹配
 * <p>
 * 与 {@link JwtAuthenticationEntryPoint} 的区别：
 * - EntryPoint（401）：用户根本没有认证（未登录或 Token 失效）
 * - DeniedHandler（403）：用户已经认证了，但是权限不够
 * <p>
 * HTTP 状态码说明：
 * - 401 Unauthorized：未认证，需要登录
 * - 403 Forbidden：已认证，但没有权限访问该资源
 *
 * @author tutorial
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private static final Logger log = LoggerFactory.getLogger(JwtAccessDeniedHandler.class);

    /**
     * Jackson 对象映射器
     */
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 处理访问拒绝异常
     * <p>
     * 当已认证的用户尝试访问没有权限的资源时，此方法会被调用。
     *
     * @param request               HTTP 请求
     * @param response              HTTP 响应
     * @param accessDeniedException 访问拒绝异常信息
     * @throws IOException      IO 异常
     * @throws ServletException Servlet 异常
     */
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException)
            throws IOException, ServletException {

        log.warn("权限不足被拦截 - URI: {}, 异常: {}",
                request.getRequestURI(), accessDeniedException.getMessage());

        // ========== 设置响应状态码为 403 Forbidden ==========
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        // ========== 设置响应类型为 JSON ==========
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // ========== 设置字符编码为 UTF-8 ==========
        response.setCharacterEncoding("UTF-8");

        // ========== 构造 JSON 响应体 ==========
        Map<String, Object> body = new HashMap<>();
        body.put("code", 403);
        body.put("message", "权限不足，无法访问该资源");
        body.put("data", null);
        body.put("path", request.getRequestURI());

        // 将 Map 对象序列化为 JSON 并写入响应流
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
