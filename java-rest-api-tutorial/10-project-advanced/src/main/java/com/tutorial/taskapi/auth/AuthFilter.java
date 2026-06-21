package com.tutorial.taskapi.auth;

import com.sun.net.httpserver.HttpExchange;
import com.tutorial.taskapi.filter.Filter;
import com.tutorial.taskapi.filter.FilterChain;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 认证过滤器
 * 
 * 实现简单的 Token 认证：
 * - 登录接口生成 Token
 * - 其他接口验证 Authorization: Bearer <token> 头
 * 
 * 注意：这是一个教学示例，生产环境请使用 JWT 库（如 jjwt）
 */
public class AuthFilter implements Filter {

    // 白名单：不需要认证的路径
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/", "/health", "/api/auth/login"
    );

    // Token 存储：token → username
    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();

    // 模拟用户存储
    private final Map<String, String> users = new ConcurrentHashMap<>();

    public AuthFilter() {
        // 预设一个管理员账户
        users.put("admin", hashPassword("123456"));
    }

    @Override
    public boolean doFilter(HttpExchange exchange, FilterChain chain) throws Exception {
        String path = exchange.getRequestURI().getPath();

        // 白名单直接放行
        if (PUBLIC_PATHS.contains(path)) {
            return chain.doFilter(exchange);
        }

        // 检查 Authorization 头
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(exchange, "缺少 Authorization 头");
            return false;
        }

        String token = authHeader.substring(7);
        String username = tokenStore.get(token);

        if (username == null) {
            sendUnauthorized(exchange, "无效的 Token");
            return false;
        }

        // 将用户信息存入 exchange 属性，后续 Handler 可以获取
        exchange.setAttribute("username", username);

        return chain.doFilter(exchange);
    }

    /**
     * 用户登录，返回 Token
     */
    public String login(String username, String password) {
        String storedHash = users.get(username);
        if (storedHash == null) return null;

        if (!storedHash.equals(hashPassword(password))) {
            return null;
        }

        // 生成随机 Token
        String token = generateToken();
        tokenStore.put(token, username);
        return token;
    }

    /**
     * 添加用户
     */
    public void registerUser(String username, String password) {
        users.put(username, hashPassword(password));
    }

    // ===== 工具方法 =====

    private String generateToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void sendUnauthorized(HttpExchange exchange, String message) throws Exception {
        String json = "{\"success\":false,\"error\":{\"code\":401,\"message\":\"" + message + "\"}}";
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(401, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    @Override
    public String name() {
        return "AuthFilter";
    }
}
