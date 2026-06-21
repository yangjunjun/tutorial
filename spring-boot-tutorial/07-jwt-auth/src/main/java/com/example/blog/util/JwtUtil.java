package com.example.blog.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类
 * <p>
 * 提供 JWT Token 的生成、解析、验证等核心功能。
 * <p>
 * 使用 jjwt 0.12.x 版本 API，主要变化：
 * 1. 使用 {@link Keys#hmacShaKeyFor(byte[])} 生成 SecretKey
 * 2. 使用 {@link Jwts#builder()} 的 .signWith(SecretKey) 方法签名
 * 3. 使用 {@link Jwts#parser()} 的 .verifyWith(SecretKey).build() 方法解析
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
     * 注意：使用 HS256 算法时，密钥长度至少需要 256 位（32 字节）。
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
     * 获取签名密钥对象
     * <p>
     * 使用 HMAC-SHA 算法，将字符串密钥转换为 SecretKey 对象。
     * jjwt 0.12.x 要求使用 SecretKey 而非字符串进行签名和验证。
     *
     * @return SecretKey 签名密钥
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

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
                .claims(claims)
                // 设置 Token 主题（Subject），这里使用用户名
                .subject(username)
                // 设置签发时间（Issued At）
                .issuedAt(new Date())
                // 设置过期时间（Expiration）= 当前时间 + 配置的有效期
                .expiration(new Date(System.currentTimeMillis() + expiration))
                // 使用 HMAC-SHA256 算法签名
                .signWith(getSigningKey())
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
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * 解析 JWT Token，获取 Claims（声明）
     * <p>
     * jjwt 0.12.x 的解析 API 变化：
     * - 旧版：Jwts.parser().setSigningKey(key).parseClaimsJws(token)
     * - 新版：Jwts.parser().verifyWith(key).build().parseSignedClaims(token)
     *
     * @param token JWT Token 字符串
     * @return Claims 对象，包含 Token 中所有声明
     * @throws ExpiredJwtException   Token 已过期
     * @throws MalformedJwtException Token 格式不正确
     * @throws SecurityException      Token 签名验证失败
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                // 设置验证密钥
                .verifyWith(getSigningKey())
                .build()
                // 解析并验证签名的 Token
                .parseSignedClaims(token)
                // 获取 Claims（声明/载荷）
                .getPayload();
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
     *
     * @param token JWT Token 字符串
     * @return 用户 ID
     */
    public Long getUserIdFromToken(String token) {
        return parseToken(token).get("userId", Long.class);
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
        } catch (SecurityException | MalformedJwtException | ExpiredJwtException
                 | UnsupportedJwtException | IllegalArgumentException e) {
            log.error("JWT Token 验证失败: {}", e.getMessage());
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
