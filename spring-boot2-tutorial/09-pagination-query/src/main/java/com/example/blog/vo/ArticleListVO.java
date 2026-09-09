package com.example.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章列表项 VO（精简版）
 * <p>
 * 用于文章列表分页接口，只包含列表展示所需的字段。
 * 不包含文章全文内容（content），避免列表接口返回过多数据。
 * <p>
 * 与文章详情 VO 的区别：
 * <pre>
 * ArticleListVO（列表页）：
 * - 包含摘要（summary），不含全文（content）
 * - 包含分类名、作者名（来自多表联查）
 * - 包含标签列表
 * - 数据量小，适合大量展示
 *
 * ArticleDetailVO（详情页）：
 * - 包含全文（content）
 * - 包含完整的分类和标签对象
 * - 包含上下篇文章信息
 * - 数据量大，按需加载
 * </pre>
 * <p>
 * 响应 JSON 示例：
 * <pre>
 * {
 *   "id": 1,
 *   "title": "Spring Boot 2.5 入门指南",
 *   "summary": "本文介绍 Spring Boot 2.5 的核心特性...",
 *   "coverImage": "https://example.com/cover1.jpg",
 *   "categoryId": 1,
 *   "categoryName": "后端开发",
 *   "authorId": 1,
 *   "authorName": "管理员",
 *   "tags": ["Spring Boot", "Java"],
 *   "viewCount": 1024,
 *   "likeCount": 56,
 *   "commentCount": 12,
 *   "status": 1,
 *   "createTime": "2024-06-18T10:30:00",
 *   "updateTime": "2024-06-18T14:20:00"
 * }
 * </pre>
 *
 * @author tutorial
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleListVO {

    // ==================== 文章基本信息 ====================

    /**
     * 文章 ID
     */
    private Long id;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章摘要
     * <p>
     * 列表页展示摘要，点击后进入详情页查看全文。
     * 摘要可以手动设置，也可以自动截取正文前 200 字。
     */
    private String summary;

    /**
     * 封面图片 URL
     * <p>
     * 文章列表中的缩略图。
     */
    private String coverImage;

    // ==================== 分类信息（来自多表联查） ====================

    /**
     * 分类 ID
     */
    private Long categoryId;

    /**
     * 分类名称
     * <p>
     * 通过多表联查从 category 表获取。
     * 列表页直接展示分类名，无需前端再查一次。
     */
    private String categoryName;

    // ==================== 作者信息（来自多表联查） ====================

    /**
     * 作者 ID
     */
    private Long authorId;

    /**
     * 作者昵称
     * <p>
     * 通过多表联查从 user 表获取。
     */
    private String authorName;

    // ==================== 标签信息 ====================

    /**
     * 标签名称列表
     * <p>
     * 一篇文章可以有多个标签（多对多关系）。
     * 通过 article_tag 中间表关联 tag 表获取。
     * <p>
     * 示例：["Spring Boot", "Java", "微服务"]
     */
    private List<String> tags;

    // ==================== 统计数据 ====================

    /**
     * 浏览量
     */
    private Long viewCount;

    /**
     * 点赞数
     */
    private Long likeCount;

    /**
     * 评论数
     */
    private Long commentCount;

    // ==================== 状态与时间 ====================

    /**
     * 文章状态
     * <p>
     * - 0：草稿
     * - 1：已发布
     * - 2：已下架
     */
    private Integer status;

    /**
     * 创建时间
     * <p>
     * 使用 Java 8 的 LocalDateTime 类型。
     * Jackson 会自动序列化为 ISO 格式：2024-06-18T10:30:00
     * <p>
     * 如需自定义格式，可以添加注解：
     * {@code @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")}
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
