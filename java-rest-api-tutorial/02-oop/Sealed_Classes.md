Java 的密封类（Sealed Classes）是 Java 15 作为预览特性引入、Java 17 正式发布的语言特性，用来精确控制哪些类可以继承或实现某个类或接口。它通过 `sealed` 和 `permits` 关键字，让开发者显式声明继承体系的边界。

**基本语法**

```java
public sealed class Shape
    permits Circle, Rectangle, Triangle {
}

public final class Circle extends Shape {
    private final double radius;
    // ...
}

public final class Rectangle extends Shape {
    private final double width, height;
    // ...
}

public final class Triangle extends Shape {
    private final double base, height;
    // ...
}
```

`sealed` 标记这个类的继承体系是封闭的，`permits` 列出所有允许的直接子类。任何不在 `permits` 列表中的类试图继承 `Shape` 都会编译报错。

**子类的三种修饰方式**

每个被 `permits` 列出的直接子类必须选择以下三种身份之一：

`final`——彻底终止继承链，不允许再被继承：

```java
public final class Circle extends Shape { ... }
```

`sealed`——自身也是密封的，继续限制自己的子类：

```java
public sealed class Animal permits Mammal, Bird { }
public sealed class Mammal extends Animal permits Dog, Cat { }
public final class Dog extends Mammal { }
public final class Cat extends Mammal { }
```

`non-sealed`——重新开放继承，任何人都可以继承它：

```java
public non-sealed class Bird extends Animal { }
// 现在任何类都可以 extends Bird
public class Parrot extends Bird { }   // 合法
```

这三种修饰方式必须选一个，否则编译报错。这个设计确保了继承体系中的每一层都明确表态：要么继续封闭，要么彻底开放。

**省略 permits 列表**

如果所有子类都定义在同一个编译单元（同一个 `.java` 文件）中，可以省略 `permits`，编译器会自动推断：

```java
// 同一个文件中，可以省略 permits
public sealed class Result {
    public static final class Success extends Result { }
    public static final class Failure extends Result { }
}
```

如果子类在不同文件中（包括不同模块），则必须显式列出 `permits`。

**密封接口**

`sealed` 同样适用于接口：

```java
public sealed interface Event
    permits UserEvent, SystemEvent, OrderEvent {
    Instant timestamp();
}

public record UserEvent(String userId, String action, Instant timestamp)
    implements Event {}

public record SystemEvent(String component, String message, Instant timestamp)
    implements Event {}

public record OrderEvent(String orderId, double amount, Instant timestamp)
    implements Event {}
```

接口用 `permits` 列出所有允许的实现类，配合 Record 使用非常自然。

**与模式匹配的配合**

密封类最强大的价值体现在和 switch 模式匹配结合使用时。编译器能够检查 switch 是否覆盖了所有可能的子类，从而不需要 `default` 分支：

```java
// 没有 default，编译器确认已穷举所有子类
String handleEvent(Event event) {
    return switch (event) {
        case UserEvent(var userId, var action, var ts) ->
            "用户 %s 执行了 %s".formatted(userId, action);
        case SystemEvent(var comp, var msg, var ts) ->
            "系统组件 [%s]：%s".formatted(comp, msg);
        case OrderEvent(var orderId, var amount, var ts) ->
            "订单 %s，金额 %.2f".formatted(orderId, amount);
    };
}
```

如果将来有人在 `Event` 的 `permits` 列表中加了一个新类型（比如 `PaymentEvent`）但忘了更新上面的 switch，编译器会直接报错："the switch expression does not cover all possible input values"。这比运行时才发现遗漏安全得多。

如果用传统的 `if-else` + `instanceof`，就无法获得这种编译期保障：

```java
// 老写法：加新类型时忘记加 else if，编译不会报错，运行时静默走错分支
if (event instanceof UserEvent ue) {
    return "用户 ...";
} else if (event instanceof SystemEvent se) {
    return "系统 ...";
}
// 如果漏了 OrderEvent，编译器不会提醒
```

**实际应用场景**

密封类特别适合用来建模"有限的、已知的"类型集合，这在实际业务中非常常见：

```java
// 支付结果
public sealed interface PaymentResult
    permits PaymentSuccess, PaymentFailure, PaymentPending {
}

public record PaymentSuccess(String transactionId, double amount)
    implements PaymentResult {}
public record PaymentFailure(String reason, String errorCode)
    implements PaymentResult {}
public record PaymentPending(String transactionId, Instant deadline)
    implements PaymentResult {}

// HTTP 响应
public sealed interface ApiResponse<T>
    permits ApiSuccess, ApiError {
}

public record ApiSuccess<T>(T data) implements ApiResponse<T> {}
public record ApiError(String message, int code) implements ApiResponse<Object> {}

// 表达式树（经典的代数数据类型）
public sealed interface Expr
    permits Num, Add, Mul, Neg {
}

public record Num(double value) implements Expr {}
public record Add(Expr left, Expr right) implements Expr {}
public record Mul(Expr left, Expr right) implements Expr {}
public record Neg(Expr expr) implements Expr {}

// 用 switch 模式匹配求值
double eval(Expr expr) {
    return switch (expr) {
        case Num(var v)        -> v;
        case Add(var l, var r) -> eval(l) + eval(r);
        case Mul(var l, var r) -> eval(l) * eval(r);
        case Neg(var e)        -> -eval(e);
    };
}
```

**与抽象类/接口的区别**

传统的抽象类或接口是"开放"的——任何人都可以继承或实现，这在设计公共 API 时是优点，但在建模封闭类型体系时是缺点（你无法确保处理了所有情况）。密封类提供了第三条路：既不是完全开放，也不是 `final` 那样彻底关闭，而是在"允许的范围内开放"。

在模块系统（JPMS）中，`permits` 还有额外的约束：子类必须和密封类在同一个模块中（或者同一个包中，如果没使用模块的话），这从模块层面也加强了封装性。

密封类本质上给 Java 带来了代数数据类型（Algebraic Data Types）的基础能力。配合 Record（积类型）和 sealed（和类型），Java 终于可以用类型系统原生表达"这个值要么是 A，要么是 B，要么是 C，没有第四种可能"这样的语义，这对写出可维护、可验证的代码帮助很大。