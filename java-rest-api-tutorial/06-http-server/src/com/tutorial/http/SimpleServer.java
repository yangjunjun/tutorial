package com.tutorial.http;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 最简 HTTP 服务器
 * 
 * 启动后访问：
 *   GET /hello  → 返回 Hello 信息
 *   GET /time   → 返回当前时间
 *   GET /       → 返回所有可用接口
 */
public class SimpleServer {

    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        // 1. 创建服务器实例
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // 2. 注册路由
        server.createContext("/hello", SimpleServer::handleHello);
        server.createContext("/time", SimpleServer::handleTime);
        server.createContext("/", SimpleServer::handleRoot);

        // 3. 启动服务器
        server.start();
        System.out.println("服务器已启动: http://localhost:" + PORT);
        System.out.println("按 Ctrl+C 停止");
        System.out.println();
        System.out.println("试试看:");
        System.out.println("  curl http://localhost:" + PORT + "/hello");
        System.out.println("  curl http://localhost:" + PORT + "/time");
    }

    /**
     * GET /hello - 返回问候
     */
    static void handleHello(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
        String response = """
                {
                    "message": "Hello from Java HttpServer!",
                    "method": "%s",
                    "path": "%s"
                }
                """.formatted(
                exchange.getRequestMethod(),
                exchange.getRequestURI().getPath()
        ).trim();

        sendJson(exchange, 200, response);
    }

    /**
     * GET /time - 返回当前时间
     */
    static void handleTime(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
        String now = LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        String response = """
                {
                    "time": "%s",
                    "timezone": "%s"
                }
                """.formatted(now, java.util.TimeZone.getDefault().getID()).trim();

        sendJson(exchange, 200, response);
    }

    /**
     * GET / - 返回帮助信息
     */
    static void handleRoot(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
        String response = """
                {
                    "name": "Java Simple Server",
                    "version": "1.0",
                    "endpoints": [
                        "GET /hello",
                        "GET /time",
                        "GET /"
                    ]
                }
                """.trim();

        sendJson(exchange, 200, response);
    }

    // ===== 工具方法 =====

    /**
     * 发送 JSON 响应的通用方法
     */
    static void sendJson(com.sun.net.httpserver.HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        // 设置响应头
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");

        // 发送响应头（状态码 + 内容长度）
        exchange.sendResponseHeaders(statusCode, bytes.length);

        // 写入响应体
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
