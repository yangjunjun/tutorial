package com.example.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 个人博客系统 - Spring Boot 应用入口类
 *
 * 这是整个博客系统的启动入口。Spring Boot 会从这个类开始：
 * 1. 创建 Spring IoC 容器
 * 2. 根据依赖自动配置 Bean（如内嵌 Tomcat、数据源等）
 * 3. 扫描 com.example.blog 及其子包下的所有组件
 * 4. 启动内嵌 Web 服务器，开始监听 HTTP 请求
 *
 * @SpringBootApplication 是一个"三合一"组合注解，等价于同时标注：
 * - @SpringBootConfiguration：标识这是一个基于 Java Config 的配置类
 * - @EnableAutoConfiguration：启用 Spring Boot 的自动配置机制
 * - @ComponentScan：启用组件扫描（默认扫描当前包及所有子包）
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
@SpringBootApplication
public class BlogApplication {

    /**
     * 应用入口方法
     *
     * @param args 命令行参数，可通过 --server.port=9090 等方式传入运行时配置
     */
    public static void main(String[] args) {
        // SpringApplication.run() 是 Spring Boot 的核心启动方法
        // 它的内部流程包括：
        //   1. 判断应用类型（Servlet / Reactive / 普通应用）
        //   2. 加载 ApplicationContextInitializer
        //   3. 加载 ApplicationListener
        //   4. 创建并刷新 Spring ApplicationContext
        //   5. 执行 CommandLineRunner / ApplicationRunner
        SpringApplication.run(BlogApplication.class, args);
    }
}
