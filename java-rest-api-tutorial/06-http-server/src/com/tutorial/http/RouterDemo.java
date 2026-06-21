package com.tutorial.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 简易路由器设计
 * 
 * 支持：
 * - GET / POST / PUT / DELETE
 * - 路径参数：/api/tasks/:id
 * - Query 参数：?key=value
 * 
 * 测试：
 *   curl http://localhost:8082/api/tasks
 *   curl http://localhost:8082/api/tasks/42
 *   curl -X POST http://localhost:8082/api/tasks -d '{"title":"新任务"}'
 *   curl -X PUT http://localhost:8082/api/tasks/42 -d '{"title":"已更新"}'
 *   curl -X DELETE http://localhost:8082/api/tasks/42
 */
public class RouterDemo {

    private static final int PORT = 8082;

    // ===== 路由器 =====
    static class Router {
        // route: "GET /api/tasks/:id" → (exchange, pathParams) -> {}
        private final List<Route> routes = new ArrayList<>();

        record Route(String method, String pattern, Pattern regex,
                     List<String> paramNames,
                     BiConsumer<HttpExchange, Map<String, String>> handler) {}

        void addRoute(String method, String pattern,
                      BiConsumer<HttpExchange, Map<String, String>> handler) {
            List<String> paramNames = new ArrayList<>();
            StringBuilder regexBuilder = new StringBuilder("^");

            for (String segment : pattern.split("/")) {
                if (segment.isEmpty()) continue;
                regexBuilder.append("/");
                if (segment.startsWith(":")) {
                    paramNames.add(segment.substring(1));
                    regexBuilder.append("([^/]+)");
                } else {
                    regexBuilder.append(Pattern.quote(segment));
                }
            }
            regexBuilder.append("$");

            Pattern regex = Pattern.compile(regexBuilder.toString());
            routes.add(new Route(method.toUpperCase(), pattern, regex, paramNames, handler));
        }

        void GET(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
            addRoute("GET", path, handler);
        }

        void POST(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
            addRoute("POST", path, handler);
        }

        void PUT(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
            addRoute("PUT", path, handler);
        }

        void DELETE(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
            addRoute("DELETE", path, handler);
        }

        /**
         * 路由分发
         */
        void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            for (Route route : routes) {
                if (!route.method().equals(method)) continue;

                Matcher matcher = route.regex().matcher(path);
                if (matcher.matches()) {
                    Map<String, String> params = new HashMap<>();
                    for (int i = 0; i < route.paramNames().size(); i++) {
                        params.put(route.paramNames().get(i), matcher.group(i + 1));
                    }
                    // 加上 query 参数
                    params.putAll(parseQueryParams(exchange.getRequestURI()));

                    try {
                        route.handler().accept(exchange, params);
                    } catch (Exception e) {
                        sendJson(exchange, 500,
                                "{\"error\":\"内部错误: " + e.getMessage() + "\"}");
                    }
                    return;
                }
            }

            // 没有匹配的路由
            sendJson(exchange, 404,
                    "{\"error\":\"未找到路由: " + method + " " + path + "\"}");
        }
    }

    // ===== 模拟数据存储 =====
    static final Map<Integer, Map<String, String>> tasks = new LinkedHashMap<>();
    static int nextId = 1;

    static {
        addTask("学习 Java 基础");
        addTask("写 REST API");
        addTask("部署上线");
    }

    static void addTask(String title) {
        Map<String, String> task = new LinkedHashMap<>();
        task.put("id", String.valueOf(nextId));
        task.put("title", title);
        task.put("completed", "false");
        tasks.put(nextId, task);
        nextId++;
    }

    // ===== 主方法 =====
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        Router router = new Router();

        // GET /api/tasks - 列表
        router.GET("/api/tasks", (exchange, params) -> {
            try {
                StringBuilder sb = new StringBuilder("[");
                int i = 0;
                for (var task : tasks.values()) {
                    if (i > 0) sb.append(",");
                    sb.append(taskToJson(task));
                    i++;
                }
                sb.append("]");
                sendJson(exchange, 200, sb.toString());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // GET /api/tasks/:id - 获取单个
        router.GET("/api/tasks/:id", (exchange, params) -> {
            try {
                int id = Integer.parseInt(params.get("id"));
                var task = tasks.get(id);
                if (task == null) {
                    sendJson(exchange, 404,
                            "{\"error\":\"任务不存在: id=" + id + "\"}");
                } else {
                    sendJson(exchange, 200, taskToJson(task));
                }
            } catch (NumberFormatException e) {
                sendJson(exchange, 400,
                        "{\"error\":\"无效的 id: " + params.get("id") + "\"}");
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // POST /api/tasks - 创建
        router.POST("/api/tasks", (exchange, params) -> {
            try {
                String body = readBody(exchange);
                // 简单解析 title
                String title = extractField(body, "title");
                if (title == null || title.isBlank()) {
                    sendJson(exchange, 400, "{\"error\":\"title 不能为空\"}");
                    return;
                }
                Map<String, String> task = new LinkedHashMap<>();
                task.put("id", String.valueOf(nextId));
                task.put("title", title);
                task.put("completed", "false");
                tasks.put(nextId, task);
                nextId++;
                sendJson(exchange, 201, taskToJson(task));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // PUT /api/tasks/:id - 更新
        router.PUT("/api/tasks/:id", (exchange, params) -> {
            try {
                int id = Integer.parseInt(params.get("id"));
                var task = tasks.get(id);
                if (task == null) {
                    sendJson(exchange, 404,
                            "{\"error\":\"任务不存在: id=" + id + "\"}");
                    return;
                }
                String body = readBody(exchange);
                String title = extractField(body, "title");
                String completed = extractField(body, "completed");
                if (title != null) task.put("title", title);
                if (completed != null) task.put("completed", completed);
                sendJson(exchange, 200, taskToJson(task));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // DELETE /api/tasks/:id - 删除
        router.DELETE("/api/tasks/:id", (exchange, params) -> {
            try {
                int id = Integer.parseInt(params.get("id"));
                var removed = tasks.remove(id);
                if (removed == null) {
                    sendJson(exchange, 404,
                            "{\"error\":\"任务不存在: id=" + id + "\"}");
                } else {
                    sendJson(exchange, 200,
                            "{\"message\":\"已删除任务 id=" + id + "\"}");
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // 将所有请求委托给路由器
        server.createContext("/", router::handle);
        server.start();

        System.out.println("路由服务器已启动: http://localhost:" + PORT);
        System.out.println("测试命令:");
        System.out.println("  curl http://localhost:" + PORT + "/api/tasks");
        System.out.println("  curl http://localhost:" + PORT + "/api/tasks/1");
        System.out.println("  curl -X POST http://localhost:" + PORT + "/api/tasks -d '{\"title\":\"新任务\"}'");
        System.out.println("  curl -X PUT http://localhost:" + PORT + "/api/tasks/1 -d '{\"title\":\"已更新\"}'");
        System.out.println("  curl -X DELETE http://localhost:" + PORT + "/api/tasks/1");
    }

    // ===== 工具方法 =====

    static String taskToJson(Map<String, String> task) {
        return "{\"id\":%s,\"title\":\"%s\",\"completed\":%s}".formatted(
                task.get("id"), task.get("title"), task.get("completed"));
    }

    static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static Map<String, String> parseQueryParams(URI uri) {
        Map<String, String> params = new HashMap<>();
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, value);
        }
        return params;
    }

    static String extractField(String json, String field) {
        String search = "\"" + field + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return null;
        int colon = json.indexOf(":", idx + search.length());
        if (colon == -1) return null;
        int start = colon + 1;
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start >= json.length()) return null;
        if (json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return end == -1 ? null : json.substring(start + 1, end);
        }
        int end = start;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(start, end).trim();
    }
}
