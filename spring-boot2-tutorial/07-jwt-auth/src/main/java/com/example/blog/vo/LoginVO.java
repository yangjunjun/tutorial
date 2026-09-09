package com.example.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应 VO（View Object）
 * <p>
 * 登录成功后返回给前端的数据对象。
 * 包含 JWT Token 和用户基本信息，前端可以用来：
 * 1. 存储 Token，后续请求携带认证信息
 * 2. 展示用户昵称等基本信息
 * <p>
 * 响应 JSON 示例：
 * <pre>
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "username": "admin",
 *   "nickname": "管理员",
 *   "userId": 1
 * }
 * </pre>
 *
 * @author tutorial
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginVO {

    /**
     * JWT Access Token
     * <p>
     * 用于后续 API 请求的认证，放在 Authorization 请求头中：
     * Authorization: Bearer {token}
     */
    private String token;

    /**
     * Refresh Token
     * <p>
     * 当 Access Token 过期时，前端使用此 Token 调用刷新接口获取新的 Access Token，
     * 无需用户重新输入用户名和密码。
     */
    private String refreshToken;

    /**
     * 用户名（登录账号）
     */
    private String username;

    /**
     * 用户昵称（用于前端展示）
     */
    private String nickname;

    /**
     * 用户 ID
     */
    private Long userId;
}
