package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 用户登录请求 DTO
 * <p>
 * 用于接收前端传递的登录参数。
 * 使用 Jakarta Validation 注解进行参数校验。
 * <p>
 * 前端请求示例（JSON）：
 * <pre>
 * {
 *   "username": "admin",
 *   "password": "123456"
 * }
 * </pre>
 *
 * @author tutorial
 */
@Data
public class UserLoginDTO {

    /**
     * 用户名
     * <p>
     * - @NotBlank：不能为空且去除空格后不能为空
     * - @Size：长度限制 4-20 个字符
     * - message：自定义校验失败提示信息
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 4, max = 20, message = "用户名长度必须在 4-20 个字符之间")
    private String username;

    /**
     * 密码
     * <p>
     * - @NotBlank：不能为空
     * - @Size：长度限制 6-32 个字符
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度必须在 6-32 个字符之间")
    private String password;
}
