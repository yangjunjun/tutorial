Java 的 `switch` 语法经历了几个重要的演进阶段，从最初 C 风格的经典写法，到近年来引入了现代化的 switch 表达式。

**经典 switch（Java 1.0 起）**

最传统的写法，和 C/C++ 几乎一样：

```java
String day = "Monday";
String result;

switch (day) {
    case "Monday":
    case "Tuesday":
    case "Wednesday":
    case "Thursday":
    case "Friday":
        result = "工作日";
        break;
    case "Saturday":
    case "Sunday":
        result = "周末";
        break;
    default:
        result = "未知";
}
```

这种写法最大的坑是**穿透（fall-through）**——如果忘了写 `break`，代码会继续执行下一个 case，这是 Java 历史上一个非常常见的 bug 来源。另外它只能当语句用，不能直接赋值给变量，必须借助外部变量来承接结果。

支持的条件类型也比较有限：`byte`、`short`、`int`、`char`、对应的包装类型、`String`（Java 7 起）、以及枚举。不支持 `long`、`float`、`double` 或任意对象。

**增强 switch 语句（Java 12 preview，Java 14 正式）**

Java 14 引入了箭头语法（`->`），解决了穿透问题和语法冗长的问题：

```java
switch (day) {
    case "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" -> 
        System.out.println("工作日");
    case "Saturday", "Sunday" -> 
        System.out.println("周末");
    default -> 
        System.out.println("未知");
}
```

箭头语法天然不会穿透，每个分支独立执行。多个 case 值可以用逗号合并到一行。如果分支逻辑有多条语句，用花括号包起来：

```java
case "Monday" -> {
    System.out.println("新的一周开始了");
    System.out.println("工作日");
}
```

**switch 表达式（Java 14 正式）**

这是最重大的改进。switch 可以作为一个表达式直接返回值，不用再借助外部变量：

```java
// 用箭头语法 + yield
String result = switch (day) {
    case "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" -> "工作日";
    case "Saturday", "Sunday" -> "周末";
    default -> "未知";
};
```

如果某个分支需要多条语句来计算结果，用 `yield` 关键字返回值：

```java
String result = switch (day) {
    case "Monday" -> {
        // 多条语句
        boolean isHoliday = checkHoliday();
        yield isHoliday ? "节假日" : "工作日";
    }
    case "Saturday", "Sunday" -> "周末";
    default -> "未知";
};
```

箭头语法和传统的 `case: ... break` 也可以混用，但不推荐。如果用传统写法作为表达式，则用 `yield` 代替 `break`：

```java
String result = switch (day) {
    case "Monday":
    case "Friday":
        yield "工作日";
    case "Saturday":
    case "Sunday":
        yield "周末";
    default:
        yield "未知";
};
```

**模式匹配 switch（Java 21 正式）**

Java 21 带来了真正意义上的模式匹配，switch 可以对类型、结构进行匹配，而不仅仅是值比较：

```java
static String format(Object obj) {
    return switch (obj) {
        case Integer i    -> "整数：" + i;
        case Long l       -> "长整数：" + l;
        case Double d     -> "浮点数：" + d;
        case String s     -> "字符串：" + s;
        case int[] arr    -> "整型数组，长度：" + arr.length;
        case null         -> "null 值";
        default           -> "其他类型：" + obj.getClass().getSimpleName();
    };
}
```

每个 case 分支不仅匹配类型，还自动完成了类型转换和变量绑定（比如 `Integer i` 既匹配了类型又声明了变量 `i`），彻底取代了以前的 `instanceof` + 强转组合：

```java
// 老写法
if (obj instanceof Integer) {
    Integer i = (Integer) obj;
    return "整数：" + i;
} else if (obj instanceof String) {
    String s = (String) obj;
    return "字符串：" + s;
}
// ...
```

模式匹配还可以加入**守卫条件（guarded pattern）**：

```java
return switch (obj) {
    case Integer i when i > 0   -> "正整数：" + i;
    case Integer i when i == 0  -> "零";
    case Integer i              -> "负整数：" + i;
    case String s when s.isEmpty() -> "空字符串";
    case String s               -> "字符串：" + s;
    default                     -> "其他";
};
```

`when` 关键字在匹配成功后追加一个布尔条件，只有条件也满足时才进入该分支。

另外 Java 21 的模式匹配 switch 还支持**解构模式**，对 record 类型特别友好：

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

String describe(Object shape) {
    return switch (shape) {
        case Point(var x, var y) when x == 0 && y == 0 
            -> "原点";
        case Point(var x, var y) 
            -> "点 (" + x + ", " + y + ")";
        case Line(Point(var x1, var y1), Point(var x2, var y2)) 
            -> "线段 (" + x1 + "," + y1 + ") → (" + x2 + "," + y2 + ")";
        default -> "未知图形";
    };
}
```

最后提一个编译器保障：当 switch 表达式覆盖了所有可能的情况时（比如枚举的所有值都列出来了，或者有 `default`），编译器能确认它是完备的；如果遗漏了某些情况，编译期就会报错。对于密封类（`sealed class`），甚至可以不用 `default` 就能做到穷举匹配：

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
record Triangle(double base, double height) implements Shape {}

double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.w() * r.h();
        case Triangle t  -> 0.5 * t.base() * t.height();
        // 不需要 default，编译器知道三个子类已经穷举
    };
}
```

总结一下演进路线：经典 switch（值匹配 + 穿透风险）→ 箭头语法（消除穿透）→ switch 表达式（直接返回值）→ 模式匹配（类型匹配 + 解构 + 守卫条件）。如果你的项目用的 Java 版本足够新（17+ 或 21+），强烈推荐用现代写法，代码会更简洁也更安全。