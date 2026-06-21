package com.tutorial.exceptionio;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 异常处理全流程演示
 */
public class ExceptionDemo {

    // ===== 自定义异常 =====
    static class TaskNotFoundException extends RuntimeException {
        private final int taskId;

        public TaskNotFoundException(int taskId) {
            super("任务不存在: id=" + taskId);
            this.taskId = taskId;
        }

        public int getTaskId() { return taskId; }
    }

    static class ValidationException extends RuntimeException {
        private final List<String> errors;

        public ValidationException(List<String> errors) {
            super("验证失败: " + errors.size() + " 个错误");
            this.errors = List.copyOf(errors);
        }

        public List<String> getErrors() { return errors; }
    }

    public static void main(String[] args) {
        basicTryCatch();
        multiCatchDemo();
        customExceptionDemo();
        finallyDemo();
        tryWithResourcesDemo();
    }

    static void basicTryCatch() {
        System.out.println("===== 基本 try-catch =====");

        // 不处理异常的情况（会崩溃）
        // int result = 10 / 0;

        try {
            int result = 10 / 0;
            System.out.println("结果: " + result);  // 不会执行
        } catch (ArithmeticException e) {
            System.out.printf("捕获异常: %s%n", e.getMessage());
        }

        // 常见运行时异常
        try {
            String s = null;
            s.length();  // NullPointerException
        } catch (NullPointerException e) {
            System.out.printf("空指针: %s%n", e.getMessage());
        }

        try {
            int[] arr = new int[3];
            arr[10] = 1;  // ArrayIndexOutOfBoundsException
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.printf("数组越界: %s%n", e.getMessage());
        }
    }

    static void multiCatchDemo() {
        System.out.println("\n===== 多重捕获 =====");

        String[] data = {"123", "abc", null};

        for (String s : data) {
            try {
                int num = Integer.parseInt(s);
                System.out.printf("  解析成功: %d%n", num);
            } catch (NumberFormatException e) {
                System.out.printf("  数字格式错误: '%s'%n", s);
            } catch (NullPointerException e) {
                System.out.println("  输入为 null");
            } catch (Exception e) {
                System.out.printf("  未知错误: %s%n", e.getClass().getSimpleName());
            }
        }

        // Java 7+ 多异常合并捕获
        try {
            riskyOperation();
        } catch (IOException | IllegalArgumentException e) {
            System.out.printf("  合并捕获: %s - %s%n", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    static void customExceptionDemo() {
        System.out.println("\n===== 自定义异常 =====");

        // TaskNotFoundException
        try {
            findTask(999);
        } catch (TaskNotFoundException e) {
            System.out.printf("  %s (taskId=%d)%n", e.getMessage(), e.getTaskId());
        }

        // ValidationException
        try {
            validateTask("", -1);
        } catch (ValidationException e) {
            System.out.printf("  %s%n", e.getMessage());
            e.getErrors().forEach(err -> System.out.printf("    - %s%n", err));
        }
    }

    static void finallyDemo() {
        System.out.println("\n===== finally 块 =====");

        // finally 总是执行（无论是否发生异常）
        System.out.println("  正常情况:");
        try {
            System.out.println("    执行 try");
        } catch (Exception e) {
            System.out.println("    执行 catch");
        } finally {
            System.out.println("    执行 finally");
        }

        System.out.println("  异常情况:");
        try {
            System.out.println("    执行 try");
            throw new RuntimeException("测试");
        } catch (Exception e) {
            System.out.println("    执行 catch");
        } finally {
            System.out.println("    执行 finally");
        }
    }

    static void tryWithResourcesDemo() {
        System.out.println("\n===== try-with-resources =====");

        // 自定义 AutoCloseable 资源
        class MyResource implements AutoCloseable {
            private final String name;
            MyResource(String name) {
                this.name = name;
                System.out.printf("    打开资源: %s%n", name);
            }
            void use() { System.out.printf("    使用资源: %s%n", name); }
            @Override
            public void close() {
                System.out.printf("    关闭资源: %s%n", name);
            }
        }

        // 多个资源按声明的逆序关闭
        try (var r1 = new MyResource("数据库连接");
             var r2 = new MyResource("文件句柄")) {
            r1.use();
            r2.use();
        }
        System.out.println("  资源已自动关闭");
    }

    // ===== 辅助方法 =====
    static void findTask(int id) {
        throw new TaskNotFoundException(id);
    }

    static void validateTask(String title, int priority) {
        List<String> errors = new ArrayList<>();
        if (title == null || title.isBlank()) {
            errors.add("标题不能为空");
        }
        if (priority < 0) {
            errors.add("优先级不能为负数");
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    static void riskyOperation() throws IOException {
        throw new IOException("模拟 IO 错误");
    }
}
