`TreeSet` 是 Java 集合框架中基于红黑树实现的有序集合（`Set`），它保证元素按排序顺序存储，不允许重复。

**基本用法**

```java
TreeSet<String> set = new TreeSet<>();
set.add("Charlie");
set.add("Alice");
set.add("Bob");

System.out.println(set);   // [Alice, Bob, Charlie]，自动按字母排序

set.add("Alice");          // 重复元素，忽略，集合不变
```

元素按自然顺序（natural ordering）排列，前提是元素类型实现了 `Comparable` 接口。`String`、`Integer`、`LocalDate` 等标准库类型都自带自然顺序。

**自定义排序**

通过构造函数传入 `Comparator` 来指定排序规则：

```java
// 按字符串长度排序
TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
byLength.add("banana");
byLength.add("fig");
byLength.add("apple");
System.out.println(byLength);   // [fig, apple, banana]

// 逆序
TreeSet<Integer> reversed = new TreeSet<>(Comparator.reverseOrder());
reversed.addAll(List.of(3, 1, 4, 1, 5, 9));
System.out.println(reversed);   // [9, 5, 4, 3, 1]

// 多条件排序
TreeSet<User> users = new TreeSet<>(
    Comparator.comparing(User::getAge)
              .thenComparing(User::getName)
);
```

如果元素没有实现 `Comparable` 又没有提供 `Comparator`，`add` 时会抛 `ClassCastException`。

**有序操作（TreeSet 独有的优势）**

`TreeSet` 实现了 `NavigableSet` 接口，提供了丰富的有序查询方法，这是它比 `HashSet` 强大的地方：

```java
TreeSet<Integer> set = new TreeSet<>(List.of(10, 20, 30, 40, 50));

// 首尾元素
set.first();    // 10
set.last();     // 50

// 比某元素小/大的最近元素
set.lower(30);     // 20（严格小于 30 的最大元素）
set.higher(30);    // 40（严格大于 30 的最小元素）
set.floor(30);     // 30（小于等于 30 的最大元素，30 存在所以返回 30）
set.floor(25);     // 20
set.ceiling(30);   // 30（大于等于 30 的最小元素）
set.ceiling(35);   // 40

// 取出并移除首尾
set.pollFirst();   // 返回 10 并从集合中移除
set.pollLast();    // 返回 50 并从集合中移除

// 子集视图
set.subSet(20, 40);        // [20, 30]（包含 20，不包含 40）
set.subSet(20, true, 40, true);  // [20, 30, 40]（两端都包含）
set.headSet(30);           // [10, 20]（小于 30 的元素）
set.tailSet(30);           // [30, 40, 50]（大于等于 30 的元素）

// 逆序视图
set.descendingSet();       // 返回逆序的 NavigableSet
```

`subSet`、`headSet`、`tailSet` 返回的是原集合的视图（view），对视图的修改会反映到原集合上，反之亦然。

**遍历**

遍历顺序就是排序后的顺序：

```java
TreeSet<String> set = new TreeSet<>(List.of("banana", "apple", "cherry"));

for (String s : set) {
    System.out.println(s);   // apple → banana → cherry
}

// 逆序遍历
for (String s : set.descendingSet()) {
    System.out.println(s);   // cherry → banana → apple
}
```

**性能特征**

`TreeSet` 底层是红黑树（实际是通过 `TreeMap` 实现的），基本操作的时间复杂度都是 O(log n)：

| 操作 | 时间复杂度 |
|---|---|
| `add` | O(log n) |
| `remove` | O(log n) |
| `contains` | O(log n) |
| `first` / `last` | O(log n) |
| `lower` / `higher` / `floor` / `ceiling` | O(log n) |
| 遍历全部元素 | O(n) |
| `size` | O(1) |

对比 `HashSet` 的 `add`/`remove`/`contains` 都是 O(1)（均摊），`TreeSet` 在单次操作上更慢。但 `HashSet` 无法提供有序遍历和范围查询，这是 `TreeSet` 的核心价值。

**和 HashSet、LinkedHashSet 的选择**

`HashSet` 适合只需要判断"有没有"的场景，性能最好，但元素无序；`LinkedHashSet` 保持插入顺序，性能接近 `HashSet`；`TreeSet` 适合需要元素有序、需要范围查询（`subSet`/`headSet`/`tailSet`）、需要快速获取最大最小值的场景。

一个简单的判断标准：如果你发现自己经常需要对集合排序或者查找"最接近某个值的元素"，就该用 `TreeSet` 而不是先放进 `HashSet` 再排序。

**实际应用示例**

```java
// 排行榜：自动按分数排序
TreeSet<Student> ranking = new TreeSet<>(
    Comparator.comparingInt(Student::getScore).reversed()
              .thenComparing(Student::getName)
);

ranking.add(new Student("Alice", 95));
ranking.add(new Student("Bob", 88));
ranking.add(new Student("Charlie", 95));

for (Student s : ranking) {
    System.out.println(s);
}
// Alice (95) → Charlie (95) → Bob (88)

// 时间线：自动按时间排序，快速获取最近事件
TreeSet<Event> timeline = new TreeSet<>(
    Comparator.comparing(Event::timestamp)
);

// 获取最近一小时的事件
Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));
NavigableSet<Event> recent = timeline.tailSet(
    new Event("", oneHourAgo)   // 构造一个用于查询的锚点
);
```

`TreeSet` 在线程安全方面和 `HashSet` 一样不是同步的。多线程环境下可以用 `Collections.synchronizedSortedSet(new TreeSet<>())`，或者用 `ConcurrentSkipListSet` 作为并发替代方案，后者基于跳表实现，同样是有序的，且支持高并发读写。