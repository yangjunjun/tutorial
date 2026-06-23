Java 中的接口（interface）是一种引用类型，用来定义一组抽象方法，表示"能做什么"而不是"是什么"。它是 Java 实现多态和解耦的核心机制之一。

**经典接口（Java 8 之前）**

最传统的接口只包含抽象方法和常量，所有方法默认是 `public abstract` 的，所有字段默认是 `public static final` 的：

```java
public interface Flyable {
    int MAX_SPEED = 500;           // 等价于 public static final int
    void fly();                    // 等价于 public abstract void fly()
    double getAltitude();
}
```

实现接口用 `implements`，一个类可以实现多个接口：

```java
public class Bird implements Flyable {
    @Override
    public void fly() {
        System.out.println("Bird is flying");
    }

    @Override
    public double getAltitude() {
        return 100.0;
    }
}

// 多接口实现
public class Duck implements Flyable, Swimmable, Runnable {
    // 必须实现所有接口中声明的抽象方法
}
```

经典接口的问题在于：如果接口新增一个方法，所有实现类都必须跟着改，这对已发布的 API 来说是灾难性的。

**默认方法（Java 8）**

Java 8 引入了 `default` 方法，允许在接口中提供方法的默认实现。这是为了在不破坏现有实现类的前提下给接口添加新方法（比如给 `Collection` 加 `stream()` 方法）：

```java
public interface Greetable {
    String getName();

    // 默认方法，实现类可以选择覆写，也可以直接用
    default void greet() {
        System.out.println("Hello, " + getName());
    }

    default void sayGoodbye() {
        System.out.println("Goodbye, " + getName());
    }
}

public class Person implements Greetable {
    private String name;
    
    public Person(String name) { this.name = name; }
    
    @Override
    public String getName() { return name; }
    
    // greet() 和 sayGoodbye() 不用实现，自动继承默认实现
}
```

当一个类实现了多个接口，而这些接口有同名的默认方法时，必须在实现类中显式解决冲突：

```java
interface A {
    default void hello() { System.out.println("Hello from A"); }
}

interface B {
    default void hello() { System.out.println("Hello from B"); }
}

// 编译报错：C 继承了两个冲突的 hello()
class C implements A, B {
    @Override
    public void hello() {
        A.super.hello();   // 明确选择 A 的版本
        // 或者自己写新逻辑
    }
}
```

冲突解决有三条规则：类优先于接口（如果父类已经提供了实现，接口的默认方法被忽略）；子接口优先于父接口（更具体的接口胜出）；前两条都无法解决时，必须在实现类中显式覆写。

**静态方法（Java 8）**

接口中可以定义静态方法，通过接口名直接调用：

```java
public interface Sortable {
    static <T extends Comparable<T>> void sort(List<T> list) {
        Collections.sort(list);
    }
}

// 调用
Sortable.sort(myList);
```

典型例子是 `Collection` 接口中的 `static` 工厂方法，如 `List.of()`、`Map.of()` 等。

**私有方法（Java 9）**

Java 9 允许在接口中定义私有方法，用来在多个默认方法之间复用逻辑：

```java
public interface Logger {
    default void logInfo(String msg) {
        log("INFO", msg);
    }

    default void logError(String msg) {
        log("ERROR", msg);
    }

    // 私有方法，不对外暴露，仅供接口内部复用
    private void log(String level, String msg) {
        System.out.printf("[%s] %s: %s%n", level, LocalDateTime.now(), msg);
    }
}
```

**接口中的常量**

接口中声明的变量自动是 `public static final`，即使你不写这些修饰符：

```java
public interface Constants {
    int TIMEOUT = 3000;              // public static final
    String DEFAULT_ENCODING = "UTF-8";
}

// 使用
System.out.println(Constants.TIMEOUT);
```

不过把接口当常量容器用是一种比较老的做法，现在更推荐用 `enum` 或工具类来管理常量。

**函数式接口（Java 8）**

只有一个抽象方法的接口叫函数式接口，可以用 `@FunctionalInterface` 注解标记（可选，但推荐），并且可以用 Lambda 表达式来实现：

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);

    // default 和 static 方法不算在"一个抽象方法"的限制内
    default Predicate<T> and(Predicate<? super T> other) {
        return t -> test(t) && other.test(t);
    }

    default Predicate<T> or(Predicate<? super T> other) {
        return t -> test(t) || other.test(t);
    }

    static <T> Predicate<T> isEqual(Object targetRef) {
        return targetRef == null
            ? Objects::isNull
            : targetRef::equals;
    }
}

// 使用 Lambda
Predicate<String> isEmpty = s -> s.isEmpty();
Predicate<String> isNotNull = s -> s != null;
Predicate<String> valid = isNotNull.and(isEmpty.negate());
```

Java 内置了很多常用的函数式接口，都在 `java.util.function` 包下：`Function<T, R>`（一个入参一个返回值）、`Consumer<T>`（一个入参无返回值）、`Supplier<T>`（无入参一个返回值）、`Predicate<T>`（一个入参返回布尔值）、`BiFunction<T, U, R>`（两个入参一个返回值）等。

**密封接口（Java 17）**

Java 17 的密封类特性也适用于接口，用 `sealed` 关键字限制哪些类可以实现它：

```java
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

// 只有 Circle、Rectangle、Triangle 能实现这个接口
public record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}

public record Rectangle(double w, double h) implements Shape {
    public double area() { return w * h; }
}

public record Triangle(double base, double height) implements Shape {
    public double area() { return 0.5 * base * height; }
}
```

密封接口配合 switch 模式匹配，可以做到穷举匹配而不需要 `default` 分支，编译器知道所有可能的实现类。

**接口 vs 抽象类**

这是面试中常被问到的问题。核心区别是：接口支持多实现（一个类可以实现多个接口），抽象类只能单继承；接口定义的是"能力"（Flyable、Serializable），抽象类定义的是"是什么"（Animal、Vehicle）；接口的字段只能是常量，抽象类可以有状态字段；Java 8 之后接口可以有默认方法，进一步模糊了二者的边界，但抽象类仍然在需要维护实例状态和构造函数时不可替代。

**接口的演进总结**

Java 8 之前接口只能有抽象方法和常量；Java 8 加入了默认方法和静态方法；Java 9 加入了私有方法；Java 17 加入了密封接口。这些演进让接口从纯粹的"契约"变成了一个功能更丰富的抽象工具，同时保持了向后兼容。在实际开发中，接口是面向接口编程、依赖注入、单元测试 mock 等实践的基石，理解它的设计哲学比记住语法更重要。

## 解释代码


```java
/**
 * 可绘制接口 - 演示 interface
 */
public interface Drawable {
    /**
     * 抽象方法：实现类必须实现
     */
    void draw();

    /**
     * 默认方法：提供默认实现，子类可选覆盖
     */
    default String describe() {
        return "这是一个可绘制的对象";
    }

    /**
     * 静态方法
     */
    static Drawable empty() {
        return () -> System.out.println("  （空白画布）");
    }
}

```
这段代码中的 `static Drawable empty()` 是接口的静态方法，Java 8 引入的特性。来拆解一下它做了什么：

```java
static Drawable empty() {
    return () -> System.out.println("  （空白画布）");
}
```

这个方法返回一个 `Drawable` 实例。因为 `Drawable` 只有一个抽象方法 `void draw()`，所以它是一个函数式接口，可以用 Lambda 表达式来实现。`()` -> `...` 就是 `draw()` 方法的 Lambda 实现——调用 `draw()` 时，打印"（空白画布）"。

**调用方式**

接口的静态方法通过接口名直接调用，和类的静态方法一样：

```java
Drawable canvas = Drawable.empty();
canvas.draw();    // 输出：  （空白画布）
```

不能通过实现类的实例来调用接口的静态方法：

```java
Drawable circle = new Circle();
// circle.empty();       // 编译报错
// Drawable.empty();     // 正确，只能通过接口名调用
```

**设计意图**

这种写法本质上是静态工厂方法（Static Factory Method）模式。接口本身不能 `new`，但通过提供一个静态工厂方法，可以返回一个预定义的、有意义的实例。和直接写 Lambda 相比，`Drawable.empty()` 表达力更强——调用者一看就知道拿到的是"空白画布"，而不是一个匿名的 Lambda。

Java 标准库中大量使用了这种模式，比如 `List.of()`、`Map.of()`、`Optional.empty()`、`Collections.emptyList()` 都是接口（或工具类）上的静态工厂方法。在你这个 `Drawable` 接口里，`empty()` 扮演的角色类似 `Optional.empty()`——提供一个语义清晰的"空值"实例。

**和抽象方法、默认方法的区别**

抽象方法（`void draw()`）定义了"实现类必须做什么"，没有方法体，由实现类提供；默认方法（`default String describe()`）提供了可选的通用实现，实现类可以覆写也可以直接用；静态方法（`static Drawable empty()`）属于接口本身，和实现类无关，不参与继承和多态，只能通过接口名调用。三者在接口中共存是 Java 8 之后接口设计的常见范式。