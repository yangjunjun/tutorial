package com.example.blog.util;

/**
 * JWT 工具类（第 14 章测试工程最小骨架）
 * <p>完整实现（jjwt 0.9.1）见第 07 章。</p>
 */
public class JwtUtil {

    private final String secret;

    private final long expiration;

    public JwtUtil(String secret, long expiration) {
        this.secret = secret;
        this.expiration = expiration;
    }

    public String getSecret() {
        return secret;
    }

    public long getExpiration() {
        return expiration;
    }

    public String generateToken(Long userId, String username, String role) {
        throw new UnsupportedOperationException("完整实现见第 07 章 JwtUtil");
    }

    public Long getUserIdFromToken(String token) {
        throw new UnsupportedOperationException("完整实现见第 07 章 JwtUtil");
    }

    public String getUsernameFromToken(String token) {
        throw new UnsupportedOperationException("完整实现见第 07 章 JwtUtil");
    }

    public boolean validateToken(String token) {
        throw new UnsupportedOperationException("完整实现见第 07 章 JwtUtil");
    }
}
