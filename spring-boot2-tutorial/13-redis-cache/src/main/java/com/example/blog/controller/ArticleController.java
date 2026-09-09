package com.example.blog.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.common.Result;
import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.service.ArticleRankingService;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.ArticleRankingVO;
import com.example.blog.vo.ArticleVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

/**
 * 文章管理 Controller（含 Redis 缓存 + 热门排行）
 * <p>
 * 相比之前章节的 ArticleController，本章新增了以下内容：
 * <ul>
 *   <li>热门文章排行接口（基于 Redis ZSet）</li>
 *   <li>文章阅读量实时显示（来自 Redis 计数器）</li>
 *   <li>排行榜数据初始化接口</li>
 * </ul>
 * </p>
 *
 * <p>缓存说明：</p>
 * <p>文章详情接口通过 @Cacheable 注解自动缓存，
 * 文章更新/删除接口通过 @CacheEvict 注解自动清除缓存。
 * 这些逻辑在 Service 层实现，Controller 层无需关心。</p>
 *
 * <p><b>Spring Boot 2.5.12 适配说明：</b></p>
 * <ul>
 *   <li>参数校验注解使用 javax.validation.Valid（Spring Boot 3 为 jakarta.validation.Valid）</li>
 *   <li>Swagger 注解使用 springfox 3.0.0 的 @Api/@ApiOperation/@ApiParam（第 12 章引入）</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Api(tags = "文章管理", description = "文章的增删改查 + 热门排行接口")
public class ArticleController {

    private final ArticleService articleService;
    private final ArticleRankingService articleRankingService;

    // ==================== 文章 CRUD ====================

    /**
     * 获取文章详情
     * <p>
     * 该接口已在 Service 层通过 @Cacheable 实现缓存。
     * 首次访问查数据库并缓存，后续访问直接返回缓存数据。
     * 每次访问还会通过 Redis ZSet 递增阅读量。
     * </p>
     *
     * @param id 文章ID
     * @return 文章详情
     */
    @GetMapping("/{id}")
    @ApiOperation(value = "获取文章详情", notes = "根据ID获取文章完整信息（带缓存）")
    public Result<ArticleVO> getById(
            @ApiParam(value = "文章ID", example = "1") @PathVariable Long id) {
        ArticleVO article = articleService.getDetail(id);
        if (article == null) {
            return Result.fail(404, "文章不存在");
        }
        // 补充 Redis 中的实时阅读量（比数据库中的更实时）
        Long redisViewCount = articleRankingService.getViewCount(id);
        if (redisViewCount > 0) {
            article.setViewCount(redisViewCount);
        }
        return Result.ok(article);
    }

    /**
     * 文章列表（分页）
     *
     * @param pageNum    页码
     * @param pageSize   每页数量
     * @param categoryId 分类ID（可选）
     * @param keyword    搜索关键词（可选）
     * @return 分页结果
     */
    @GetMapping
    @ApiOperation(value = "文章列表（分页）", notes = "分页查询已发布的文章列表")
    public Result<Page<ArticleListVO>> page(
            @ApiParam(value = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @ApiParam(value = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @ApiParam(value = "分类ID") @RequestParam(required = false) Long categoryId,
            @ApiParam(value = "搜索关键词") @RequestParam(required = false) String keyword) {
        return Result.ok(articleService.page(pageNum, pageSize, categoryId, keyword));
    }

    /**
     * 创建文章
     *
     * @param dto 创建参数
     * @return 文章ID
     */
    @PostMapping
    @ApiOperation(value = "创建文章", notes = "创建新的博客文章")
    public Result<Long> create(
            @RequestBody @Valid ArticleCreateDTO dto) {
        return Result.ok(articleService.create(dto));
    }

    /**
     * 更新文章
     * <p>
     * 更新成功后会自动清除该文章的缓存（@CacheEvict），
     * 下次查询时会从数据库加载最新数据并重新缓存。
     * </p>
     *
     * @param id  文章ID
     * @param dto 更新参数
     * @return 操作结果
     */
    @PutMapping("/{id}")
    @ApiOperation(value = "更新文章", notes = "更新文章信息（自动清除缓存）")
    public Result<Void> update(
            @ApiParam(value = "文章ID") @PathVariable Long id,
            @RequestBody @Valid ArticleUpdateDTO dto) {
        articleService.update(id, dto);
        return Result.ok();
    }

    /**
     * 删除文章
     * <p>
     * 删除成功后会自动清除该文章的缓存。
     * </p>
     *
     * @param id 文章ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    @ApiOperation(value = "删除文章", notes = "删除文章（自动清除缓存）")
    public Result<Void> delete(
            @ApiParam(value = "文章ID") @PathVariable Long id) {
        articleService.delete(id);
        return Result.ok();
    }

    // ==================== 热门文章排行（新增） ====================

    /**
     * 获取热门文章排行榜
     * <p>
     * 基于 Redis ZSet 实现的实时排行榜。
     * 文章的每次访问都会通过 ZINCRBY 递增阅读量，
     * 排行榜按阅读量降序排列。
     * </p>
     *
     * <p>使用示例：</p>
     * <pre>
     * GET /api/articles/ranking?count=10
     *
     * 响应：
     * {
     *   "code": 200,
     *   "data": [
     *     {"articleId": 5, "title": "Spring Boot 入门", "viewCount": 1024},
     *     {"articleId": 3, "title": "Redis 实战", "viewCount": 856},
     *     ...
     *   ]
     * }
     * </pre>
     *
     * @param count 要获取的数量，默认 10，最大 50
     * @return 排行榜列表
     */
    @GetMapping("/ranking")
    @ApiOperation(value = "热门文章排行榜", notes = "基于 Redis ZSet 的实时热门排行，按阅读量降序")
    public Result<List<ArticleRankingVO>> ranking(
            @ApiParam(value = "排行数量", example = "10")
            @RequestParam(defaultValue = "10") Integer count) {
        // 限制最大获取数量
        if (count > 50) {
            count = 50;
        }
        if (count <= 0) {
            count = 10;
        }
        return Result.ok(articleRankingService.getTopArticles(count));
    }

    /**
     * 初始化排行榜数据
     * <p>
     * 从数据库加载现有文章的阅读量到 Redis。
     * 适用于系统首次部署或 Redis 数据恢复。
     * 仅限管理员调用。
     * </p>
     *
     * @return 操作结果
     */
    @PostMapping("/ranking/init")
    @ApiOperation(value = "初始化排行榜数据", notes = "从数据库加载阅读量到 Redis（管理员操作）")
    public Result<Void> initRanking() {
        articleRankingService.initRankingData();
        return Result.ok();
    }

    /**
     * 重置排行榜
     * <p>
     * 清空 Redis 中的所有排行数据。
     * 仅限管理员调用，谨慎使用。
     * </p>
     *
     * @return 操作结果
     */
    @DeleteMapping("/ranking")
    @ApiOperation(value = "重置排行榜", notes = "清空所有排行数据（管理员操作，谨慎使用）")
    public Result<Void> resetRanking() {
        articleRankingService.resetRanking();
        return Result.ok();
    }
}
