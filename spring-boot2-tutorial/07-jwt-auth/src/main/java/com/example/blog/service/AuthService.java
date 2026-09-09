package com.example.blog.service;

import com.example.blog.dto.UserLoginDTO;
import com.example.blog.vo.LoginVO;

/**
 * 认证服务接口
 * <p>
 * 定义用户认证相关的业务方法，包括：
 * - 用户登录
 * - Token 刷新
 * - 用户注册（后续章节扩展）
 *
 * @author tutorial
 */
public interface AuthService {

    /**
     * 用户登录
     * <p>
     * 验证用户名和密码，成功后生成 JWT Token 并返回。
     * <p>
     * 流程：
     * 1. 根据用户名查询用户信息
     * 2. 使用 BCrypt 比对密码
     * 3. 生成 Access Token 和 Refresh Token
     * 4. 返回 Token 和用户基本信息
     *
     * @param loginDTO 登录请求参数（用户名、密码）
     * @return LoginVO 包含 Token 和用户信息
     */
    LoginVO login(UserLoginDTO loginDTO);

    /**
     * 刷新 Token
     * <p>
     * 当 Access Token 过期时，前端使用 Refresh Token 调用此接口获取新的 Token。
     * <p>
     * 流程：
     * 1. 验证 Refresh Token 是否有效
     * 2. 从 Refresh Token 中提取用户信息
     * 3. 生成新的 Access Token 和 Refresh Token
     * 4. 返回新的 Token 信息
     *
     * @param refreshToken Refresh Token 字符串
     * @return LoginVO 包含新的 Token 和用户信息
     */
    LoginVO refreshToken(String refreshToken);
}
