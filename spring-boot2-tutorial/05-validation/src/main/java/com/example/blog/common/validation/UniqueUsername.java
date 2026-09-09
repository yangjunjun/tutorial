package com.example.blog.common.validation;

import javax.validation.Constraint;
import javax.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 自定义校验注解 — 用户名唯一性校验
 * <p>
 * 标注在 DTO 的 {@code username} 字段上，在校验阶段自动查询数据库，
 * 判断该用户名是否已被注册。如果已存在则校验失败，返回指定的错误消息。
 * </p>
 *
 * <h3>使用示例：</h3>
 * <pre>{@code
 * public class UserRegisterDTO {
 *
 *     @UniqueUsername(message = "该用户名已被注册")
 *     @NotBlank(message = "用户名不能为空")
 *     private String username;
 * }
 * }</pre>
 *
 * <h3>实现原理：</h3>
 * <ol>
 *   <li>{@code @Constraint(validatedBy = UniqueUsernameValidator.class)} 指定校验器类</li>
 *   <li>Spring 在校验时会自动实例化并调用 {@link UniqueUsernameValidator#isValid} 方法</li>
 *   <li>{@code groups} 和 {@code payload} 是 javax Validation 2.0 规范要求必须定义的属性</li>
 * </ol>
 *
 * <h3>支持的注解目标：</h3>
 * <ul>
 *   <li>{@link ElementType#FIELD} — 标注在字段上</li>
 *   <li>{@link ElementType#METHOD} — 标注在 getter 方法上</li>
 *   <li>{@link ElementType#PARAMETER} — 标注在方法参数上</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 * @see UniqueUsernameValidator
 */
@Documented
@Constraint(validatedBy = UniqueUsernameValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface UniqueUsername {

    /**
     * 校验失败时的错误消息
     * <p>支持消息模板，如 {@code "{unique.username}"}，可在 messages.properties 中定义。</p>
     */
    String message() default "该用户名已被注册";

    /**
     * 校验分组（javax Validation 2.0 规范要求）
     */
    Class<?>[] groups() default {};

    /**
     * 负载信息（javax Validation 2.0 规范要求）
     */
    Class<? extends Payload>[] payload() default {};
}
