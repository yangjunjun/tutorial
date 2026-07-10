package com.example;

import java.util.*;

public class UserRepository {
    private final Map<String, UserRecord> store = new HashMap<>();

    public void save(String name, String email) {
        store.put(name, new UserRecord(name, email));
    }

    public Optional<UserRecord> findByName(String name) {
        return Optional.ofNullable(store.get(name));
    }

    public List<UserRecord> findAll() {
        return List.copyOf(store.values());
    }

    public boolean delete(String name) {
        return store.remove(name) != null;
    }

    public record UserRecord(String name, String email) {}
}
