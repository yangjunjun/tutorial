package com.tutorial.exceptionio;

import java.util.List;

/**
 * JSON 处理演示
 * 
 * 注意：本示例使用 Java 内置能力模拟 JSON 操作。
 * 实际项目中推荐使用 Jackson 库（见 pom.xml 配置）。
 * 
 * Jackson 依赖：
 * <dependency>
 *     <groupId>com.fasterxml.jackson.core</groupId>
 *     <artifactId>jackson-databind</artifactId>
 *     <version>2.17.0</version>
 * </dependency>
 */
public class JsonDemo {

    // 模拟的任务类
    static class Task {
        private int id;
        private String title;
        private String description;
        private boolean completed;

        public Task() {}  // Jackson 需要无参构造器

        public Task(int id, String title, String description, boolean completed) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.completed = completed;
        }

        // Getters & Setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }

        @Override
        public String toString() {
            return "Task{id=%d, title='%s', completed=%s}".formatted(id, title, completed);
        }
    }

    // ===== 手动 JSON 序列化（不依赖外部库） =====
    static String taskToJson(Task task) {
        return """
                {
                    "id": %d,
                    "title": "%s",
                    "description": "%s",
                    "completed": %s
                }""".formatted(
                task.getId(),
                escapeJson(task.getTitle()),
                escapeJson(task.getDescription()),
                task.isCompleted()
        );
    }

    static String taskListToJson(List<Task> tasks) {
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 0; i < tasks.size(); i++) {
            sb.append("  ").append(taskToJson(tasks.get(i)).replace("\n", "\n  "));
            if (i < tasks.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("]");
        return sb.toString();
    }

    static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    public static void main(String[] args) {
        serializeDemo();
        deserializeDemo();
        jsonStructureDesign();
    }

    static void serializeDemo() {
        System.out.println("===== JSON 序列化 =====");

        Task task = new Task(1, "学习 Java", "完成基础语法学习", false);
        String json = taskToJson(task);
        System.out.println("单个任务:");
        System.out.println(json);

        List<Task> tasks = List.of(
                new Task(1, "学习 Java", "完成基础语法", true),
                new Task(2, "写 REST API", "实现 CRUD 接口", false),
                new Task(3, "部署上线", "配置生产环境", false)
        );

        System.out.println("\n任务列表:");
        System.out.println(taskListToJson(tasks));
    }

    static void deserializeDemo() {
        System.out.println("\n===== JSON 反序列化（模拟）=====");

        // 实际项目中使用 Jackson:
        // ObjectMapper mapper = new ObjectMapper();
        // Task task = mapper.readValue(json, Task.class);

        String json = """
                {"id": 42, "title": "新任务", "description": "这是一个测试", "completed": false}
                """;
        System.out.println("原始 JSON:");
        System.out.println(json);

        // 简单解析演示（生产环境请用 Jackson）
        System.out.println("解析结果:");
        System.out.printf("  id: %s%n", extractJsonValue(json, "id"));
        System.out.printf("  title: %s%n", extractJsonValue(json, "title"));
        System.out.printf("  completed: %s%n", extractJsonValue(json, "completed"));
    }

    static void jsonStructureDesign() {
        System.out.println("\n===== REST API JSON 设计 =====");

        // 标准 REST API 响应格式
        String successResponse = """
                {
                    "success": true,
                    "data": {
                        "id": 1,
                        "title": "学习 Java",
                        "completed": false
                    }
                }
                """;

        String errorResponse = """
                {
                    "success": false,
                    "error": {
                        "code": 404,
                        "message": "任务不存在",
                        "details": []
                    }
                }
                """;

        String listResponse = """
                {
                    "success": true,
                    "data": [...],
                    "pagination": {
                        "page": 1,
                        "size": 10,
                        "total": 42
                    }
                }
                """;

        System.out.println("成功响应:");
        System.out.println(successResponse);
        System.out.println("错误响应:");
        System.out.println(errorResponse);
        System.out.println("列表响应（含分页）:");
        System.out.println(listResponse);
    }

    // 简单的 JSON 值提取（仅用于演示）
    static String extractJsonValue(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return null;
        int colon = json.indexOf(":", idx + search.length());
        if (colon == -1) return null;
        int start = colon + 1;
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start >= json.length()) return null;
        if (json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return json.substring(start + 1, end);
        }
        int end = start;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(start, end).trim();
    }
}
