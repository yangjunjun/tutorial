# 第 03 章：集合与泛型

> Java 集合框架是日常开发中使用最频繁的工具之一。本章通过实际场景学习 List、Set、Map 以及泛型。

## 学习目标

- 掌握 List、Set、Map 三大集合的使用场景和区别
- 理解泛型的作用与使用方式
- 学会选择合适的集合类型
- 了解 Java 9+ 的集合工厂方法

## 知识要点

### 1. List（有序、可重复）

```java
// ArrayList：随机访问快 O(1)，插入删除慢 O(n)
List<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");

// LinkedList：插入删除快 O(1)，随机访问慢 O(n)
List<String> queue = new LinkedList<>();

// Java 9+ 不可变集合工厂
List<String> fixed = List.of("Alice", "Bob", "Charlie");
```

### 2. Set（无序、不重复）

```java
Set<String> tags = new HashSet<>();
tags.add("java");
tags.add("tutorial");
tags.add("java");  // 重复，不会添加

// TreeSet：有序
Set<Integer> sorted = new TreeSet<>(List.of(3, 1, 4, 1, 5));
// 结果：[1, 3, 4, 5]
```

### 3. Map（键值对）

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);

// 遍历
scores.forEach((name, score) -> {
    System.out.printf("%s: %d%n", name, score);
});

// Java 9+ 不可变 Map
Map<String, String> config = Map.of(
    "host", "localhost",
    "port", "8080"
);
```

### 4. 泛型

```java
// 泛型类
public class Box<T> {
    private T item;
    public void put(T item) { this.item = item; }
    public T get() { return item; }
}

// 泛型方法
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// 通配符
public static double sum(List<? extends Number> list) {
    return list.stream().mapToDouble(Number::doubleValue).sum();
}
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `ListDemo.java` | List 操作：排序、过滤、转换 |
| `MapDemo.java` | Map 操作：模拟简易内存数据库 |
| `GenericsDemo.java` | 泛型类、泛型方法、通配符 |

## 编译与运行

```bash
cd 03-collections
javac -d out src/com/tutorial/collections/*.java
java -cp out com.tutorial.collections.ListDemo
java -cp out com.tutorial.collections.MapDemo
java -cp out com.tutorial.collections.GenericsDemo
```

## 练习

1. 用 `Map<String, List<String>>` 实现一个简单的通讯录（姓名 → 电话号码列表）
2. 写一个泛型方法 `<T> List<T> removeDuplicates(List<T> list)` 去重但保持顺序
3. 用 `TreeMap` 实现一个词频统计器，按频率降序输出

## 下一章

[04 - 异常处理与 IO →](../04-exception-io/)
