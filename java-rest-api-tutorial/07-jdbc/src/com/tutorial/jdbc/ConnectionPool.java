package com.tutorial.jdbc;

import java.sql.*;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * 简易数据库连接池实现
 * 
 * 生产环境推荐使用 HikariCP 或 C3P0 等成熟方案。
 * 本示例仅用于理解连接池的原理。
 */
public class ConnectionPool {

    private final BlockingQueue<Connection> pool;
    private final String url;
    private final int maxSize;

    /**
     * 创建连接池
     * @param url  数据库连接 URL
     * @param size 池大小
     */
    public ConnectionPool(String url, int size) throws SQLException {
        this.url = url;
        this.maxSize = size;
        this.pool = new ArrayBlockingQueue<>(size);

        // 预创建连接
        for (int i = 0; i < size; i++) {
            pool.offer(DriverManager.getConnection(url));
        }
        System.out.printf("连接池初始化完成: %d 个连接%n", size);
    }

    /**
     * 从池中获取连接（阻塞等待）
     */
    public Connection getConnection() throws InterruptedException {
        Connection conn = pool.take();
        System.out.printf("[获取连接] 剩余: %d/%d%n", pool.size(), maxSize);
        return new PooledConnection(conn, pool);
    }

    /**
     * 获取连接（带超时）
     */
    public Connection getConnection(long timeoutMs) throws InterruptedException, SQLException {
        Connection conn = pool.poll(timeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS);
        if (conn == null) {
            throw new SQLException("获取连接超时");
        }
        System.out.printf("[获取连接] 剩余: %d/%d%n", pool.size(), maxSize);
        return new PooledConnection(conn, pool);
    }

    /**
     * 关闭连接池
     */
    public void close() {
        int closed = 0;
        for (Connection conn : pool) {
            try {
                conn.close();
                closed++;
            } catch (SQLException e) {
                // ignore
            }
        }
        System.out.printf("连接池已关闭: 释放 %d 个连接%n", closed);
    }

    /**
     * 包装连接，close() 时归还到池中而非真正关闭
     */
    static class PooledConnection implements AutoCloseable {
        private final Connection realConnection;
        private final BlockingQueue<Connection> pool;
        private boolean closed = false;

        PooledConnection(Connection conn, BlockingQueue<Connection> pool) {
            this.realConnection = conn;
            this.pool = pool;
        }

        public Connection getRealConnection() { return realConnection; }

        @Override
        public void close() {
            if (!closed) {
                closed = true;
                pool.offer(realConnection);  // 归还到池中
                System.out.printf("[归还连接] 剩余: %d/%d%n", pool.size(),
                        ((ArrayBlockingQueue<Connection>) pool).remainingCapacity() + pool.size());
            }
        }
    }

    // ===== 演示 =====
    public static void main(String[] args) {
        String dbUrl = "jdbc:sqlite:tutorial.db";

        try {
            ConnectionPool pool = new ConnectionPool(dbUrl, 3);

            // 模拟并发获取连接
            System.out.println("\n===== 连接池使用演示 =====");

            // 获取连接 1
            try (var pc = pool.getConnection()) {
                Connection conn = pc.getRealConnection();
                try (PreparedStatement stmt = conn.prepareStatement("SELECT COUNT(*) FROM tasks");
                     ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        System.out.printf("  任务总数: %d%n", rs.getInt(1));
                    }
                }
            }  // 自动归还到池中

            // 获取连接 2
            try (var pc = pool.getConnection()) {
                Connection conn = pc.getRealConnection();
                try (PreparedStatement stmt = conn.prepareStatement(
                        "SELECT COUNT(*) FROM tasks WHERE completed = 1");
                     ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        System.out.printf("  已完成任务: %d%n", rs.getInt(1));
                    }
                }
            }

            System.out.println("\n===== 模拟多线程 =====");

            Thread[] threads = new Thread[5];
            for (int i = 0; i < threads.length; i++) {
                final int threadId = i + 1;
                threads[i] = new Thread(() -> {
                    try (var pc = pool.getConnection()) {
                        Connection conn = pc.getRealConnection();
                        try (PreparedStatement stmt = conn.prepareStatement(
                                "SELECT COUNT(*) FROM tasks");
                             ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) {
                                System.out.printf("  线程-%d: 查询到 %d 条记录%n",
                                        threadId, rs.getInt(1));
                            }
                        }
                    } catch (Exception e) {
                        System.err.printf("  线程-%d 出错: %s%n", threadId, e.getMessage());
                    }
                });
                threads[i].start();
            }

            // 等待所有线程完成
            for (Thread t : threads) t.join();

            pool.close();

        } catch (Exception e) {
            System.err.println("错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
