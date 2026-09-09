package com.example.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 文章更新请求 DTO（第 14 章测试工程最小骨架）
 */
@Data
public class ArticleUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private String title;

    private String content;
}
