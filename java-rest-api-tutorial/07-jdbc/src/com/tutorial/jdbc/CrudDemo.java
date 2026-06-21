package com.tutorial.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC CRUD 操作完整演示
 * 
 * 运行前请先执行 DatabaseSetup 创建表和初始数据。
 */
public class CrudDemo {

    private static final String DB_URL = "jdbc:sqlite:tutorial.db";

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            conn.setAutoCommit(true);

            createTask(conn, "新任务：学习 Stream API", "函数式编程", 4);
            readAllTasks(conn);
            readTaskById(conn, 1);
            updateTask(conn, 1, "学习 Java 基础（已复习）", "第二次学习", 5);
            readTaskById(conn, 1);
            deleteTask(conn, 7);
            searchTasks(conn, "学习");
            countByStatus(conn);
            batchInsert(conn);

        } catch (SQLException e) {
            System.err.println("数据库错误: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ===== CREATE =====
    static void createTask(Connection conn, String title, String description, int priority)
            throws SQLException {
        System.out.println("===== CREATE: 插入新任务 =====");

        String sql = """
                INSERT INTO tasks (title, description, priority)
                VALUES (?, ?, ?)
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, title);
            stmt.setString(2, description);
            stmt.setInt(3, priority);

            int rows = stmt.executeUpdate();
            System.out.printf("  插入 %d 行%n", rows);

            // 获取自动生成的 ID
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    System.out.printf("  生成的 ID: %d%n", keys.getInt(1));
                }
            }
        }
    }

    // ===== READ ALL =====
    static void readAllTasks(Connection conn) throws SQLException {
        System.out.println("\n===== READ: 所有任务 =====");

        String sql = "SELECT id, title, description, priority, completed, created_at FROM tasks ORDER BY id";

        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            List<String[]> tasks = new ArrayList<>();
            while (rs.next()) {
                tasks.add(new String[]{
                        String.valueOf(rs.getInt("id")),
                        rs.getString("title"),
                        rs.getString("description"),
                        "P" + rs.getInt("priority"),
                        rs.getInt("completed") == 1 ? "✓" : "○",
                        rs.getString("created_at")
                });
            }

            // 格式化输出
            System.out.printf("  %-4s %-25s %-15s %-4s %-3s %s%n",
                    "ID", "标题", "描述", "优先", "状态", "创建时间");
            System.out.println("  " + "-".repeat(80));
            for (String[] t : tasks) {
                System.out.printf("  %-4s %-25s %-15s %-4s %-3s %s%n",
                        t[0], t[1], t[2], t[3], t[4], t[5]);
            }
            System.out.printf("  共 %d 条记录%n", tasks.size());
        }
    }

    // ===== READ BY ID =====
    static void readTaskById(Connection conn, int id) throws SQLException {
        System.out.printf("%n===== READ: 任务 id=%d =====%n", id);

        String sql = "SELECT * FROM tasks WHERE id = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    System.out.printf("  ID:       %d%n", rs.getInt("id"));
                    System.out.printf("  标题:     %s%n", rs.getString("title"));
                    System.out.printf("  描述:     %s%n", rs.getString("description"));
                    System.out.printf("  优先级:   %d%n", rs.getInt("priority"));
                    System.out.printf("  状态:     %s%n",
                            rs.getInt("completed") == 1 ? "已完成" : "未完成");
                    System.out.printf("  创建时间: %s%n", rs.getString("created_at"));
                } else {
                    System.out.println("  未找到该任务");
                }
            }
        }
    }

    // ===== UPDATE =====
    static void updateTask(Connection conn, int id, String title, String description, int priority)
            throws SQLException {
        System.out.printf("%n===== UPDATE: 更新任务 id=%d =====%n", id);

        String sql = """
                UPDATE tasks
                SET title = ?, description = ?, priority = ?, updated_at = datetime('now')
                WHERE id = ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, title);
            stmt.setString(2, description);
            stmt.setInt(3, priority);
            stmt.setInt(4, id);

            int rows = stmt.executeUpdate();
            System.out.printf("  更新了 %d 行%n", rows);

            if (rows == 0) {
                System.out.println("  警告：未找到匹配的任务");
            }
        }
    }

    // ===== DELETE =====
    static void deleteTask(Connection conn, int id) throws SQLException {
        System.out.printf("%n===== DELETE: 删除任务 id=%d =====%n", id);

        String sql = "DELETE FROM tasks WHERE id = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            int rows = stmt.executeUpdate();
            System.out.printf("  删除了 %d 行%n", rows);
        }
    }

    // ===== SEARCH =====
    static void searchTasks(Connection conn, String keyword) throws SQLException {
        System.out.printf("%n===== SEARCH: 关键词='%s' =====%n", keyword);

        String sql = "SELECT id, title FROM tasks WHERE title LIKE ? ORDER BY id";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, "%" + keyword + "%");

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    System.out.printf("  [%d] %s%n", rs.getInt("id"), rs.getString("title"));
                }
            }
        }
    }

    // ===== AGGREGATE =====
    static void countByStatus(Connection conn) throws SQLException {
        System.out.println("\n===== AGGREGATE: 状态统计 =====");

        String sql = """
                SELECT
                    CASE WHEN completed = 1 THEN '已完成' ELSE '未完成' END as status,
                    COUNT(*) as count
                FROM tasks
                GROUP BY completed
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                System.out.printf("  %s: %d 个%n", rs.getString("status"), rs.getInt("count"));
            }
        }
    }

    // ===== BATCH INSERT =====
    static void batchInsert(Connection conn) throws SQLException {
        System.out.println("\n===== BATCH: 批量插入 =====");

        String sql = "INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)";

        conn.setAutoCommit(false);  // 手动事务
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            for (int i = 1; i <= 5; i++) {
                stmt.setString(1, "批量任务 #" + i);
                stmt.setString(2, "自动生成的测试任务");
                stmt.setInt(3, i % 5 + 1);
                stmt.addBatch();
            }

            int[] results = stmt.executeBatch();
            conn.commit();  // 提交事务
            System.out.printf("  批量插入 %d 条记录（使用事务）%n", results.length);

        } catch (SQLException e) {
            conn.rollback();  // 出错则回滚
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }
}
