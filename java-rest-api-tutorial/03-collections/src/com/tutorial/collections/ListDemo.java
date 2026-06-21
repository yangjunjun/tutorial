package com.tutorial.collections;

import java.util.*;

/**
 * List 操作演示：排序、过滤、转换
 */
public class ListDemo {

    public static void main(String[] args) {
        basicOperations();
        sortingDemo();
        factoryMethods();
        iterationDemo();
    }

    static void basicOperations() {
        System.out.println("===== 基本操作 =====");
        List<String> tasks = new ArrayList<>();

        // 添加
        tasks.add("学习 Java");
        tasks.add("写 REST API");
        tasks.add("部署上线");
        tasks.add("学习 Java");  // List 允许重复
        System.out.println("任务列表: " + tasks);
        System.out.println("任务数量: " + tasks.size());
        System.out.println("包含'写 REST API': " + tasks.contains("写 REST API"));

        // 获取与修改
        System.out.printf("第一个任务: %s%n", tasks.get(0));
        tasks.set(2, "测试部署");
        System.out.println("修改后: " + tasks);

        // 删除
        tasks.remove("学习 Java");  // 删除第一个匹配项
        System.out.println("删除后: " + tasks);
    }

    static void sortingDemo() {
        System.out.println("\n===== 排序 =====");
        List<Integer> numbers = new ArrayList<>(List.of(42, 17, 8, 99, 3, 55));
        System.out.println("排序前: " + numbers);

        // 自然排序
        Collections.sort(numbers);
        System.out.println("升序: " + numbers);

        // 自定义排序
        numbers.sort(Comparator.reverseOrder());
        System.out.println("降序: " + numbers);

        // 对象排序
        record Task(String title, int priority) {}
        List<Task> taskList = new ArrayList<>(List.of(
                new Task("紧急修复", 1),
                new Task("代码审查", 3),
                new Task("写文档", 5),
                new Task("开会", 2)
        ));

        taskList.sort(Comparator.comparingInt(Task::priority));
        System.out.println("\n按优先级排序:");
        taskList.forEach(t -> System.out.printf("  [%d] %s%n", t.priority(), t.title()));
    }

    static void factoryMethods() {
        System.out.println("\n===== 集合工厂方法 (Java 9+) =====");

        // 不可变 List
        var names = List.of("Alice", "Bob", "Charlie");
        System.out.println("不可变 List: " + names);
        // names.add("Dave");  // 会抛出 UnsupportedOperationException

        // 创建可变副本
        var mutableNames = new ArrayList<>(names);
        mutableNames.add("Dave");
        System.out.println("可变副本: " + mutableNames);

        // 从数组创建 List
        String[] arr = {"X", "Y", "Z"};
        var fromArray = Arrays.asList(arr);  // 固定大小
        System.out.println("从数组: " + fromArray);
    }

    static void iterationDemo() {
        System.out.println("\n===== 遍历方式 =====");
        var items = List.of("Java", "Python", "Go", "Rust");

        // 1. 增强 for
        System.out.print("增强 for: ");
        for (String item : items) {
            System.out.print(item + " ");
        }
        System.out.println();

        // 2. forEach + Lambda
        System.out.print("forEach: ");
        items.forEach(item -> System.out.print(item + " "));
        System.out.println();

        // 3. 带索引遍历
        System.out.println("带索引:");
        for (int i = 0; i < items.size(); i++) {
            System.out.printf("  [%d] %s%n", i, items.get(i));
        }

        // 4. Iterator
        System.out.print("Iterator: ");
        var it = items.iterator();
        while (it.hasNext()) {
            System.out.print(it.next() + " ");
        }
        System.out.println();
    }
}
