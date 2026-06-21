package com.example.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户登录请求 DTO（Data Transfer Object）
 *
 * 当前端调用 POST /api/auth/login 接口时，
 * 请求体中的 JSON 数据会被 Spring MVC 反序列化为这个对象。
 *
 * 为什么不直接用 User 实体接收登录请求？
 * 1. 登录只需要 username 和 password，不需要 User 的其他字段（如 email、role 等）
 * 2. 后续可以在 DTO 上添加参数校验注解（如 @NotBlank、@Size）
 * 3. DTO 与 Entity 解耦，前端接口格式变化不会影响数据库模型
 * 4. 安全性：避免恶意用户通过构造 JSON 注入 User 的其他字段
 *
 * 前端请求示例：
 * <pre>
 * POST /api/auth/login
 * Content-Type: application/json
 *
 * {
 *     "username": "admin",
 *     "password": "123456"
 * }
 * </pre>
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginDTO {

    /**
     * 用户名
     * 后续可添加校验注解：
     * - @NotBlank(message = "用户名不能为空")
     * - @Size(min = 4, max = 50, message = "用户名长度为 4-50 个字符")
     */
    private String username;

    /**
     * 密码（明文）
     * 后端收到明文后，使用 BCrypt 与数据库中存储的哈希值进行比对
     * 后续可添加校验注解：
     * - @NotBlank(message = "密码不能为空")
     * - @Size(min = 6, max = 20, message = "密码长度为 6-20 个字符")
     */
    private String password;
}
