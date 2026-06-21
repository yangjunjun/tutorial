package com.tutorial.taskapi.dao;

import com.tutorial.taskapi.model.Task;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 任务数据访问层（Data Access Object）
 * 
 * 负责与数据库交互：增删改查
 */
public class TaskDao {

    private final String dbUrl;

    public TaskDao(String dbUrl) {
        this.dbUrl = dbUrl;
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl);
    }

    /**
     * 查询所有任务（分页 + 过滤）
     */
    public List<Task> findAll(int offset, int limit, Boolean completed) {
        StringBuilder sql = new StringBuilder(
                "SELECT * FROM tasks");

        if (completed != null) {
            sql.append(" WHERE completed = ?");
        }
        sql.append(" ORDER BY id DESC LIMIT ? OFFSET ?");

        List<Task> tasks = new ArrayList<>();

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            int idx = 1;
            if (completed != null) {
                stmt.setInt(idx++, completed ? 1 : 0);
            }
            stmt.setInt(idx++, limit);
            stmt.setInt(idx, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    tasks.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("查询任务失败", e);
        }

        return tasks;
    }

    /**
     * 统计任务数
     */
    public long count(Boolean completed) {
        String sql = "SELECT COUNT(*) FROM tasks";
        if (completed != null) {
            sql += " WHERE completed = ?";
        }

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            if (completed != null) {
                stmt.setInt(1, completed ? 1 : 0);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("统计任务失败", e);
        }
    }

    /**
     * 按 ID 查询
     */
    public Task findById(int id) {
        String sql = "SELECT * FROM tasks WHERE id = ?";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        } catch (SQLException e) {
            throw new RuntimeException("查询任务失败: id=" + id, e);
        }
    }

    /**
     * 插入新任务
     */
    public Task insert(Task task) {
        String sql = """
                INSERT INTO tasks (title, description, completed, priority)
                VALUES (?, ?, ?, ?)
                """;

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, task.getTitle());
            stmt.setString(2, task.getDescription() != null ? task.getDescription() : "");
            stmt.setInt(3, task.isCompleted() ? 1 : 0);
            stmt.setInt(4, task.getPriority());

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    task.setId(keys.getInt(1));
                }
            }

            return task;

        } catch (SQLException e) {
            throw new RuntimeException("创建任务失败", e);
        }
    }

    /**
     * 更新任务
     */
    public void update(Task task) {
        String sql = """
                UPDATE tasks
                SET title = ?, description = ?, completed = ?, priority = ?,
                    updated_at = datetime('now','localtime')
                WHERE id = ?
                """;

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, task.getTitle());
            stmt.setString(2, task.getDescription());
            stmt.setInt(3, task.isCompleted() ? 1 : 0);
            stmt.setInt(4, task.getPriority());
            stmt.setInt(5, task.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("更新任务失败: id=" + task.getId(), e);
        }
    }

    /**
     * 删除任务
     */
    public boolean delete(int id) {
        String sql = "DELETE FROM tasks WHERE id = ?";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new RuntimeException("删除任务失败: id=" + id, e);
        }
    }

    /**
     * 将 ResultSet 行映射为 Task 对象
     */
    private Task mapRow(ResultSet rs) throws SQLException {
        Task task = new Task();
        task.setId(rs.getInt("id"));
        task.setTitle(rs.getString("title"));
        task.setDescription(rs.getString("description"));
        task.setCompleted(rs.getInt("completed") == 1);
        task.setPriority(rs.getInt("priority"));
        task.setCreatedAt(rs.getString("created_at"));
        task.setUpdatedAt(rs.getString("updated_at"));
        return task;
    }
}
