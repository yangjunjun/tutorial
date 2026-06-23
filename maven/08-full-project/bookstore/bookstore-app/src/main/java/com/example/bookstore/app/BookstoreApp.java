package com.example.bookstore.app;

import com.example.bookstore.model.BookCategory;
import com.example.bookstore.service.BookService;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.Properties;

public class BookstoreApp {
    public static void main(String[] args) throws IOException {
        // 加载配置（已通过 Resource Filtering 替换占位符）
        Properties config = loadConfig();

        System.out.println("╔═══════════════════════════════════════════════╗");
        System.out.println("║          Bookstore Management System          ║");
        System.out.println("╠═══════════════════════════════════════════════╣");
        System.out.printf("║  Environment: %-32s║%n", config.getProperty("app.env"));
        System.out.printf("║  Version:     %-32s║%n", config.getProperty("app.version"));
        System.out.printf("║  Capacity:    %-32s║%n", config.getProperty("store.capacity"));
        System.out.printf("║  Log Level:   %-32s║%n", config.getProperty("logging.level"));
        System.out.println("╚═══════════════════════════════════════════════╝");
        System.out.println();

        // 创建业务服务
        BookService service = new BookService();

        // 添加示例书籍
        service.addBook("978-0-13-468599-1", "The Pragmatic Programmer",
                "David Thomas & Andrew Hunt", new BigDecimal("49.99"), BookCategory.TECHNOLOGY);
        service.addBook("978-0-596-51774-8", "JavaScript: The Good Parts",
                "Douglas Crockford", new BigDecimal("29.99"), BookCategory.TECHNOLOGY);
        service.addBook("978-0-06-112008-4", "To Kill a Mockingbird",
                "Harper Lee", new BigDecimal("14.99"), BookCategory.FICTION);
        service.addBook("978-0-14-028329-7", "Sapiens: A Brief History of Humankind",
                "Yuval Noah Harari", new BigDecimal("24.99"), BookCategory.HISTORY);
        service.addBook("978-0-452-28423-4", "1984",
                "George Orwell", new BigDecimal("13.99"), BookCategory.FICTION);

        System.out.println("--- All Books (" + service.getBookCount() + ") ---");
        System.out.println(service.toJson(service.listAll()));

        System.out.println("\n--- Technology Books ---");
        var techBooks = service.listByCategory(BookCategory.TECHNOLOGY);
        System.out.println(service.toJson(techBooks));

        System.out.println("\n--- Search: 'history' ---");
        var searchResults = service.search("history");
        System.out.println(service.toJson(searchResults));

        System.out.println("\n--- Remove: 978-0-452-28423-4 (1984) ---");
        service.removeBook("978-0-452-28423-4");
        System.out.println("Remaining books: " + service.getBookCount());
    }

    private static Properties loadConfig() throws IOException {
        Properties props = new Properties();
        try (InputStream is = BookstoreApp.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (is != null) {
                props.load(is);
            }
        }
        return props;
    }
}
