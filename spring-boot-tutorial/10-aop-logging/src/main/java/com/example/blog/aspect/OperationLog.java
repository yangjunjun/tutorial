package com.example.blog.aspect;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解
 * <p>
 * 标记在 Controller 方法上，AOP 切面会自动拦截并记录操作日志，
 * 包括操作人、操作类型、请求参数、响应结果、耗时、IP 地址等信息。
 * </p>
 *
 * <p>使用示例：</p>
 * <pre>{@code
 * @OperationLog(module = "文章管理", type = "创建", description = "创建新文章")
 * @PostMapping
 * public Result<Long> create(@RequestBody ArticleCreateDTO dto) {
 *     return Result.ok(articleService.create(dto));
 * }
 * }</pre>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Target(ElementType.METHOD)          // 只能标注在方法上
@Retention(RetentionPolicy.RUNTIME)  // 运行时保留，AOP 需要通过反射读取
@Documented                          // 包含在 Javadoc 中
public @interface OperationLog {

    /**
     * 操作模块
     * <p>例如：文章管理、用户管理、评论管理、系统配置</p>
     */
    String module() default "";

    /**
     * 操作类型
     * <p>例如：创建、修改、删除、查询、导入、导出、审核</p>
     */
    String type() default "";

    /**
     * 操作描述
     * <p>对本次操作的详细说明，便于后续审计追踪</p>
     */
    String description() default "";
}
