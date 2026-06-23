package com.example;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * 演示 Maven Profile + Resource Filtering：
 * 读取构建时已替换占位符的 application.properties。
 */
public class ProfileDemo {
    public static void main(String[] args) throws IOException {
        Properties props = new Properties();
        try (InputStream is = ProfileDemo.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (is == null) {
                System.err.println("application.properties not found!");
                return;
            }
            props.load(is);
        }

        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║       Maven Profile Demo             ║");
        System.out.println("╠══════════════════════════════════════╣");
        System.out.printf("║  App:      %-25s ║%n", props.getProperty("app.name"));
        System.out.printf("║  Version:  %-25s ║%n", props.getProperty("app.version"));
        System.out.printf("║  Env:      %-25s ║%n", props.getProperty("app.env"));
        System.out.printf("║  DB URL:   %-25s ║%n", props.getProperty("db.url"));
        System.out.printf("║  DB User:  %-25s ║%n", props.getProperty("db.username"));
        System.out.printf("║  Port:     %-25s ║%n", props.getProperty("server.port"));
        System.out.printf("║  LogLevel: %-25s ║%n", props.getProperty("logging.level"));
        System.out.println("╚══════════════════════════════════════╝");
    }
}
