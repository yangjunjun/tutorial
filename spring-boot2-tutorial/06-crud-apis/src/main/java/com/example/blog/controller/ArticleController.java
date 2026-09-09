package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleDetailVO;
import com.example.blog.vo.ArticleVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 文章 Controller
 * <p>
 * 提供文章的 RESTful API，包括创建、查询详情、列表查询、更新和删除。
 * 所有接口统一返回 {@link Result} 对象，参数校验由 {@code @Validated} 触发。
 * </p>
 *
 * <h3>API 端点一览：</h3>
 * <table>
 *   <tr><th>方法</th><th>路径</th><th>说明</th></tr>
 *   <tr><td>POST</td><td>/api/articles</td><td>创建文章</td></tr>
 *   <tr><td>GET</td><td>/api/articles/{id}</td><td>获取文章详情</td></tr>
 *   <tr><td>GET</td><td>/api/articles</td><td>分页查询文章列表</td></tr>
 *   <tr><td>PUT</td><td>/api/articles/{id}</td><td>更新文章</td></tr>
 *   <tr><td>DELETE</td><td>/api/articles/{id}</td><td>删除文章</td></tr>
 * </table>
 *
 * <h3>设计说明：</h3>
 * <ul>
 *   <li>Controller 层只负责接收请求参数和返回响应，不包含业务逻辑</li>
 *   <li>参数校验通过 {@code @Validated} 自动触发，校验失败由全局异常处理器处理</li>
 *   <li>当前用户 ID 暂时硬编码为 1L（后续章节引入 JWT 认证后从 Token 中获取）</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    // ============================================================
    // 创建文章
    // ============================================================

    /**
     * 创建文章
     * <p>
     * 接收 JSON 请求体，通过 {@code @Validated} 触发 {@link ArticleCreateDTO} 上的校验注解。
     * 校验通过后调用 Service 层创建文章，返回新文章的 ID。
     * </p>
     *
     * @param dto 创建文章 DTO（由 @Validated 触发校验）
     * @return 包含新文章 ID 的统一响应
     */
    @PostMapping
    public Result<Long> createArticle(@Validated @RequestBody ArticleCreateDTO dto) {
        // 获取当前登录用户 ID（暂时硬编码，后续通过 JWT 认证获取）
        Long currentUserId = 1L;

        Long articleId = articleService.createArticle(dto, currentUserId);
        return Result.success("文章创建成功", articleId);
    }

    // ============================================================
    // 获取文章详情
    // ============================================================

    /**
     * 获取文章详情
     * <p>
     * 根据文章 ID 查询完整信息，包括文章内容、作者信息、分类名称等。
     * 同时会将文章的浏览量 +1。
     * </p>
     *
     * @param id 文章 ID（路径参数）
     * @return 包含文章详情的统一响应
     */
    @GetMapping("/{id}")
    public Result<ArticleDetailVO> getArticleDetail(@PathVariable Long id) {
        ArticleDetailVO detail = articleService.getArticleDetail(id);
        return Result.success(detail);
    }

    // ============================================================
    // 分页查询文章列表
    // ============================================================

    /**
     * 分页查询文章列表
     * <p>
     * 支持按分类筛选，默认查询第一页、每页 10 条。
     * 只返回已发布的文章，按创建时间倒序排列。
     * </p>
     *
     * @param pageNum    页码，默认 1
     * @param pageSize   每页条数，默认 10
     * @param categoryId 分类 ID（可选）
     * @return 包含文章列表的统一响应
     */
    @GetMapping
    public Result<List<ArticleVO>> listArticles(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long categoryId) {
        List<ArticleVO> articles = articleService.listArticles(pageNum, pageSize, categoryId);
        return Result.success(articles);
    }

    // ============================================================
    // 更新文章
    // ============================================================

    /**
     * 更新文章
     * <p>
     * 根据路径中的 ID 和请求体中的字段更新文章。
     * 使用 {@code @Validated} 触发 {@link ArticleUpdateDTO} 上的校验注解。
     * 只有文章作者才能执行此操作。
     * </p>
     *
     * @param id  文章 ID（路径参数，用于二次确认）
     * @param dto 更新文章 DTO
     * @return 统一响应
     */
    @PutMapping("/{id}")
    public Result<Void> updateArticle(@PathVariable Long id,
                                      @Validated @RequestBody ArticleUpdateDTO dto) {
        // 确保路径参数 ID 与请求体 ID 一致
        dto.setId(id);

        Long currentUserId = 1L; // 暂时硬编码
        articleService.updateArticle(dto, currentUserId);
        return Result.success();
    }

    // ============================================================
    // 删除文章
    // ============================================================

    /**
     * 删除文章（逻辑删除）
     * <p>
     * 根据 ID 逻辑删除文章。只有文章作者才能执行此操作。
     * </p>
     *
     * @param id 文章 ID
     * @return 统一响应
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        Long currentUserId = 1L; // 暂时硬编码
        articleService.deleteArticle(id, currentUserId);
        return Result.success();
    }
}
