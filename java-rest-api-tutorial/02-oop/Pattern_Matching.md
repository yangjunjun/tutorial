Java 的模式匹配（Pattern Matching）是一系列从 Java 16 开始逐步引入的特性，目标是用更简洁、更安全的方式做类型判断、数据提取和条件分支。它经历了多个 JEP 分阶段落地，到 Java 21 已经形成了比较完整的体系。

**instanceof 模式匹配（Java 16）**

在模式匹配出现之前，Java 中判断类型并使用对象需要三步：`instanceof` 检查、强制类型转换、使用变量。模式匹配把它压缩成一步：

```java
// 老写法
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// 新写法：模式变量（Pattern Variable）
if (obj instanceof String s) {
    System.out.println(s.length());   // s 已经是 String 类型，无需强转
}
```

`instanceof String s` 同时完成了类型检查和变量绑定。如果 `obj` 不是 `String`，变量 `s` 根本不存在，不会出现空指针或类型转换错误。

这个模式变量可以在后续条件中继续使用：

```java
// 模式变量可以在 && 后续条件中使用
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());
}

// 也可以用在三元表达式中
String result = obj instanceof Integer i
    ? "整数：" + i
    : "非整数";
```

需要注意作用域规则：用 `&&` 时模式变量在右侧可用（因为左侧为 true 时才会走右侧），但用 `||` 时不可用（因为左侧为 false 时右侧也要执行，此时类型不匹配）：

```java
// 合法
if (obj instanceof String s && s.isEmpty()) { ... }

// 编译报错：|| 右侧无法保证 obj 是 String
if (obj instanceof String s || s.isEmpty()) { ... }
```

**switch 模式匹配（Java 21）**

switch 的模式匹配是最强大的部分，可以匹配类型、值、结构，并配合守卫条件使用：

```java
String describe(Object obj) {
    return switch (obj) {
        case Integer i    -> "整数：" + i;
        case Long l       -> "长整数：" + l;
        case Double d     -> "浮点数：" + d;
        case String s     -> "字符串（长度 %d）".formatted(s.length());
        case null         -> "null";
        default           -> "其他：" + obj.getClass().getSimpleName();
    };
}
```

**守卫模式（Guarded Patterns）**

`when` 关键字在模式匹配成功后追加一个布尔条件：

```java
return switch (obj) {
    case Integer i when i > 0    -> "正整数：" + i;
    case Integer i when i == 0   -> "零";
    case Integer i               -> "负整数：" + i;
    case String s when s.isBlank() -> "空白字符串";
    case String s                -> "字符串：" + s;
    default                      -> "其他";
};
```

`when` 后面可以是任意布尔表达式，包括调用方法：

```java
case String s when s.matches("\\d+")  -> "数字字符串：" + s;
case User u when u.isAdmin()          -> "管理员：" + u.name();
```

**Record 解构模式**

Record 在 switch 中可以被解构，直接提取组件：

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

String describe(Object shape) {
    return switch (shape) {
        case Point(var x, var y) when x == 0 && y == 0
            -> "原点";
        case Point(var x, var y) when x == y
            -> "对角线上的点";
        case Point(var x, var y)
            -> "点 (%d, %d)".formatted(x, y);
        case Line(Point(var x1, var y1), Point(var x2, var y2))
            -> "线段 (%d,%d) → (%d,%d)".formatted(x1, y1, x2, y2);
        default
            -> "未知图形";
    };
}
```

嵌套解构可以层层深入，一次性提取复杂结构中的数据，省去了大量手动调用访问器的代码。

**密封类型与穷举匹配**

当 switch 的目标类型是密封类（`sealed`）或枚举时，编译器能验证是否覆盖了所有情况，不需要 `default`：

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
        // 不需要 default，三个子类已穷举
    };
}
```

如果后来有人新增了 `Shape` 的子类但忘了在 switch 里加对应分支，编译器会直接报错，这比运行时才发现遗漏安全得多。

**嵌套模式与嵌套解构的复杂示例**

把几种模式组合起来可以处理非常复杂的数据结构：

```java
record Address(String city, String street) {}
record Employee(String name, int age, Address address) {}
record Department(String deptName, List<Employee> employees) {}

String classify(Object obj) {
    return switch (obj) {
        // 嵌套解构 + 守卫
        case Employee(var name, var age, Address(var city, _))
            when age > 60 && "北京".equals(city)
            -> "北京的退休员工：" + name;

        case Employee(var name, var age, Address(var city, _))
            when age > 60
            -> "%s的退休员工：%s".formatted(city, name);

        case Employee(var name, _, _)
            -> "在职员工：" + name;

        case Department(var deptName, var employees)
            when employees.size() > 100
            -> "大型部门：" + deptName;

        case Department(var deptName, _)
            -> "部门：" + deptName;

        default -> "未知对象";
    };
}
```

其中 `_`（未命名模式变量，Java 22 正式）表示"我匹配这个位置但不关心它的值"，避免引入无用的变量名。

**模式匹配的演进时间线**

梳理一下各阶段的 JEP：Java 16 引入 `instanceof` 模式匹配（JEP 394）；Java 17 引入密封类（JEP 409），为穷举匹配打基础；Java 19/20 预览了 Record 模式和 switch 模式匹配（JEP 405、406、427、433）；Java 21 正式化了 switch 模式匹配、Record 模式、守卫模式（JEP 441）；Java 22 正式化了未命名变量和未命名模式 `_`（JEP 456）。

**模式匹配的核心价值**

传统 Java 处理"根据类型做不同处理"的逻辑时，要么写一堆 `if-else` + `instanceof` + 强转（冗长且容易出错），要么用访问者模式（Visitor Pattern，结构复杂）。模式匹配把这种逻辑变成了声明式的、编译器可验证的形式：你只需要描述"数据长什么样时做什么"，编译器帮你检查类型安全性和分支完备性。本质上，这是 Java 在向函数式语言（Haskell、Scala、Rust 等）的模式匹配能力靠拢，对处理复杂的数据结构和业务规则特别有帮助。