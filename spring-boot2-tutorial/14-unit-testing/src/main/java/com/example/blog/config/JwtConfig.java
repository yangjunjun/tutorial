package com.example.blog.config;

import com.example.blog.util.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 配置（第 14 章测试工程最小骨架）
 * <p>完整实现见第 07 章。</p>
 */
@Configuration
public class JwtConfig {

    @Bean
    public JwtUtil jwtUtil(@Value("${jwt.secret:default-secret-key-for-blog-system}") String secret,
                           @Value("${jwt.expiration:3600000}") long expiration) {
        return new JwtUtil(secret, expiration);
    }
}
