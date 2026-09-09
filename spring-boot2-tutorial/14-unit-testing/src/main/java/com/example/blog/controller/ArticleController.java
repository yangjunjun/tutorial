package com.example.blog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.blog.dto.ApiResponse;
import com.example.blog.dto.ArticleCreateRequest;
import com.example.blog.dto.ArticleUpdateRequest;
import com.example.blog.entity.Article;
import com.example.blog.service.ArticleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

/**
 * 文章 Controller（第 14 章测试工程最小骨架）
 * <p>提供测试类引用的端点签名，完整实现见第 06/09 章。</p>
 */
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ApiResponse<IPage<Article>> page(@RequestParam(defaultValue = "1") Integer page,
                                            @RequestParam(defaultValue = "10") Integer size,
                                            @RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) String keyword) {
        return wrap(articleService.page(page, size, categoryId, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Article>> getById(@PathVariable Long id) {
        Article article = articleService.getById(id);
        if (article == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(fail(404, "文章不存在"));
        }
        return ResponseEntity.ok(wrap(article));
    }

    @PostMapping
    public ApiResponse<Boolean> create(@RequestBody @Valid ArticleCreateRequest request) {
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setSummary(request.getSummary());
        article.setContent(request.getContent());
        article.setCategoryId(request.getCategoryId());
        article.setStatus(request.getStatus());
        return wrap(articleService.save(article));
    }

    @PutMapping("/{id}")
    public ApiResponse<Boolean> update(@PathVariable Long id,
                                       @RequestBody @Valid ArticleUpdateRequest request) {
        Article article = new Article();
        article.setId(id);
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        return wrap(articleService.updateById(article));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        return wrap(articleService.removeByIdAndAuthor(id, id));
    }

    private <T> ApiResponse<T> wrap(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("操作成功");
        response.setData(data);
        return response;
    }

    private <T> ApiResponse<T> fail(int code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        return response;
    }
}
