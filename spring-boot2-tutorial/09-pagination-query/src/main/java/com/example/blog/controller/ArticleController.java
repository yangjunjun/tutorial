package com.example.blog.controller;

import com.example.blog.dto.ArticleQueryDTO;
import com.example.blog.service.ArticleService;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.PageVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 文章 Controller
 * <p>
 * 提供文章相关的 RESTful API，包括分页列表查询。
 * <p>
 * 接口列表：
 * - GET /api/articles/public/page  — 公开文章列表（无需登录）
 * - GET /api/articles/page         — 管理后台文章列表（需要登录）
 * <p>
 * 前端分页参数传递约定：
 * <pre>
 * GET /api/articles/public/page?current=1&size=10&keyword=Spring&categoryId=1&sortBy=createTime&sortOrder=desc
 * </pre>
 * <p>
 * 参数说明：
 * - current：当前页码，从 1 开始，默认 1
 * - size：每页条数，默认 10，最大 100
 * - keyword：搜索关键词（可选）
 * - categoryId：分类 ID（可选）
 * - tagId：标签 ID（可选）
 * - sortBy：排序字段，可选 createTime/viewCount/likeCount，默认 createTime
 * - sortOrder：排序方向，可选 asc/desc，默认 desc
 *
 * @author tutorial
 */
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private static final Logger log = LoggerFactory.getLogger(ArticleController.class);

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    /**
     * 公开文章分页列表（无需登录）
     * <p>
     * 只返回已发布的文章，适用于前台文章列表页面。
     * 此接口在 SecurityConfig 中配置为 permitAll，无需 Token。
     * <p>
     * 请求方式：GET
     * 请求路径：/api/articles/public/page
     * <p>
     * 请求示例：
     * <pre>
     * curl "http://localhost:8080/api/articles/public/page?current=1&size=10"
     * curl "http://localhost:8080/api/articles/public/page?keyword=Spring&categoryId=1"
     * curl "http://localhost:8080/api/articles/public/page?sortBy=viewCount&sortOrder=desc"
     * curl "http://localhost:8080/api/articles/public/page?tagId=3&current=2&size=5"
     * </pre>
     * <p>
     * 响应示例：
     * <pre>
     * {
     *   "code": 200,
     *   "message": "查询成功",
     *   "data": {
     *     "records": [
     *       {
     *         "id": 1,
     *         "title": "Spring Boot 2.5 入门指南",
     *         "summary": "本文介绍 Spring Boot 2.5 的核心特性...",
     *         "categoryName": "后端开发",
     *         "authorName": "管理员",
     *         "tags": ["Spring Boot", "Java"],
     *         "viewCount": 1024,
     *         "createTime": "2024-06-18T10:30:00"
     *       }
     *     ],
     *     "total": 56,
     *     "size": 10,
     *     "current": 1,
     *     "pages": 6
     *   }
     * }
     * </pre>
     *
     * @param queryDTO 查询参数（Spring MVC 会自动将 URL 参数映射到 DTO 字段）
     * @return 分页结果
     */
    @GetMapping("/public/page")
    public ResponseEntity<Map<String, Object>> getPublicArticlePage(
            ArticleQueryDTO queryDTO) {

        log.debug("公开文章列表查询: {}", queryDTO);

        // 调用 Service 层查询（会自动过滤只返回已发布的文章）
        PageVO<ArticleListVO> pageVO = articleService.getPublicArticlePage(queryDTO);

        // 构造响应
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "查询成功");
        response.put("data", pageVO);

        return ResponseEntity.ok(response);
    }

    /**
     * 管理后台文章分页列表（需要登录）
     * <p>
     * 可以查看所有状态的文章（包括草稿、已下架等）。
     * 需要携带有效的 JWT Token。
     * <p>
     * 请求方式：GET
     * 请求路径：/api/articles/page
     * <p>
     * 请求示例：
     * <pre>
     * curl "http://localhost:8080/api/articles/page?current=1&size=10&status=0" \
     *   -H "Authorization: Bearer {token}"
     * </pre>
     *
     * @param queryDTO 查询参数
     * @return 分页结果
     */
    @GetMapping("/page")
    @PreAuthorize("isAuthenticated()")  // 需要登录才能访问
    public ResponseEntity<Map<String, Object>> getArticlePage(
            ArticleQueryDTO queryDTO) {

        log.debug("管理后台文章列表查询: {}", queryDTO);

        // 调用 Service 层查询（不限制文章状态）
        PageVO<ArticleListVO> pageVO = articleService.getArticlePage(queryDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "查询成功");
        response.put("data", pageVO);

        return ResponseEntity.ok(response);
    }

    /**
     * 管理员文章管理接口（需要 ADMIN 角色）
     * <p>
     * 用于管理后台的文章管理列表，仅管理员可访问。
     * <p>
     * 请求方式：GET
     * 请求路径：/api/articles/admin/page
     * <p>
     * 请求示例：
     * <pre>
     * curl "http://localhost:8080/api/articles/admin/page?current=1&size=20" \
     *   -H "Authorization: Bearer {admin_token}"
     * </pre>
     *
     * @param queryDTO 查询参数
     * @return 分页结果
     */
    @GetMapping("/admin/page")
    @PreAuthorize("hasRole('ADMIN')")  // 需要 ADMIN 角色
    public ResponseEntity<Map<String, Object>> getAdminArticlePage(
            ArticleQueryDTO queryDTO) {

        log.debug("管理员文章列表查询: {}", queryDTO);

        PageVO<ArticleListVO> pageVO = articleService.getArticlePage(queryDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "查询成功");
        response.put("data", pageVO);

        return ResponseEntity.ok(response);
    }
}
