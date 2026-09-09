package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.dto.ArticleQueryDTO;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.PageVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 文章服务实现类
 * <p>
 * 实现文章分页查询的核心逻辑，包括：
 * 1. 参数校验与默认值设置
 * 2. 调用 Mapper 执行分页查询（MyBatis-Plus 分页插件自动处理）
 * 3. 补充标签信息（多对多关系需要额外查询）
 * 4. 封装为 PageVO 返回
 *
 * @author tutorial
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    private static final Logger log = LoggerFactory.getLogger(ArticleServiceImpl.class);

    /**
     * 允许的排序字段白名单
     * <p>
     * 用于防止 SQL 注入。因为排序字段是动态传入的，
     * 如果直接使用 ${sortBy} 拼接 SQL，攻击者可以注入恶意 SQL。
     * 通过白名单校验，只允许预定义的字段参与排序。
     * <p>
     * 注意 JDK 8 兼容性：这里使用 Arrays.asList + HashSet 构造集合，
     * 而不能使用 JDK 9+ 的 Set.of() 方法。
     */
    private static final Set<String> ALLOWED_SORT_FIELDS = new HashSet<>(
            Arrays.asList("createTime", "viewCount", "likeCount", "updateTime")
    );

    /**
     * 允许的排序方向白名单
     */
    private static final Set<String> ALLOWED_SORT_ORDERS = new HashSet<>(
            Arrays.asList("asc", "desc")
    );

    private final ArticleMapper articleMapper;

    public ArticleServiceImpl(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    /**
     * 分页查询文章列表（管理后台，可查看所有状态的文章）
     * <p>
     * 核心流程：
     * 1. 校验和规范化查询参数
     * 2. 创建 MyBatis-Plus Page 对象
     * 3. 根据是否有 tagId 选择不同的查询方式
     * 4. 为每条文章补充标签信息
     * 5. 封装为 PageVO 返回
     *
     * @param queryDTO 查询参数 DTO
     * @return 分页结果
     */
    @Override
    public PageVO<ArticleListVO> getArticlePage(ArticleQueryDTO queryDTO) {
        // ========== 第一步：校验和规范化参数 ==========
        validateAndNormalizeParams(queryDTO);

        log.debug("文章分页查询参数: current={}, size={}, keyword={}, " +
                        "categoryId={}, tagId={}, status={}, sortBy={}, sortOrder={}",
                queryDTO.getCurrent(), queryDTO.getSize(),
                queryDTO.getKeyword(), queryDTO.getCategoryId(),
                queryDTO.getTagId(), queryDTO.getStatus(),
                queryDTO.getSortBy(), queryDTO.getSortOrder());

        // ========== 第二步：创建分页对象 ==========
        // Page 对象包含当前页码和每页大小
        // MyBatis-Plus 的分页插件会拦截此参数，自动改写 SQL
        Page<ArticleListVO> page = new Page<>(
                queryDTO.getCurrent(),
                queryDTO.getSize()
        );

        // ========== 第三步：执行分页查询 ==========
        IPage<ArticleListVO> resultPage;

        if (queryDTO.getTagId() != null) {
            // 按标签查询：需要关联中间表，使用自定义 SQL
            resultPage = articleMapper.selectArticlePageByTagId(
                    page,
                    queryDTO.getTagId(),
                    queryDTO.getStatus()
            );
        } else {
            // 通用查询：支持分类、关键词、状态筛选
            resultPage = articleMapper.selectArticlePage(
                    page,
                    queryDTO.getCategoryId(),
                    queryDTO.getStatus(),
                    queryDTO.getKeyword(),
                    queryDTO.getSortBy(),
                    queryDTO.getSortOrder()
            );
        }

        // ========== 第四步：补充标签信息 ==========
        // 多表联查已经获取了分类名和作者名，
        // 但标签是多对多关系，需要额外查询
        List<ArticleListVO> records = resultPage.getRecords();
        fillTags(records);

        // ========== 第五步：封装为 PageVO 返回 ==========
        return PageVO.of(resultPage, records);
    }

    /**
     * 分页查询公开文章列表（前台接口，只返回已发布的文章）
     * <p>
     * 与 getArticlePage 的区别：
     * - 强制 status = 1（已发布）
     * - 忽略前端传入的 status 参数
     *
     * @param queryDTO 查询参数 DTO
     * @return 分页结果
     */
    @Override
    public PageVO<ArticleListVO> getPublicArticlePage(ArticleQueryDTO queryDTO) {
        // 强制设置为"已发布"状态，防止前端传入其他状态
        queryDTO.setStatus(1);

        return getArticlePage(queryDTO);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 校验和规范化查询参数
     * <p>
     * 主要处理：
     * 1. 分页参数默认值和边界值
     * 2. 排序字段白名单校验（防止 SQL 注入）
     * 3. 关键词去除前后空格
     *
     * @param queryDTO 查询参数 DTO
     */
    private void validateAndNormalizeParams(ArticleQueryDTO queryDTO) {
        // --- 分页参数校验 ---
        if (queryDTO.getCurrent() == null || queryDTO.getCurrent() < 1) {
            queryDTO.setCurrent(1);
        }
        if (queryDTO.getSize() == null || queryDTO.getSize() < 1) {
            queryDTO.setSize(10);
        }
        if (queryDTO.getSize() > 100) {
            queryDTO.setSize(100);  // 防止一次查询过多数据
        }

        // --- 排序字段白名单校验（防止 SQL 注入）---
        String sortBy = queryDTO.getSortBy();
        if (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            queryDTO.setSortBy("createTime");  // 使用默认排序字段
        }

        // --- 排序方向白名单校验 ---
        String sortOrder = queryDTO.getSortOrder();
        if (sortOrder == null || !ALLOWED_SORT_ORDERS.contains(sortOrder.toLowerCase())) {
            queryDTO.setSortOrder("desc");  // 使用默认排序方向
        }

        // --- 关键词处理 ---
        if (queryDTO.getKeyword() != null) {
            // 去除前后空格
            String keyword = queryDTO.getKeyword().trim();
            // 空字符串视为无关键词
            queryDTO.setKeyword(keyword.isEmpty() ? null : keyword);
        }
    }

    /**
     * 为文章列表填充标签信息
     * <p>
     * 由于标签是多对多关系（文章-标签通过中间表关联），
     * 在主查询中不方便直接联查，所以单独查询后填充。
     * <p>
     * 优化思路（TODO - 后续章节可扩展）：
     * 1. 批量查询所有文章的标签（避免 N+1 查询问题）
     * 2. 使用 Redis 缓存文章标签
     * 3. 在文章表中使用 JSON 字段冗余存储标签名
     *
     * @param records 文章列表
     */
    private void fillTags(List<ArticleListVO> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        // TODO: 批量查询标签，避免 N+1 查询问题
        // 当前版本先设置为空列表，后续章节实现完整的标签查询
        for (ArticleListVO article : records) {
            article.setTags(Collections.<String>emptyList());
        }

        /*
         * 完整的实现思路（供参考）：
         *
         * // 1. 收集所有文章 ID
         * List<Long> articleIds = records.stream()
         *     .map(ArticleListVO::getId)
         *     .collect(Collectors.toList());
         *
         * // 2. 批量查询 article_tag 和 tag 表
         * List<ArticleTagVO> articleTags = tagMapper
         *     .selectTagsByArticleIds(articleIds);
         *
         * // 3. 按文章 ID 分组
         * Map<Long, List<String>> tagMap = articleTags.stream()
         *     .collect(Collectors.groupingBy(
         *         ArticleTagVO::getArticleId,
         *         Collectors.mapping(
         *             ArticleTagVO::getTagName,
         *             Collectors.toList()
         *         )
         *     ));
         *
         * // 4. 填充到每条文章中
         * for (ArticleListVO article : records) {
         *     article.setTags(
         *         tagMap.getOrDefault(article.getId(), Collections.emptyList())
         *     );
         * }
         */
    }
}
