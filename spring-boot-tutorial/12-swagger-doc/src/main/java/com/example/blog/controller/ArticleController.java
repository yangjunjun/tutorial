package com.example.blog.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.common.Result;
import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.ArticleVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 文章管理 Controller（Swagger 注解完整版）
 * <p>
 * 本文件展示了如何在 Controller 中使用 SpringDoc OpenAPI 注解，
 * 为每个接口添加详细的文档描述，包括：
 * <ul>
 *   <li>@Tag — 定义接口分组</li>
 *   <li>@Operation — 定义接口摘要和描述</li>
 *   <li>@Parameter — 定义参数描述和示例</li>
 *   <li>@ApiResponse — 定义响应状态码和描述</li>
 * </ul>
 * </p>
 *
 * <p>注意：本文件为示例片段，省略了 Service 层的实际业务逻辑。
 * 实际使用时，ArticleService 需要注入并调用其方法。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Tag(name = "文章管理", description = "文章的增删改查接口。包括文章列表、详情、创建、更新和删除操作。")
public class ArticleController {

    // private final ArticleService articleService;

    /**
     * 创建文章
     * <p>需要登录，且用户具备作者权限。</p>
     */
    @PostMapping
    @Operation(
            summary = "创建文章",
            description = "创建一篇新的博客文章。支持 Markdown 格式的内容。"
                    + "创建后可选择直接发布或存为草稿。"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "创建成功，返回文章ID",
                    content = @Content(schema = @Schema(implementation = Result.class))),
            @ApiResponse(responseCode = "400", description = "参数校验失败（标题为空、内容过长等）"),
            @ApiResponse(responseCode = "401", description = "未登录"),
            @ApiResponse(responseCode = "403", description = "无权限")
    })
    public Result<Long> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "文章创建参数",
                    required = true
            )
            @RequestBody @Valid ArticleCreateDTO dto) {
        // return Result.ok(articleService.create(dto));
        return Result.ok(1L); // 示例返回
    }

    /**
     * 获取文章详情
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "获取文章详情",
            description = "根据文章ID获取完整信息，包括内容、作者、分类、标签、阅读量等。"
                    + "每次访问会自动增加阅读量。"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "404", description = "文章不存在或已被删除")
    })
    public Result<ArticleVO> getById(
            @Parameter(description = "文章ID", example = "1", required = true)
            @PathVariable Long id) {
        // return Result.ok(articleService.getDetail(id));
        return Result.ok(new ArticleVO()); // 示例返回
    }

    /**
     * 文章列表（分页）
     */
    @GetMapping
    @Operation(
            summary = "文章列表（分页）",
            description = "分页查询已发布的文章列表。支持按分类、标签、关键词筛选。"
                    + "返回文章摘要信息，不包含完整内容。"
    )
    @Parameters({
            @Parameter(name = "pageNum", description = "页码（从1开始）", example = "1", in = ParameterIn.QUERY),
            @Parameter(name = "pageSize", description = "每页数量（默认10，最大50）", example = "10", in = ParameterIn.QUERY),
            @Parameter(name = "categoryId", description = "分类ID（可选，按分类筛选）", example = "1", in = ParameterIn.QUERY),
            @Parameter(name = "tagId", description = "标签ID（可选，按标签筛选）", example = "2", in = ParameterIn.QUERY),
            @Parameter(name = "keyword", description = "搜索关键词（可选，搜索标题和摘要）", example = "Spring Boot", in = ParameterIn.QUERY)
    })
    public Result<Page<ArticleListVO>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String keyword) {
        // return Result.ok(articleService.page(pageNum, pageSize, categoryId, tagId, keyword));
        return Result.ok(new Page<>()); // 示例返回
    }

    /**
     * 更新文章
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "更新文章",
            description = "更新文章的标题、内容、分类、标签等信息。仅文章作者或管理员可操作。"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "401", description = "未登录"),
            @ApiResponse(responseCode = "403", description = "无权限（非作者或管理员）"),
            @ApiResponse(responseCode = "404", description = "文章不存在")
    })
    public Result<Void> update(
            @Parameter(description = "文章ID", example = "1") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "文章更新参数（只需传要修改的字段）"
            )
            @RequestBody @Valid ArticleUpdateDTO dto) {
        // articleService.update(id, dto);
        return Result.ok();
    }

    /**
     * 删除文章
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "删除文章",
            description = "根据ID删除文章（软删除，标记为已删除状态）。仅文章作者或管理员可操作。"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "401", description = "未登录"),
            @ApiResponse(responseCode = "403", description = "无权限"),
            @ApiResponse(responseCode = "404", description = "文章不存在")
    })
    public Result<Void> delete(
            @Parameter(description = "文章ID", example = "1") @PathVariable Long id) {
        // articleService.delete(id);
        return Result.ok();
    }

    /**
     * 文章点赞/取消点赞
     */
    @PostMapping("/{id}/like")
    @Operation(
            summary = "点赞/取消点赞",
            description = "切换文章的点赞状态。如果已点赞则取消，未点赞则点赞。"
    )
    public Result<Boolean> toggleLike(
            @Parameter(description = "文章ID", example = "1") @PathVariable Long id) {
        // return Result.ok(articleService.toggleLike(id));
        return Result.ok(true); // 示例返回
    }

    /**
     * 获取当前用户的文章列表（管理后台用）
     */
    @GetMapping("/my")
    @Operation(
            summary = "我的文章列表",
            description = "获取当前登录用户的文章列表，包含草稿和已发布的文章。用于管理后台。"
    )
    @Parameters({
            @Parameter(name = "pageNum", description = "页码", example = "1"),
            @Parameter(name = "pageSize", description = "每页数量", example = "10"),
            @Parameter(name = "status", description = "文章状态筛选：0-草稿 1-已发布 -1-已删除", example = "1")
    })
    public Result<Page<ArticleListVO>> myArticles(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Integer status) {
        // return Result.ok(articleService.myArticles(pageNum, pageSize, status));
        return Result.ok(new Page<>()); // 示例返回
    }
}
