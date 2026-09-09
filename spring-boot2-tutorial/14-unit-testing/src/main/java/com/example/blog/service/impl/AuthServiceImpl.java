package com.example.blog.service.impl;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.entity.User;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.UserMapper;
import com.example.blog.service.AuthService;
import com.example.blog.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 认证 Service 实现（第 14 章测试工程最小骨架）
 * <p>仅包含被测试类引用的方法签名，完整业务实现见第 07 章。</p>
 */
@org.springframework.stereotype.Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserMapper userMapper,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() == 0) {
            throw new BusinessException("账号已被禁用");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        return new LoginResponse(token, user.getUsername(), user.getRole());
    }

    @Override
    public boolean register(RegisterRequest request) {
        User existByUsername = userMapper.selectByUsername(request.getUsername());
        if (existByUsername != null) {
            throw new BusinessException("用户名已存在");
        }
        User existByEmail = userMapper.selectByEmail(request.getEmail());
        if (existByEmail != null) {
            throw new BusinessException("邮箱已被使用");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());
        user.setRole("ROLE_USER");
        user.setStatus(1);
        return userMapper.insert(user) > 0;
    }

    @Override
    public String refreshToken(String refreshToken) {
        Long userId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    @Override
    public User getUserById(Long userId) {
        return userMapper.selectById(userId);
    }
}
