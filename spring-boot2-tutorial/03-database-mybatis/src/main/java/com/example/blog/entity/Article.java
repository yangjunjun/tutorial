package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文章实体类 —— 对应数据库 article 表
 *
 * 存储博客文章的核心信息，包括标题、正文、摘要、分类、作者等。
 * 文章内容使用 Markdown 格式存储，前端渲染为 HTML 展示。
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("article")
public class Article {

    /**
     * 文章 ID（主键，自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 文章标题
     * 对应数据库列：article.title VARCHAR(200)
     */
    private String title;

    /**
     * 文章正文（Markdown 格式）
     * 对应数据库列：article.content LONGTEXT
     * 使用 LONGTEXT 类型以支持超长文章内容（最大 4GB）
     */
    private String content;

    /**
     * 文章摘要
     * 对应数据库列：article.summary VARCHAR(500)
     * 用于列表页展示，避免加载完整文章内容
     */
    private String summary;

    /**
     * 所属分类 ID（关联 category 表）
     * 对应数据库列：article.category_id BIGINT
     * Java 字段名 categoryId 自动映射到数据库列 category_id
     */
    private Long categoryId;

    /**
     * 作者 ID（关联 user 表）
     * 对应数据库列：article.author_id BIGINT
     */
    private Long authorId;

    /**
     * 封面图片 URL
     * 对应数据库列：article.cover_image VARCHAR(255)
     */
    private String coverImage;

    /**
     * 文章状态
     * 对应数据库列：article.status TINYINT
     * 取值：0（草稿）、1（已发布）、2（已下架）
     */
    private Integer status;

    /**
     * 浏览量
     * 对应数据库列：article.view_count BIGINT
     * 每次用户访问文章详情页时 +1
     */
    private Long viewCount;

    /**
     * 创建时间
     * 插入时自动填充（配合 MetaObjectHandler）
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     * 插入和更新时自动填充
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
