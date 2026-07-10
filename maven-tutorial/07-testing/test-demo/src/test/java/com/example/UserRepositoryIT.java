package com.example;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 集成测试（命名为 *IT.java，由 Failsafe 插件运行）。
 * 在真实场景中，这里会连接真实数据库或外部服务。
 * 本例使用内存存储模拟集成测试的流程和命名约定。
 */
class UserRepositoryIT {
    private UserRepository repo;

    @BeforeEach
    void setUp() {
        repo = new UserRepository();
    }

    @Test
    void shouldSaveAndRetrieveUser() {
        repo.save("alice", "alice@example.com");

        var user = repo.findByName("alice");
        assertTrue(user.isPresent());
        assertEquals("alice@example.com", user.get().email());
    }

    @Test
    void shouldReturnEmptyForNonExistentUser() {
        var user = repo.findByName("ghost");
        assertTrue(user.isEmpty());
    }

    @Test
    void shouldListAllUsers() {
        repo.save("alice", "alice@example.com");
        repo.save("bob", "bob@example.com");

        var users = repo.findAll();
        assertEquals(2, users.size());
    }

    @Test
    void shouldDeleteUser() {
        repo.save("alice", "alice@example.com");
        assertTrue(repo.delete("alice"));
        assertTrue(repo.findByName("alice").isEmpty());
    }

    @Test
    void deleteShouldReturnFalseForNonExistentUser() {
        assertFalse(repo.delete("ghost"));
    }
}
