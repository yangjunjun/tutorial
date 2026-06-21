package com.tutorial.collections;

import java.util.*;

/**
 * Map 操作演示：模拟简易内存数据库
 */
public class MapDemo {

    // 模拟用户数据
    record User(int id, String name, String email) {}

    public static void main(String[] args) {
        basicMap();
        miniDatabase();
        mapTechniques();
    }

    static void basicMap() {
        System.out.println("===== 基本 Map 操作 =====");

        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);

        System.out.println("成绩表: " + scores);
        System.out.printf("Alice 的成绩: %d%n", scores.get("Alice"));
        System.out.printf("Dave 的成绩: %s%n", scores.getOrDefault("Dave", 0));

        // 更新
        scores.put("Bob", 90);
        System.out.println("更新后: " + scores);

        // 遍历
        System.out.println("遍历:");
        scores.forEach((name, score) ->
                System.out.printf("  %s: %s%n", name, score >= 90 ? "优秀" : "良好"));
    }

    static void miniDatabase() {
        System.out.println("\n===== 简易内存数据库 =====");

        // 用 Map 模拟数据库：id → User
        Map<Integer, User> db = new LinkedHashMap<>();  // 保持插入顺序

        // CREATE
        db.put(1, new User(1, "张三", "zhang@example.com"));
        db.put(2, new User(2, "李四", "li@example.com"));
        db.put(3, new User(3, "王五", "wang@example.com"));
        System.out.println("插入 3 条记录");

        // READ
        User user = db.get(2);
        System.out.printf("查询 id=2: %s%n", user);

        // UPDATE
        db.put(2, new User(2, "李四", "lisi_new@example.com"));
        System.out.printf("更新 id=2: %s%n", db.get(2));

        // DELETE
        db.remove(3);
        System.out.println("删除 id=3 后:");
        db.forEach((id, u) -> System.out.printf("  [%d] %s <%s>%n", u.id(), u.name(), u.email()));

        // 查询
        long count = db.size();
        System.out.printf("总记录数: %d%n", count);

        // 条件查询：查找邮箱包含 example.com 的用户
        List<User> filtered = db.values().stream()
                .filter(u -> u.email().contains("example.com"))
                .toList();
        System.out.printf("包含 example.com 的用户: %d 个%n", filtered.size());
    }

    static void mapTechniques() {
        System.out.println("\n===== Map 进阶技巧 =====");

        Map<String, List<String>> groupMap = new HashMap<>();

        // computeIfAbsent：键不存在时才创建
        groupMap.computeIfAbsent("开发组", k -> new ArrayList<>()).add("张三");
        groupMap.computeIfAbsent("开发组", k -> new ArrayList<>()).add("李四");
        groupMap.computeIfAbsent("测试组", k -> new ArrayList<>()).add("王五");
        groupMap.computeIfAbsent("测试组", k -> new ArrayList<>()).add("赵六");

        System.out.println("分组:");
        groupMap.forEach((group, members) ->
                System.out.printf("  %s: %s%n", group, members));

        // merge：合并值
        Map<String, Integer> wordCount = new HashMap<>();
        String[] words = "hello world hello java world hello".split(" ");
        for (String word : words) {
            wordCount.merge(word, 1, Integer::sum);
        }
        System.out.println("\n词频统计: " + wordCount);

        // TreeMap：按 key 排序
        Map<String, Integer> sortedMap = new TreeMap<>(wordCount);
        System.out.println("按字母排序: " + sortedMap);
    }
}
