package com.tutorial.taskapi.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.tutorial.taskapi.model.ApiResponse;
import com.tutorial.taskapi.model.Task;
import com.tutorial.taskapi.service.TaskService;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 任务请求处理器
 * 
 * 负责：
 * 1. 解析请求（Body、参数）
 * 2. 调用 Service 层
 * 3. 构建 JSON 响应
 */
public class TaskHandler {

    private final TaskService service;
    private final ObjectMapper mapper;

    public TaskHandler(TaskService service) {
        this.service = service;
        this.mapper = new ObjectMapper();
    }

    // ===== CRUD Handlers =====

    /**
     * GET /api/tasks
     */
    public void listAll(HttpExchange exchange, Map<String, String> params) throws IOException {
        // 解析分页参数
        int page = parseIntOrDefault(params.get("page"), 1);
        int size = parseIntOrDefault(params.get("size"), 10);
        String status = params.get("status");  // "completed" | "pending" | null

        var result = service.listTasks(page, size, status);
        var pagination = new ApiResponse.Pagination(page, size, result.total());

        String json = mapper.writeValueAsString(ApiResponse.ok(result.tasks(), pagination));
        sendJson(exchange, 200, json);
    }

    /**
     * GET /api/tasks/:id
     */
    public void getById(HttpExchange exchange, Map<String, String> params) throws IOException {
        int id = parseId(params.get("id"));
        if (id < 0) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, "无效的 ID")));
            return;
        }

        var task = service.getTask(id);
        if (task == null) {
            sendJson(exchange, 404,
                    mapper.writeValueAsString(ApiResponse.error(404, "任务不存在: id=" + id)));
        } else {
            sendJson(exchange, 200,
                    mapper.writeValueAsString(ApiResponse.ok(task)));
        }
    }

    /**
     * POST /api/tasks
     */
    public void create(HttpExchange exchange, Map<String, String> params) throws IOException {
        String body = readBody(exchange);

        Task task;
        try {
            task = mapper.readValue(body, Task.class);
        } catch (Exception e) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, "无效的 JSON: " + e.getMessage())));
            return;
        }

        String validationError = task.validate();
        if (validationError != null) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, validationError)));
            return;
        }

        Task created = service.createTask(task);
        sendJson(exchange, 201,
                mapper.writeValueAsString(ApiResponse.ok(created)));
    }

    /**
     * PUT /api/tasks/:id
     */
    public void update(HttpExchange exchange, Map<String, String> params) throws IOException {
        int id = parseId(params.get("id"));
        if (id < 0) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, "无效的 ID")));
            return;
        }

        String body = readBody(exchange);
        Task updates;
        try {
            updates = mapper.readValue(body, Task.class);
        } catch (Exception e) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, "无效的 JSON")));
            return;
        }

        Task updated = service.updateTask(id, updates);
        if (updated == null) {
            sendJson(exchange, 404,
                    mapper.writeValueAsString(ApiResponse.error(404, "任务不存在: id=" + id)));
        } else {
            sendJson(exchange, 200,
                    mapper.writeValueAsString(ApiResponse.ok(updated)));
        }
    }

    /**
     * DELETE /api/tasks/:id
     */
    public void delete(HttpExchange exchange, Map<String, String> params) throws IOException {
        int id = parseId(params.get("id"));
        if (id < 0) {
            sendJson(exchange, 400,
                    mapper.writeValueAsString(ApiResponse.error(400, "无效的 ID")));
            return;
        }

        boolean deleted = service.deleteTask(id);
        if (!deleted) {
            sendJson(exchange, 404,
                    mapper.writeValueAsString(ApiResponse.error(404, "任务不存在: id=" + id)));
        } else {
            sendJson(exchange, 200,
                    mapper.writeValueAsString(ApiResponse.ok(Map.of(
                            "message", "任务已删除", "id", id))));
        }
    }

    // ===== 工具方法 =====

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    private void sendJson(HttpExchange exchange, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private int parseId(String idStr) {
        try {
            return Integer.parseInt(idStr);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private int parseIntOrDefault(String str, int defaultVal) {
        try {
            return Integer.parseInt(str);
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
