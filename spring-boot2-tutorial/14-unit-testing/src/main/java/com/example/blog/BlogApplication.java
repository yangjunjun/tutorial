package com.example.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 博客系统启动类（第 14 章测试工程的最小主代码骨架）
 * <p>
 * 说明：第 14 章的教程文件仅包含测试代码，但为了支持
 * {@code mvn test-compile} / {@code mvn test} 的编译验证，
 * 这里提供一个最小化的启动类与被测类骨架。
 * 完整的主代码实现请参考第 01-13 章的对应文件。
 * </p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@SpringBootApplication
public class BlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }
}
