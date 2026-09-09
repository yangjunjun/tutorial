package com.example.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * 文章创建请求 DTO（第 14 章测试工程最小骨架）
 */
@Data
public class ArticleCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "标题不能为空")
    private String title;

    private String summary;

    private String content;

    private Long categoryId;

    private Integer status;
}
