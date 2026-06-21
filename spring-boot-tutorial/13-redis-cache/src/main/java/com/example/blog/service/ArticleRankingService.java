package com.example.blog.service;

import com.example.blog.vo.ArticleRankingVO;

import java.util.List;

/**
 * 热门文章排行榜 Service 接口
 * <p>
 * 使用 Redis 的 ZSet（有序集合）数据结构实现实时排行榜。
 * ZSet 中的 Member 为文章ID，Score 为阅读量（或综合评分）。
 * </p>
 *
 * <p>核心特性：</p>
 * <ul>
 *   <li>实时性：每次访问文章详情页都会递增阅读量</li>
 *   <li>高性能：ZSet 的 ZINCRBY 操作时间复杂度为 O(log N)</li>
 *   <li>原子性：Redis 的递增操作是原子的，支持高并发</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
public interface ArticleRankingService {

    /**
     * 文章阅读量 +1
     * <p>
     * 当用户访问文章详情页时调用。
     * 使用 ZINCRBY 命令原子性地将文章的 score 加 1。
     * 如果文章不在 ZSet 中，会自动添加（初始 score 为 1）。
     * </p>
     *
     * @param articleId 文章ID
     */
    void incrementViewCount(Long articleId);

    /**
     * 获取热门文章排行榜（Top N）
     * <p>
     * 从 ZSet 中按 score 降序取出前 N 篇文章，
     * 再根据文章ID查询文章标题等信息组装返回。
     * </p>
     *
     * @param count 要获取的数量（如 Top 10）
     * @return 排行榜列表（按阅读量降序）
     */
    List<ArticleRankingVO> getTopArticles(int count);

    /**
     * 获取指定文章的阅读量（来自 Redis 计数器）
     * <p>
     * 注意：这个值是 Redis 中的实时计数，
     * 可能与数据库中的 viewCount 字段有差异（定时同步）。
     * </p>
     *
     * @param articleId 文章ID
     * @return 阅读量，如果文章不存在于排行中则返回 0
     */
    Long getViewCount(Long articleId);

    /**
     * 批量初始化排行数据
     * <p>
     * 在系统启动或排行榜重置时，从数据库加载现有文章的阅读量
     * 到 Redis ZSet 中，作为初始数据。
     * </p>
     */
    void initRankingData();

    /**
     * 重置排行榜
     * <p>清空 ZSet 中的所有数据。管理后台使用，谨慎操作。</p>
     */
    void resetRanking();
}
