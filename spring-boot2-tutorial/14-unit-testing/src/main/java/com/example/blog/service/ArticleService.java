package com.example.blog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.blog.entity.Article;

import java.util.List;

/**
 * 文章 Service 接口（第 14 章测试工程最小骨架）
 */
public interface ArticleService {

    Article getById(Long id);

    IPage<Article> page(Integer pageNum, Integer pageSize, Long categoryId, String keyword);

    boolean save(Article article);

    boolean updateById(Article article);

    boolean removeByIdAndAuthor(Long id, Long authorId);

    void incrementViewCount(Long id);

    List<Article> listByAuthorId(Long authorId);
}
