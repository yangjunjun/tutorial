package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文章分类实体类 —— 对应数据库 category 表
 *
 * 用于对文章进行分类管理，支持排序功能。
 * 每篇文章属于一个分类（一对一），一个分类下可以有多篇文章。
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("category")
public class Category {

    /**
     * 分类 ID（主键，自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 分类名称
     * 对应数据库列：category.name VARCHAR(50) UNIQUE
     * 分类名称不可重复
     */
    private String name;

    /**
     * 分类描述
     * 对应数据库列：category.description VARCHAR(200)
     * 简要描述该分类包含的内容范围
     */
    private String description;

    /**
     * 排序值
     * 对应数据库列：category.sort INT DEFAULT 0
     * 数字越小排序越靠前，用于分类列表的显示顺序
     */
    private Integer sort;

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
