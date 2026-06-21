package com.tutorial.taskapi;

import com.tutorial.taskapi.server.HttpServerStarter;

import java.io.IOException;

/**
 * 应用入口
 * 
 * 负责：
 * 1. 初始化数据库
 * 2. 创建各层组件（DAO → Service → Handler）
 * 3. 启动 HTTP 服务器
 */
public class Main {

    private static final int PORT = 8080;

    public static void main(String[] args) {
        System.out.println("=================================");
        System.out.println("  Task Management API Server");
        System.out.println("  纯 Java 实现 · 零框架依赖");
        System.out.println("=================================");

        try {
            // 初始化数据库
            System.out.println("\n[1/3] 初始化数据库...");
            initDatabase();

            // 创建服务器
            System.out.println("[2/3] 配置 HTTP 服务器...");
            HttpServerStarter server = new HttpServerStarter(PORT);

            // 启动
            System.out.println("[3/3] 启动服务器...");
            server.start();

            System.out.println("\n✓ 服务器已启动: http://localhost:" + PORT);
            System.out.println("  按 Ctrl+C 停止\n");

            // 优雅关闭
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n正在关闭服务器...");
                server.stop();
                System.out.println("服务器已停止。");
            }));

        } catch (Exception e) {
            System.err.println("启动失败: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    static void initDatabase() {
        String dbUrl = "jdbc:sqlite:taskapi.db";

        try (var conn = java.sql.DriverManager.getConnection(dbUrl)) {
            var stmt = conn.createStatement();

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    title       TEXT    NOT NULL,
                    description TEXT    DEFAULT '',
                    completed   INTEGER DEFAULT 0,
                    priority    INTEGER DEFAULT 0,
                    created_at  TEXT    DEFAULT (datetime('now','localtime')),
                    updated_at  TEXT    DEFAULT (datetime('now','localtime'))
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT    NOT NULL UNIQUE,
                    password TEXT    NOT NULL
                )
            """);

            System.out.println("  数据库表已就绪");

        } catch (java.sql.SQLException e) {
            throw new RuntimeException("数据库初始化失败", e);
        }
    }
}
