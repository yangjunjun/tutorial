package com.example.blog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.dto.ArticleCreateRequest;
import com.example.blog.dto.ArticleUpdateRequest;
import com.example.blog.dto.ApiResponse;
import com.example.blog.entity.Article;
import com.example.blog.exception.BusinessException;
import com.example.blog.exception.GlobalExceptionHandler;
import com.example.blog.service.ArticleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ArticleController 集成测试
 *
 * <p>使用 @WebMvcTest 注解只加载 Controller 层的 Bean，
 * Service 层使用 @MockBean 模拟。
 *
 * <p>测试内容：
 * <ul>
 *   <li>GET /api/articles - 文章列表（分页）</li>
 *   <li>GET /api/articles/{id} - 文章详情</li>
 *   <li>POST /api/articles - 创建文章</li>
 *   <li>PUT /api/articles/{id} - 更新文章</li>
 *   <li>DELETE /api/articles/{id} - 删除文章</li>
 * </ul>
 *
 * <p><b>Spring Boot 2.5.12 适配说明：</b></p>
 * <ul>
 *   <li>@WebMvcTest / @AutoConfigureMockMvc / @MockBean 在 2.5.x 中的用法
 *       与 Spring Boot 3 完全一致</li>
 *   <li>@MockBean 位于 {@code org.springframework.boot.test.mock.bean} 包
 *       （Spring Boot 3.4 起才标记废弃并推荐 @MockitoBean，2.5.12 时代 @MockBean 是标准写法）</li>
 * </ul>
 *
 * <p>被测类：{@link ArticleController}
 */
@WebMvcTest(ArticleController.class)
@AutoConfigureMockMvc(addFilters = false) // 关闭 Security 过滤器，简化测试
@Import(GlobalExceptionHandler.class)     // 导入全局异常处理器
@DisplayName("文章控制器（ArticleController）集成测试")
class ArticleControllerTest {

    // ============================================================
    // 测试基础设施
    // ============================================================

    /** Spring MockMvc，模拟 HTTP 请求 */
    @Autowired
    private MockMvc mockMvc;

    /** Mock 的文章 Service */
    @MockBean
    private ArticleService articleService;

    /** JSON 序列化工具 */
    @Autowired
    private ObjectMapper objectMapper;

    /** 测试用的文章对象 */
    private Article testArticle;

    /** 测试用的文章列表 */
    private List<Article> articleList;

    /**
     * 每个测试前初始化测试数据
     */
    @BeforeEach
    void setUp() {
        // 初始化测试文章
        testArticle = new Article();
        testArticle.setId(1L);
        testArticle.setTitle("Spring Boot 入门教程");
        testArticle.setSummary("这是一篇 Spring Boot 入门教程");
        testArticle.setContent("# Spring Boot\n\n详细内容...");
        testArticle.setAuthorId(1L);
        testArticle.setCategoryId(1L);
        testArticle.setStatus(1);
        testArticle.setViewCount(100L);
        testArticle.setCreateTime(LocalDateTime.of(2024, 1, 1, 10, 0));
        testArticle.setUpdateTime(LocalDateTime.of(2024, 1, 1, 10, 0));

        // 初始化文章列表
        Article secondArticle = new Article();
        secondArticle.setId(2L);
        secondArticle.setTitle("MyBatis-Plus 实战");
        secondArticle.setSummary("MyBatis-Plus 进阶教程");
        secondArticle.setAuthorId(1L);
        secondArticle.setStatus(1);

        articleList = Arrays.asList(testArticle, secondArticle);
    }

    // ============================================================
    // GET /api/articles - 分页查询文章列表
    // ============================================================

    @Nested
    @DisplayName("GET /api/articles - 分页查询文章列表")
    class ListArticles {

        @Test
        @DisplayName("默认分页参数 - 应返回第一页数据")
        void shouldReturnFirstPageWithDefaultParams() throws Exception {
            // Arrange：模拟分页查询结果
            Page<Article> mockPage = new Page<>(1, 10);
            mockPage.setRecords(articleList);
            mockPage.setTotal(2);

            when(articleService.page(eq(1), eq(10), isNull(), isNull()))
                .thenReturn(mockPage);

            // Act & Assert
            mockMvc.perform(get("/api/articles")
                    .param("page", "1")
                    .param("size", "10"))
                .andExpect(status().isOk())                    // HTTP 200
                .andExpect(jsonPath("$.code").value(200))      // 业务状态码 200
                .andExpect(jsonPath("$.data.records").isArray())// data.records 是数组
                .andExpect(jsonPath("$.data.records.length()").value(2)) // 2 条记录
                .andExpect(jsonPath("$.data.total").value(2))  // 总记录数
                .andExpect(jsonPath("$.data.records[0].title")
                    .value("Spring Boot 入门教程"));             // 第一条记录标题

            verify(articleService).page(1, 10, null, null);
        }

        @Test
        @DisplayName("带分类筛选 - 应传递 categoryId 参数")
        void shouldPassCategoryIdWhenFiltering() throws Exception {
            Page<Article> mockPage = new Page<>(1, 10);
            mockPage.setRecords(Collections.singletonList(testArticle));
            mockPage.setTotal(1);

            when(articleService.page(eq(1), eq(10), eq(1L), isNull()))
                .thenReturn(mockPage);

            mockMvc.perform(get("/api/articles")
                    .param("page", "1")
                    .param("size", "10")
                    .param("categoryId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.length()").value(1));

            verify(articleService).page(1, 10, 1L, null);
        }

        @Test
        @DisplayName("空数据 - 应返回空列表")
        void shouldReturnEmptyListWhenNoArticles() throws Exception {
            Page<Article> emptyPage = new Page<>(1, 10);
            emptyPage.setRecords(Collections.emptyList());
            emptyPage.setTotal(0);

            when(articleService.page(anyInt(), anyInt(), isNull(), isNull()))
                .thenReturn(emptyPage);

            mockMvc.perform(get("/api/articles")
                    .param("page", "1")
                    .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records").isArray())
                .andExpect(jsonPath("$.data.records.length()").value(0))
                .andExpect(jsonPath("$.data.total").value(0));
        }
    }

    // ============================================================
    // GET /api/articles/{id} - 获取文章详情
    // ============================================================

    @Nested
    @DisplayName("GET /api/articles/{id} - 获取文章详情")
    class GetArticle {

        @Test
        @DisplayName("文章存在 - 应返回 200 和文章数据")
        void shouldReturnArticleWhenExists() throws Exception {
            when(articleService.getById(1L)).thenReturn(testArticle);

            ResultActions result = mockMvc.perform(get("/api/articles/1"))
                .andDo(print()); // 打印请求/响应详情

            result.andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").value("Spring Boot 入门教程"))
                .andExpect(jsonPath("$.data.summary").value("这是一篇 Spring Boot 入门教程"))
                .andExpect(jsonPath("$.data.content").exists())
                .andExpect(jsonPath("$.data.status").value(1));

            verify(articleService).getById(1L);
        }

        @Test
        @DisplayName("文章不存在 - 应返回 404")
        void shouldReturn404WhenArticleNotFound() throws Exception {
            when(articleService.getById(999L)).thenReturn(null);

            mockMvc.perform(get("/api/articles/999"))
                .andExpect(status().isNotFound());

            verify(articleService).getById(999L);
        }

        @Test
        @DisplayName("文章 ID 为负数 - 应正常处理")
        void shouldHandleNegativeId() throws Exception {
            when(articleService.getById(-1L)).thenReturn(null);

            mockMvc.perform(get("/api/articles/-1"))
                .andExpect(status().isNotFound());
        }
    }

    // ============================================================
    // POST /api/articles - 创建文章
    // ============================================================

    @Nested
    @DisplayName("POST /api/articles - 创建文章")
    class CreateArticle {

        @Test
        @DisplayName("参数完整 - 应成功创建并返回 200")
        void shouldCreateArticleSuccessfully() throws Exception {
            // Arrange
            ArticleCreateRequest request = new ArticleCreateRequest();
            request.setTitle("新文章标题");
            request.setSummary("新文章摘要");
            request.setContent("新文章完整内容...");
            request.setCategoryId(1L);
            request.setStatus(1);

            when(articleService.save(any(Article.class))).thenReturn(true);

            // Act & Assert
            mockMvc.perform(post("/api/articles")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").exists());

            // 验证 Service 层的 save 方法被调用
            verify(articleService).save(any(Article.class));
        }

        @Test
        @DisplayName("标题为空 - 应返回 400 错误")
        void shouldReturn400WhenTitleIsEmpty() throws Exception {
            ArticleCreateRequest request = new ArticleCreateRequest();
            request.setTitle(""); // 空标题
            request.setContent("内容");

            mockMvc.perform(post("/api/articles")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("请求体为空 - 应返回 400 错误")
        void shouldReturn400WhenRequestBodyIsEmpty() throws Exception {
            mockMvc.perform(post("/api/articles")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest());
        }
    }

    // ============================================================
    // PUT /api/articles/{id} - 更新文章
    // ============================================================

    @Nested
    @DisplayName("PUT /api/articles/{id} - 更新文章")
    class UpdateArticle {

        @Test
        @DisplayName("参数正确 - 应成功更新并返回 200")
        void shouldUpdateArticleSuccessfully() throws Exception {
            ArticleUpdateRequest request = new ArticleUpdateRequest();
            request.setTitle("更新后的标题");
            request.setContent("更新后的内容");

            when(articleService.updateById(any(Article.class))).thenReturn(true);

            mockMvc.perform(put("/api/articles/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

            verify(articleService).updateById(any(Article.class));
        }

        @Test
        @DisplayName("文章不存在 - 更新应返回失败")
        void shouldReturnFailureWhenArticleNotFound() throws Exception {
            ArticleUpdateRequest request = new ArticleUpdateRequest();
            request.setTitle("更新标题");

            when(articleService.updateById(any(Article.class))).thenReturn(false);

            mockMvc.perform(put("/api/articles/999")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        }
    }

    // ============================================================
    // DELETE /api/articles/{id} - 删除文章
    // ============================================================

    @Nested
    @DisplayName("DELETE /api/articles/{id} - 删除文章")
    class DeleteArticle {

        @Test
        @DisplayName("作者删除自己的文章 - 应成功删除并返回 200")
        void shouldDeleteArticleSuccessfully() throws Exception {
            when(articleService.removeByIdAndAuthor(eq(1L), anyLong())).thenReturn(true);

            mockMvc.perform(delete("/api/articles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

            verify(articleService).removeByIdAndAuthor(eq(1L), anyLong());
        }

        @Test
        @DisplayName("非作者删除 - 应返回 403 或业务错误码")
        void shouldReturnForbiddenWhenNotOwner() throws Exception {
            when(articleService.removeByIdAndAuthor(eq(1L), anyLong()))
                .thenThrow(new BusinessException("权限不足，无法删除该文章"));

            mockMvc.perform(delete("/api/articles/1"))
                .andExpect(status().is5xxServerError()); // 全局异常处理器返回 500

            verify(articleService).removeByIdAndAuthor(eq(1L), anyLong());
        }

        @Test
        @DisplayName("删除不存在的文章 - 应返回错误")
        void shouldReturnErrorWhenArticleNotFound() throws Exception {
            when(articleService.removeByIdAndAuthor(eq(999L), anyLong()))
                .thenThrow(new BusinessException("文章不存在"));

            mockMvc.perform(delete("/api/articles/999"))
                .andExpect(status().is5xxServerError());
        }
    }

    // ============================================================
    // 搜索文章
    // ============================================================

    @Nested
    @DisplayName("GET /api/articles/search - 搜索文章")
    class SearchArticles {

        @Test
        @DisplayName("关键词搜索 - 应返回匹配结果")
        void shouldReturnMatchingArticles() throws Exception {
            Page<Article> mockPage = new Page<>(1, 10);
            mockPage.setRecords(Collections.singletonList(testArticle));
            mockPage.setTotal(1);

            when(articleService.page(eq(1), eq(10), isNull(), eq("Spring")))
                .thenReturn(mockPage);

            mockMvc.perform(get("/api/articles")
                    .param("page", "1")
                    .param("size", "10")
                    .param("keyword", "Spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.length()").value(1))
                .andExpect(jsonPath("$.data.records[0].title").value("Spring Boot 入门教程"));
        }
    }
}
