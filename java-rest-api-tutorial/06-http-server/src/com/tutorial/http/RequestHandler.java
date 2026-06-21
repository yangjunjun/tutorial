package com.tutorial.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 请求解析演示：方法、路径、Query 参数、Body
 * 
 * 启动后测试：
 *   curl "http://localhost:8081/api/search?q=java&limit=10"
 *   curl -X POST http://localhost:8081/api/echo -d '{"hello":"world"}'
 */
public class RequestHandler {

    private static final int PORT = 8081;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/api/search", RequestHandler::handleSearch);
        server.createContext("/api/echo", RequestHandler::handleEcho);
        server.createContext("/api/info", RequestHandler::handleInfo);

        server.start();
        System.out.println("请求解析服务器已启动: http://localhost:" + PORT);
        System.out.println("测试:");
        System.out.println("  curl \"http://localhost:" + PORT + "/api/search?q=java&limit=10\"");
        System.out.println("  curl -X POST http://localhost:" + PORT + "/api/echo -d '{\"hello\":\"world\"}'");
        System.out.println("  curl http://localhost:" + PORT + "/api/info");
    }

    /**
     * GET /api/search?q=xxx&limit=10
     * 演示 Query 参数解析
     */
    static void handleSearch(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"仅支持 GET 方法\"}");
            return;
        }

        // 解析 Query 参数
        Map<String, String> params = parseQueryParams(exchange.getRequestURI());

        String query = params.getOrDefault("q", "");
        int limit = Integer.parseInt(params.getOrDefault("limit", "10"));

        // 模拟搜索结果
        List<String> results = new ArrayList<>();
        for (int i = 1; i <= Math.min(limit, 5); i++) {
            results.add("结果 %d: %s 相关条目 #%d".formatted(i, query, i));
        }

        String response = """
                {
                    "query": "%s",
                    "limit": %d,
                    "total": %d,
                    "results": %s
                }
                """.formatted(query, limit, results.size(), toJsonArray(results)).trim();

        sendJson(exchange, 200, response);
    }

    /**
     * POST /api/echo
     * 演示请求 Body 读取
     */
    static void handleEcho(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"仅支持 POST 方法\"}");
            return;
        }

        // 读取 Body
        String body = readBody(exchange);

        // 获取 Content-Type
        String contentType = exchange.getRequestHeaders()
                .getFirst("Content-Type");

        String response = """
                {
                    "method": "%s",
                    "path": "%s",
                    "contentType": "%s",
                    "bodyLength": %d,
                    "body": %s,
                    "headers": %s
                }
                """.formatted(
                exchange.getRequestMethod(),
                exchange.getRequestURI().getPath(),
                contentType != null ? contentType : "未设置",
                body.length(),
                body,
                headersToJson(exchange)
        ).trim();

        sendJson(exchange, 200, response);
    }

    /**
     * GET /api/info
     * 返回完整的请求信息
     */
    static void handleInfo(HttpExchange exchange) throws IOException {
        URI uri = exchange.getRequestURI();

        String response = """
                {
                    "method": "%s",
                    "path": "%s",
                    "query": "%s",
                    "host": "%s",
                    "remoteAddress": "%s",
                    "protocol": "%s"
                }
                """.formatted(
                exchange.getRequestMethod(),
                uri.getPath(),
                uri.getQuery() != null ? uri.getQuery() : "",
                exchange.getRequestHeaders().getFirst("Host"),
                exchange.getRemoteAddress().toString(),
                exchange.getProtocol()
        ).trim();

        sendJson(exchange, 200, response);
    }

    // ===== 工具方法 =====

    /**
     * 解析 URI 中的 Query 参数
     * 例: ?q=java&limit=10 → {q=java, limit=10}
     */
    static Map<String, String> parseQueryParams(URI uri) {
        Map<String, String> params = new HashMap<>();
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) return params;

        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1
                    ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8)
                    : "";
            params.put(key, value);
        }
        return params;
    }

    /**
     * 读取请求 Body
     */
    static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    /**
     * 发送 JSON 响应
     */
    static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /**
     * List 转 JSON 数组字符串
     */
    static String toJsonArray(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("\"").append(list.get(i)).append("\"");
        }
        return sb.append("]").toString();
    }

    /**
     * Headers 转 JSON
     */
    static String headersToJson(HttpExchange exchange) {
        StringBuilder sb = new StringBuilder("{");
        var headers = exchange.getRequestHeaders();
        int i = 0;
        for (var entry : headers.entrySet()) {
            if (i > 0) sb.append(", ");
            sb.append("\"").append(entry.getKey()).append("\": \"")
                    .append(String.join(", ", entry.getValue())).append("\"");
            i++;
        }
        return sb.append("}").toString();
    }
}
