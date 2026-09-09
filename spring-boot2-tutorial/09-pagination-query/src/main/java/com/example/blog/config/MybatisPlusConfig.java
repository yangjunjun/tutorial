package com.example.blog.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus 配置类
 * <p>
 * 本教程使用 <strong>MyBatis-Plus 3.5.1</strong>（在 pom.xml 中显式指定版本）。
 * <p>
 * 主要配置 MyBatis-Plus 的插件，包括：
 * - 分页插件（PaginationInnerInterceptor）
 * <p>
 * <strong>为什么需要分页插件？</strong>
 * <p>
 * MyBatis-Plus 本身不会自动拦截 SQL 并改写分页语句。
 * 需要配置 PaginationInnerInterceptor 插件，它会：
 * 1. 拦截包含 Page 对象的查询方法
 * 2. 自动改写 SQL，添加 LIMIT 和 OFFSET 子句（MySQL）
 * 3. 自动执行 COUNT 查询获取总记录数
 * <p>
 * 例如，原始 SQL：
 * <pre>
 * SELECT * FROM blog_article WHERE status = 1
 * </pre>
 * 会被改写为：
 * <pre>
 * SELECT COUNT(*) FROM blog_article WHERE status = 1    -- 统计总数
 * SELECT * FROM blog_article WHERE status = 1 LIMIT 10 OFFSET 0  -- 分页查询
 * </pre>
 * <p>
 * <strong>3.5.x 的写法变化</strong>：
 * <pre>
 * // 3.4.x 及更早版本（已废弃）：
 * PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
 *
 * // 3.5.x（本教程使用）：
 * MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
 * interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
 * </pre>
 *
 * @author tutorial
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * 配置 MyBatis-Plus 拦截器
     * <p>
     * MybatisPlusInterceptor 是一个"总拦截器"，
     * 可以添加多个内部插件（InnerInterceptor），如：
     * - PaginationInnerInterceptor：分页插件
     * - BlockAttackInnerInterceptor：防全表更新与删除插件
     * - OptimisticLockerInnerInterceptor：乐观锁插件
     * - TenantLineInnerInterceptor：多租户插件
     * <p>
     * 本项目目前只需要分页插件。
     *
     * @return MybatisPlusInterceptor 配置好的拦截器
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        // 创建 MyBatis-Plus 拦截器
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // ========== 添加分页插件 ==========
        // PaginationInnerInterceptor 是分页插件的核心
        // 3.5.1 推荐在构造方法中直接传入数据库类型：
        // new PaginationInnerInterceptor(DbType.MYSQL)
        PaginationInnerInterceptor paginationInterceptor =
            new PaginationInnerInterceptor(DbType.MYSQL);

        // 设置单页最大记录数限制（防止一次性查询过多数据）
        // 超过此限制的 size 参数会被截断为 500
        paginationInterceptor.setMaxLimit(500L);

        // 是否溢出处理：当请求页码超出总页数时
        // true = 返回首页数据
        // false = 返回空数据（默认）
        paginationInterceptor.setOverflow(false);

        // 将分页插件添加到拦截器中
        // 注意：如果有多个插件，分页插件通常放在最后
        interceptor.addInnerInterceptor(paginationInterceptor);

        return interceptor;
    }
}
