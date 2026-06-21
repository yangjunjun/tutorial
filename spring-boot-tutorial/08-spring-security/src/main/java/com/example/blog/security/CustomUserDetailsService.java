package com.example.blog.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 自定义 UserDetailsService 实现
 * <p>
 * Spring Security 在认证过程中需要通过 UserDetailsService 加载用户信息。
 * 默认实现（InMemoryUserDetailsManager）从内存中查找用户，
 * 而我们的项目需要从数据库中查找，所以需要自定义实现。
 * <p>
 * 工作流程：
 * 1. JWT 过滤器从 Token 中提取用户名
 * 2. 调用 loadUserByUsername(username) 加载用户
 * 3. 查询数据库获取用户信息
 * 4. 包装为 LoginUser（UserDetails 实现）返回
 * 5. Spring Security 后续使用 LoginUser 进行权限判断
 *
 * @author tutorial
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserMapper userMapper;

    /**
     * 构造注入 UserMapper
     *
     * @param userMapper 用户数据访问 Mapper
     */
    public CustomUserDetailsService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 根据用户名加载用户详情
     * <p>
     * 该方法会在以下场景被调用：
     * 1. JWT 过滤器验证 Token 后加载用户信息
     * 2. 表单登录时验证用户名密码
     * <p>
     * 注意事项：
     * - 找不到用户时必须抛出 UsernameNotFoundException，而不是返回 null
     * - 返回的 UserDetails 包含密码，Spring Security 会用它来验证密码
     * - 返回的权限列表（authorities）决定了用户的访问权限
     *
     * @param username 用户名
     * @return UserDetails 用户详情对象
     * @throws UsernameNotFoundException 用户名不存在时抛出
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("加载用户信息: {}", username);

        // ========== 第一步：从数据库查询用户 ==========
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        User user = userMapper.selectOne(queryWrapper);

        // ========== 第二步：检查用户是否存在 ==========
        if (user == null) {
            log.warn("用户不存在: {}", username);
            // 必须抛出 UsernameNotFoundException
            // Spring Security 会将其转换为认证失败
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        // ========== 第三步：包装为 LoginUser 返回 ==========
        // LoginUser 实现了 UserDetails 接口
        // 内部会自动将 role 字段转换为 GrantedAuthority 列表
        LoginUser loginUser = new LoginUser(user);

        log.debug("用户信息加载成功: {}, 角色: {}", username, loginUser.getAuthorities());

        return loginUser;
    }
}
