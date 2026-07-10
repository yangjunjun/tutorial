package com.example.bookstore.service;

import com.example.bookstore.model.Book;
import com.example.bookstore.model.BookCategory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public class BookService {
    private final BookRepository repository;
    private final Gson gson;

    public BookService() {
        this(new BookRepository());
    }

    public BookService(BookRepository repository) {
        this.repository = repository;
        this.gson = new GsonBuilder().setPrettyPrinting().create();
    }

    public Book addBook(String isbn, String title, String author,
                        BigDecimal price, BookCategory category) {
        var book = new Book(isbn, title, author, price, category);
        repository.save(book);
        return book;
    }

    public Optional<Book> getBook(String isbn) {
        return repository.findByIsbn(isbn);
    }

    public List<Book> listAll() {
        return repository.findAll();
    }

    public List<Book> listByCategory(BookCategory category) {
        return repository.findByCategory(category);
    }

    public List<Book> search(String keyword) {
        return repository.searchByTitle(keyword);
    }

    public boolean removeBook(String isbn) {
        return repository.delete(isbn);
    }

    public String toJson(Object obj) {
        return gson.toJson(obj);
    }

    public int getBookCount() {
        return repository.count();
    }
}
