package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 更新文章 DTO
 * <p>
 * 接收前端提交的修改文章请求数据。
 * 与 {@link ArticleCreateDTO} 的区别在于：
 * <ul>
 *   <li>多了 {@code id} 字段（必填），用于指定要更新的文章</li>
 *   <li>其余字段与创建时类似，但可根据业务需求调整校验规则</li>
 * </ul>
 * </p>
 *
 * <h3>设计说明：为什么不复用 ArticleCreateDTO？</h3>
 * <p>
 * 创建和更新场景的校验规则可能不同（如更新时允许部分字段为空表示"不修改"），
 * 且更新接口必须携带 ID。分开定义可以让每个 DTO 的职责更清晰，
 * 也方便后续为不同场景添加独立的校验逻辑。
 * </p>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
public class ArticleUpdateDTO {

    /**
     * 文章 ID（必填）
     * <p>更新操作必须指定目标文章的 ID。</p>
     */
    @NotNull(message = "文章 ID 不能为空")
    private Long id;

    /**
     * 文章标题
     * <p>更新时同样校验长度限制。</p>
     */
    @NotBlank(message = "文章标题不能为空")
    @Size(max = 100, message = "文章标题不能超过 100 个字符")
    private String title;

    /**
     * 文章内容（Markdown 格式）
     */
    @NotBlank(message = "文章内容不能为空")
    @Size(min = 10, message = "文章内容至少需要 10 个字符")
    private String content;

    /**
     * 分类 ID
     */
    @NotNull(message = "请选择文章分类")
    private Long categoryId;

    /**
     * 文章摘要
     */
    @Size(max = 200, message = "文章摘要不能超过 200 个字符")
    private String summary;

    /**
     * 封面图片 URL
     */
    @Size(max = 500, message = "封面图片 URL 过长")
    private String coverImage;

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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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

    @Override
    public String toString() {
        return "ArticleUpdateDTO{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", categoryId=" + categoryId +
                '}';
    }
}
