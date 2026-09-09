package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.entity.Article;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.service.ArticleRankingService;
import com.example.blog.vo.ArticleRankingVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 热门文章排行榜 Service 实现
 * <p>
 * 使用 Redis 的 ZSet（有序集合）实现实时热门文章排行榜。
 * </p>
 *
 * <h3>ZSet 数据结构说明：</h3>
 * <pre>
 * Key:    article:ranking:views
 * Member: 文章ID（String 类型，如 "1", "2", "3"）
 * Score:  阅读量（Double 类型，如 1.0, 100.0）
 *
 * ZSet 按 Score 升序排列，使用 ZREVRANGE 获取降序（热门在前）的结果。
 * </pre>
 *
 * <h3>核心 Redis 命令：</h3>
 * <ul>
 *   <li>ZINCRBY — 文章被访问时，score +1</li>
 *   <li>ZREVRANGE WITHSCORES — 获取 Top N 热门文章</li>
 *   <li>ZSCORE — 获取某篇文章的阅读量</li>
 *   <li>ZRANK / ZREVRANK — 获取排名</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleRankingServiceImpl implements ArticleRankingService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ArticleMapper articleMapper;

    /**
     * Redis ZSet 的 Key
     * <p>所有文章的阅读量数据存储在这个 ZSet 中</p>
     */
    private static final String RANKING_KEY = "article:ranking:views";

    // ==================== 阅读量递增 ====================

    /**
     * 文章阅读量 +1
     * <p>
     * 使用 ZINCRBY 命令原子性地递增 score。
     * 如果文章 ID 不在 ZSet 中，Redis 会自动创建（初始 score 为 1）。
     * </p>
     *
     * <p>Redis 命令等价于：</p>
     * <pre>
     * ZINCRBY article:ranking:views 1 "100"
     * </pre>
     *
     * @param articleId 文章ID
     */
    @Override
    public void incrementViewCount(Long articleId) {
        Double newScore = stringRedisTemplate.opsForZSet()
                .incrementScore(RANKING_KEY, String.valueOf(articleId), 1);
        log.debug("文章 {} 阅读量递增，当前值: {}", articleId, newScore);
    }

    // ==================== 获取排行榜 ====================

    /**
     * 获取热门文章排行榜（Top N）
     * <p>
     * 使用 ZREVRANGE 命令按 score 降序取出前 N 个元素。
     * 然后根据文章 ID 批量查询文章信息，组装返回数据。
     * </p>
     *
     * <p>Redis 命令等价于：</p>
     * <pre>
     * ZREVRANGE article:ranking:views 0 9 WITHSCORES
     * </pre>
     *
     * @param count 要获取的数量
     * @return 排行榜列表
     */
    @Override
    public List<ArticleRankingVO> getTopArticles(int count) {
        if (count <= 0) {
            return Collections.emptyList();
        }

        // 从 ZSet 中获取分数最高的 N 个元素（降序）
        Set<ZSetOperations.TypedTuple<String>> tuples = stringRedisTemplate.opsForZSet()
                .reverseRangeWithScores(RANKING_KEY, 0, (long) count - 1);

        if (tuples == null || tuples.isEmpty()) {
            log.info("排行榜为空");
            return Collections.emptyList();
        }

        // 组装返回数据
        List<ArticleRankingVO> result = tuples.stream()
                .map(tuple -> {
                    try {
                        Long articleId = Long.valueOf(tuple.getValue());
                        Double score = tuple.getScore();

                        // 查询文章基本信息（只需要标题和封面）
                        Article article = articleMapper.selectById(articleId);
                        if (article == null || article.getStatus() == -1) {
                            // 文章不存在或已删除，跳过
                            return null;
                        }

                        ArticleRankingVO vo = new ArticleRankingVO();
                        vo.setArticleId(articleId);
                        vo.setTitle(article.getTitle());
                        vo.setCoverImage(article.getCoverImage());
                        vo.setViewCount(score != null ? score.longValue() : 0L);
                        return vo;
                    } catch (Exception e) {
                        log.warn("解析排行榜数据失败: {}", tuple.getValue(), e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)  // 过滤掉 null（已删除的文章）
                .collect(Collectors.toList());

        log.info("获取热门文章排行 Top {}，实际返回 {} 条", count, result.size());
        return result;
    }

    // ==================== 获取单篇文章阅读量 ====================

    /**
     * 获取指定文章的阅读量（来自 Redis）
     * <p>
     * 使用 ZSCORE 命令获取指定 member 的 score。
     * </p>
     *
     * <p>Redis 命令等价于：</p>
     * <pre>
     * ZSCORE article:ranking:views "100"
     * </pre>
     *
     * @param articleId 文章ID
     * @return 阅读量
     */
    @Override
    public Long getViewCount(Long articleId) {
        Double score = stringRedisTemplate.opsForZSet()
                .score(RANKING_KEY, String.valueOf(articleId));
        return score != null ? score.longValue() : 0L;
    }

    // ==================== 初始化排行数据 ====================

    /**
     * 初始化排行榜数据
     * <p>
     * 从数据库加载所有已发布文章的阅读量到 Redis ZSet 中。
     * 适用于以下场景：
     * <ul>
     *   <li>系统首次部署时，Redis 中没有排行数据</li>
     *   <li>Redis 数据丢失后恢复</li>
     *   <li>管理员手动触发重新初始化</li>
     * </ul>
     * </p>
     *
     * <p>注意：大数据量时应分批加载，避免阻塞 Redis。</p>
     */
    @Override
    public void initRankingData() {
        log.info("开始初始化文章排行榜数据...");

        // 查询所有已发布的文章（status = 1）
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getStatus, 1)
                .select(Article::getId, Article::getViewCount);

        List<Article> articles = articleMapper.selectList(wrapper);

        if (articles.isEmpty()) {
            log.info("没有已发布的文章，跳过初始化");
            return;
        }

        // 批量写入 Redis ZSet
        int count = 0;
        for (Article article : articles) {
            if (article.getViewCount() != null && article.getViewCount() > 0) {
                stringRedisTemplate.opsForZSet()
                        .add(RANKING_KEY,
                                String.valueOf(article.getId()),
                                article.getViewCount().doubleValue());
                count++;
            }
        }

        log.info("排行榜数据初始化完成，写入 {} 条记录", count);
    }

    // ==================== 重置排行榜 ====================

    /**
     * 重置排行榜
     * <p>删除整个 ZSet Key，清空所有排行数据。</p>
     */
    @Override
    public void resetRanking() {
        Boolean deleted = stringRedisTemplate.delete(RANKING_KEY);
        log.info("排行榜已重置，删除结果: {}", deleted);
    }

    // ==================== 定时同步 ====================

    /**
     * 定时将 Redis 中的阅读量同步到数据库
     * <p>
     * 文章每次被访问时，阅读量只在 Redis 中递增（高性能），
     * 通过定时任务定期将 Redis 中的最新值同步到 MySQL，保证数据持久化。
     * </p>
     *
     * <p>调度策略：每 10 分钟执行一次</p>
     *
     * <p>注意：生产环境中，如果文章数量很大，应分批同步。</p>
     */
    @Scheduled(fixedRate = 600000)  // 每 10 分钟（600000 毫秒）
    public void syncViewCountToDatabase() {
        log.info("开始同步文章阅读量到数据库...");

        // 获取 ZSet 中的所有数据
        Set<ZSetOperations.TypedTuple<String>> tuples = stringRedisTemplate.opsForZSet()
                .rangeWithScores(RANKING_KEY, 0, -1);

        if (tuples == null || tuples.isEmpty()) {
            log.info("没有需要同步的数据");
            return;
        }

        int syncCount = 0;
        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            try {
                Long articleId = Long.valueOf(tuple.getValue());
                Long viewCount = tuple.getScore() != null ? tuple.getScore().longValue() : 0L;

                // 更新数据库中的阅读量
                Article article = new Article();
                article.setId(articleId);
                article.setViewCount(viewCount);
                articleMapper.updateById(article);
                syncCount++;
            } catch (Exception e) {
                log.warn("同步文章阅读量失败: articleId={}", tuple.getValue(), e);
            }
        }

        log.info("文章阅读量同步完成，共同步 {} 篇文章", syncCount);
    }
}
