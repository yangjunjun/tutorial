package com.example.blog.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * 用户注册 DTO
 * <p>
 * 接收前端提交的用户注册请求数据，通过 javax Validation 注解自动校验各字段。
 * 使用分组校验（Group Validation）区分"创建"和"更新"场景。
 * </p>
 *
 * <h3>字段校验规则：</h3>
 * <ul>
 *   <li>username — 4~20 位，仅允许字母、数字、下划线；创建和更新时均需校验</li>
 *   <li>password — 6~20 位；仅创建时校验</li>
 *   <li>confirmPassword — 需与 password 一致；仅创建时校验</li>
 *   <li>email — 合法邮箱格式；创建和更新时均需校验</li>
 *   <li>nickname — 2~20 位非空字符；可选字段</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
public class UserRegisterDTO {

    /**
     * 校验分组标记接口 — 创建场景
     * <p>在 Controller 中使用 {@code @Validated(Create.class)} 触发该分组。</p>
     */
    public interface Create {}

    /**
     * 校验分组标记接口 — 更新场景
     * <p>在 Controller 中使用 {@code @Validated(Update.class)} 触发该分组。</p>
     */
    public interface Update {}

    /**
     * 用户名
     * <p>
     * 规则：4~20 位，仅允许字母、数字和下划线。
     * 分组：Create（创建）和 Update（更新）时均校验。
     * </p>
     */
    @NotBlank(message = "用户名不能为空", groups = {Create.class, Update.class})
    @Size(min = 4, max = 20, message = "用户名长度必须在 4~20 个字符之间", groups = {Create.class, Update.class})
    @Pattern(regexp = "^[a-zA-Z0-9_]+$",
            message = "用户名只能包含字母、数字和下划线",
            groups = {Create.class, Update.class})
    private String username;

    /**
     * 密码
     * <p>
     * 规则：6~20 位，不能为空。
     * 分组：仅 Create（创建/注册）时校验，更新用户信息时无需再次输入密码。
     * </p>
     */
    @NotBlank(message = "密码不能为空", groups = Create.class)
    @Size(min = 6, max = 20, message = "密码长度必须在 6~20 个字符之间", groups = Create.class)
    private String password;

    /**
     * 确认密码
     * <p>
     * 规则：必须与 password 一致（通过前端或自定义校验器实现，此处仅做非空校验）。
     * 分组：仅 Create 时校验。
     * </p>
     */
    @NotBlank(message = "确认密码不能为空", groups = Create.class)
    private String confirmPassword;

    /**
     * 邮箱
     * <p>
     * 规则：合法的邮箱格式。
     * 分组：Create 和 Update 时均校验。
     * </p>
     */
    @NotBlank(message = "邮箱不能为空", groups = {Create.class, Update.class})
    @Email(message = "邮箱格式不正确", groups = {Create.class, Update.class})
    private String email;

    /**
     * 昵称（可选字段）
     * <p>
     * 规则：2~20 位非空字符。如果传了值则校验长度，不传则跳过。
     * </p>
     */
    @Size(min = 2, max = 20, message = "昵称长度必须在 2~20 个字符之间")
    private String nickname;

    // ==================== Getter / Setter ====================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    @Override
    public String toString() {
        return "UserRegisterDTO{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", nickname='" + nickname + '\'' +
                '}';
    }
}
