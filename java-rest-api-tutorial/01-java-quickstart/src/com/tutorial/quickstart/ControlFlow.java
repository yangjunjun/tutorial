package com.tutorial.quickstart;

import java.util.List;

/**
 * 控制流语句演示
 */
public class ControlFlow {

    public static void main(String[] args) {
        ifElseDemo();
        switchDemo();
        switchExpressionDemo();
        forLoopDemo();
        enhancedForDemo();
        whileDemo();
        breakContinueDemo();
    }

    static void ifElseDemo() {
        System.out.println("===== if-else =====");
        int score = 85;
        String grade;

        if (score >= 90) {
            grade = "A";
        } else if (score >= 80) {
            grade = "B";
        } else if (score >= 70) {
            grade = "C";
        } else {
            grade = "D";
        }

        System.out.printf("分数 %d → 等级 %s%n", score, grade);
    }

    static void switchDemo() {
        System.out.println("\n===== switch 传统形式 =====");
        String day = "WEDNESDAY";

        switch (day) {
            case "MONDAY":
            case "TUESDAY":
            case "WEDNESDAY":
            case "THURSDAY":
            case "FRIDAY":
                System.out.println(day + " 是工作日");
                break;
            case "SATURDAY":
            case "SUNDAY":
                System.out.println(day + " 是周末");
                break;
            default:
                System.out.println("未知");
        }
    }

    static void switchExpressionDemo() {
        System.out.println("\n===== switch 表达式 (Java 14+) =====");
        String day = "SATURDAY";

        // switch 表达式，箭头语法不需要 break
        String type = switch (day) {
            case "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" -> "工作日";
            case "SATURDAY", "SUNDAY" -> "周末";
            default -> "未知";
        };

        System.out.printf("%s → %s%n", day, type);

        // 带代码块的 switch 表达式
        int numLetters = switch (day) {
            case "MONDAY" -> 6;
            case "TUESDAY" -> 7;
            default -> {
                int len = day.length();
                yield len;  // yield 用于代码块中返回值
            }
        };
        System.out.printf("%s 有 %d 个字母%n", day, numLetters);
    }

    static void forLoopDemo() {
        System.out.println("\n===== for 循环 =====");

        // 基本 for
        for (int i = 1; i <= 5; i++) {
            System.out.printf("  i = %d%n", i);
        }

        // 倒序
        System.out.println("倒计时:");
        for (int i = 5; i >= 1; i--) {
            System.out.printf("  %d...", i);
        }
        System.out.println("发射！");
    }

    static void enhancedForDemo() {
        System.out.println("\n===== 增强 for =====");
        List<String> names = List.of("Alice", "Bob", "Charlie");

        for (String name : names) {
            System.out.printf("  Hello, %s!%n", name);
        }
    }

    static void whileDemo() {
        System.out.println("\n===== while 循环 =====");

        int n = 1;
        while (n <= 32) {
            System.out.printf("  2^%d = %d%n", (int)(Math.log(n) / Math.log(2)), n);
            n *= 2;
        }
    }

    static void breakContinueDemo() {
        System.out.println("\n===== break 与 continue =====");

        System.out.println("跳过偶数:");
        for (int i = 1; i <= 10; i++) {
            if (i % 2 == 0) continue;  // 跳过本次
            System.out.printf("  %d", i);
        }

        System.out.println("\n遇到 7 停止:");
        for (int i = 1; i <= 10; i++) {
            if (i == 7) break;  // 终止循环
            System.out.printf("  %d", i);
        }
        System.out.println();
    }
}
