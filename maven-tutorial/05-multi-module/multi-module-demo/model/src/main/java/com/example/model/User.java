package com.example.model;

/**
 * 用户数据模型 - 纯数据类，不依赖任何第三方库。
 */
public record User(String id, String name, String email) {

    public User withName(String newName) {
        return new User(id, newName, email);
    }

    public User withEmail(String newEmail) {
        return new User(id, name, newEmail);
    }
}
