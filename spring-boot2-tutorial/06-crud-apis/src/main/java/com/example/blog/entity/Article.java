package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 文章实体类（第 06 章最小化版本）
 * <p>
 * 参考 readme.md 第 6.5.1 节的 Article 实体结构。
 * ArticleServiceImpl / CategoryServiceImpl 的业务逻辑依赖本实体编译通过，
 * 因此这里提供完整字段的实体定义。
 * </p>
 *
 * <h3>数据库表结构（参考）：</h3>
 * <pre>{@code
 * CREATE TABLE `article` (
 *   `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
 *   `title`        VARCHAR(100) NOT NULL COMMENT '文章标题',
 *   `content`      LONGTEXT     NOT NULL COMMENT '文章内容（Markdown）',
 *   `summary`      VARCHAR(300) DEFAULT NULL COMMENT '文章摘要',
 *   `cover_image`  VARCHAR(500) DEFAULT NULL COMMENT '封面图片 URL',
 *   `category_id`  BIGINT       NOT NULL COMMENT '分类 ID',
 *   `author_id`    BIGINT       NOT NULL COMMENT '作者 ID',
 *   `view_count`   INT          DEFAULT 0 COMMENT '浏览量',
 *   `like_count`   INT          DEFAULT 0 COMMENT '点赞数',
 *   `comment_count` INT         DEFAULT 0 COMMENT '评论数',
 *   `status`       TINYINT      DEFAULT 1 COMMENT '状态：1-已发布，0-草稿，-1-已删除',
 *   `create_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
 *   `update_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
 *   `is_deleted`   TINYINT      DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
 *   PRIMARY KEY (`id`)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';
 * }</pre>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@TableName("article")
public class Article {

    /**
     * 主键 ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章内容（Markdown 格式）
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
     * 分类 ID
     */
    private Long categoryId;

    /**
     * 作者 ID
     */
    private Long authorId;

    /**
     * 浏览量
     */
    private Integer viewCount;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 评论数
     */
    private Integer commentCount;

    /**
     * 状态：1-已发布，0-草稿，-1-已删除
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public Integer getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
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
}
