package com.example.blog.controller;

import com.example.blog.common.Result;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
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
import java.util.ArrayList;

/**
 * 文章管理 Controller（Swagger 注解完整版）
 * <p>
 * 本文件展示了如何在 Controller 中使用 Springfox 3.0.0（Swagger 2 风格）注解，
 * 为每个接口添加详细的文档描述，包括：
 * <ul>
 *   <li>@Api — 定义接口分组</li>
 *   <li>@ApiOperation — 定义接口摘要和描述</li>
 *   <li>@ApiParam — 定义参数描述和示例</li>
 *   <li>@ApiImplicitParam(s) — 以列表形式描述请求参数</li>
 *   <li>@ApiResponse(s) — 定义响应状态码和描述</li>
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
@Api(tags = "文章管理", description = "文章的增删改查接口。包括文章列表、详情、创建、更新和删除操作。")
public class ArticleController {

    // private final ArticleService articleService;

    /**
     * 创建文章
     * <p>需要登录，且用户具备作者权限。</p>
     */
    @PostMapping
    @ApiOperation(
            value = "创建文章",
            notes = "创建一篇新的博客文章。支持 Markdown 格式的内容。"
                    + "创建后可选择直接发布或存为草稿。"
    )
    @ApiResponses({
            @ApiResponse(code = 200, message = "创建成功，返回文章ID"),
            @ApiResponse(code = 400, message = "参数校验失败（标题为空、内容过长等）"),
            @ApiResponse(code = 401, message = "未登录"),
            @ApiResponse(code = 403, message = "无权限")
    })
    public Result<Long> create(
            @ApiParam(value = "文章创建参数", required = true)
            @RequestBody @Valid ArticleCreateDTOExample dto) {
        // return Result.ok(articleService.create(dto));
        return Result.ok(1L); // 示例返回
    }

    /**
     * 获取文章详情
     */
    @GetMapping("/{id}")
    @ApiOperation(
            value = "获取文章详情",
            notes = "根据文章ID获取完整信息，包括内容、作者、分类、标签、阅读量等。"
                    + "每次访问会自动增加阅读量。"
    )
    @ApiResponses({
            @ApiResponse(code = 200, message = "查询成功"),
            @ApiResponse(code = 404, message = "文章不存在或已被删除")
    })
    public Result<String> getById(
            @ApiParam(value = "文章ID", example = "1", required = true)
            @PathVariable Long id) {
        // return Result.ok(articleService.getDetail(id));
        return Result.ok("文章详情示例"); // 示例返回
    }

    /**
     * 文章列表（分页）
     */
    @GetMapping
    @ApiOperation(
            value = "文章列表（分页）",
            notes = "分页查询已发布的文章列表。支持按分类、标签、关键词筛选。"
                    + "返回文章摘要信息，不包含完整内容。"
    )
    public Result<String> page(
            @ApiParam(value = "页码（从1开始）", example = "1") @RequestParam(defaultValue = "1") Integer pageNum,
            @ApiParam(value = "每页数量（默认10，最大50）", example = "10") @RequestParam(defaultValue = "10") Integer pageSize,
            @ApiParam(value = "分类ID（可选，按分类筛选）", example = "1") @RequestParam(required = false) Long categoryId,
            @ApiParam(value = "标签ID（可选，按标签筛选）", example = "2") @RequestParam(required = false) Long tagId,
            @ApiParam(value = "搜索关键词（可选，搜索标题和摘要）", example = "Spring Boot") @RequestParam(required = false) String keyword) {
        // return Result.ok(articleService.page(pageNum, pageSize, categoryId, tagId, keyword));
        return Result.ok(new ArrayList<String>().toString()); // 示例返回
    }

    /**
     * 更新文章
     */
    @PutMapping("/{id}")
    @ApiOperation(
            value = "更新文章",
            notes = "更新文章的标题、内容、分类、标签等信息。仅文章作者或管理员可操作。"
    )
    @ApiResponses({
            @ApiResponse(code = 200, message = "更新成功"),
            @ApiResponse(code = 401, message = "未登录"),
            @ApiResponse(code = 403, message = "无权限（非作者或管理员）"),
            @ApiResponse(code = 404, message = "文章不存在")
    })
    public Result<Void> update(
            @ApiParam(value = "文章ID", example = "1") @PathVariable Long id,
            @ApiParam(value = "文章更新参数（只需传要修改的字段）", required = true)
            @RequestBody @Valid ArticleCreateDTOExample dto) {
        // articleService.update(id, dto);
        return Result.ok();
    }

    /**
     * 删除文章
     */
    @DeleteMapping("/{id}")
    @ApiOperation(
            value = "删除文章",
            notes = "根据ID删除文章（软删除，标记为已删除状态）。仅文章作者或管理员可操作。"
    )
    @ApiResponses({
            @ApiResponse(code = 200, message = "删除成功"),
            @ApiResponse(code = 401, message = "未登录"),
            @ApiResponse(code = 403, message = "无权限"),
            @ApiResponse(code = 404, message = "文章不存在")
    })
    public Result<Void> delete(
            @ApiParam(value = "文章ID", example = "1", required = true) @PathVariable Long id) {
        // articleService.delete(id);
        return Result.ok();
    }

    /**
     * 文章点赞/取消点赞
     */
    @PostMapping("/{id}/like")
    @ApiOperation(
            value = "点赞/取消点赞",
            notes = "切换文章的点赞状态。如果已点赞则取消，未点赞则点赞。"
    )
    public Result<Boolean> toggleLike(
            @ApiParam(value = "文章ID", example = "1", required = true) @PathVariable Long id) {
        // return Result.ok(articleService.toggleLike(id));
        return Result.ok(true); // 示例返回
    }

    /**
     * 获取当前用户的文章列表（管理后台用）
     */
    @GetMapping("/my")
    @ApiOperation(
            value = "我的文章列表",
            notes = "获取当前登录用户的文章列表，包含草稿和已发布的文章。用于管理后台。"
    )
    public Result<String> myArticles(
            @ApiParam(value = "页码", example = "1") @RequestParam(defaultValue = "1") Integer pageNum,
            @ApiParam(value = "每页数量", example = "10") @RequestParam(defaultValue = "10") Integer pageSize,
            @ApiParam(value = "文章状态筛选：0-草稿 1-已发布 -1-已删除", example = "1")
            @RequestParam(required = false) Integer status) {
        // return Result.ok(articleService.myArticles(pageNum, pageSize, status));
        return Result.ok(new ArrayList<String>().toString()); // 示例返回
    }

    /**
     * 示例 DTO（内嵌静态类，仅用于演示 @RequestBody 的文档标注）
     * <p>实际项目中应独立放在 dto 包下，参见 12.8 节的 ArticleCreateDTO 完整示例。</p>
     */
    public static class ArticleCreateDTOExample {
        // 文章标题
        private String title;
        // 文章内容（Markdown）
        private String content;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
