package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.entity.Article;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.service.ArticleRankingService;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.ArticleVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 文章 Service 实现类（含 Redis 缓存）
 * <p>
 * 本章重点演示 Spring Cache 注解的使用：
 * <ul>
 *   <li>{@code @Cacheable} — 查询时缓存结果</li>
 *   <li>{@code @CacheEvict} — 更新/删除时清除缓存</li>
 *   <li>{@code @CacheConfig} — 类级别的缓存公共配置</li>
 * </ul>
 * </p>
 *
 * <p>缓存策略采用 Cache Aside Pattern：</p>
 * <ol>
 *   <li>读操作：先查缓存 → 命中则返回 → 未命中则查库并写入缓存</li>
 *   <li>写操作：先更新数据库 → 再删除缓存</li>
 * </ol>
 *
 * <p><b>Spring Boot 2.5.12 适配说明：</b></p>
 * <ul>
 *   <li>实体使用 javax 世代注解，MyBatis-Plus 为 3.5.1（mybatis-plus-boot-starter）</li>
 *   <li>阅读量计数由 {@link ArticleRankingService}（Redis ZSet）提供实时数据</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "article")  // 类级别配置：统一缓存名称为 "article"
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;
    private final ArticleRankingService articleRankingService;

    // ==================== 查询（带缓存） ====================

    /**
     * 获取文章详情（带缓存）
     * <p>
     * 缓存策略：
     * <ul>
     *   <li>缓存 key: article::{id}</li>
     *   <li>过期时间: 由 CacheManager 配置（默认 30 分钟）</li>
     *   <li>条件: 结果不为 null 时才缓存（unless）</li>
     * </ul>
     * </p>
     *
     * <p>执行流程：</p>
     * <ol>
     *   <li>Spring Cache 拦截器先检查 Redis 中是否有 key 为 article::{id} 的缓存</li>
     *   <li>如果命中：直接返回缓存数据，不执行方法体</li>
     *   <li>如果未命中：执行方法体，将返回值写入缓存</li>
     * </ol>
     *
     * @param id 文章ID
     * @return 文章详情 VO
     */
    @Cacheable(key = "#id", unless = "#result == null")
    @Override
    public ArticleVO getDetail(Long id) {
        log.info("[缓存] MISS - article::{}", id);

        // 查询文章基本信息
        Article article = articleMapper.selectById(id);
        if (article == null) {
            return null; // 返回 null 不会缓存（因为 unless = "#result == null"）
        }

        // 转换为 VO
        ArticleVO vo = convertToVO(article);

        // 增加阅读量（通过 Redis ZSet 计数器，不直接更新数据库）
        articleRankingService.incrementViewCount(id);

        return vo;
    }

    /**
     * 分页查询文章列表
     * <p>
     * 列表接口通常不使用缓存，因为筛选条件多、组合复杂。
     * 如果需要缓存，建议使用自定义 key 拼接策略。
     * </p>
     *
     * @param pageNum    页码
     * @param pageSize   每页数量
     * @param categoryId 分类ID（可选）
     * @param keyword    搜索关键词（可选）
     * @return 分页结果
     */
    @Override
    public Page<ArticleListVO> page(Integer pageNum, Integer pageSize,
                                    Long categoryId, String keyword) {
        Page<Article> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        // 只查询已发布的文章
        wrapper.eq(Article::getStatus, 1);
        // 按分类筛选
        wrapper.eq(categoryId != null, Article::getCategoryId, categoryId);
        // 按关键词搜索标题和摘要
        wrapper.and(StringUtils.hasText(keyword), w ->
                w.like(Article::getTitle, keyword)
                 .or()
                 .like(Article::getSummary, keyword));
        // 按创建时间降序
        wrapper.orderByDesc(Article::getCreateTime);

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        // 转换为 VO 分页
        Page<ArticleListVO> voPage = new Page<>();
        voPage.setCurrent(articlePage.getCurrent());
        voPage.setSize(articlePage.getSize());
        voPage.setTotal(articlePage.getTotal());
        voPage.setRecords(articlePage.getRecords().stream()
                .map(this::convertToListVO)
                .collect(Collectors.toList()));

        return voPage;
    }

    // ==================== 写入（清除缓存） ====================

    /**
     * 创建文章
     * <p>
     * 创建操作不需要缓存注解（新数据无缓存可清除）。
     * 创建后会自动被下一次 getDetail 调用缓存。
     * </p>
     *
     * @param dto 创建参数
     * @return 文章ID
     */
    @Transactional
    @Override
    public Long create(ArticleCreateDTO dto) {
        Article article = new Article();
        article.setTitle(dto.getTitle());
        article.setSummary(dto.getSummary());
        article.setContent(dto.getContent());
        article.setCategoryId(dto.getCategoryId());
        article.setCoverImage(dto.getCoverImage());
        article.setStatus(Boolean.TRUE.equals(dto.getPublished()) ? 1 : 0);
        article.setViewCount(0L);

        article.setCreateTime(LocalDateTime.now());

        articleMapper.insert(article);
        log.info("文章创建成功，ID: {}", article.getId());

        return article.getId();
    }

    /**
     * 更新文章
     * <p>
     * 使用 @CacheEvict 在方法执行成功后清除对应文章的缓存。
     * 这样下次查询时会从数据库加载最新数据并重新缓存。
     * </p>
     *
     * <p>执行顺序：</p>
     * <ol>
     *   <li>执行方法体（更新数据库）</li>
     *   <li>方法正常返回后，删除 key 为 article::{id} 的缓存</li>
     * </ol>
     *
     * @param id  文章ID
     * @param dto 更新参数
     */
    @CacheEvict(key = "#id")
    @Transactional
    @Override
    public void update(Long id, ArticleUpdateDTO dto) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new RuntimeException("文章不存在");
        }

        // 更新非空字段
        if (StringUtils.hasText(dto.getTitle())) {
            article.setTitle(dto.getTitle());
        }
        if (dto.getSummary() != null) {
            article.setSummary(dto.getSummary());
        }
        if (StringUtils.hasText(dto.getContent())) {
            article.setContent(dto.getContent());
        }
        if (dto.getCategoryId() != null) {
            article.setCategoryId(dto.getCategoryId());
        }
        if (dto.getCoverImage() != null) {
            article.setCoverImage(dto.getCoverImage());
        }
        if (dto.getStatus() != null) {
            article.setStatus(dto.getStatus());
        }

        articleMapper.updateById(article);
        log.info("文章更新成功，ID: {}", id);
    }

    /**
     * 删除文章
     * <p>
     * 使用 @CacheEvict 清除被删除文章的缓存。
     * </p>
     *
     * @param id 文章ID
     */
    @CacheEvict(key = "#id")
    @Transactional
    @Override
    public void delete(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new RuntimeException("文章不存在");
        }

        // 软删除：修改状态为已删除
        LambdaUpdateWrapper<Article> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Article::getId, id)
                .set(Article::getStatus, -1);
        articleMapper.update(null, updateWrapper);

        log.info("文章删除成功，ID: {}", id);
    }

    /**
     * 批量更新文章状态
     * <p>
     * 使用 @CacheEvict(allEntries = true) 清除所有文章缓存。
     * 因为批量操作涉及多篇文章，逐条清除效率低且可能遗漏。
     * </p>
     *
     * @param ids    文章ID列表
     * @param status 目标状态
     */
    @CacheEvict(allEntries = true)
    @Override
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        LambdaUpdateWrapper<Article> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.in(Article::getId, ids)
                .set(Article::getStatus, status);
        articleMapper.update(null, updateWrapper);
        log.info("批量更新文章状态，数量: {}, 状态: {}", ids.size(), status);
    }

    // ==================== 私有转换方法 ====================

    /**
     * 将 Article 实体转换为 ArticleVO（详情页用）
     */
    private ArticleVO convertToVO(Article article) {
        ArticleVO vo = new ArticleVO();
        vo.setId(article.getId());
        vo.setTitle(article.getTitle());
        vo.setSummary(article.getSummary());
        vo.setContent(article.getContent());
        vo.setCategoryId(article.getCategoryId());
        vo.setCoverImage(article.getCoverImage());
        vo.setStatus(article.getStatus());
        vo.setViewCount(article.getViewCount());
        vo.setCreateTime(article.getCreateTime());
        return vo;
    }

    /**
     * 将 Article 实体转换为 ArticleListVO（列表页用）
     */
    private ArticleListVO convertToListVO(Article article) {
        ArticleListVO vo = new ArticleListVO();
        vo.setId(article.getId());
        vo.setTitle(article.getTitle());
        vo.setSummary(article.getSummary());
        vo.setCoverImage(article.getCoverImage());
        vo.setViewCount(article.getViewCount());
        vo.setCreateTime(article.getCreateTime());
        return vo;
    }
}
