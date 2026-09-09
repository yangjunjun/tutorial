package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.Article;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章数据访问接口（Mapper）
 *
 * 继承 BaseMapper<Article> 后自动获得基本 CRUD 方法。
 *
 * 内置方法列表（同 UserMapper，此处不再重复列举）：
 * - insert / deleteById / updateById / selectById / selectList 等
 *
 * 常用场景示例：
 *
 * 1. 插入文章：
 *    articleMapper.insert(article);
 *
 * 2. 查询某作者的所有文章：
 *    articleMapper.selectList(
 *        new LambdaQueryWrapper<Article>()
 *            .eq(Article::getAuthorId, authorId)
 *            .orderByDesc(Article::getCreateTime)
 *    );
 *
 * 3. 查询已发布的文章列表：
 *    articleMapper.selectList(
 *        new LambdaQueryWrapper<Article>()
 *            .eq(Article::getStatus, 1)
 *    );
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {

    // ============================================================
    // 此处无需编写任何代码，BaseMapper 已提供完整的 CRUD 方法。
    // 如需自定义 SQL（如多表联查获取作者昵称、分类名称等），
    // 可在下方添加方法声明，并在 ArticleMapper.xml 中编写实现。
    // ============================================================

    // 示例：关联查询文章详情（含作者昵称和分类名称）
    // ArticleVO selectArticleDetail(@Param("id") Long id);
}
