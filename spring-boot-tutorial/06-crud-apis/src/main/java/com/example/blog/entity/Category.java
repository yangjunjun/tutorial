package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 分类实体类
 * <p>
 * 对应数据库表 {@code category}，用于管理博客文章的分类信息。
 * 使用 MyBatis-Plus 注解映射数据库字段。
 * </p>
 *
 * <h3>数据库表结构（参考）：</h3>
 * <pre>{@code
 * CREATE TABLE `category` (
 *   `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
 *   `name`        VARCHAR(50)  NOT NULL COMMENT '分类名称',
 *   `description` VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
 *   `sort_order`  INT          DEFAULT 0 COMMENT '排序序号（越小越靠前）',
 *   `status`      TINYINT      DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
 *   `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
 *   `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
 *   `is_deleted`  TINYINT      DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
 *   PRIMARY KEY (`id`),
 *   UNIQUE KEY `uk_name` (`name`)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类表';
 * }</pre>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
@TableName("category")
public class Category {

    /**
     * 主键 ID
     * <p>使用雪花算法自动生成（MyBatis-Plus 默认策略）。</p>
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 分类名称（唯一）
     */
    private String name;

    /**
     * 分类描述
     */
    private String description;

    /**
     * 排序序号，数值越小排越前
     */
    private Integer sortOrder;

    /**
     * 状态：1-启用，0-禁用
     */
    private Integer status;

    /**
     * 创建时间
     * <p>使用 MyBatis-Plus 自动填充功能，插入时自动设置。</p>
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     * <p>插入和更新时均自动填充。</p>
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 逻辑删除标记：0-未删除，1-已删除
     * <p>
     * 使用 {@code @TableLogic} 注解后，MyBatis-Plus 在执行 delete 操作时
     * 会自动转为 UPDATE 语句，将 is_deleted 设为 1；
     * 查询时自动追加 WHERE is_deleted = 0 条件。
     * </p>
     */
    @TableLogic
    private Integer isDeleted;

    // ==================== Getter / Setter ====================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    public Integer getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Integer isDeleted) {
        this.isDeleted = isDeleted;
    }

    @Override
    public String toString() {
        return "Category{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", sortOrder=" + sortOrder +
                ", status=" + status +
                '}';
    }
}
