package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户实体类 —— 对应数据库 user 表
 *
 * MyBatis-Plus 注解说明：
 * - @TableName("user")：指定该实体类对应的数据库表名
 * - @TableId(type = IdType.AUTO)：标记主键字段，使用数据库自增策略
 * - @TableField(fill = FieldFill.INSERT)：标记字段在插入时自动填充
 * - @TableField(fill = FieldFill.INSERT_UPDATE)：标记字段在插入和更新时自动填充
 *
 * 驼峰映射：
 * MyBatis-Plus 默认开启驼峰命名自动映射，例如：
 * Java 字段 createTime  →  数据库列 create_time
 * 因此不需要为每个字段单独指定 @TableField 映射
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("user")
public class User {

    /**
     * 用户 ID（主键，自增）
     *
     * @TableId 标注主键字段
     * IdType.AUTO：使用数据库的 AUTO_INCREMENT 自增策略
     * 其他可选策略：
     * - IdType.ASSIGN_ID：雪花算法，生成全局唯一 ID（分布式场景）
     * - IdType.INPUT：手动设置 ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户名（唯一，用于登录）
     * 对应数据库列：user.username VARCHAR(50) UNIQUE
     * 驼峰自动映射，无需 @TableField 注解
     */
    private String username;

    /**
     * 密码（BCrypt 加密后的哈希值）
     * 对应数据库列：user.password VARCHAR(100)
     * 注意：在返回给前端时应该排除此字段（使用 VO 或在查询时排除）
     */
    private String password;

    /**
     * 昵称（显示在页面上的名称）
     * 对应数据库列：user.nickname VARCHAR(50)
     */
    private String nickname;

    /**
     * 邮箱地址
     * 对应数据库列：user.email VARCHAR(100)
     */
    private String email;

    /**
     * 头像 URL
     * 对应数据库列：user.avatar VARCHAR(255)
     * 注意：Java 字段名 avatar 自动映射到数据库列 avatar
     */
    private String avatar;

    /**
     * 角色
     * 对应数据库列：user.role VARCHAR(20)
     * 取值：ADMIN（管理员）、USER（普通用户）
     */
    private String role;

    /**
     * 账号状态
     * 对应数据库列：user.status TINYINT
     * 取值：0（正常）、1（禁用）
     */
    private Integer status;

    /**
     * 创建时间
     * 对应数据库列：user.create_time DATETIME
     *
     * @TableField(fill = FieldFill.INSERT)：
     * 当执行 insert 操作时，MyBatis-Plus 会自动填充当前时间
     * 需要配合 MetaObjectHandler 实现类使用（后续章节实现）
     *
     * 当前阶段，数据库字段设置了 DEFAULT CURRENT_TIMESTAMP，
     * 即使不自动填充，MySQL 也会自动设置默认值
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     * 对应数据库列：user.update_time DATETIME
     *
     * @TableField(fill = FieldFill.INSERT_UPDATE)：
     * 当执行 insert 或 update 操作时，MyBatis-Plus 会自动填充当前时间
     *
     * 同样，数据库字段设置了 ON UPDATE CURRENT_TIMESTAMP 作为兜底
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
