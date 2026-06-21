# 第 02 章：面向对象编程

> Java 是纯面向对象语言（除基本类型外）。本章通过动物和图形的例子深入理解 OOP 四大特性。

## 学习目标

- 掌握类与对象的定义和使用
- 理解封装、继承、多态、抽象
- 学会使用接口（interface）和抽象类（abstract class）
- 了解 Java Record（Java 16+）简化数据类

## 知识要点

### 1. 类与对象

```java
public class Animal {
    private String name;    // 字段（属性）
    private int age;

    // 构造方法
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // getter/setter（封装）
    public String getName() { return name; }
    public int getAge() { return age; }

    // 方法
    public String speak() {
        return name + " 发出声音";
    }

    @Override
    public String toString() {
        return "Animal{name='%s', age=%d}".formatted(name, age);
    }
}
```

### 2. 继承

子类继承父类的属性和方法，Java 只支持单继承。

```java
public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age);  // 调用父类构造器
        this.breed = breed;
    }

    @Override
    public String speak() {
        return getName() + " 说: 汪汪！";
    }
}
```

### 3. 接口

Java 8+ 接口可以有 default 方法。一个类可以实现多个接口。

```java
public interface Drawable {
    void draw();                    // 抽象方法
    default String describe() {     // 默认方法
        return "这是一个可绘制的对象";
    }
}
```

### 4. 多态

通过父类引用调用子类方法，运行时动态绑定。

```java
Animal animal = new Dog("旺财", 3, "金毛");
animal.speak();  // 运行时调用 Dog 的 speak()
```

### 5. Record（Java 16+）

Record 是不可变数据类的简写形式。

```java
public record Point(double x, double y) {}
// 自动生成：构造器、getter、equals、hashCode、toString
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `Animal.java` | 基类：封装与构造方法 |
| `Dog.java` | 继承：方法重写 |
| `Cat.java` | 继承：多态演示 |
| `Drawable.java` | 接口定义 |
| `Shape.java` | 抽象类 |
| `Circle.java` | 抽象类实现 + 接口实现 |
| `Main.java` | 综合演示 |

## 编译与运行

```bash
cd 02-oop
javac -d out src/com/tutorial/oop/*.java
java -cp out com.tutorial.oop.Main
```

## 练习

1. 创建一个 `Rectangle` 类继承自 `Shape`，实现面积和周长计算
2. 给 `Animal` 添加一个 `Comparable` 接口实现，按年龄排序
3. 用 Record 重写一个 `Task` 数据类，包含 id、title、completed 字段

## 下一章

[03 - 集合与泛型 →](../03-collections/)
