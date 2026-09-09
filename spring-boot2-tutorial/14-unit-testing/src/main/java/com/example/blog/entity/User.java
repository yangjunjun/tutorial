package com.example.blog.entity;

import lombok.Data;

/**
 * 用户实体（第 14 章测试工程最小骨架）
 */
@Data
public class User {

    private Long id;

    private String username;

    private String password;

    private String email;

    private String nickname;

    private String avatar;

    private String role;

    private Integer status;
}
