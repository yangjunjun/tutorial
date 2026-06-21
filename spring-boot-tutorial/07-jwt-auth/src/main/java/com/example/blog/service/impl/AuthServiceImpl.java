package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.dto.UserLoginDTO;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import com.example.blog.service.AuthService;
import com.example.blog.util.JwtUtil;
import com.example.blog.vo.LoginVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现类
 * <p>
 * 实现用户登录和 Token 刷新的核心业务逻辑。
 * <p>
 * 依赖说明：
 * - {@link UserMapper}：MyBatis-Plus Mapper，用于查询用户数据（前几章已创建）
 * - {@link JwtUtil}：JWT 工具类（本章新增）
 * - {@link PasswordEncoder}：密码编码器，使用 BCrypt 算法（下一章详细配置）
 *
 * @author tutorial
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    /**
     * 构造注入
     * <p>
     * 推荐使用构造注入而非 @Autowired 字段注入，原因：
     * 1. 依赖不可变（final），更安全
     * 2. 方便单元测试时传入 Mock 对象
     * 3. 避免循环依赖（启动时就会报错）
     */
    public AuthServiceImpl(UserMapper userMapper,
                           JwtUtil jwtUtil,
                           PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 用户登录实现
     * <p>
     * 核心流程：
     * 1. 根据用户名查询数据库中的用户记录
     * 2. 检查用户是否存在
     * 3. 使用 BCrypt 验证密码是否匹配
     * 4. 检查用户状态（是否被禁用）
     * 5. 生成 Access Token 和 Refresh Token
     * 6. 返回登录结果
     *
     * @param loginDTO 登录请求参数
     * @return 登录响应（包含 Token 和用户信息）
     * @throws RuntimeException 用户名或密码错误、用户被禁用时抛出
     */
    @Override
    public LoginVO login(UserLoginDTO loginDTO) {
        String username = loginDTO.getUsername();
        String password = loginDTO.getPassword();

        log.info("用户登录尝试: {}", username);

        // ========== 第一步：根据用户名查询用户 ==========
        // 使用 MyBatis-Plus 的 LambdaQueryWrapper 构造查询条件
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        User user = userMapper.selectOne(queryWrapper);

        // ========== 第二步：验证用户是否存在 ==========
        if (user == null) {
            log.warn("登录失败，用户不存在: {}", username);
            // 注意：安全最佳实践是不区分"用户不存在"和"密码错误"
            // 统一返回"用户名或密码错误"，防止用户名枚举攻击
            throw new RuntimeException("用户名或密码错误");
        }

        // ========== 第三步：验证密码 ==========
        // BCrypt 的 matches 方法会自动从数据库存储的密码哈希中提取 salt 进行比对
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("登录失败，密码错误: {}", username);
            throw new RuntimeException("用户名或密码错误");
        }

        // ========== 第四步：检查用户状态 ==========
        // status = 0 表示正常，1 表示禁用
        if (user.getStatus() != null && user.getStatus() == 1) {
            log.warn("登录失败，用户已被禁用: {}", username);
            throw new RuntimeException("用户已被禁用，请联系管理员");
        }

        // ========== 第五步：生成 Token ==========
        // Access Token：短期有效，用于 API 请求认证
        String accessToken = jwtUtil.generateToken(
                user.getUsername(),
                user.getId(),
                user.getNickname()
        );

        // Refresh Token：长期有效，用于刷新 Access Token
        String refreshToken = jwtUtil.generateRefreshToken(
                user.getUsername(),
                user.getId()
        );

        log.info("用户登录成功: {}", username);

        // ========== 第六步：构造并返回登录结果 ==========
        return LoginVO.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .userId(user.getId())
                .build();
    }

    /**
     * 刷新 Token 实现
     * <p>
     * 当 Access Token 过期后，前端无需让用户重新登录，
     * 而是使用 Refresh Token 调用此接口获取新的 Token 对。
     * <p>
     * 安全考虑：
     * - 刷新时同时发放新的 Refresh Token（Token 轮换）
     * - 如果 Refresh Token 也被盗用，可以通过 Token 黑名单机制应对
     * - 生产环境建议在 Redis 中记录 Token 状态
     *
     * @param refreshToken Refresh Token 字符串
     * @return 新的登录响应（包含新 Token 和用户信息）
     * @throws RuntimeException Refresh Token 无效时抛出
     */
    @Override
    public LoginVO refreshToken(String refreshToken) {
        // ========== 第一步：验证 Refresh Token ==========
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh Token 无效或已过期，请重新登录");
        }

        // ========== 第二步：从 Token 中提取用户信息 ==========
        String username = jwtUtil.getUsernameFromToken(refreshToken);
        Long userId = jwtUtil.getUserIdFromToken(refreshToken);

        // ========== 第三步：查询用户最新信息 ==========
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 再次检查用户状态
        if (user.getStatus() != null && user.getStatus() == 1) {
            throw new RuntimeException("用户已被禁用");
        }

        // ========== 第四步：生成新的 Token 对 ==========
        String newAccessToken = jwtUtil.generateToken(
                user.getUsername(),
                user.getId(),
                user.getNickname()
        );

        String newRefreshToken = jwtUtil.generateRefreshToken(
                user.getUsername(),
                user.getId()
        );

        log.info("Token 刷新成功，用户: {}", username);

        // ========== 第五步：返回新的 Token 信息 ==========
        return LoginVO.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .userId(user.getId())
                .build();
    }
}
