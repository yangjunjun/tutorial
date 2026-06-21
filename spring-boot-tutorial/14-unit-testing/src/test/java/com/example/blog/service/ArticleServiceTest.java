package com.example.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.dto.ArticleCreateRequest;
import com.example.blog.dto.ArticleUpdateRequest;
import com.example.blog.entity.Article;
import com.example.blog.entity.Category;
import com.example.blog.entity.Tag;
import com.example.blog.exception.BusinessException;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.CategoryMapper;
import com.example.blog.mapper.TagMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ArticleService 单元测试
 *
 * <p>测试策略：
 * <ul>
 *   <li>Mock 掉 ArticleMapper 等数据访问层，专注于业务逻辑测试</li>
 *   <li>使用 @Nested 按功能分组测试用例</li>
 *   <li>每个测试用例遵循 AAA 模式：Arrange（准备）- Act（执行）- Assert（断言）</li>
 * </ul>
 *
 * <p>被测类：{@link ArticleServiceImpl}
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("文章服务（ArticleService）单元测试")
class ArticleServiceTest {

    // ============================================================
    // Mock 依赖对象
    // ============================================================

    /** Mock 的文章 Mapper，模拟数据库操作 */
    @Mock
    private ArticleMapper articleMapper;

    /** Mock 的分类 Mapper */
    @Mock
    private CategoryMapper categoryMapper;

    /** Mock 的标签 Mapper */
    @Mock
    private TagMapper tagMapper;

    /** 被测对象，Mockito 会自动注入上面标注了 @Mock 的依赖 */
    @InjectMocks
    private ArticleServiceImpl articleService;

    // ============================================================
    // 测试数据
    // ============================================================

    /** 测试用的文章对象 */
    private Article testArticle;

    /** 测试用的已发布文章 */
    private Article publishedArticle;

    /** 测试用的草稿文章 */
    private Article draftArticle;

    /**
     * 每个测试方法执行前的初始化操作。
     * 准备通用的测试数据。
     */
    @BeforeEach
    void setUp() {
        // 基础测试文章
        testArticle = new Article();
        testArticle.setId(1L);
        testArticle.setTitle("Spring Boot 入门教程");
        testArticle.setSummary("从零开始学习 Spring Boot");
        testArticle.setContent("# Spring Boot\n\n这是一篇入门教程...");
        testArticle.setAuthorId(1L);
        testArticle.setCategoryId(1L);
        testArticle.setStatus(1); // 1 = 已发布
        testArticle.setViewCount(100);
        testArticle.setLikeCount(20);
        testArticle.setCreateTime(LocalDateTime.of(2024, 1, 1, 10, 0, 0));
        testArticle.setUpdateTime(LocalDateTime.of(2024, 1, 1, 10, 0, 0));

        // 已发布文章
        publishedArticle = new Article();
        publishedArticle.setId(2L);
        publishedArticle.setTitle("已发布的文章");
        publishedArticle.setAuthorId(1L);
        publishedArticle.setStatus(1);

        // 草稿文章
        draftArticle = new Article();
        draftArticle.setId(3L);
        draftArticle.setTitle("草稿文章");
        draftArticle.setAuthorId(1L);
        draftArticle.setStatus(0); // 0 = 草稿
    }

    // ============================================================
    // 查询文章相关测试
    // ============================================================

    /**
     * 文章查询相关的测试用例组
     */
    @Nested
    @DisplayName("查询文章 - getById")
    class GetArticleById {

        @Test
        @DisplayName("正常场景：根据 ID 查询已存在的文章，应返回文章对象")
        void shouldReturnArticleWhenArticleExists() {
            // Arrange：定义 Mock 行为 —— 当查询 ID=1 的文章时，返回 testArticle
            when(articleMapper.selectById(1L)).thenReturn(testArticle);

            // Act：调用被测方法
            Article result = articleService.getById(1L);

            // Assert：验证返回结果
            assertNotNull(result, "返回的文章不应为 null");
            assertEquals(1L, result.getId(), "文章 ID 应为 1");
            assertEquals("Spring Boot 入门教程", result.getTitle(), "文章标题应匹配");
            assertEquals("从零开始学习 Spring Boot", result.getSummary(), "文章摘要应匹配");
            assertEquals(1, result.getStatus(), "文章状态应为已发布(1)");

            // 验证 Mapper 方法确实被调用了 1 次
            verify(articleMapper, times(1)).selectById(1L);
        }

        @Test
        @DisplayName("异常场景：根据 ID 查询不存在的文章，应返回 null")
        void shouldReturnNullWhenArticleNotExists() {
            // Arrange：查询 ID=999 时返回 null
            when(articleMapper.selectById(999L)).thenReturn(null);

            // Act
            Article result = articleService.getById(999L);

            // Assert
            assertNull(result, "不存在的文章应返回 null");
            verify(articleMapper).selectById(999L);
        }

        @Test
        @DisplayName("边界场景：传入 ID 为 null 时，Mapper 应被调用并返回 null")
        void shouldCallMapperWithNullId() {
            when(articleMapper.selectById(null)).thenReturn(null);

            Article result = articleService.getById(null);

            assertNull(result);
            verify(articleMapper).selectById(null);
        }
    }

    // ============================================================
    // 分页查询测试
    // ============================================================

    @Nested
    @DisplayName("分页查询文章 - page")
    class PageArticles {

        @Test
        @DisplayName("正常分页查询 - 应返回分页结果")
        void shouldReturnPagedArticles() {
            // Arrange：准备模拟的分页数据
            Page<Article> mockPage = new Page<>(1, 10);
            mockPage.setRecords(Arrays.asList(testArticle, publishedArticle));
            mockPage.setTotal(2);

            when(articleMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                .thenReturn(mockPage);

            // Act
            IPage<Article> result = articleService.page(1, 10, null, null);

            // Assert
            assertNotNull(result, "分页结果不应为 null");
            assertEquals(2, result.getRecords().size(), "应返回 2 条记录");
            assertEquals(2, result.getTotal(), "总记录数应为 2");
            assertEquals(1, result.getCurrent(), "当前页码应为 1");
        }

        @Test
        @DisplayName("空数据分页 - 应返回空列表")
        void shouldReturnEmptyPageWhenNoArticles() {
            Page<Article> emptyPage = new Page<>(1, 10);
            emptyPage.setRecords(List.of());
            emptyPage.setTotal(0);

            when(articleMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                .thenReturn(emptyPage);

            IPage<Article> result = articleService.page(1, 10, null, null);

            assertNotNull(result);
            assertTrue(result.getRecords().isEmpty(), "空数据时应返回空列表");
            assertEquals(0, result.getTotal());
        }
    }

    // ============================================================
    // 创建文章相关测试
    // ============================================================

    @Nested
    @DisplayName("创建文章 - save")
    class CreateArticle {

        @Test
        @DisplayName("正常场景：参数正确时应成功创建文章")
        void shouldCreateArticleSuccessfully() {
            // Arrange：模拟 insert 操作返回影响行数 1（成功）
            when(articleMapper.insert(any(Article.class))).thenReturn(1);

            Article newArticle = new Article();
            newArticle.setTitle("新文章标题");
            newArticle.setContent("新文章内容");
            newArticle.setAuthorId(1L);
            newArticle.setCategoryId(1L);
            newArticle.setStatus(1);

            // Act
            boolean result = articleService.save(newArticle);

            // Assert
            assertTrue(result, "创建文章应返回 true");

            // 使用 ArgumentCaptor 捕获实际传入 Mapper 的参数
            ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
            verify(articleMapper).insert(captor.capture());
            Article insertedArticle = captor.getValue();
            assertEquals("新文章标题", insertedArticle.getTitle());
            assertEquals(1L, insertedArticle.getAuthorId());
        }

        @Test
        @DisplayName("异常场景：Mapper 插入失败（返回 0）时应返回 false")
        void shouldReturnFalseWhenInsertFails() {
            when(articleMapper.insert(any(Article.class))).thenReturn(0);

            Article newArticle = new Article();
            newArticle.setTitle("失败的文章");
            newArticle.setAuthorId(1L);

            boolean result = articleService.save(newArticle);

            assertFalse(result, "插入失败时应返回 false");
        }

        @Test
        @DisplayName("创建草稿文章 - status 应为 0")
        void shouldCreateDraftArticle() {
            when(articleMapper.insert(any(Article.class))).thenReturn(1);

            Article draft = new Article();
            draft.setTitle("我的草稿");
            draft.setContent("草稿内容");
            draft.setAuthorId(1L);
            draft.setStatus(0); // 草稿

            boolean result = articleService.save(draft);

            assertTrue(result);
            ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
            verify(articleMapper).insert(captor.capture());
            assertEquals(0, captor.getValue().getStatus(), "草稿状态应为 0");
        }
    }

    // ============================================================
    // 更新文章相关测试
    // ============================================================

    @Nested
    @DisplayName("更新文章 - updateById")
    class UpdateArticle {

        @Test
        @DisplayName("正常场景：更新已存在的文章应成功")
        void shouldUpdateArticleSuccessfully() {
            // Arrange
            when(articleMapper.selectById(1L)).thenReturn(testArticle);
            when(articleMapper.updateById(any(Article.class))).thenReturn(1);

            testArticle.setTitle("更新后的标题");
            testArticle.setContent("更新后的内容");

            // Act
            boolean result = articleService.updateById(testArticle);

            // Assert
            assertTrue(result, "更新应返回 true");
            verify(articleMapper).updateById(any(Article.class));
        }

        @Test
        @DisplayName("异常场景：更新不存在的文章应返回 false")
        void shouldReturnFalseWhenUpdateNonExistentArticle() {
            Article nonExistent = new Article();
            nonExistent.setId(999L);

            when(articleMapper.updateById(any(Article.class))).thenReturn(0);

            boolean result = articleService.updateById(nonExistent);

            assertFalse(result, "更新不存在的文章应返回 false");
        }
    }

    // ============================================================
    // 删除文章相关测试
    // ============================================================

    @Nested
    @DisplayName("删除文章 - removeByIdAndAuthor")
    class DeleteArticle {

        @Test
        @DisplayName("正常场景：作者本人删除文章应成功")
        void shouldDeleteArticleWhenOwnerMatches() {
            // Arrange：模拟文章存在且作者 ID 匹配
            when(articleMapper.selectById(1L)).thenReturn(testArticle);
            when(articleMapper.deleteById(1L)).thenReturn(1);

            // Act：作者 ID=1 删除自己的文章
            boolean result = articleService.removeByIdAndAuthor(1L, 1L);

            // Assert
            assertTrue(result, "作者本人删除文章应成功");
            verify(articleMapper).selectById(1L);
            verify(articleMapper).deleteById(1L);
        }

        @Test
        @DisplayName("权限校验：非作者删除文章应抛出 BusinessException")
        void shouldThrowExceptionWhenNotOwner() {
            // Arrange：文章作者是 1L，但请求删除的用户是 999L
            when(articleMapper.selectById(1L)).thenReturn(testArticle);

            // Act & Assert：非作者删除应抛出异常
            BusinessException exception = assertThrows(
                BusinessException.class,
                () -> articleService.removeByIdAndAuthor(1L, 999L),
                "非作者删除应抛出 BusinessException"
            );

            // 验证错误信息
            assertTrue(
                exception.getMessage().contains("权限") || exception.getMessage().contains("操作"),
                "异常信息应包含权限相关描述"
            );

            // 验证 deleteById 从未被调用（即没有真正执行删除）
            verify(articleMapper, never()).deleteById(anyLong());
        }

        @Test
        @DisplayName("异常场景：删除不存在的文章应抛出 BusinessException")
        void shouldThrowExceptionWhenArticleNotFound() {
            // Arrange：文章不存在
            when(articleMapper.selectById(999L)).thenReturn(null);

            // Act & Assert
            assertThrows(
                BusinessException.class,
                () -> articleService.removeByIdAndAuthor(999L, 1L),
                "删除不存在的文章应抛出异常"
            );

            // deleteById 不应被调用
            verify(articleMapper, never()).deleteById(anyLong());
        }
    }

    // ============================================================
    // 文章统计相关测试
    // ============================================================

    @Nested
    @DisplayName("文章统计 - incrementViewCount")
    class ArticleStatistics {

        @Test
        @DisplayName("增加浏览次数 - 应调用 Mapper 更新")
        void shouldIncrementViewCount() {
            when(articleMapper.selectById(1L)).thenReturn(testArticle);
            when(articleMapper.updateById(any(Article.class))).thenReturn(1);

            articleService.incrementViewCount(1L);

            // 验证 updateById 被调用，且传入的文章 viewCount 增加了
            ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
            verify(articleMapper).updateById(captor.capture());
            assertEquals(101, captor.getValue().getViewCount(), "浏览次数应增加 1");
        }

        @Test
        @DisplayName("文章不存在时增加浏览次数 - 不应执行更新")
        void shouldNotUpdateWhenArticleNotFound() {
            when(articleMapper.selectById(999L)).thenReturn(null);

            // 文章不存在时不应抛出异常，只是静默忽略
            assertDoesNotThrow(() -> articleService.incrementViewCount(999L));

            verify(articleMapper, never()).updateById(any(Article.class));
        }
    }

    // ============================================================
    // 按作者查询文章测试
    // ============================================================

    @Nested
    @DisplayName("按作者查询文章 - listByAuthorId")
    class ListByAuthor {

        @Test
        @DisplayName("作者有多篇文章 - 应返回列表")
        void shouldReturnArticlesWhenAuthorHasArticles() {
            List<Article> articles = Arrays.asList(testArticle, publishedArticle, draftArticle);
            when(articleMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(articles);

            List<Article> result = articleService.listByAuthorId(1L);

            assertNotNull(result);
            assertEquals(3, result.size(), "应返回 3 篇文章");
            verify(articleMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("作者没有文章 - 应返回空列表")
        void shouldReturnEmptyListWhenNoArticles() {
            when(articleMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<Article> result = articleService.listByAuthorId(999L);

            assertNotNull(result);
            assertTrue(result.isEmpty(), "没有文章时应返回空列表");
        }
    }
}
