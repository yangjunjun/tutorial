package com.tutorial.taskapi.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

/**
 * HTTP 服务器启动器
 * 
 * 负责创建 HttpServer、注册路由、配置线程池
 */
public class HttpServerStarter {

    private final HttpServer server;
    private final int port;

    public HttpServerStarter(int port) throws IOException {
        this.port = port;
        this.server = HttpServer.create(new InetSocketAddress(port), 0);

        // 配置线程池
        server.setExecutor(Executors.newFixedThreadPool(10));

        // 注册路由
        registerRoutes();
    }

    private void registerRoutes() {
        // 根路径 - API 信息
        server.createContext("/", this::handleRoot);

        // 健康检查
        server.createContext("/health", this::handleHealth);

        // TODO: 后续章节会在这里注册任务相关路由
        // server.createContext("/api/tasks", taskRouter::handle);
    }

    public void start() {
        server.start();
    }

    public void stop() {
        server.stop(2);  // 等待 2 秒让请求完成
    }

    // ===== 路由处理器 =====

    private void handleRoot(HttpExchange exchange) throws IOException {
        String json = """
                {
                    "name": "Task Management API",
                    "version": "1.0.0",
                    "description": "纯 Java 实现的 RESTful 任务管理 API",
                    "endpoints": {
                        "GET /health": "健康检查",
                        "GET /api/tasks": "获取任务列表",
                        "POST /api/tasks": "创建任务",
                        "GET /api/tasks/:id": "获取单个任务",
                        "PUT /api/tasks/:id": "更新任务",
                        "DELETE /api/tasks/:id": "删除任务"
                    }
                }
                """;
        sendJson(exchange, 200, json);
    }

    private void handleHealth(HttpExchange exchange) throws IOException {
        String json = """
                {
                    "status": "UP",
                    "timestamp": "%s"
                }
                """.formatted(java.time.Instant.now().toString());
        sendJson(exchange, 200, json);
    }

    // ===== 工具方法 =====

    private void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
