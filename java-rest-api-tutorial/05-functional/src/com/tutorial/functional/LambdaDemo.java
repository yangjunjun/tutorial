package com.tutorial.functional;

import java.util.Comparator;
import java.util.List;
import java.util.function.*;

/**
 * Lambda 表达式与方法引用演示
 */
public class LambdaDemo {

    public static void main(String[] args) {
        lambdaSyntax();
        methodReference();
        closureDemo();
        comparatorChain();
    }

    static void lambdaSyntax() {
        System.out.println("===== Lambda 语法 =====");

        // 无参数
        Runnable sayHello = () -> System.out.println("  Hello from Lambda!");
        sayHello.run();

        // 单参数（可省略括号）
        Consumer<String> print = s -> System.out.println("  " + s);
        print.accept("单参数 Lambda");

        // 多参数
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        System.out.printf("  3 + 5 = %d%n", add.apply(3, 5));

        // 多行代码
        BiFunction<String, String, String> format = (name, age) -> {
            String result = "姓名: %s, 年龄: %s".formatted(name, age);
            return result;
        };
        System.out.printf("  %s%n", format.apply("张三", "25"));

        // Predicate
        Predicate<Integer> isPositive = n -> n > 0;
        System.out.printf("  5 是正数? %s%n", isPositive.test(5));
        System.out.printf("  -3 是正数? %s%n", isPositive.test(-3));
    }

    static void methodReference() {
        System.out.println("\n===== 方法引用 =====");

        // 1. 静态方法引用
        Function<String, Integer> parser = Integer::parseInt;
        System.out.printf("  静态方法引用: \"42\" → %d%n", parser.apply("42"));

        // 2. 实例方法引用
        Function<String, String> upper = String::toUpperCase;
        System.out.printf("  实例方法引用: %s%n", upper.apply("hello"));

        // 3. 构造方法引用
        Supplier<List<String>> listFactory = java.util.ArrayList::new;
        var list = listFactory.get();
        list.add("构造方法引用");
        System.out.printf("  构造方法引用: %s%n", list);

        // 4. 对象的实例方法引用
        String prefix = "  前缀: ";
        Consumer<String> printer = System.out::println;
        printer.accept(prefix + "对象的实例方法引用");

        // 对比 Lambda 和方法引用
        List<String> names = List.of("Charlie", "Alice", "Bob");
        System.out.println("\n  排序前: " + names);
        var sorted = names.stream()
                .sorted(String::compareToIgnoreCase)  // 方法引用
                .toList();
        System.out.println("  排序后: " + sorted);
    }

    static void closureDemo() {
        System.out.println("\n===== 闭包（变量捕获）=====");

        String greeting = "你好";  // effectively final
        Consumer<String> greeter = name ->
                System.out.printf("  %s, %s!%n", greeting, name);

        greeter.accept("张三");
        greeter.accept("李四");

        // greeting = "再见";  // 编译错误：Lambda 捕获的变量必须是 effectively final
        // Lambda 可以读取外部变量，但不能修改

        // 用数组"绕过"（不推荐，仅演示概念）
        int[] counter = {0};
        Runnable increment = () -> counter[0]++;
        increment.run();
        increment.run();
        increment.run();
        System.out.printf("  计数器: %d%n", counter[0]);
    }

    static void comparatorChain() {
        System.out.println("\n===== Comparator 链式调用 =====");

        record Student(String name, int age, double score) {}

        var students = List.of(
                new Student("Charlie", 20, 85.5),
                new Student("Alice", 22, 92.0),
                new Student("Bob", 20, 92.0),
                new Student("Dave", 21, 78.0),
                new Student("Eve", 22, 95.5)
        );

        // 按成绩降序 → 年龄升序 → 姓名升序
        Comparator<Student> cmp = Comparator
                .comparingDouble(Student::score).reversed()
                .thenComparingInt(Student::age)
                .thenComparing(Student::name);

        System.out.println("  排序结果:");
        students.stream()
                .sorted(cmp)
                .forEach(s -> System.out.printf("    %s (age=%d, score=%.1f)%n",
                        s.name(), s.age(), s.score()));
    }
}
