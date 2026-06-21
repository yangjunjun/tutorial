package com.example.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.blog.entity.Article;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.service.ArticleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 文章服务实现类
 *
 * 继承 ServiceImpl<ArticleMapper, Article>，自动获得：
 * - baseMapper 变量（ArticleMapper 实例），可直接调用 Mapper 方法
 * - IService<Article> 的所有实现方法（save、getById、list、page 等）
 *
 * @Slf4j：自动生成 log 日志变量，用于记录业务日志
 * @Service：注册为 Spring Bean，供 Controller 层注入使用
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
@Slf4j
@Service
public class ArticleServiceImpl extends ServiceImpl<ArticleMapper, Article> implements ArticleService {

    // ============================================================
    // 此处无需编写任何代码即可获得 IService 提供的所有 CRUD 方法。
    // 如需自定义业务逻辑，可在下方添加方法实现。
    // ============================================================

    // 示例：增加文章浏览量
    // @Override
    // public void incrementViewCount(Long articleId) {
    //     // 使用 MyBatis-Plus 的 UpdateWrapper 实现原子性 +1 操作
    //     baseMapper.update(null,
    //         new LambdaUpdateWrapper<Article>()
    //             .eq(Article::getId, articleId)
    //             .setSql("view_count = view_count + 1")
    //     );
    //     log.info("文章浏览量 +1，articleId={}", articleId);
    // }

    // 示例：获取文章详情（含作者信息）
    // @Override
    // public ArticleVO getArticleDetail(Long id) {
    //     // 1. 查询文章
    //     Article article = getById(id);
    //     if (article == null) {
    //         throw new RuntimeException("文章不存在");
    //     }
    //     // 2. 查询作者信息
    //     User author = userService.getById(article.getAuthorId());
    //     // 3. 查询分类信息
    //     Category category = categoryService.getById(article.getCategoryId());
    //     // 4. 组装 VO 对象
    //     return ArticleVO.builder()
    //         .id(article.getId())
    //         .title(article.getTitle())
    //         .content(article.getContent())
    //         .authorName(author.getNickname())
    //         .categoryName(category.getName())
    //         .viewCount(article.getViewCount())
    //         .createTime(article.getCreateTime())
    //         .build();
    // }
}
