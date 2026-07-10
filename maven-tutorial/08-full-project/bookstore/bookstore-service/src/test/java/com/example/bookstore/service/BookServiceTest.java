package com.example.bookstore.service;

import com.example.bookstore.model.BookCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class BookServiceTest {
    private BookService service;

    @BeforeEach
    void setUp() {
        service = new BookService();
    }

    @Test
    void shouldAddBook() {
        var book = service.addBook("978-0-13-468599-1", "The Pragmatic Programmer",
                "David Thomas", new BigDecimal("49.99"), BookCategory.TECHNOLOGY);

        assertNotNull(book);
        assertEquals("978-0-13-468599-1", book.isbn());
        assertEquals(1, service.getBookCount());
    }

    @Test
    void shouldFindBookByIsbn() {
        service.addBook("978-0-13-468599-1", "The Pragmatic Programmer",
                "David Thomas", new BigDecimal("49.99"), BookCategory.TECHNOLOGY);

        var found = service.getBook("978-0-13-468599-1");
        assertTrue(found.isPresent());
        assertEquals("The Pragmatic Programmer", found.get().title());
    }

    @Test
    void shouldReturnEmptyForUnknownIsbn() {
        var found = service.getBook("000-0-00-000000-0");
        assertTrue(found.isEmpty());
    }

    @Test
    void shouldFilterByCategory() {
        service.addBook("isbn-1", "Java in Action", "Author A",
                new BigDecimal("39.99"), BookCategory.TECHNOLOGY);
        service.addBook("isbn-2", "A Brief History", "Author B",
                new BigDecimal("29.99"), BookCategory.HISTORY);
        service.addBook("isbn-3", "Clean Code", "Author C",
                new BigDecimal("44.99"), BookCategory.TECHNOLOGY);

        var techBooks = service.listByCategory(BookCategory.TECHNOLOGY);
        assertEquals(2, techBooks.size());
    }

    @Test
    void shouldSearchByTitle() {
        service.addBook("isbn-1", "Java Concurrency in Practice", "Author A",
                new BigDecimal("39.99"), BookCategory.TECHNOLOGY);
        service.addBook("isbn-2", "Effective Java", "Author B",
                new BigDecimal("44.99"), BookCategory.TECHNOLOGY);
        service.addBook("isbn-3", "The Great Gatsby", "Author C",
                new BigDecimal("12.99"), BookCategory.FICTION);

        var results = service.search("java");
        assertEquals(2, results.size());
    }

    @Test
    void shouldRemoveBook() {
        service.addBook("isbn-1", "Test Book", "Author",
                new BigDecimal("9.99"), BookCategory.FICTION);

        assertTrue(service.removeBook("isbn-1"));
        assertEquals(0, service.getBookCount());
    }

    @Test
    void removeShouldReturnFalseForUnknownIsbn() {
        assertFalse(service.removeBook("unknown"));
    }
}
