package com.tutorial.jdbc;

import java.sql.*;

/**
 * 数据库初始化：建表、插入初始数据
 * 
 * 使用 SQLite 嵌入式数据库
 */
public class DatabaseSetup {

    private static final String DB_URL = "jdbc:sqlite:tutorial.db";

    public static void main(String[] args) {
        try {
            // 加载驱动（SQLite 通常需要这行）
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.out.println("请确保 SQLite JDBC 驱动在 classpath 中");
            System.out.println("下载: https://github.com/xerial/sqlite-jdbc/releases");
            // 继续执行，让 DriverManager 尝试自动加载
        }

        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            System.out.println("数据库连接成功: " + DB_URL);

            createTables(conn);
            insertSeedData(conn);
            verifyData(conn);

        } catch (SQLException e) {
            System.err.println("数据库错误: " + e.getMessage());
            e.printStackTrace();
        }
    }

    static void createTables(Connection conn) throws SQLException {
        System.out.println("\n===== 创建数据表 =====");

        String createTasks = """
                CREATE TABLE IF NOT EXISTS tasks (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    title       TEXT    NOT NULL,
                    description TEXT    DEFAULT '',
                    completed   INTEGER DEFAULT 0,
                    priority    INTEGER DEFAULT 0,
                    created_at  TEXT    DEFAULT (datetime('now')),
                    updated_at  TEXT    DEFAULT (datetime('now'))
                )
                """;

        String createUsers = """
                CREATE TABLE IF NOT EXISTS users (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    username   TEXT    NOT NULL UNIQUE,
                    email      TEXT    NOT NULL UNIQUE,
                    password   TEXT    NOT NULL,
                    created_at TEXT    DEFAULT (datetime('now'))
                )
                """;

        // 创建索引
        String createIndex = """
                CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
                """;

        try (Statement stmt = conn.createStatement()) {
            stmt.execute(createTasks);
            System.out.println("  表 tasks 创建成功");

            stmt.execute(createUsers);
            System.out.println("  表 users 创建成功");

            stmt.execute(createIndex);
            System.out.println("  索引创建成功");
        }
    }

    static void insertSeedData(Connection conn) throws SQLException {
        System.out.println("\n===== 插入初始数据 =====");

        // 使用 PreparedStatement 批量插入
        String insertTask = """
                INSERT INTO tasks (title, description, priority, completed)
                VALUES (?, ?, ?, ?)
                """;

        Object[][] seedData = {
                {"学习 Java 基础", "完成语法学习", 3, 1},
                {"掌握集合框架", "List, Set, Map", 4, 1},
                {"学习 JDBC", "数据库操作", 4, 0},
                {"构建 REST API", "使用 HttpServer", 5, 0},
                {"编写单元测试", "JUnit 5", 3, 0},
                {"部署上线", "Docker 容器化", 5, 0},
        };

        try (PreparedStatement stmt = conn.prepareStatement(insertTask)) {
            for (Object[] data : seedData) {
                stmt.setString(1, (String) data[0]);
                stmt.setString(2, (String) data[1]);
                stmt.setInt(3, (Integer) data[2]);
                stmt.setInt(4, (Integer) data[3]);
                stmt.addBatch();  // 添加到批处理
            }

            int[] results = stmt.executeBatch();  // 批量执行
            System.out.printf("  插入 %d 条任务记录%n", results.length);
        }

        // 插入用户
        String insertUser = """
                INSERT OR IGNORE INTO users (username, email, password)
                VALUES (?, ?, ?)
                """;

        try (PreparedStatement stmt = conn.prepareStatement(insertUser)) {
            stmt.setString(1, "admin");
            stmt.setString(2, "admin@example.com");
            stmt.setString(3, "password123");  // 生产环境请加密！
            stmt.executeUpdate();
            System.out.println("  插入管理员用户");
        }
    }

    static void verifyData(Connection conn) throws SQLException {
        System.out.println("\n===== 验证数据 =====");

        String sql = "SELECT COUNT(*) as count FROM tasks";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                System.out.printf("  任务总数: %d%n", rs.getInt("count"));
            }
        }

        sql = "SELECT id, title, priority, completed FROM tasks ORDER BY priority DESC";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            System.out.println("  任务列表:");
            while (rs.next()) {
                System.out.printf("    [%d] %s (P%d, %s)%n",
                        rs.getInt("id"),
                        rs.getString("title"),
                        rs.getInt("priority"),
                        rs.getInt("completed") == 1 ? "已完成" : "未完成");
            }
        }
    }
}
