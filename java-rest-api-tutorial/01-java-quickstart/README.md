# 第 01 章：Java 快速入门

> 本章快速过一遍 Java 基础语法，适合有其他语言经验的开发者。

## 学习目标

- 掌握 Java 的基本数据类型与变量声明
- 熟悉 if/else、switch、for、while 等控制流
- 理解方法定义与参数传递（值传递）
- 学会使用 String 和 StringBuilder

## 知识要点

### 1. 变量与类型

Java 是强类型语言，基本类型有 `int`, `long`, `double`, `float`, `boolean`, `char`, `byte`, `short`。引用类型包括 String、数组、类等。

```java
int age = 25;
double price = 19.99;
boolean active = true;
String name = "张三";  // String 是引用类型
```

### 2. 控制流

```java
// if-else
if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else {
    grade = "C";
}

// switch（Java 14+ 支持表达式形式）
String result = switch (day) {
    case MONDAY, FRIDAY -> "工作日";
    case SATURDAY, SUNDAY -> "休息日";
    default -> "未知";
};

// for 循环
for (int i = 0; i < 10; i++) { ... }

// 增强 for
for (String item : list) { ... }

// while
while (condition) { ... }
```

### 3. 方法

Java 方法是值传递。基本类型传递值的副本，引用类型传递引用的副本。

```java
public static int add(int a, int b) {
    return a + b;
}

// 可变参数
public static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}
```

### 4. 字符串

String 是不可变的（immutable），频繁拼接用 StringBuilder。

```java
String greeting = "Hello" + " " + "World";  // 编译器优化

StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100; i++) {
    sb.append(i).append(",");
}
String result = sb.toString();

// 字符串格式化
String msg = String.format("姓名: %s, 年龄: %d", name, age);
// Java 15+ 文本块
String json = """
        {
            "name": "张三",
            "age": 25
        }
        """;
```

## 示例代码

本章包含以下示例文件：

| 文件 | 说明 |
|------|------|
| `HelloWorld.java` | 第一个 Java 程序，编译与运行 |
| `Variables.java` | 变量类型、类型转换、常量 |
| `ControlFlow.java` | 各种控制流语句 |
| `Methods.java` | 方法定义、重载、可变参数 |

## 编译与运行

```bash
cd 01-java-quickstart
javac -d out src/com/tutorial/quickstart/*.java
java -cp out com.tutorial.quickstart.HelloWorld
java -cp out com.tutorial.quickstart.Variables
java -cp out com.tutorial.quickstart.ControlFlow
java -cp out com.tutorial.quickstart.Methods
```

## 练习

1. 写一个方法 `isPalindrome(String s)`，判断字符串是否是回文
2. 用 switch 表达式实现一个简单的计算器（+、-、*、/）
3. 写一个方法，接收可变参数 `String...` 并返回拼接后的字符串（用 StringBuilder）

## 下一章

[02 - 面向对象编程 →](../02-oop/)
