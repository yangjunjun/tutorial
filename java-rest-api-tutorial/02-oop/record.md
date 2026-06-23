Java 的 Record 是 Java 14 作为预览特性引入、Java 16 正式发布的新型类声明方式，用来简洁地表达"纯数据载体"。它让编译器自动生成那些重复但又不得不写的样板代码。

**基本语法**

```java
public record Point(int x, int y) {}
```

就这一行声明，编译器会自动生成：一个 `final` 类（继承自 `java.lang.Record`）、两个 `private final` 字段（`x` 和 `y`）、一个全参构造函数、每个字段的访问器方法（`x()` 和 `y()`，注意不是 `getX()`）、`equals()`、`hashCode()` 和 `toString()`。

等价的传统写法：

```java
public final class Point extends Record {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() { return x; }
    public int y() { return y; }

    @Override
    public boolean equals(Object o) { /* 比较 x 和 y */ }

    @Override
    public int hashCode() { /* 基于 x 和 y */ }

    @Override
    public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}
```

对比下来，Record 把几十行代码压缩到了一行。

**使用**

```java
Point p1 = new Point(3, 4);
Point p2 = new Point(3, 4);

System.out.println(p1.x());                    // 3
System.out.println(p1.y());                    // 4
System.out.println(p1);                        // Point[x=3, y=4]
System.out.println(p1.equals(p2));             // true（基于值比较）

// 字段是 final 的，不可修改
// p1.x = 5;  // 编译报错
```

**紧凑构造函数（Compact Constructor）**

Record 可以定义一种特殊的构造函数，不写参数列表（自动和 record 组件一致），主要用于参数校验：

```java
public record Range(int min, int max) {
    // 紧凑构造函数：没有参数列表，直接引用 min 和 max
    public Range {
        if (min > max) {
            throw new IllegalArgumentException(
                "min(%d) 不能大于 max(%d)".formatted(min, max));
        }
    }
}

new Range(1, 10);   // 正常
new Range(10, 1);   // 抛出 IllegalArgumentException
```

紧凑构造函数里对字段的赋值是隐式的——构造函数体执行完后，编译器自动把参数值赋给对应字段。你不需要也不应该写 `this.min = min`。

**普通构造函数**

也可以定义常规的构造函数，比如提供默认值的便利构造函数：

```java
public record User(String name, int age) {
    // 便利构造函数
    public User(String name) {
        this(name, 0);   // 必须委托给规范构造函数（全参的那个）
    }
}

new User("Alice");       // User[name=Alice, age=0]
new User("Bob", 25);     // User[name=Bob, age=25]
```

**添加自定义方法**

Record 可以像普通类一样添加实例方法、静态方法、实现接口：

```java
public record Rectangle(double width, double height) {
    // 实例方法
    public double area() {
        return width * height;
    }

    public double perimeter() {
        return 2 * (width + height);
    }

    // 静态方法（工厂方法）
    public static Rectangle square(double side) {
        return new Rectangle(side, side);
    }
}

var r = Rectangle.square(5);
System.out.println(r.area());       // 25.0
```

**覆写自动生成的方法**

可以覆写 `toString`、`equals`、`hashCode` 或访问器方法：

```java
public record Money(double amount, String currency) {
    // 自定义 toString
    @Override
    public String toString() {
        return "%.2f %s".formatted(amount, currency);
    }

    // 自定义访问器，比如返回格式化后的值
    public String currency() {
        return currency.toUpperCase();
    }
}

var m = new Money(99.5, "cny");
System.out.println(m);              // 99.50 CNY
System.out.println(m.currency());   // CNY
```

**实现接口**

```java
public record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}
```

**嵌套 Record**

Record 可以嵌套在其他 Record 或类中：

```java
public record Order(
    String orderId,
    Customer customer,
    List<OrderItem> items
) {
    public record Customer(String name, String email) {}

    public record OrderItem(String product, int quantity, double price) {
        public double subtotal() {
            return quantity * price;
        }
    }

    public double total() {
        return items.stream()
            .mapToDouble(OrderItem::subtotal)
            .sum();
    }
}
```

**Record 与模式匹配**

Record 在 Java 21 的 switch 模式匹配中特别好用，支持解构：

```java
record Point(int x, int y) {}

String describe(Object obj) {
    return switch (obj) {
        case Point(var x, var y) when x == 0 && y == 0 -> "原点";
        case Point(var x, var y) when x == y           -> "对角线上的点 (" + x + ")";
        case Point(var x, var y)                        -> "点 (" + x + ", " + y + ")";
        default                                         -> "未知";
    };
}
```

解构模式会自动把 Record 的组件提取出来绑定到变量上，不用手动调访问器。

嵌套 Record 也可以深度解构：

```java
record Line(Point start, Point end) {}

String describe(Object obj) {
    return switch (obj) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) ->
            "线段 (%d,%d) → (%d,%d)".formatted(x1, y1, x2, y2);
        default -> "未知";
    };
}
```

**Record 的限制**

Record 有几个不能做的事情：不能继承其他类（它隐式继承 `java.lang.Record`，Java 不支持多继承）；字段都是 `private final` 的，不能有非 final 的实例字段（但可以有 `static` 字段）；不能有实例初始化块（`{ ... }`）；访问器方法名和字段名相同（`x()` 而不是 `getX()`），和 JavaBean 规范不兼容。

最后一点在实际中有时会碰到问题：某些框架（比如 Jackson、Hibernate）默认按 JavaBean 的 `getXxx` 约定来反射属性，Record 的 `xxx()` 命名可能无法被自动识别。好消息是主流的 JSON 库和 ORM 框架在新版本中都已经对 Record 做了专门适配。

**什么时候用 Record**

Record 适合一切"数据不可变且结构固定"的场景：DTO（数据传输对象）、配置对象、数据库查询结果映射、值对象（Value Object）、作为 Map 的 key（自带正确的 `equals` 和 `hashCode`）等。如果你的类主要就是用来承载数据，没有复杂的业务行为和可变状态，Record 几乎总是比传统的 class + Lombok `@Data` 更简洁、更安全。

和 Lombok 对比的话，Record 是语言级别的原生支持，不需要额外依赖和注解处理器，生成的代码对编译器和工具链完全透明。Lombok 在需要可变数据类（`@Data`、`@Setter`）或建造者模式（`@Builder`）等更丰富的场景下仍然有价值，但对于纯不可变数据载体，Record 已经是更优的选择。