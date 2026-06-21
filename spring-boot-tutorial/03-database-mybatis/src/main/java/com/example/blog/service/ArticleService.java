package com.example.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.blog.entity.Article;

/**
 * 文章服务接口
 *
 * 继承 IService<Article> 获得丰富的 CRUD 和批量操作方法。
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
public interface ArticleService extends IService<Article> {

    // ============================================================
    // 自定义业务方法声明区
    // ============================================================

    // 示例：根据文章 ID 获取文章详情（含作者信息、分类名称）
    // ArticleVO getArticleDetail(Long id);

    // 示例：分页查询已发布的文章列表
    // PageResult<ArticleVO> getPublishedArticles(int pageNum, int pageSize, Long categoryId);

    // 示例：增加文章浏览量
    // void incrementViewCount(Long articleId);

    // 示例：发布文章（草稿 -> 已发布）
    // boolean publishArticle(Long articleId);
}
