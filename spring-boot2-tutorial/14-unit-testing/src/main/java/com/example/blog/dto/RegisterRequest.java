package com.example.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 注册请求 DTO（第 14 章测试工程最小骨架）
 */
@Data
public class RegisterRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private String username;

    private String password;

    private String email;

    private String nickname;
}
