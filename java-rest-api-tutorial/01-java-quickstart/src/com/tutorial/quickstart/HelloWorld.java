package com.tutorial.quickstart;

/**
 * 第一个 Java 程序
 * 
 * 编译：javac HelloWorld.java
 * 运行：java HelloWorld
 */
public class HelloWorld {

    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // 命令行参数
        if (args.length > 0) {
            System.out.println("你传入的参数是：");
            for (int i = 0; i < args.length; i++) {
                System.out.printf("  args[%d] = %s%n", i, args[i]);
            }
        }

        // 系统信息
        System.out.println("Java 版本: " + System.getProperty("java.version"));
        System.out.println("操作系统: " + System.getProperty("os.name"));
    }
}
