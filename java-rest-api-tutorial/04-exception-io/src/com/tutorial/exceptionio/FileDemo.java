package com.tutorial.exceptionio;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.List;

/**
 * 文件读写演示：NIO.2 API
 */
public class FileDemo {

    public static void main(String[] args) throws IOException {
        // 创建临时目录
        Path tempDir = Files.createTempDirectory("java-tutorial-");
        System.out.println("临时目录: " + tempDir);

        try {
            writeDemo(tempDir);
            readDemo(tempDir);
            appendDemo(tempDir);
            listFilesDemo(tempDir);
            pathOperations(tempDir);
        } finally {
            // 清理临时文件
            try (var stream = Files.walk(tempDir)) {
                stream.sorted(java.util.Comparator.reverseOrder())
                      .forEach(p -> {
                          try { Files.deleteIfExists(p); } catch (IOException e) { /* ignore */ }
                      });
            }
        }
    }

    static void writeDemo(Path dir) throws IOException {
        System.out.println("\n===== 写入文件 =====");
        Path file = dir.resolve("hello.txt");

        // 方式 1: Files.writeString (Java 11+)
        Files.writeString(file, "Hello, Java NIO.2!\n第二行内容\n", StandardCharsets.UTF_8);
        System.out.printf("  写入: %s (%d bytes)%n", file.getFileName(), Files.size(file));

        // 方式 2: 写入多行
        Path listFile = dir.resolve("tasks.txt");
        List<String> tasks = List.of("学习 Java", "写 REST API", "部署上线");
        Files.write(listFile, tasks, StandardCharsets.UTF_8);
        System.out.printf("  写入: %s (%d 行)%n", listFile.getFileName(), tasks.size());

        // 方式 3: BufferedWriter（适合大量写入）
        Path logFile = dir.resolve("log.txt");
        try (BufferedWriter writer = Files.newBufferedWriter(logFile, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
            for (int i = 1; i <= 5; i++) {
                writer.write("[%d] 日志条目 #%d".formatted(System.currentTimeMillis(), i));
                writer.newLine();
            }
        }
        System.out.printf("  写入: %s%n", logFile.getFileName());
    }

    static void readDemo(Path dir) throws IOException {
        System.out.println("\n===== 读取文件 =====");

        // 方式 1: Files.readString (Java 11+)
        Path file = dir.resolve("hello.txt");
        String content = Files.readString(file);
        System.out.println("  readString:");
        System.out.println("  " + content.replace("\n", "\n  "));

        // 方式 2: Files.readAllLines
        Path listFile = dir.resolve("tasks.txt");
        List<String> lines = Files.readAllLines(listFile);
        System.out.println("  readAllLines:");
        for (int i = 0; i < lines.size(); i++) {
            System.out.printf("    [%d] %s%n", i + 1, lines.get(i));
        }

        // 方式 3: BufferedReader（适合大文件逐行读取）
        Path logFile = dir.resolve("log.txt");
        System.out.println("  BufferedReader:");
        try (BufferedReader reader = Files.newBufferedReader(logFile)) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.printf("    %s%n", line);
            }
        }
    }

    static void appendDemo(Path dir) throws IOException {
        System.out.println("\n===== 追加写入 =====");
        Path file = dir.resolve("hello.txt");

        Files.writeString(file, "追加的内容\n",
                StandardCharsets.UTF_8, StandardOpenOption.APPEND);

        String content = Files.readString(file);
        System.out.println("  追加后文件内容:");
        for (String line : content.split("\n")) {
            System.out.printf("    | %s%n", line);
        }
    }

    static void listFilesDemo(Path dir) throws IOException {
        System.out.println("\n===== 列出文件 =====");

        try (var stream = Files.list(dir)) {
            stream.forEach(p -> {
                try {
                    System.out.printf("  %s (%d bytes)%n",
                            p.getFileName(),
                            Files.isRegularFile(p) ? Files.size(p) : -1);
                } catch (IOException e) {
                    System.out.printf("  %s (error)%n", p.getFileName());
                }
            });
        }
    }

    static void pathOperations(Path dir) {
        System.out.println("\n===== Path 操作 =====");
        Path file = dir.resolve("sub").resolve("deep").resolve("file.txt");

        System.out.printf("  完整路径: %s%n", file);
        System.out.printf("  文件名:   %s%n", file.getFileName());
        System.out.printf("  父目录:   %s%n", file.getParent());
        System.out.printf("  根目录:   %s%n", file.getRoot());
        System.out.printf("  层级数:   %d%n", file.getNameCount());

        // 路径拼接
        Path base = Path.of("/home", "user");
        Path full = base.resolve("docs").resolve("readme.md");
        System.out.printf("  拼接: %s%n", full);
    }
}
