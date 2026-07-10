package com.example.app;

import com.example.service.UserService;

/**
 * 应用入口 - 依赖 service 模块，
 * 通过传递依赖间接使用 model 和 common。
 */
public class Application {
    public static void main(String[] args) {
        var userService = new UserService();

        userService.createUser("Alice", "alice@example.com");
        userService.createUser("Bob", "bob@example.com");
        userService.createUser("Charlie", "charlie@example.com");

        System.out.println("=== Multi-Module Demo ===");
        System.out.println("All users (JSON):");
        System.out.println(userService.listAllAsJson());

        System.out.println("\nFind Bob:");
        userService.findByName("Bob").ifPresent(u ->
            System.out.println("  Found: " + u.name() + " <" + u.email() + ">")
        );
    }
}
