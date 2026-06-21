package com.tutorial.quickstart;

/**
 * 方法定义、重载、可变参数
 */
public class Methods {

    public static void main(String[] args) {
        // 基本方法调用
        System.out.println("===== 基本方法 =====");
        System.out.printf("add(3, 5) = %d%n", add(3, 5));
        System.out.printf("add(1.5, 2.7) = %.1f%n", add(1.5, 2.7));

        // 方法重载
        System.out.println("\n===== 方法重载 =====");
        System.out.printf("max(10, 20) = %d%n", max(10, 20));
        System.out.printf("max(3.14, 2.72) = %.2f%n", max(3.14, 2.72));
        System.out.printf("max(1, 5, 3) = %d%n", max(1, 5, 3));

        // 可变参数
        System.out.println("\n===== 可变参数 =====");
        System.out.printf("sum() = %d%n", sum());
        System.out.printf("sum(1) = %d%n", sum(1));
        System.out.printf("sum(1,2,3) = %d%n", sum(1, 2, 3));
        System.out.printf("sum(1,2,3,4,5) = %d%n", sum(1, 2, 3, 4, 5));

        // 值传递演示
        System.out.println("\n===== 值传递 =====");
        int x = 10;
        System.out.printf("修改前: x = %d%n", x);
        tryModify(x);
        System.out.printf("修改后: x = %d （基本类型传递副本）%n", x);

        int[] arr = {1, 2, 3};
        System.out.printf("修改前: arr[0] = %d%n", arr[0]);
        tryModifyArray(arr);
        System.out.printf("修改后: arr[0] = %d （引用类型可修改内容）%n", arr[0]);
    }

    // ===== 基本方法 =====
    public static int add(int a, int b) {
        return a + b;
    }

    // 方法重载：同名不同参
    public static double add(double a, double b) {
        return a + b;
    }

    // ===== 重载示例 =====
    public static int max(int a, int b) {
        return a > b ? a : b;
    }

    public static double max(double a, double b) {
        return a > b ? a : b;
    }

    public static int max(int a, int b, int c) {
        return max(a, max(b, c));
    }

    // ===== 可变参数 =====
    public static int sum(int... numbers) {
        int total = 0;
        for (int n : numbers) {
            total += n;
        }
        return total;
    }

    // ===== 值传递 =====
    public static void tryModify(int val) {
        val = 999;  // 不影响原变量
        System.out.printf("  方法内部: val = %d%n", val);
    }

    public static void tryModifyArray(int[] arr) {
        arr[0] = 999;  // 可以修改数组内容
        System.out.printf("  方法内部: arr[0] = %d%n", arr[0]);
    }

    // ===== 递归示例 =====
    public static long factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
}
