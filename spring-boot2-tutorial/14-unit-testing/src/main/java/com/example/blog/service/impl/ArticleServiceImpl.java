package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.entity.Article;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.CategoryMapper;
import com.example.blog.mapper.TagMapper;
import com.example.blog.service.ArticleService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 文章 Service 实现（第 14 章测试工程最小骨架）
 * <p>仅包含被测试类引用的方法签名，完整业务实现见第 06/09/13 章。</p>
 */
@org.springframework.stereotype.Service
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;

    public ArticleServiceImpl(ArticleMapper articleMapper,
                              CategoryMapper categoryMapper,
                              TagMapper tagMapper) {
        this.articleMapper = articleMapper;
        this.categoryMapper = categoryMapper;
        this.tagMapper = tagMapper;
    }

    @Override
    public Article getById(Long id) {
        return articleMapper.selectById(id);
    }

    @Override
    public IPage<Article> page(Integer pageNum, Integer pageSize, Long categoryId, String keyword) {
        Page<Article> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        return articleMapper.selectPage(page, wrapper);
    }

    @Override
    public boolean save(Article article) {
        return articleMapper.insert(article) > 0;
    }

    @Override
    public boolean updateById(Article article) {
        articleMapper.selectById(article.getId());
        return articleMapper.updateById(article) > 0;
    }

    @Override
    public boolean removeByIdAndAuthor(Long id, Long authorId) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException("文章不存在");
        }
        if (!article.getAuthorId().equals(authorId)) {
            throw new BusinessException("没有操作权限，无法删除该文章");
        }
        return articleMapper.deleteById(id) > 0;
    }

    @Override
    public void incrementViewCount(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            return;
        }
        article.setViewCount(article.getViewCount() == null ? 1L : article.getViewCount() + 1);
        articleMapper.updateById(article);
    }

    @Override
    public List<Article> listByAuthorId(Long authorId) {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getAuthorId, authorId);
        return articleMapper.selectList(wrapper);
    }
}
