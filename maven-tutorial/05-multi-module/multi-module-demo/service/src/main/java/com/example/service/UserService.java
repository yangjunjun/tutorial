package com.example.service;

import com.example.common.JsonUtils;
import com.example.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户业务逻辑 - 依赖 model 和 common 模块。
 */
public class UserService {
    private final List<User> users = new ArrayList<>();

    public User createUser(String name, String email) {
        var user = new User(UUID.randomUUID().toString(), name, email);
        users.add(user);
        return user;
    }

    public Optional<User> findByName(String name) {
        return users.stream()
                .filter(u -> u.name().equalsIgnoreCase(name))
                .findFirst();
    }

    public List<User> listAll() {
        return List.copyOf(users);
    }

    public String listAllAsJson() {
        return JsonUtils.toJson(users);
    }
}
