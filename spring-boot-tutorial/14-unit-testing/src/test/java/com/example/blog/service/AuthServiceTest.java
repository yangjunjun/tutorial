package com.example.blog.service;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.entity.User;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.UserMapper;
import com.example.blog.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AuthService 认证服务单元测试
 *
 * <p>测试范围：
 * <ul>
 *   <li>用户登录：正确凭据、错误用户名、错误密码、账号被禁用</li>
 *   <li>用户注册：正常注册、用户名重复、邮箱重复</li>
 *   <li>Token 相关：Token 刷新、Token 验证</li>
 * </ul>
 *
 * <p>被测类：{@link AuthServiceImpl}
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("认证服务（AuthService）单元测试")
class AuthServiceTest {

    // ============================================================
    // Mock 依赖对象
    // ============================================================

    /** Mock 的用户 Mapper */
    @Mock
    private UserMapper userMapper;

    /** Mock 的密码编码器 */
    @Mock
    private PasswordEncoder passwordEncoder;

    /** Mock 的 JWT 工具类 */
    @Mock
    private JwtUtil jwtUtil;

    /** 被测对象：认证服务实现类 */
    @InjectMocks
    private AuthServiceImpl authService;

    // ============================================================
    // 测试数据
    // ============================================================

    /** 测试用的管理员用户 */
    private User adminUser;

    /** 测试用的普通用户 */
    private User normalUser;

    /** 测试用的被禁用用户 */
    private User disabledUser;

    /**
     * 每个测试方法执行前初始化测试数据
     */
    @BeforeEach
    void setUp() {
        // 管理员用户
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setPassword("$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBR.XSByqy7aR3iqVqV1O1h0sKy");
        adminUser.setEmail("admin@example.com");
        adminUser.setNickname("管理员");
        adminUser.setAvatar("/avatars/admin.png");
        adminUser.setRole("ROLE_ADMIN");
        adminUser.setStatus(1); // 1 = 正常

        // 普通用户
        normalUser = new User();
        normalUser.setId(2L);
        normalUser.setUsername("zhangsan");
        normalUser.setPassword("$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBR.XSByqy7aR3iqVqV1O1h0sKy");
        normalUser.setEmail("zhangsan@example.com");
        normalUser.setNickname("张三");
        normalUser.setRole("ROLE_USER");
        normalUser.setStatus(1);

        // 被禁用的用户
        disabledUser = new User();
        disabledUser.setId(3L);
        disabledUser.setUsername("banned");
        disabledUser.setPassword("$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBR.XSByqy7aR3iqVqV1O1h0sKy");
        disabledUser.setEmail("banned@example.com");
        disabledUser.setRole("ROLE_USER");
        disabledUser.setStatus(0); // 0 = 禁用
    }

    // ============================================================
    // 登录相关测试
    // ============================================================

    @Nested
    @DisplayName("用户登录 - login")
    class Login {

        @Test
        @DisplayName("正常登录：正确的用户名和密码应返回 Token 和用户信息")
        void shouldReturnTokenWhenCredentialsAreCorrect() {
            // Arrange：模拟正确的登录流程
            LoginRequest request = new LoginRequest("admin", "password123");

            // 1. 根据用户名查询到用户
            when(userMapper.selectByUsername("admin")).thenReturn(adminUser);
            // 2. 密码校验通过
            when(passwordEncoder.matches("password123", adminUser.getPassword()))
                .thenReturn(true);
            // 3. 生成 JWT Token
            when(jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN"))
                .thenReturn("eyJhbGciOiJIUzI1NiJ9.mock-jwt-token");

            // Act：执行登录
            LoginResponse response = authService.login(request);

            // Assert：验证返回结果
            assertNotNull(response, "登录响应不应为 null");
            assertEquals("eyJhbGciOiJIUzI1NiJ9.mock-jwt-token", response.getToken(),
                "Token 应与 Mock 返回的一致");
            assertEquals("admin", response.getUsername(), "用户名应匹配");
            assertEquals("ROLE_ADMIN", response.getRole(), "角色应匹配");

            // 验证各依赖方法被正确调用
            verify(userMapper).selectByUsername("admin");
            verify(passwordEncoder).matches("password123", adminUser.getPassword());
            verify(jwtUtil).generateToken(1L, "admin", "ROLE_ADMIN");
        }

        @Test
        @DisplayName("正常登录：普通用户登录应返回正确的角色信息")
        void shouldReturnCorrectRoleForNormalUser() {
            LoginRequest request = new LoginRequest("zhangsan", "password123");

            when(userMapper.selectByUsername("zhangsan")).thenReturn(normalUser);
            when(passwordEncoder.matches("password123", normalUser.getPassword()))
                .thenReturn(true);
            when(jwtUtil.generateToken(2L, "zhangsan", "ROLE_USER"))
                .thenReturn("user-jwt-token");

            LoginResponse response = authService.login(request);

            assertNotNull(response);
            assertEquals("user-jwt-token", response.getToken());
            assertEquals("zhangsan", response.getUsername());
            assertEquals("ROLE_USER", response.getRole());
        }

        @Test
        @DisplayName("登录失败：用户名不存在应抛出 BusinessException")
        void shouldThrowWhenUsernameNotFound() {
            // Arrange
            LoginRequest request = new LoginRequest("unknown_user", "password");
            when(userMapper.selectByUsername("unknown_user")).thenReturn(null);

            // Act & Assert
            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request),
                "用户名不存在时应抛出 BusinessException"
            );

            // 验证错误信息（不应暴露"用户不存在"的细节，统一提示凭据错误）
            assertEquals("用户名或密码错误", exception.getMessage(),
                "错误信息应统一为'用户名或密码错误'，防止用户名枚举攻击");

            // 密码校验和 Token 生成不应被调用
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("登录失败：密码错误应抛出 BusinessException")
        void shouldThrowWhenPasswordIsWrong() {
            // Arrange
            LoginRequest request = new LoginRequest("admin", "wrongPassword");
            when(userMapper.selectByUsername("admin")).thenReturn(adminUser);
            when(passwordEncoder.matches("wrongPassword", adminUser.getPassword()))
                .thenReturn(false);

            // Act & Assert
            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request),
                "密码错误时应抛出 BusinessException"
            );

            assertEquals("用户名或密码错误", exception.getMessage());

            // Token 不应被生成
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("登录失败：账号被禁用应抛出 BusinessException")
        void shouldThrowWhenAccountIsDisabled() {
            // Arrange
            LoginRequest request = new LoginRequest("banned", "password123");
            when(userMapper.selectByUsername("banned")).thenReturn(disabledUser);
            when(passwordEncoder.matches("password123", disabledUser.getPassword()))
                .thenReturn(true);

            // Act & Assert
            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request),
                "账号被禁用时应抛出 BusinessException"
            );

            assertTrue(
                exception.getMessage().contains("禁用") || exception.getMessage().contains("封禁"),
                "异常信息应提示账号被禁用"
            );

            // Token 不应被生成
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("边界场景：用户名为空字符串时应正常处理")
        void shouldHandleEmptyUsername() {
            LoginRequest request = new LoginRequest("", "password");
            when(userMapper.selectByUsername("")).thenReturn(null);

            assertThrows(BusinessException.class, () -> authService.login(request));
        }
    }

    // ============================================================
    // 注册相关测试
    // ============================================================

    @Nested
    @DisplayName("用户注册 - register")
    class Register {

        @Test
        @DisplayName("正常注册：新用户应成功注册并保存加密密码")
        void shouldRegisterSuccessfully() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("SecureP@ss123");
            request.setEmail("newuser@example.com");
            request.setNickname("新用户");

            // 用户名和邮箱均未被占用
            when(userMapper.selectByUsername("newuser")).thenReturn(null);
            when(userMapper.selectByEmail("newuser@example.com")).thenReturn(null);
            when(passwordEncoder.encode("SecureP@ss123"))
                .thenReturn("$2a$10$encryptedPassword");
            when(userMapper.insert(any(User.class))).thenReturn(1);

            // Act
            boolean result = authService.register(request);

            // Assert
            assertTrue(result, "注册应成功");

            // 使用 ArgumentCaptor 捕获实际保存的用户对象
            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userMapper).insert(captor.capture());

            User savedUser = captor.getValue();
            assertEquals("newuser", savedUser.getUsername());
            assertEquals("$2a$10$encryptedPassword", savedUser.getPassword(),
                "密码应被加密后保存");
            assertEquals("newuser@example.com", savedUser.getEmail());
            assertEquals("新用户", savedUser.getNickname());
            assertEquals("ROLE_USER", savedUser.getRole(), "新用户默认角色应为 ROLE_USER");
        }

        @Test
        @DisplayName("注册失败：用户名已存在应抛出 BusinessException")
        void shouldThrowWhenUsernameAlreadyExists() {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("admin"); // 已存在的用户名
            request.setPassword("password");
            request.setEmail("new@example.com");

            when(userMapper.selectByUsername("admin")).thenReturn(adminUser);

            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.register(request),
                "用户名已存在时应抛出异常"
            );

            assertTrue(exception.getMessage().contains("用户名"),
                "异常信息应提示用户名已被占用");

            // 不应执行插入操作
            verify(userMapper, never()).insert(any(User.class));
        }

        @Test
        @DisplayName("注册失败：邮箱已被使用应抛出 BusinessException")
        void shouldThrowWhenEmailAlreadyExists() {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("password");
            request.setEmail("admin@example.com"); // 已存在的邮箱

            when(userMapper.selectByUsername("newuser")).thenReturn(null);
            when(userMapper.selectByEmail("admin@example.com")).thenReturn(adminUser);

            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.register(request),
                "邮箱已存在时应抛出异常"
            );

            assertTrue(exception.getMessage().contains("邮箱"),
                "异常信息应提示邮箱已被使用");

            verify(userMapper, never()).insert(any(User.class));
        }

        @Test
        @DisplayName("注册时密码应被加密，明文密码不应出现在数据库中")
        void shouldEncryptPasswordBeforeSaving() {
            RegisterRequest request = new RegisterRequest();
            request.setUsername("secureuser");
            request.setPassword("MyPlainTextPassword");
            request.setEmail("secure@example.com");

            when(userMapper.selectByUsername("secureuser")).thenReturn(null);
            when(userMapper.selectByEmail("secure@example.com")).thenReturn(null);
            when(passwordEncoder.encode("MyPlainTextPassword"))
                .thenReturn("$2a$10$BCryptHashedValue");
            when(userMapper.insert(any(User.class))).thenReturn(1);

            authService.register(request);

            // 验证密码编码器被调用
            verify(passwordEncoder).encode("MyPlainTextPassword");

            // 捕获保存的用户，确认密码不是明文
            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userMapper).insert(captor.capture());
            assertNotEquals("MyPlainTextPassword", captor.getValue().getPassword(),
                "保存的密码不应是明文");
            assertEquals("$2a$10$BCryptHashedValue", captor.getValue().getPassword(),
                "保存的密码应是加密后的值");
        }
    }

    // ============================================================
    // Token 相关测试
    // ============================================================

    @Nested
    @DisplayName("Token 操作")
    class TokenOperations {

        @Test
        @DisplayName("刷新 Token：有效 Token 对应的用户应获得新 Token")
        void shouldRefreshTokenForValidUser() {
            // Arrange：模拟从旧 Token 中解析出用户 ID
            when(jwtUtil.getUserIdFromToken("old-valid-token")).thenReturn(1L);
            when(userMapper.selectById(1L)).thenReturn(adminUser);
            when(jwtUtil.generateToken(1L, "admin", "ROLE_ADMIN"))
                .thenReturn("new-refreshed-token");

            // Act
            String newToken = authService.refreshToken("old-valid-token");

            // Assert
            assertNotNull(newToken);
            assertEquals("new-refreshed-token", newToken);
        }

        @Test
        @DisplayName("刷新 Token：Token 对应的用户不存在应抛出异常")
        void shouldThrowWhenUserNotFoundForToken() {
            when(jwtUtil.getUserIdFromToken("token-for-deleted-user")).thenReturn(999L);
            when(userMapper.selectById(999L)).thenReturn(null);

            assertThrows(
                BusinessException.class,
                () -> authService.refreshToken("token-for-deleted-user")
            );
        }
    }

    // ============================================================
    // 辅助方法验证测试
    // ============================================================

    @Nested
    @DisplayName("辅助方法")
    class HelperMethods {

        @Test
        @DisplayName("getCurrentUser - 根据用户 ID 查询当前用户信息")
        void shouldReturnCurrentUser() {
            when(userMapper.selectById(1L)).thenReturn(adminUser);

            User currentUser = authService.getUserById(1L);

            assertNotNull(currentUser);
            assertEquals("admin", currentUser.getUsername());
            assertEquals("ROLE_ADMIN", currentUser.getRole());
        }

        @Test
        @DisplayName("getCurrentUser - 用户不存在时返回 null")
        void shouldReturnNullWhenUserNotFound() {
            when(userMapper.selectById(999L)).thenReturn(null);

            User result = authService.getUserById(999L);

            assertNull(result);
        }
    }
}
