package com.example.blog.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类
 * <p>
 * 提供 JWT Token 的生成、解析、验证等核心功能。
 * <p>
 * 本教程使用 <strong>jjwt 0.9.1</strong>（JDK 8 世代最常用的版本），API 为经典的"旧风格"：
 * 1. 生成：Jwts.builder().setSubject(...).signWith(SignatureAlgorithm.HS256, secret)
 * 2. 解析：Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody()
 * 3. 密钥直接使用 String，无需 0.12.x 的 Keys.hmacShaKeyFor() 生成 SecretKey 对象
 * 4. JDK 8 下无需额外添加 jaxb 依赖
 * <p>
 * Token 结构说明：
 * JWT 由三部分组成，用 "." 分隔：
 * - Header（头部）：声明 Token 类型和签名算法，如 {"alg": "HS256", "typ": "JWT"}
 * - Payload（载荷）：携带声明（Claims），如用户名、角色、过期时间等
 * - Signature（签名）：使用 Header 中声明的算法和密钥对前两部分签名，防篡改
 *
 * @author tutorial
 */
@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    /**
     * JWT 签名密钥
     * <p>
     * 从 application.yml 配置中读取。
     * jjwt 0.9.1 中字符串密钥会被内部转为字节数组参与 HMAC 运算，
     * 为了安全，仍建议使用足够长的随机字符串（不少于 32 字节）。
     * 生产环境中请使用安全的随机字符串，不要使用硬编码。
     */
    @Value("${jwt.secret:blog-tutorial-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256}")
    private String secret;

    /**
     * Token 有效期（毫秒）
     * <p>
     * 默认 24 小时（86400000ms）。
     * 从 application.yml 配置中读取，可通过 jwt.expiration 自定义。
     */
    @Value("${jwt.expiration:86400000}")
    private long expiration;

    /**
     * Token 刷新有效期（毫秒）
     * <p>
     * 默认 7 天（604800000ms）。
     * Refresh Token 用于在 Access Token 过期后获取新的 Access Token，
     * 避免用户频繁重新登录。
     */
    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    /**
     * 生成 JWT Token（Access Token）
     * <p>
     * Token 中包含以下信息（Claims）：
     * - sub（Subject）：用户名，作为 Token 的主题标识
     * - userId：用户 ID，自定义声明
     * - nickname：用户昵称，自定义声明
     * - iat（Issued At）：Token 签发时间
     * - exp（Expiration）：Token 过期时间
     *
     * @param username 用户名
     * @param userId   用户 ID
     * @param nickname 用户昵称
     * @return JWT Token 字符串
     */
    public String generateToken(String username, Long userId, String nickname) {
        // 构建自定义声明（Claims）
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("nickname", nickname);

        return Jwts.builder()
                // 设置自定义声明
                .setClaims(claims)
                // 设置 Token 主题（Subject），这里使用用户名
                .setSubject(username)
                // 设置签发时间（Issued At）
                .setIssuedAt(new Date())
                // 设置过期时间（Expiration）= 当前时间 + 配置的有效期
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // 使用 HMAC-SHA256 算法签名（0.9.1 旧风格：算法枚举 + 字符串密钥）
                .signWith(SignatureAlgorithm.HS256, secret)
                // 序列化为紧凑格式的 JWT 字符串（Header.Payload.Signature）
                .compact();
    }

    /**
     * 生成 Refresh Token
     * <p>
     * Refresh Token 包含的信息比 Access Token 少，
     * 主要用于换取新的 Access Token，有效期更长。
     *
     * @param username 用户名
     * @param userId   用户 ID
     * @return Refresh Token 字符串
     */
    public String generateRefreshToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        // 标记为 Refresh Token，防止 Access Token 被当作 Refresh Token 使用
        claims.put("type", "refresh");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    /**
     * 解析 JWT Token，获取 Claims（声明）
     * <p>
     * jjwt 0.9.1 的解析 API：
     * <pre>
     * Jwts.parser()
     *     .setSigningKey(secret)   // 设置验证密钥（字符串或 Key 均可）
     *     .parseClaimsJws(token)   // 解析并验证签名的 Token
     *     .getBody();              // 获取 Claims（载荷）
     * </pre>
     * 注意与 0.12.x 新版 API 的区别：
     * 新版为 Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload()
     *
     * @param token JWT Token 字符串
     * @return Claims 对象，包含 Token 中所有声明
     * @throws ExpiredJwtException    Token 已过期
     * @throws MalformedJwtException  Token 格式不正确
     * @throws SignatureException     Token 签名验证失败
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                // 设置验证密钥（0.9.1 支持直接传入字符串密钥）
                .setSigningKey(secret)
                // 解析并验证签名的 Token，返回 Jws<Claims>
                .parseClaimsJws(token)
                // 获取 Claims（声明/载荷）
                .getBody();
    }

    /**
     * 从 Token 中获取用户名
     * <p>
     * 用户名存储在标准声明 "sub"（Subject）中。
     *
     * @param token JWT Token 字符串
     * @return 用户名
     */
    public String getUsernameFromToken(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * 从 Token 中获取用户 ID
     * <p>
     * 用户 ID 存储在自定义声明 "userId" 中。
     * <p>
     * 注意：JSON 反序列化后数字类型统一为 Integer，
     * 因此先按 Integer 取出再转 Long，避免 ClassCastException。
     *
     * @param token JWT Token 字符串
     * @return 用户 ID
     */
    public Long getUserIdFromToken(String token) {
        Object userId = parseToken(token).get("userId");
        if (userId == null) {
            return null;
        }
        return Long.valueOf(userId.toString());
    }

    /**
     * 从 Token 中获取用户昵称
     *
     * @param token JWT Token 字符串
     * @return 用户昵称
     */
    public String getNicknameFromToken(String token) {
        return parseToken(token).get("nickname", String.class);
    }

    /**
     * 判断 Token 是否已过期
     *
     * @param token JWT Token 字符串
     * @return true 表示已过期，false 表示未过期
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expirationDate = parseToken(token).getExpiration();
            return expirationDate.before(new Date());
        } catch (ExpiredJwtException e) {
            // 捕获过期异常，直接返回 true
            return true;
        }
    }

    /**
     * 验证 Token 是否有效
     * <p>
     * 验证内容包括：
     * 1. Token 格式是否正确
     * 2. 签名是否有效（未被篡改）
     * 3. Token 是否未过期
     *
     * @param token    JWT Token 字符串
     * @param username 期望的用户名（用于二次验证）
     * @return true 表示 Token 有效
     */
    public boolean validateToken(String token, String username) {
        try {
            // 解析 Token（会自动验证签名和过期时间）
            Claims claims = parseToken(token);
            // 验证 Token 中的用户名与期望的用户名是否一致
            String tokenUsername = claims.getSubject();
            return tokenUsername != null && tokenUsername.equals(username);
        } catch (SecurityException e) {
            log.error("JWT 签名验证失败: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("JWT Token 格式错误: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT Token 已过期: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("不支持的 JWT Token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT Claims 为空: {}", e.getMessage());
        }
        return false;
    }

    /**
     * 验证 Token 是否有效（不校验用户名）
     *
     * @param token JWT Token 字符串
     * @return true 表示 Token 有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.error("JWT Token 已过期: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.error("不支持的 JWT Token: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.error("JWT Token 格式错误: {}", e.getMessage());
            return false;
        } catch (SecurityException e) {
            log.error("JWT 签名验证失败: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.error("JWT Claims 为空: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 获取 Token 的过期时间
     *
     * @param token JWT Token 字符串
     * @return 过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return parseToken(token).getExpiration();
    }
}
