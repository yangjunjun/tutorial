package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * 插件演示：这个类会被 shade-plugin 打成 fat jar，
 * 包含 Gson 依赖在内，可以直接 java -jar 运行。
 */
public class PluginDemo {
    public static void main(String[] args) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        var buildInfo = Map.of(
            "project", "plugin-demo",
            "version", "1.0.0",
            "buildTime", LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
            "javaVersion", System.getProperty("java.version"),
            "message", "Fat JAR built by maven-shade-plugin!"
        );

        System.out.println("=== Maven Plugin Demo ===");
        System.out.println(gson.toJson(buildInfo));
    }
}
