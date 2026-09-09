package com.example.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文章详情响应 VO（View Object）
 *
 * 当前端调用 GET /api/articles/{id} 接口获取文章详情时，
 * 返回的 JSON 数据由此对象序列化而来。
 *
 * 为什么不直接返回 Article 实体？
 * 1. VO 中包含 authorName（作者昵称）和 authorAvatar（作者头像），
 *    这些是从 User 表关联查询来的，Article 实体中只有 authorId
 * 2. VO 中包含 categoryName（分类名称），从 Category 表关联查询
 * 3. 可以控制返回字段，避免暴露不需要的数据（如内部 ID、敏感字段等）
 * 4. 前端 API 和后端 Entity 可以独立演进，互不影响
 *
 * 响应示例：
 * <pre>
 * GET /api/articles/1
 *
 * {
 *     "id": 1,
 *     "title": "Spring Boot 入门教程",
 *     "content": "# Spring Boot\n\n这是文章内容...",
 *     "summary": "本文介绍 Spring Boot 的基础知识...",
 *     "coverImage": "https://example.com/images/cover.jpg",
 *     "authorName": "张三",
 *     "authorAvatar": "https://example.com/avatars/zhangsan.jpg",
 *     "categoryName": "后端开发",
 *     "viewCount": 1024,
 *     "createTime": "2024-03-15T10:30:00",
 *     "updateTime": "2024-03-16T14:20:00"
 * }
 * </pre>
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleVO {

    /**
     * 文章 ID
     */
    private Long id;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章正文（Markdown 格式）
     * 前端需要使用 Markdown 渲染库将其转为 HTML 展示
     */
    private String content;

    /**
     * 文章摘要
     */
    private String summary;

    /**
     * 封面图片 URL
     */
    private String coverImage;

    /**
     * 作者昵称
     * 这个字段在 Article 实体中不存在，需要通过 User 表关联查询获取。
     * 在 Service 层中，先通过 authorId 查询 User 表，取出 nickname 赋值给此字段。
     */
    private String authorName;

    /**
     * 作者头像 URL
     * 同 authorName，通过 User 表关联查询获取
     */
    private String authorAvatar;

    /**
     * 分类名称
     * 这个字段在 Article 实体中不存在，需要通过 Category 表关联查询获取。
     * 在 Service 层中，先通过 categoryId 查询 Category 表，取出 name 赋值给此字段。
     */
    private String categoryName;

    /**
     * 浏览量
     */
    private Long viewCount;

    /**
     * 创建时间
     * Jackson 会默认将 LocalDateTime 序列化为 ISO 8601 格式：
     * "2024-03-15T10:30:00"
     * 可以通过 @JsonFormat 注解自定义格式
     */
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     */
    private LocalDateTime updateTime;
}
