package com.example.blog.security;

import com.example.blog.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器
 * <p>
 * 继承 {@link OncePerRequestFilter}，确保每次请求只执行一次过滤。
 * <p>
 * 工作流程：
 * 1. 从请求头 "Authorization" 中提取 Token（格式：Bearer xxx）
 * 2. 解析 Token，获取用户名
 * 3. 通过 UserDetailsService 加载用户信息
 * 4. 创建 Authentication 对象并存入 SecurityContext
 * 5. 后续请求可以通过 SecurityContextHolder 获取当前登录用户
 * <p>
 * 注意事项：
 * - 该过滤器需要在 Spring Security 过滤器链中注册，位于 UsernamePasswordAuthenticationFilter 之前
 * - 如果 Token 无效或缺失，不会设置 Authentication，请求会由后续的 Security 过滤器处理
 * - 如果 SecurityContext 中已有认证信息（已登录），则跳过 Token 验证
 *
 * @author tutorial
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    /**
     * Authorization 请求头名称
     */
    private static final String AUTHORIZATION_HEADER = "Authorization";

    /**
     * Token 前缀（Bearer Token 规范）
     */
    private static final String TOKEN_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    /**
     * 构造注入依赖
     *
     * @param jwtUtil            JWT 工具类
     * @param userDetailsService 用户详情服务（用于加载用户信息）
     */
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * 核心过滤逻辑
     * <p>
     * OncePerRequestFilter 的 doFilterInternal 方法，每个请求只执行一次。
     *
     * @param request     HTTP 请求
     * @param response    HTTP 响应
     * @param filterChain 过滤器链
     * @throws ServletException Servlet 异常
     * @throws IOException      IO 异常
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // ========== 第一步：从请求头中提取 JWT Token ==========
            String jwt = extractJwtFromRequest(request);

            // ========== 第二步：验证 Token 是否有效 ==========
            // 条件：Token 不为空 且 SecurityContext 中没有已认证信息
            if (jwt != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 验证 Token 格式和签名是否有效
                if (jwtUtil.validateToken(jwt)) {

                    // ========== 第三步：从 Token 中提取用户名 ==========
                    String username = jwtUtil.getUsernameFromToken(jwt);

                    // ========== 第四步：从数据库加载用户详情 ==========
                    // UserDetailsService.loadUserByUsername 会查询数据库获取用户信息
                    // 包括密码、角色、权限等
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // ========== 第五步：创建认证对象并存入 SecurityContext ==========
                    // UsernamePasswordAuthenticationToken 是 Spring Security 提供的认证对象
                    // 三个参数：主体（用户信息）、凭证（密码，这里不需要）、权限列表
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    // 设置认证详情（包含请求 IP、Session ID 等信息）
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // 将认证对象存入 SecurityContext
                    // 后续可以通过 SecurityContextHolder.getContext().getAuthentication() 获取
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT 认证成功，用户: {}", username);
                }
            }
        } catch (Exception e) {
            // Token 验证失败不抛异常，让请求继续流转
            // 后续由 Spring Security 判断是否有权限访问
            log.error("JWT 认证过程异常: {}", e.getMessage());
        }

        // 继续执行过滤器链中的下一个过滤器
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取 JWT Token
     * <p>
     * HTTP 请求头格式：Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
     * 需要去掉 "Bearer " 前缀，获取纯 Token 字符串。
     *
     * @param request HTTP 请求
     * @return JWT Token 字符串，如果不存在则返回 null
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        // 获取 Authorization 请求头的值
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        // 判断是否存在且以 "Bearer " 开头
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
            // 截取 "Bearer " 后面的 Token 部分
            return bearerToken.substring(TOKEN_PREFIX.length());
        }

        return null;
    }
}
