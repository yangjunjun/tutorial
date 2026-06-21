package com.example.blog.security;

import com.example.blog.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 自定义 UserDetails 实现
 * <p>
 * 实现 Spring Security 的 {@link UserDetails} 接口，
 * 将数据库中的 {@link User} 实体包装为 Spring Security 能识别的用户对象。
 * <p>
 * 为什么需要自定义 UserDetails？
 * <p>
 * Spring Security 的认证流程需要一个 UserDetails 对象来获取：
 * 1. 用户名（用于认证）
 * 2. 密码（用于验证）
 * 3. 权限列表（用于授权）
 * 4. 账户状态（是否过期、是否锁定、是否禁用）
 * <p>
 * 默认的 User 类功能有限，我们通过自定义 LoginUser 可以：
 * - 携带额外的业务字段（如 userId、nickname）
 * - 从数据库的 role 字段动态生成权限列表
 * - 根据数据库 status 字段控制账户状态
 *
 * @author tutorial
 */
@Getter
public class LoginUser implements UserDetails {

    /**
     * 用户 ID
     */
    private final Long userId;

    /**
     * 用户名（登录账号）
     */
    private final String username;

    /**
     * 密码（BCrypt 哈希值）
     */
    private final String password;

    /**
     * 用户昵称
     */
    private final String nickname;

    /**
     * 用户邮箱
     */
    private final String email;

    /**
     * 用户头像 URL
     */
    private final String avatar;

    /**
     * 用户角色（如 "admin", "user"）
     */
    private final String role;

    /**
     * 用户状态（0=正常，1=禁用）
     */
    private final Integer status;

    /**
     * 权限列表（Spring Security 使用）
     */
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * 构造函数：从 User 实体构建 LoginUser
     * <p>
     * 在此处完成角色到权限的转换：
     * - 数据库中的 role = "admin" → Spring Security 权限 "ROLE_ADMIN"
     * - 数据库中的 role = "user" → Spring Security 权限 "ROLE_USER"
     * <p>
     * 注意：Spring Security 的角色名称约定以 "ROLE_" 前缀开头，
     * 这样 @PreAuthorize("hasRole('ADMIN')") 注解才能正确匹配。
     *
     * @param user 数据库用户实体
     */
    public LoginUser(User user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.nickname = user.getNickname();
        this.email = user.getEmail();
        this.avatar = user.getAvatar();
        this.role = user.getRole();
        this.status = user.getStatus();

        // 构建权限列表
        this.authorities = buildAuthorities(user.getRole());
    }

    /**
     * 根据角色字符串构建 Spring Security 权限集合
     * <p>
     * 角色可以是逗号分隔的字符串，如 "admin,user"，
     * 每个角色都会转换为对应的 GrantedAuthority。
     *
     * @param role 角色字符串
     * @return 权限集合
     */
    private Collection<? extends GrantedAuthority> buildAuthorities(String role) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (role != null && !role.isBlank()) {
            // 支持多角色，逗号分隔
            String[] roles = role.split(",");
            for (String r : roles) {
                String trimmedRole = r.trim();
                // 确保角色名以 "ROLE_" 开头
                if (!trimmedRole.startsWith("ROLE_")) {
                    trimmedRole = "ROLE_" + trimmedRole.toUpperCase();
                }
                authorities.add(new SimpleGrantedAuthority(trimmedRole));
            }
        }

        // 默认添加 ROLE_USER 角色
        boolean hasUserRole = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER"));
        if (!hasUserRole) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return authorities;
    }

    // ==================== UserDetails 接口方法实现 ====================

    /**
     * 获取权限列表
     * <p>
     * Spring Security 使用此方法进行授权判断。
     * 返回的权限集合会在 Authentication 对象中使用。
     *
     * @return 权限集合
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * 账户是否未过期
     * <p>
     * true = 未过期（可以正常使用）
     * false = 已过期（无法登录）
     *
     * @return 始终返回 true（本项目不做过期控制）
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * 账户是否未锁定
     * <p>
     * true = 未锁定（可以正常使用）
     * false = 已锁定（如密码错误次数过多）
     *
     * @return 始终返回 true（本项目不做锁定控制）
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * 凭证（密码）是否未过期
     * <p>
     * true = 未过期
     * false = 已过期（需要修改密码）
     *
     * @return 始终返回 true
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * 账户是否可用
     * <p>
     * 根据数据库中的 status 字段判断：
     * - status = 0 → 可用（true）
     * - status = 1 → 禁用（false）
     *
     * @return true 表示账户可用
     */
    @Override
    public boolean isEnabled() {
        return status == null || status == 0;
    }
}
