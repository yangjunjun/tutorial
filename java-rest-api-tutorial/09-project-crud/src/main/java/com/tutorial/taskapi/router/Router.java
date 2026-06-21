package com.tutorial.taskapi.router;

import com.sun.net.httpserver.HttpExchange;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HTTP 路由器
 * 
 * 支持路径参数（:id）和 Query 参数
 * 支持 GET / POST / PUT / DELETE
 */
public class Router {

    private final List<Route> routes = new ArrayList<>();

    record Route(String method, String pattern, Pattern regex,
                 List<String> paramNames,
                 BiConsumer<HttpExchange, Map<String, String>> handler) {}

    /**
     * 注册路由
     */
    public void addRoute(String method, String pattern,
                         BiConsumer<HttpExchange, Map<String, String>> handler) {
        List<String> paramNames = new ArrayList<>();
        StringBuilder regexStr = new StringBuilder("^");

        for (String segment : pattern.split("/")) {
            if (segment.isEmpty()) continue;
            regexStr.append("/");
            if (segment.startsWith(":")) {
                paramNames.add(segment.substring(1));
                regexStr.append("([^/]+)");
            } else {
                regexStr.append(Pattern.quote(segment));
            }
        }
        regexStr.append("$");

        routes.add(new Route(
                method.toUpperCase(), pattern,
                Pattern.compile(regexStr.toString()),
                paramNames, handler));
    }

    public void GET(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
        addRoute("GET", path, handler);
    }

    public void POST(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
        addRoute("POST", path, handler);
    }

    public void PUT(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
        addRoute("PUT", path, handler);
    }

    public void DELETE(String path, BiConsumer<HttpExchange, Map<String, String>> handler) {
        addRoute("DELETE", path, handler);
    }

    /**
     * 分发请求
     */
    public void handle(HttpExchange exchange) {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        for (Route route : routes) {
            if (!route.method().equals(method)) continue;

            Matcher matcher = route.regex().matcher(path);
            if (matcher.matches()) {
                Map<String, String> params = new LinkedHashMap<>();

                // 路径参数
                for (int i = 0; i < route.paramNames().size(); i++) {
                    params.put(route.paramNames().get(i),
                            URLDecoder.decode(matcher.group(i + 1), StandardCharsets.UTF_8));
                }

                // Query 参数
                params.putAll(parseQuery(exchange.getRequestURI()));

                try {
                    route.handler().accept(exchange, params);
                } catch (Exception e) {
                    handleServerError(exchange, e);
                }
                return;
            }
        }

        handleNotFound(exchange, method, path);
    }

    // ===== 工具方法 =====

    private Map<String, String> parseQuery(URI uri) {
        Map<String, String> params = new LinkedHashMap<>();
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            params.put(
                    URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                    kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "");
        }
        return params;
    }

    private void handleNotFound(HttpExchange exchange, String method, String path) {
        String json = "{\"success\":false,\"error\":{\"code\":404,\"message\":\"未找到路由: %s %s\"}}"
                .formatted(method, path);
        sendResponse(exchange, 404, json);
    }

    private void handleServerError(HttpExchange exchange, Exception e) {
        String json = "{\"success\":false,\"error\":{\"code\":500,\"message\":\"服务器内部错误: %s\"}}"
                .formatted(e.getMessage().replace("\"", "'"));
        sendResponse(exchange, 500, json);
    }

    private void sendResponse(HttpExchange exchange, int code, String json) {
        try {
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(code, bytes.length);
            try (var os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        } catch (Exception ex) {
            System.err.println("发送响应失败: " + ex.getMessage());
        }
    }
}
