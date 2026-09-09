package com.example.blog.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户实体类 —— 对应数据库 user 表
 *
 * 包含用户的基本信息，如用户名、密码、昵称、邮箱、头像等。
 * 本章先定义纯 POJO 实体类，第 03 章会为其添加 MyBatis-Plus 注解。
 *
 * Lombok 注解说明：
 * - @Data：自动生成 getter、setter、toString、equals、hashCode
 * - @Builder：生成建造者模式，支持链式创建对象
 * - @NoArgsConstructor：生成无参构造器（ORM 框架和 Spring 依赖注入需要）
 * - @AllArgsConstructor：生成包含所有参数的构造器
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * 用户 ID（主键，自增）
     * 对应数据库字段：user.id BIGINT AUTO_INCREMENT
     */
    private Long id;

    /**
     * 用户名（唯一，用于登录）
     * 对应数据库字段：user.username VARCHAR(50) UNIQUE
     * 长度 4-50 个字符，仅允许字母、数字、下划线
     */
    private String username;

    /**
     * 密码（存储 BCrypt 加密后的哈希值）
     * 对应数据库字段：user.password VARCHAR(100)
     * 注意：永远不要存储明文密码！BCrypt 哈希值长度固定为 60 字符
     */
    private String password;

    /**
     * 昵称（显示在页面上的名称）
     * 对应数据库字段：user.nickname VARCHAR(50)
     * 允许中文，长度 2-50 个字符
     */
    private String nickname;

    /**
     * 邮箱地址
     * 对应数据库字段：user.email VARCHAR(100)
     */
    private String email;

    /**
     * 头像 URL
     * 对应数据库字段：user.avatar VARCHAR(255)
     * 存储头像图片的完整 URL 或相对路径
     */
    private String avatar;

    /**
     * 角色
     * 对应数据库字段：user.role VARCHAR(20) DEFAULT 'USER'
     * 取值：
     * - ADMIN：管理员（拥有所有权限）
     * - USER：普通用户（只能管理自己的文章）
     */
    private String role;

    /**
     * 账号状态
     * 对应数据库字段：user.status TINYINT DEFAULT 0
     * 取值：
     * - 0：正常（可以正常登录和使用）
     * - 1：禁用（禁止登录）
     */
    private Integer status;

    /**
     * 创建时间
     * 对应数据库字段：user.create_time DATETIME DEFAULT CURRENT_TIMESTAMP
     * 使用 LocalDateTime 而非 Date，因为它是 Java 8+ 的线程安全时间类
     */
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     * 对应数据库字段：user.update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     * 每次更新记录时自动更新
     */
    private LocalDateTime updateTime;
}
