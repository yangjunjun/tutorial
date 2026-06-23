package com.example.bookstore.model;

public enum BookCategory {
    FICTION("小说"),
    NON_FICTION("非虚构"),
    TECHNOLOGY("技术"),
    SCIENCE("科学"),
    HISTORY("历史");

    private final String displayName;

    BookCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
