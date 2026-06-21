package com.example.blog.vo;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章详情 VO（View Object）
 * <p>
 * 用于文章详情页展示，包含文章的完整内容以及作者信息、分类名称等关联数据。
 * 相比 {@link ArticleVO}，增加了 {@code content}（完整内容）和更多关联信息。
 * </p>
 *
 * <h3>与 ArticleVO 的区别：</h3>
 * <ul>
 *   <li>ArticleVO — 列表页使用，不含 content，数据量小</li>
 *   <li>ArticleDetailVO — 详情页使用，含 content 和更多关联信息</li>
 * </ul>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
public class ArticleDetailVO {

    /**
     * 文章 ID
     */
    private Long id;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章完整内容（Markdown 格式）
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

    // ==================== 分类信息 ====================

    /**
     * 分类 ID
     */
    private Long categoryId;

    /**
     * 分类名称
     */
    private String categoryName;

    // ==================== 作者信息 ====================

    /**
     * 作者 ID
     */
    private Long authorId;

    /**
     * 作者昵称
     */
    private String authorNickname;

    /**
     * 作者头像 URL
     */
    private String authorAvatar;

    // ==================== 统计数据 ====================

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

    // ==================== 标签 ====================

    /**
     * 文章标签列表
     * <p>每个元素包含标签 ID 和标签名称。</p>
     */
    private List<TagInfo> tags;

    // ==================== 时间信息 ====================

    /**
     * 文章状态：1-已发布，0-草稿
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 最后更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 标签信息内部类
     */
    public static class TagInfo {

        /** 标签 ID */
        private Long id;

        /** 标签名称 */
        private String name;

        public TagInfo() {}

        public TagInfo(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

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

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getAuthorNickname() {
        return authorNickname;
    }

    public void setAuthorNickname(String authorNickname) {
        this.authorNickname = authorNickname;
    }

    public String getAuthorAvatar() {
        return authorAvatar;
    }

    public void setAuthorAvatar(String authorAvatar) {
        this.authorAvatar = authorAvatar;
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

    public List<TagInfo> getTags() {
        return tags;
    }

    public void setTags(List<TagInfo> tags) {
        this.tags = tags;
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
}
