package com.tutorial.quickstart;

/**
 * 变量、类型与类型转换
 */
public class Variables {

    public static void main(String[] args) {
        // ===== 基本类型 =====
        byte b = 127;           // 8 bit
        short s = 32767;        // 16 bit
        int i = 2_147_483_647;  // 32 bit，支持下划线分隔
        long l = 9_000_000_000L;// 64 bit，注意 L 后缀
        float f = 3.14f;        // 32 bit，注意 f 后缀
        double d = 3.14159265;  // 64 bit
        boolean flag = true;
        char c = '中';           // 16 bit Unicode

        System.out.println("===== 基本类型 =====");
        System.out.printf("byte:   %d%n", b);
        System.out.printf("short:  %d%n", s);
        System.out.printf("int:    %d%n", i);
        System.out.printf("long:   %d%n", l);
        System.out.printf("float:  %.2f%n", f);
        System.out.printf("double: %.8f%n", d);
        System.out.printf("boolean: %s%n", flag);
        System.out.printf("char:   %s%n", c);

        // ===== 自动类型转换（小→大） =====
        int intVal = 100;
        long longVal = intVal;     // int → long 自动转换
        double doubleVal = intVal; // int → double 自动转换
        System.out.println("\n===== 自动转换 =====");
        System.out.printf("int %d → long %d → double %.1f%n", intVal, longVal, doubleVal);

        // ===== 强制类型转换（大→小） =====
        double pi = 3.99;
        int truncated = (int) pi;  // 截断，不是四舍五入
        System.out.println("\n===== 强制转换 =====");
        System.out.printf("double %.2f → int %d%n", pi, truncated);

        // ===== 常量 =====
        final double PI = 3.14159265;
        final String APP_NAME = "TaskAPI";
        System.out.println("\n===== 常量 =====");
        System.out.printf("PI = %s%n", PI);
        System.out.printf("APP_NAME = %s%n", APP_NAME);

        // ===== var 局部变量类型推断 (Java 10+) =====
        var message = "Hello";   // 编译器推断为 String
        var count = 42;          // 编译器推断为 int
        var list = java.util.List.of(1, 2, 3); // 推断为 List<Integer>
        System.out.println("\n===== var 类型推断 =====");
        System.out.printf("message 类型: %s%n", message.getClass().getSimpleName());
        System.out.printf("count = %d%n", count);
        System.out.printf("list = %s%n", list);
    }
}
