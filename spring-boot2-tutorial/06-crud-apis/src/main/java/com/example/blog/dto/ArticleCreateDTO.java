package com.example.blog.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * 创建文章 DTO
 * <p>
 * 接收前端提交的新建文章请求数据。
 * 所有必填字段通过 javax Validation 注解自动校验，
 * 校验失败时由全局异常处理器返回友好的错误提示。
 * </p>
 *
 * <h3>字段校验规则：</h3>
 * <ul>
 *   <li>title — 必填，1~100 字符</li>
 *   <li>content — 必填，至少 10 个字符（防止无意义内容）</li>
 *   <li>categoryId — 必填，分类 ID</li>
 *   <li>summary — 可选，最多 200 字符</li>
 *   <li>coverImage — 可选，URL 格式</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
public class ArticleCreateDTO {

    /**
     * 文章标题
     * <p>必填，长度 1~100 个字符。</p>
     */
    @NotBlank(message = "文章标题不能为空")
    @Size(max = 100, message = "文章标题不能超过 100 个字符")
    private String title;

    /**
     * 文章内容（Markdown 格式）
     * <p>必填，最少 10 个字符，防止提交空白或无意义内容。</p>
     */
    @NotBlank(message = "文章内容不能为空")
    @Size(min = 10, message = "文章内容至少需要 10 个字符")
    private String content;

    /**
     * 分类 ID
     * <p>必填，对应数据库中的 category 表主键。</p>
     */
    @NotNull(message = "请选择文章分类")
    private Long categoryId;

    /**
     * 文章摘要
     * <p>可选字段。如果前端未传，Service 层可从 content 中自动截取前 200 字作为摘要。</p>
     */
    @Size(max = 200, message = "文章摘要不能超过 200 个字符")
    private String summary;

    /**
     * 封面图片 URL
     * <p>可选字段。前端可上传图片后返回 URL，再填入此字段。</p>
     */
    @Size(max = 500, message = "封面图片 URL 过长")
    private String coverImage;

    // ==================== Getter / Setter ====================

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
        return "ArticleCreateDTO{" +
                "title='" + title + '\'' +
                ", categoryId=" + categoryId +
                ", summary='" + summary + '\'' +
                '}';
    }
}
