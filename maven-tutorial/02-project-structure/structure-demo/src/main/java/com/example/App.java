package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.InputStream;
import java.util.Properties;

public class App {
    public static void main(String[] args) throws Exception {
        // 从 classpath 加载资源文件
        Properties config = new Properties();
        try (InputStream is = App.class.getClassLoader()
                .getResourceAsStream("config.properties")) {
            if (is != null) {
                config.load(is);
            }
        }

        // 使用 Gson 序列化
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        var info = new AppInfo(
            config.getProperty("app.name", "Unknown"),
            config.getProperty("app.version", "0.0.0"),
            System.getProperty("java.version")
        );

        System.out.println("Application Info (JSON):");
        System.out.println(gson.toJson(info));
    }

    record AppInfo(String name, String version, String javaVersion) {}
}
