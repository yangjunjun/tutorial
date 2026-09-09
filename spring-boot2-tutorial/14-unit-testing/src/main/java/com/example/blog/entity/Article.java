package com.example.blog.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文章实体（第 14 章测试工程最小骨架）
 * <p>完整实现见第 03/06/09 章。</p>
 */
@Data
public class Article {

    private Long id;

    private String title;

    private String summary;

    private String content;

    private Long authorId;

    private Long categoryId;

    private Integer status;

    private Long viewCount;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
