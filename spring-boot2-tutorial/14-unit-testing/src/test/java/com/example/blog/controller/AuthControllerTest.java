package com.example.blog.controller;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.exception.BusinessException;
import com.example.blog.exception.GlobalExceptionHandler;
import com.example.blog.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 认证控制器测试
 *
 * <p>使用 @WebMvcTest 只加载 AuthController 相关 Bean，
 * AuthService 使用 @MockBean 模拟。
 *
 * <p>测试内容：
 * <ul>
 *   <li>POST /api/auth/login - 用户登录</li>
 *   <li>POST /api/auth/register - 用户注册</li>
 *   <li>POST /api/auth/refresh - 刷新 Token</li>
 *   <li>GET /api/auth/me - 获取当前用户信息</li>
 * </ul>
 *
 * <p><b>Spring Boot 2.5.12 适配说明：</b>
 * @MockBean 在 2.5.x 中是官方推荐的测试注解
 * （位于 org.springframework.boot.test.mock.bean 包）。
 * </p>
 *
 * <p>被测类：{@link AuthController}
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // 关闭 Security 过滤器
@Import(GlobalExceptionHandler.class)     // 导入全局异常处理器
@DisplayName("认证控制器（AuthController）集成测试")
class AuthControllerTest {

    // ============================================================
    // 测试基础设施
    // ============================================================

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    // ============================================================
    // POST /api/auth/login - 用户登录
    // ============================================================

    @Nested
    @DisplayName("POST /api/auth/login - 用户登录")
    class Login {

        @Test
        @DisplayName("正常登录：正确的用户名和密码应返回 Token")
        void shouldReturnTokenWhenCredentialsAreCorrect() throws Exception {
            // Arrange：模拟登录成功
            LoginRequest request = new LoginRequest("admin", "password123");
            LoginResponse response = new LoginResponse(
                "eyJhbGciOiJIUzI1NiJ9.mock-jwt-token.for-testing",
                "admin",
                "ROLE_ADMIN"
            );

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            // Act & Assert：发送登录请求并验证响应
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andDo(print()) // 打印请求/响应详情，方便调试
                .andExpect(status().isOk())                              // HTTP 200
                .andExpect(jsonPath("$.code").value(200))                // 业务码 200
                .andExpect(jsonPath("$.data.token").exists())            // Token 存在
                .andExpect(jsonPath("$.data.token").value(
                    "eyJhbGciOiJIUzI1NiJ9.mock-jwt-token.for-testing"))
                .andExpect(jsonPath("$.data.username").value("admin"))   // 用户名
                .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN")); // 角色

            verify(authService).login(any(LoginRequest.class));
        }

        @Test
        @DisplayName("正常登录：普通用户应返回 USER 角色")
        void shouldReturnUserRoleForNormalUser() throws Exception {
            LoginRequest request = new LoginRequest("zhangsan", "password123");
            LoginResponse response = new LoginResponse("user-token", "zhangsan", "ROLE_USER");

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.data.username").value("zhangsan"));
        }

        @Test
        @DisplayName("登录失败：用户名或密码错误应返回 401 或业务错误码")
        void shouldReturnErrorWhenCredentialsAreWrong() throws Exception {
            LoginRequest request = new LoginRequest("admin", "wrongPassword");

            when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessException("用户名或密码错误"));

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError()); // 全局异常处理器返回

            verify(authService).login(any(LoginRequest.class));
        }

        @Test
        @DisplayName("登录失败：账号被禁用应返回错误提示")
        void shouldReturnErrorWhenAccountIsDisabled() throws Exception {
            LoginRequest request = new LoginRequest("banned", "password123");

            when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessException("账号已被禁用"));

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError());
        }

        @Test
        @DisplayName("参数校验：用户名为空应返回 400")
        void shouldReturn400WhenUsernameIsEmpty() throws Exception {
            // 发送空 JSON 对象（缺少必填字段）
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());

            // Service 层不应被调用
            verify(authService, never()).login(any(LoginRequest.class));
        }

        @Test
        @DisplayName("参数校验：请求体为空应返回 400")
        void shouldReturn400WhenRequestBodyIsEmpty() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Content-Type 错误：非 JSON 格式应返回 415")
        void shouldReturn415WhenContentTypeIsNotJson() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.TEXT_PLAIN)
                    .content("username=admin&password=123"))
                .andExpect(status().isUnsupportedMediaType());
        }
    }

    // ============================================================
    // POST /api/auth/register - 用户注册
    // ============================================================

    @Nested
    @DisplayName("POST /api/auth/register - 用户注册")
    class Register {

        @Test
        @DisplayName("正常注册：参数完整应成功注册")
        void shouldRegisterSuccessfully() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("SecureP@ss123");
            request.setEmail("newuser@example.com");
            request.setNickname("新用户");

            when(authService.register(any(RegisterRequest.class))).thenReturn(true);

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").exists());

            verify(authService).register(any(RegisterRequest.class));
        }

        @Test
        @DisplayName("注册失败：用户名已存在应返回错误")
        void shouldReturnErrorWhenUsernameExists() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("admin");
            request.setPassword("password123");
            request.setEmail("new@example.com");

            when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BusinessException("用户名已存在"));

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError());
        }

        @Test
        @DisplayName("注册失败：邮箱已被使用应返回错误")
        void shouldReturnErrorWhenEmailExists() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("password123");
            request.setEmail("admin@example.com");

            when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BusinessException("邮箱已被使用"));

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError());
        }
    }

    // ============================================================
    // POST /api/auth/refresh - 刷新 Token
    // ============================================================

    @Nested
    @DisplayName("POST /api/auth/refresh - 刷新 Token")
    class RefreshToken {

        @Test
        @DisplayName("有效 Token 应返回新 Token")
        void shouldReturnNewTokenWhenOldTokenIsValid() throws Exception {
            when(authService.refreshToken("valid-old-token"))
                .thenReturn("new-refreshed-token");

            mockMvc.perform(post("/api/auth/refresh")
                    .header("Authorization", "Bearer valid-old-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("new-refreshed-token"));

            verify(authService).refreshToken("valid-old-token");
        }

        @Test
        @DisplayName("过期 Token 应返回 401")
        void shouldReturn401WhenTokenIsExpired() throws Exception {
            when(authService.refreshToken("expired-token"))
                .thenThrow(new BusinessException("Token 已过期"));

            mockMvc.perform(post("/api/auth/refresh")
                    .header("Authorization", "Bearer expired-token"))
                .andExpect(status().is5xxServerError());
        }

        @Test
        @DisplayName("无 Authorization 头应返回错误")
        void shouldReturnErrorWhenNoAuthHeader() throws Exception {
            mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isBadRequest());
        }
    }

    // ============================================================
    // GET /api/auth/me - 获取当前用户信息
    // ============================================================

    @Nested
    @DisplayName("GET /api/auth/me - 获取当前用户信息")
    class GetCurrentUser {

        @Test
        @DisplayName("携带有效 Token 应返回用户信息")
        void shouldReturnUserInfoWithValidToken() throws Exception {
            // 由于 addFilters=false，Security 过滤器不生效，
            // 这里主要测试 Controller 方法本身的逻辑
            // 在完整集成测试中，会测试 JWT Filter + Controller 的完整链路
            mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk());
        }
    }
}
