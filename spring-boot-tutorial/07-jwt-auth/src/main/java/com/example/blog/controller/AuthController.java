package com.example.blog.controller;

import com.example.blog.dto.UserLoginDTO;
import com.example.blog.service.AuthService;
import com.example.blog.vo.LoginVO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证 Controller
 * <p>
 * 处理用户登录、Token 刷新等认证相关请求。
 * <p>
 * 接口列表：
 * - POST /api/auth/login      — 用户登录，返回 JWT Token
 * - POST /api/auth/refresh     — 刷新 Token
 * <p>
 * 这些接口都是公开的（不需要认证），需要在 Security 配置中放行。
 *
 * @author tutorial
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 用户登录接口
     * <p>
     * 接收用户名和密码，验证通过后返回 JWT Token 和用户基本信息。
     * <p>
     * 请求方式：POST
     * 请求路径：/api/auth/login
     * Content-Type：application/json
     * <p>
     * 请求示例：
     * <pre>
     * curl -X POST http://localhost:8080/api/auth/login \
     *   -H "Content-Type: application/json" \
     *   -d '{"username": "admin", "password": "123456"}'
     * </pre>
     * <p>
     * 成功响应示例：
     * <pre>
     * {
     *   "code": 200,
     *   "message": "登录成功",
     *   "data": {
     *     "token": "eyJhbGciOiJIUzI1NiIs...",
     *     "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
     *     "username": "admin",
     *     "nickname": "管理员",
     *     "userId": 1
     *   }
     * }
     * </pre>
     *
     * @param loginDTO 登录请求参数，使用 @Valid 触发参数校验
     * @return 统一响应格式
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody UserLoginDTO loginDTO) {
        log.info("收到登录请求，用户名: {}", loginDTO.getUsername());

        try {
            // 调用认证服务进行登录验证
            LoginVO loginVO = authService.login(loginDTO);

            // 构造成功响应
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "登录成功");
            response.put("data", loginVO);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("登录失败: {}", e.getMessage());

            // 构造失败响应
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("message", e.getMessage());
            response.put("data", null);

            // 返回 401 Unauthorized 状态码
            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * 刷新 Token 接口
     * <p>
     * 当 Access Token 过期时，前端使用 Refresh Token 调用此接口获取新的 Token。
     * <p>
     * 请求方式：POST
     * 请求路径：/api/auth/refresh
     * Content-Type：application/json
     * <p>
     * 请求示例：
     * <pre>
     * curl -X POST http://localhost:8080/api/auth/refresh \
     *   -H "Content-Type: application/json" \
     *   -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIs..."}'
     * </pre>
     *
     * @param params 请求参数，包含 refreshToken 字段
     * @return 统一响应格式
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            @RequestBody Map<String, String> params) {

        String refreshToken = params.get("refreshToken");

        if (refreshToken == null || refreshToken.isBlank()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("message", "Refresh Token 不能为空");
            response.put("data", null);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 调用认证服务刷新 Token
            LoginVO loginVO = authService.refreshToken(refreshToken);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "Token 刷新成功");
            response.put("data", loginVO);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Token 刷新失败: {}", e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * 获取当前登录用户信息接口（测试用）
     * <p>
     * 需要携带有效的 JWT Token 才能访问。
     * 用于验证 JWT 认证是否正常工作。
     * <p>
     * 请求方式：GET
     * 请求路径：/api/auth/me
     * <p>
     * 请求示例：
     * <pre>
     * curl -X GET http://localhost:8080/api/auth/me \
     *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
     * </pre>
     *
     * @return 当前登录用户的基本信息
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        // 通过 SecurityContextHolder 获取当前登录用户
        // 这个对象是在 JwtAuthenticationFilter 中设置的
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", authentication.getName());
            userInfo.put("authorities", authentication.getAuthorities());

            // 如果 principal 是自定义的 LoginUser 对象，可以获取更多信息
            Object principal = authentication.getPrincipal();
            if (principal instanceof com.example.blog.security.LoginUser loginUser) {
                userInfo.put("nickname", loginUser.getNickname());
                userInfo.put("userId", loginUser.getUserId());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", userInfo);

            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("code", 401);
        response.put("message", "未登录");
        response.put("data", null);

        return ResponseEntity.status(401).body(response);
    }
}
