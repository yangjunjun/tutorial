# 第 05 章：函数式编程

> Java 8 引入的 Lambda 和 Stream API 让 Java 拥有了函数式编程能力。这在现代 Java 代码中无处不在。

## 学习目标

- 理解 Lambda 表达式的语法和本质
- 掌握 Stream API 的常用操作（filter, map, collect, reduce）
- 学会使用 Optional 避免空指针
- 了解常用函数式接口

## 知识要点

### 1. Lambda 表达式

Lambda 是匿名函数的简写，本质是函数式接口的实现。

```java
// 传统写法
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda 写法
Runnable r = () -> System.out.println("Hello");

// 带参数和类型推断
Comparator<String> cmp = (a, b) -> a.length() - b.length();

// 多行代码用花括号
Comparator<String> cmp2 = (a, b) -> {
    int diff = a.length() - b.length();
    return diff != 0 ? diff : a.compareTo(b);
};
```

### 2. 常用函数式接口

| 接口 | 方法 | 用途 |
|------|------|------|
| `Function<T,R>` | `R apply(T t)` | 转换 |
| `Predicate<T>` | `boolean test(T t)` | 条件判断 |
| `Consumer<T>` | `void accept(T t)` | 消费/副作用 |
| `Supplier<T>` | `T get()` | 生产/提供 |
| `BiFunction<T,U,R>` | `R apply(T t, U u)` | 双参数转换 |

### 3. Stream API

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "Dave");

// filter → map → collect
List<String> result = names.stream()
    .filter(n -> n.length() > 3)
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// reduce
int sum = IntStream.rangeClosed(1, 100).sum();
```

### 4. Optional

```java
Optional<String> opt = Optional.ofNullable(getName());

// 链式处理
String result = opt
    .filter(s -> s.length() > 0)
    .map(String::toUpperCase)
    .orElse("默认值");
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `LambdaDemo.java` | Lambda 语法、方法引用、闭包 |
| `StreamDemo.java` | Stream 全流程操作：创建、中间操作、终结操作 |
| `FunctionalInterfaces.java` | 四大函数式接口实战 |

## 编译与运行

```bash
cd 05-functional
javac -d out src/com/tutorial/functional/*.java
java -cp out com.tutorial.functional.LambdaDemo
java -cp out com.tutorial.functional.StreamDemo
java -cp out com.tutorial.functional.FunctionalInterfaces
```

## 练习

1. 用 Stream 实现：给定一个 `List<String>`，找出最长的字符串
2. 用 Stream + Collector 实现 `groupBy`：按首字母分组
3. 用 `Function` 组合实现一个字符串处理管道：去空格 → 转小写 → 取前 10 字符

## 下一章

[06 - HTTP 服务器基础 →](../06-http-server/)
