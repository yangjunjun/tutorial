package com.example.bookstore.model;

import java.math.BigDecimal;

public record Book(
    String isbn,
    String title,
    String author,
    BigDecimal price,
    BookCategory category
) {
    public Book withPrice(BigDecimal newPrice) {
        return new Book(isbn, title, author, newPrice, category);
    }
}
