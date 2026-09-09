package com.example.blog.entity;

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
public class Article {

    /**
     * 文章 ID（主键，自增）
     * 对应数据库字段：article.id BIGINT AUTO_INCREMENT
     */
    private Long id;

    /**
     * 文章标题
     * 对应数据库字段：article.title VARCHAR(200)
     * 建议标题长度不超过 200 个字符
     */
    private String title;

    /**
     * 文章正文（Markdown 格式）
     * 对应数据库字段：article.content LONGTEXT
     * 使用 LONGTEXT 类型以支持超长文章内容
     * 前端需要使用 Markdown 渲染库（如 marked.js）将其转为 HTML
     */
    private String content;

    /**
     * 文章摘要
     * 对应数据库字段：article.summary VARCHAR(500)
     * 用于列表页展示，避免加载完整文章内容
     * 一般取正文前 200 个字符，或由用户手动填写
     */
    private String summary;

    /**
     * 所属分类 ID（关联 category 表）
     * 对应数据库字段：article.category_id BIGINT
     * 外键关联到 category.id
     */
    private Long categoryId;

    /**
     * 作者 ID（关联 user 表）
     * 对应数据库字段：article.author_id BIGINT
     * 外键关联到 user.id
     */
    private Long authorId;

    /**
     * 封面图片 URL
     * 对应数据库字段：article.cover_image VARCHAR(255)
     * 存储文章封面图片的完整 URL 或相对路径
     */
    private String coverImage;

    /**
     * 文章状态
     * 对应数据库字段：article.status TINYINT DEFAULT 0
     * 取值：
     * - 0：草稿（仅作者可见）
     * - 1：已发布（所有人可见）
     * - 2：已下架（管理员下架）
     */
    private Integer status;

    /**
     * 浏览量
     * 对应数据库字段：article.view_count BIGINT DEFAULT 0
     * 每次用户访问文章详情页时 +1
     * 使用 Long 类型，因为浏览量可能非常大
     */
    private Long viewCount;

    /**
     * 创建时间
     * 对应数据库字段：article.create_time DATETIME DEFAULT CURRENT_TIMESTAMP
     */
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     * 对应数据库字段：article.update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     */
    private LocalDateTime updateTime;
}
