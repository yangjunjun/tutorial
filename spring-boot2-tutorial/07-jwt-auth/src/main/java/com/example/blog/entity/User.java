package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户实体类 —— 对应数据库 blog_user 表
 *
 * MyBatis-Plus 注解说明：
 * - @TableName("user")：指定该实体类对应的数据库表名
 * - @TableId(type = IdType.AUTO)：标记主键字段，使用数据库自增策略
 * - @TableField(fill = FieldFill.INSERT)：标记字段在插入时自动填充
 *
 * 驼峰映射：
 * MyBatis-Plus 默认开启驼峰命名自动映射，例如：
 * Java 字段 createTime  →  数据库列 create_time
 * 因此不需要为每个字段单独指定 @TableField 映射
 *
 * @author tutorial
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("user")
public class User {

    /**
     * 用户 ID（主键，自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户名（唯一，用于登录）
     */
    private String username;

    /**
     * 密码（BCrypt 加密后的哈希值）
     */
    private String password;

    /**
     * 昵称（显示在页面上的名称）
     */
    private String nickname;

    /**
     * 邮箱地址
     */
    private String email;

    /**
     * 头像 URL
     */
    private String avatar;

    /**
     * 角色
     * 取值：admin（管理员）、user（普通用户）
     */
    private String role;

    /**
     * 账号状态
     * 取值：0（正常）、1（禁用）
     */
    private Integer status;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
