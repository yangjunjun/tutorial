package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.common.BusinessException;
import com.example.blog.common.ResultCode;
import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.entity.Article;
import com.example.blog.entity.Category;
import com.example.blog.entity.User;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.CategoryMapper;
import com.example.blog.mapper.UserMapper;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleDetailVO;
import com.example.blog.vo.ArticleVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文章 Service 实现类
 * <p>
 * 包含文章 CRUD 的完整业务逻辑。每个方法都遵循以下模式：
 * <ol>
 *   <li>参数校验（业务级别的校验，如"分类是否存在"）</li>
 *   <li>业务逻辑处理（如自动截取摘要、浏览量自增）</li>
 *   <li>DTO/Entity/VO 之间的转换</li>
 *   <li>调用 Mapper 执行数据库操作</li>
 * </ol>
 * </p>
 *
 * <p>注意：代码中的 {@code isBlank()} 检查均使用 JDK 8 兼容写法
 * {@code trim().isEmpty()}（{@code String#isBlank()} 是 JDK 11 才引入的）。</p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    private static final Logger log = LoggerFactory.getLogger(ArticleServiceImpl.class);

    /** 摘要自动截取的最大长度 */
    private static final int SUMMARY_MAX_LENGTH = 200;

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private UserMapper userMapper;

    // ==================== 创建文章 ====================

    /**
     * 创建文章
     * <p>
     * 使用 {@code @Transactional} 保证事务一致性：
     * 如果中间步骤失败（如分类校验通过但插入失败），会回滚所有操作。
     * </p>
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createArticle(ArticleCreateDTO dto, Long authorId) {
        // 1. 校验分类是否存在
        Category category = categoryMapper.selectById(dto.getCategoryId());
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // 2. DTO → Entity 转换
        Article article = new Article();
        article.setTitle(dto.getTitle());
        article.setContent(dto.getContent());
        article.setCategoryId(dto.getCategoryId());
        article.setAuthorId(authorId);
        article.setCoverImage(dto.getCoverImage());

        // 3. 自动生成摘要：如果前端未提供 summary，则从 content 中截取前 200 字
        if (dto.getSummary() != null && !dto.getSummary().trim().isEmpty()) {
            article.setSummary(dto.getSummary());
        } else {
            article.setSummary(generateSummary(dto.getContent()));
        }

        // 4. 设置默认值
        article.setViewCount(0);
        article.setLikeCount(0);
        article.setCommentCount(0);
        article.setStatus(1); // 1=已发布

        // 5. 插入数据库
        articleMapper.insert(article);

        log.info("文章创建成功: id={}, title={}, authorId={}", article.getId(), article.getTitle(), authorId);
        return article.getId();
    }

    // ==================== 更新文章 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateArticle(ArticleUpdateDTO dto, Long operatorId) {
        // 1. 查询文章是否存在
        Article article = articleMapper.selectById(dto.getId());
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 2. 权限检查：只有作者本人可以修改（此处简化，实际项目中还应检查管理员权限）
        if (!article.getAuthorId().equals(operatorId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有作者本人可以修改此文章");
        }

        // 3. 如果修改了分类，校验新分类是否存在
        if (dto.getCategoryId() != null && !dto.getCategoryId().equals(article.getCategoryId())) {
            Category category = categoryMapper.selectById(dto.getCategoryId());
            if (category == null) {
                throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
            }
            article.setCategoryId(dto.getCategoryId());
        }

        // 4. 更新字段
        article.setTitle(dto.getTitle());
        article.setContent(dto.getContent());
        article.setCoverImage(dto.getCoverImage());

        // 摘要处理
        if (dto.getSummary() != null && !dto.getSummary().trim().isEmpty()) {
            article.setSummary(dto.getSummary());
        } else {
            article.setSummary(generateSummary(dto.getContent()));
        }

        // 5. 更新数据库（MyBatis-Plus 会自动更新非 null 字段）
        articleMapper.updateById(article);

        log.info("文章更新成功: id={}, operatorId={}", article.getId(), operatorId);
    }

    // ==================== 查询文章详情 ====================

    @Override
    public ArticleDetailVO getArticleDetail(Long id) {
        // 1. 查询文章
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 2. 浏览量 +1（使用 LambdaUpdateWrapper 避免并发问题）
        LambdaUpdateWrapper<Article> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Article::getId, id)
                .setSql("view_count = view_count + 1");
        articleMapper.update(null, updateWrapper);

        // 3. 构建详情 VO
        ArticleDetailVO vo = new ArticleDetailVO();
        vo.setId(article.getId());
        vo.setTitle(article.getTitle());
        vo.setContent(article.getContent());
        vo.setSummary(article.getSummary());
        vo.setCoverImage(article.getCoverImage());
        vo.setCategoryId(article.getCategoryId());
        vo.setAuthorId(article.getAuthorId());
        vo.setViewCount(article.getViewCount() + 1); // 展示加 1 后的值
        vo.setLikeCount(article.getLikeCount());
        vo.setCommentCount(article.getCommentCount());
        vo.setStatus(article.getStatus());
        vo.setCreateTime(article.getCreateTime());
        vo.setUpdateTime(article.getUpdateTime());

        // 4. 关联查询分类名称
        Category category = categoryMapper.selectById(article.getCategoryId());
        if (category != null) {
            vo.setCategoryName(category.getName());
        }

        // 5. 关联查询作者信息
        User author = userMapper.selectById(article.getAuthorId());
        if (author != null) {
            vo.setAuthorNickname(author.getNickname());
            vo.setAuthorAvatar(author.getAvatar());
        }

        // 6. 标签查询（暂留空列表，标签模块在后续章节实现）
        vo.setTags(new ArrayList<ArticleDetailVO.TagInfo>());

        return vo;
    }

    // ==================== 分页查询文章列表 ====================

    @Override
    public List<ArticleVO> listArticles(int pageNum, int pageSize, Long categoryId) {
        // 1. 构建查询条件
        LambdaQueryWrapper<Article> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Article::getStatus, 1); // 只查询已发布的文章

        // 如果指定了分类 ID，添加分类过滤条件
        if (categoryId != null) {
            queryWrapper.eq(Article::getCategoryId, categoryId);
        }

        // 按创建时间倒序排列（最新文章在前）
        queryWrapper.orderByDesc(Article::getCreateTime);

        // 2. 执行分页查询
        Page<Article> page = new Page<Article>(pageNum, pageSize);
        Page<Article> resultPage = articleMapper.selectPage(page, queryWrapper);

        // 3. 批量查询分类信息（避免 N+1 查询问题）
        List<Article> articles = resultPage.getRecords();
        if (articles.isEmpty()) {
            return Collections.emptyList();
        }

        // 提取所有分类 ID（去重）
        List<Long> categoryIds = new ArrayList<Long>();
        for (Article article : articles) {
            if (!categoryIds.contains(article.getCategoryId())) {
                categoryIds.add(article.getCategoryId());
            }
        }

        // 批量查询分类
        List<Category> categories = categoryMapper.selectBatchIds(categoryIds);
        // 构建 categoryId → categoryName 映射
        // 注意：JDK 8 中不能使用 var，需显式声明 Map<String, String> 类型
        Map<Long, String> categoryMap = new HashMap<Long, String>();
        for (Category category : categories) {
            categoryMap.put(category.getId(), category.getName());
        }

        // 批量查询作者信息
        List<Long> authorIds = new ArrayList<Long>();
        for (Article article : articles) {
            if (!authorIds.contains(article.getAuthorId())) {
                authorIds.add(article.getAuthorId());
            }
        }
        List<User> authors = userMapper.selectBatchIds(authorIds);
        Map<Long, String> authorMap = new HashMap<Long, String>();
        for (User author : authors) {
            authorMap.put(author.getId(), author.getNickname());
        }

        // 4. Entity → VO 转换
        List<ArticleVO> voList = new ArrayList<ArticleVO>();
        for (Article article : articles) {
            ArticleVO vo = new ArticleVO();
            vo.setId(article.getId());
            vo.setTitle(article.getTitle());
            vo.setSummary(article.getSummary());
            vo.setCoverImage(article.getCoverImage());
            vo.setCategoryId(article.getCategoryId());
            vo.setCategoryName(categoryMap.get(article.getCategoryId()) == null
                    ? "未知分类" : categoryMap.get(article.getCategoryId()));
            vo.setAuthorId(article.getAuthorId());
            vo.setAuthorName(authorMap.get(article.getAuthorId()) == null
                    ? "匿名用户" : authorMap.get(article.getAuthorId()));
            vo.setViewCount(article.getViewCount());
            vo.setLikeCount(article.getLikeCount());
            vo.setCommentCount(article.getCommentCount());
            vo.setStatus(article.getStatus());
            vo.setCreateTime(article.getCreateTime());
            vo.setUpdateTime(article.getUpdateTime());
            voList.add(vo);
        }
        return voList;
    }

    // ==================== 删除文章 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteArticle(Long id, Long operatorId) {
        // 1. 查询文章是否存在
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 2. 权限检查：只有作者本人可以删除
        if (!article.getAuthorId().equals(operatorId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有作者本人可以删除此文章");
        }

        // 3. 逻辑删除（MyBatis-Plus 的 @TableLogic 会自动转为 UPDATE 操作）
        articleMapper.deleteById(id);

        log.info("文章删除成功: id={}, operatorId={}", id, operatorId);
    }

    // ==================== 私有工具方法 ====================

    /**
     * 从文章内容中自动生成摘要
     * <p>
     * 去除 Markdown 标记后，截取前 200 个字符。
     * 如果内容不足 200 字，则使用全文作为摘要。
     * </p>
     *
     * @param content 文章原始内容（Markdown 格式）
     * @return 生成的摘要文本
     */
    private String generateSummary(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }

        // 简单去除 Markdown 标记（#、*、`、> 等）
        String plainText = content.replaceAll("[#*`>\\-\\[\\]!]", "")
                .replaceAll("\\s+", " ")
                .trim();

        // 截取前 200 字符
        if (plainText.length() > SUMMARY_MAX_LENGTH) {
            return plainText.substring(0, SUMMARY_MAX_LENGTH) + "...";
        }
        return plainText;
    }
}
