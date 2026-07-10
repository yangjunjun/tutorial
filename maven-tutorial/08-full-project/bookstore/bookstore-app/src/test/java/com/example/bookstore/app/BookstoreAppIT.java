package com.example.bookstore.app;

import com.example.bookstore.model.BookCategory;
import com.example.bookstore.service.BookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 集成测试：验证从 app 层到 service 层的完整调用链。
 * 命名为 *IT.java，由 Failsafe 插件在 verify 阶段运行。
 */
class BookstoreAppIT {
    private BookService service;

    @BeforeEach
    void setUp() {
        service = new BookService();
        service.addBook("isbn-1", "Test Book A", "Author A",
                new BigDecimal("19.99"), BookCategory.TECHNOLOGY);
        service.addBook("isbn-2", "Test Book B", "Author B",
                new BigDecimal("29.99"), BookCategory.FICTION);
        service.addBook("isbn-3", "Advanced Testing", "Author C",
                new BigDecimal("39.99"), BookCategory.TECHNOLOGY);
    }

    @Test
    void fullWorkflowShouldWork() {
        // 验证初始状态
        assertEquals(3, service.getBookCount());

        // 按分类查询
        var techBooks = service.listByCategory(BookCategory.TECHNOLOGY);
        assertEquals(2, techBooks.size());

        // 搜索
        var results = service.search("test");
        assertEquals(2, results.size());

        // 删除
        assertTrue(service.removeBook("isbn-1"));
        assertEquals(2, service.getBookCount());

        // 验证 JSON 序列化不抛异常
        String json = service.toJson(service.listAll());
        assertNotNull(json);
        assertTrue(json.contains("Test Book B"));
    }

    @Test
    void shouldHandleEmptyStore() {
        BookService emptyService = new BookService();
        assertEquals(0, emptyService.getBookCount());
        assertTrue(emptyService.listAll().isEmpty());
        assertTrue(emptyService.search("anything").isEmpty());
    }
}
