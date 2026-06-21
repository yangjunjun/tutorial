package com.tutorial.functional;

import java.util.*;
import java.util.stream.*;

/**
 * Stream API 全流程演示
 */
public class StreamDemo {

    record Task(String title, String category, int priority, boolean done) {}

    public static void main(String[] args) {
        creatingStreams();
        intermediateOps();
        terminalOps();
        collectorsDemo();
        practicalExample();
    }

    static void creatingStreams() {
        System.out.println("===== 创建 Stream =====");

        // 从集合
        List<String> list = List.of("A", "B", "C");
        Stream<String> s1 = list.stream();
        System.out.println("  从集合: " + s1.toList());

        // 从数组
        Stream<String> s2 = Stream.of("X", "Y", "Z");
        System.out.println("  从元素: " + s2.toList());

        // 数值流
        var intStream = IntStream.range(1, 6);  // [1, 6)
        System.out.println("  IntStream: " + intStream.boxed().toList());

        var closed = IntStream.rangeClosed(1, 5);  // [1, 5]
        System.out.println("  闭区间: " + closed.boxed().toList());

        // generate（无限流，需 limit）
        var randoms = Stream.generate(Math::random)
                .limit(5)
                .map(d -> String.format("%.2f", d))
                .toList();
        System.out.println("  随机数: " + randoms);

        // iterate
        var powers = Stream.iterate(1, n -> n * 2)
                .limit(8)
                .toList();
        System.out.println("  2 的幂: " + powers);
    }

    static void intermediateOps() {
        System.out.println("\n===== 中间操作 =====");

        List<Task> tasks = getTasks();

        // filter
        var pending = tasks.stream()
                .filter(t -> !t.done())
                .toList();
        System.out.println("  未完成任务: " + pending.size() + " 个");

        // map（转换）
        var titles = tasks.stream()
                .map(Task::title)
                .toList();
        System.out.println("  标题列表: " + titles);

        // flatMap（展平）
        List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4), List.of(5));
        var flat = nested.stream()
                .flatMap(Collection::stream)
                .toList();
        System.out.println("  flatMap: " + flat);

        // distinct
        var unique = Stream.of("A", "B", "A", "C", "B")
                .distinct().toList();
        System.out.println("  distinct: " + unique);

        // sorted
        var sorted = tasks.stream()
                .sorted(Comparator.comparingInt(Task::priority))
                .map(t -> t.title() + "(" + t.priority() + ")")
                .toList();
        System.out.println("  按优先级排序: " + sorted);

        // peek（调试用）
        System.out.print("  peek 调试: ");
        tasks.stream()
                .filter(t -> t.priority() >= 3)
                .peek(t -> System.out.print("[" + t.title() + "] "))
                .map(Task::title)
                .toList();
        System.out.println();
    }

    static void terminalOps() {
        System.out.println("\n===== 终结操作 =====");

        List<Task> tasks = getTasks();

        // count
        long doneCount = tasks.stream().filter(Task::done).count();
        System.out.printf("  已完成: %d 个%n", doneCount);

        // min/max
        var highest = tasks.stream()
                .max(Comparator.comparingInt(Task::priority));
        highest.ifPresent(t -> System.out.printf("  最高优先级: %s (%d)%n", t.title(), t.priority()));

        // anyMatch / allMatch / noneMatch
        boolean hasUrgent = tasks.stream().anyMatch(t -> t.priority() >= 5);
        boolean allDone = tasks.stream().allMatch(Task::done);
        System.out.printf("  有紧急任务? %s%n", hasUrgent);
        System.out.printf("  全部完成? %s%n", allDone);

        // reduce
        int totalPriority = tasks.stream()
                .mapToInt(Task::priority)
                .sum();
        System.out.printf("  优先级总和: %d%n", totalPriority);

        // reduce 自定义
        var titleConcat = tasks.stream()
                .map(Task::title)
                .reduce("", (a, b) -> a.isEmpty() ? b : a + " | " + b);
        System.out.printf("  标题拼接: %s%n", titleConcat);

        // forEach
        System.out.print("  forEach: ");
        tasks.stream()
                .filter(Task::done)
                .forEach(t -> System.out.print(t.title() + " "));
        System.out.println();
    }

    static void collectorsDemo() {
        System.out.println("\n===== Collectors =====");

        List<Task> tasks = getTasks();

        // toList / toSet
        var doneSet = tasks.stream()
                .filter(Task::done)
                .map(Task::title)
                .collect(Collectors.toSet());
        System.out.println("  toSet: " + doneSet);

        // toMap
        var taskMap = tasks.stream()
                .collect(Collectors.toMap(Task::title, Task::priority));
        System.out.println("  toMap: " + taskMap);

        // groupingBy
        var byCategory = tasks.stream()
                .collect(Collectors.groupingBy(Task::category));
        System.out.println("  按类别分组:");
        byCategory.forEach((cat, ts) ->
                System.out.printf("    %s: %s%n", cat,
                        ts.stream().map(Task::title).toList()));

        // partitioningBy（按 boolean 分两组）
        var byDone = tasks.stream()
                .collect(Collectors.partitioningBy(Task::done));
        System.out.printf("  已完成: %d, 未完成: %d%n",
                byDone.get(true).size(), byDone.get(false).size());

        // joining
        var joined = tasks.stream()
                .map(Task::title)
                .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("  joining: " + joined);

        // summarizingInt
        var stats = tasks.stream()
                .collect(Collectors.summarizingInt(Task::priority));
        System.out.printf("  优先级统计: min=%d, max=%d, avg=%.1f, sum=%d%n",
                stats.getMin(), stats.getMax(), stats.getAverage(), stats.getSum());
    }

    static void practicalExample() {
        System.out.println("\n===== 实战：任务报表 =====");

        List<Task> tasks = getTasks();

        // 按类别统计完成率
        var report = tasks.stream()
                .collect(Collectors.groupingBy(
                        Task::category,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                ts -> {
                                    long done = ts.stream().filter(Task::done).count();
                                    return "%.0f%% (%d/%d)".formatted(
                                            100.0 * done / ts.size(), done, ts.size());
                                }
                        )
                ));

        System.out.println("  类别完成率:");
        report.forEach((cat, rate) ->
                System.out.printf("    %s: %s%n", cat, rate));

        // 找出每个类别优先级最高的任务
        var topTasks = tasks.stream()
                .collect(Collectors.groupingBy(
                        Task::category,
                        Collectors.maxBy(Comparator.comparingInt(Task::priority))
                ));

        System.out.println("  各类别最高优先级:");
        topTasks.forEach((cat, task) ->
                task.ifPresent(t ->
                        System.out.printf("    %s: %s (P%d)%n", cat, t.title(), t.priority())));
    }

    static List<Task> getTasks() {
        return List.of(
                new Task("修复登录 Bug", "开发", 5, true),
                new Task("添加单元测试", "开发", 3, false),
                new Task("重构 DAO 层", "开发", 2, false),
                new Task("编写 API 文档", "文档", 4, true),
                new Task("更新用户手册", "文档", 1, false),
                new Task("部署到测试环境", "运维", 4, true),
                new Task("配置监控告警", "运维", 3, false),
                new Task("性能压测", "测试", 5, false),
                new Task("安全扫描", "测试", 4, true)
        );
    }
}
