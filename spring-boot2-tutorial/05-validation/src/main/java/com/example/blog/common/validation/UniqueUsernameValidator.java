package com.example.blog.common.validation;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 用户名唯一性校验器
 * <p>
 * 实现 {@link ConstraintValidator} 接口，配合 {@link UniqueUsername} 注解使用。
 * 在校验阶段通过 {@link UserMapper} 查询数据库，判断用户名是否已被占用。
 * </p>
 *
 * <h3>工作流程：</h3>
 * <ol>
 *   <li>Spring 在启动时自动注入 {@link UserMapper}（因为 Validator 由 Spring 管理）</li>
 *   <li>校验时调用 {@code isValid()} 方法，参数 {@code value} 即为被标注字段的值</li>
 *   <li>如果 value 为 null，直接返回 true（非空校验应由 @NotBlank 负责）</li>
 *   <li>查询数据库，如果存在相同用户名则返回 false（校验失败）</li>
 * </ol>
 *
 * <h3>注意事项：</h3>
 * <ul>
 *   <li>校验器由 Spring 容器管理，因此可以使用 {@code @Autowired} 注入 Bean</li>
 *   <li>数据库查询异常应被捕获，避免中断校验流程</li>
 *   <li>null 值应返回 true，遵循"单一职责"原则 — 非空校验交给 @NotBlank</li>
 *   <li>JDK 8 下 String 没有 {@code isBlank()} 方法，使用 {@code trim().isEmpty()} 代替</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 * @see UniqueUsername
 */
public class UniqueUsernameValidator implements ConstraintValidator<UniqueUsername, String> {

    private static final Logger log = LoggerFactory.getLogger(UniqueUsernameValidator.class);

    /**
     * 注入 UserMapper 用于查询数据库
     * <p>
     * 由于 Spring Boot 会将 Validator 实例纳入 IoC 容器管理，
     * 因此可以直接使用 @Autowired 注入 Mapper、Service 等 Bean。
     * </p>
     */
    @Autowired
    private UserMapper userMapper;

    /**
     * 初始化方法（在校验开始前调用一次）
     * <p>可用于读取注解上的配置属性，此处无需额外初始化。</p>
     *
     * @param annotation 注解实例
     */
    @Override
    public void initialize(UniqueUsername annotation) {
        // 无需额外初始化
    }

    /**
     * 执行校验逻辑
     *
     * @param value   被校验的字段值（即 username）
     * @param context 校验上下文，可用于自定义错误消息等
     * @return true 表示校验通过（用户名唯一），false 表示校验失败（用户名已存在）
     */
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null 或纯空白字符串不做唯一性校验，交给 @NotBlank 处理
        // 注意：JDK 8 的 String 没有 isBlank()，使用 trim().isEmpty() 等价实现
        if (value == null || value.trim().isEmpty()) {
            return true;
        }

        try {
            // 使用 MyBatis-Plus 的 LambdaQueryWrapper 查询用户名是否已存在
            LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(User::getUsername, value);
            Long count = userMapper.selectCount(queryWrapper);

            // count == 0 表示用户名不存在，校验通过
            return count == 0;
        } catch (Exception e) {
            // 数据库异常时记录日志，并返回 false（保守策略：异常时拒绝请求）
            log.error("校验用户名唯一性时发生异常: {}", e.getMessage(), e);
            return false;
        }
    }
}
