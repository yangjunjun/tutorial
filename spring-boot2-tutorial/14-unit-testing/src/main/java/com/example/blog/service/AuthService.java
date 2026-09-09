package com.example.blog.service;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.dto.RegisterRequest;

/**
 * 认证 Service 接口（第 14 章测试工程最小骨架）
 */
public interface AuthService {

    LoginResponse login(LoginRequest request);

    boolean register(RegisterRequest request);

    String refreshToken(String refreshToken);

    com.example.blog.entity.User getUserById(Long userId);
}
