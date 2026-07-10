package com.example.bookstore.service;

import com.example.bookstore.model.Book;
import com.example.bookstore.model.BookCategory;

import java.util.*;
import java.util.stream.Collectors;

public class BookRepository {
    private final Map<String, Book> store = new LinkedHashMap<>();

    public void save(Book book) {
        store.put(book.isbn(), book);
    }

    public Optional<Book> findByIsbn(String isbn) {
        return Optional.ofNullable(store.get(isbn));
    }

    public List<Book> findAll() {
        return List.copyOf(store.values());
    }

    public List<Book> findByCategory(BookCategory category) {
        return store.values().stream()
                .filter(b -> b.category() == category)
                .collect(Collectors.toList());
    }

    public List<Book> searchByTitle(String keyword) {
        String lower = keyword.toLowerCase();
        return store.values().stream()
                .filter(b -> b.title().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    public boolean delete(String isbn) {
        return store.remove(isbn) != null;
    }

    public int count() {
        return store.size();
    }
}
