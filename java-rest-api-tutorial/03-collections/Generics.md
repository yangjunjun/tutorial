Java 的泛型（Generics）是 Java 5 引入的类型参数化机制，让类、接口和方法可以操作任意类型，同时保持编译期的类型安全。

**为什么需要泛型**

没有泛型之前，集合框架都用 `Object`，取出时需要强制类型转换，类型错误要到运行时才发现：

```java
// Java 5 之前
List list = new ArrayList();
list.add("hello");
list.add(123);                          // 编译不报错，但逻辑上不对
String s = (String) list.get(1);        // 运行时 ClassCastException

// 有了泛型
List<String> list = new ArrayList<>();
list.add("hello");
// list.add(123);                       // 编译报错，问题提前暴露
String s = list.get(0);                 // 无需强转
```

泛型把类型检查从运行时提前到了编译时，这是它最核心的价值。

**泛型类**

在类名后面声明类型参数，通常用单个大写字母（这是约定，不是强制）：

```java
public class Box<T> {
    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T getValue() { return value; }
    public void setValue(T value) { this.value = value; }
}

// 使用
Box<String> strBox = new Box<>("hello");
String s = strBox.getValue();           // 不需要强转

Box<Integer> intBox = new Box<>(42);
int n = intBox.getValue();              // 自动拆箱
```

常见的类型参数命名约定：`T`（Type）、`E`（Element）、`K`（Key）、`V`（Value）、`N`（Number）、`R`（Result）。

多个类型参数：

```java
public class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() { return key; }
    public V getValue() { return value; }
}

Pair<String, Integer> pair = new Pair<>("age", 30);
```

**泛型方法**

类型参数可以声明在方法上，而不是类上。类型参数写在方法返回值前面：

```java
public class Utils {
    // 泛型方法：<T> 在返回值 void 前面
    public static <T> void print(T[] array) {
        for (T item : array) {
            System.out.println(item);
        }
    }

    // 返回泛型类型
    public static <T> List<T> singletonList(T item) {
        List<T> list = new ArrayList<>();
        list.add(item);
        return list;
    }
}

// 使用（类型通常由编译器自动推断）
Utils.print(new String[]{"a", "b", "c"});
List<Integer> list = Utils.singletonList(42);

// 也可以显式指定（很少需要）
Utils.<String>print(new String[]{"a", "b"});
```

**类型边界（Bounds）**

用 `extends` 限制类型参数必须是某个类型的子类（或实现某个接口）：

```java
// T 必须实现 Comparable
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// T 必须同时满足多个条件（一个类 + 多个接口，类必须写在最前面）
public static <T extends Number & Comparable<T>> T findMax(List<T> list) {
    return list.stream().max(Comparator.naturalOrder()).orElse(null);
}

// <T extends Number> 意味着 T 只能是 Number 或其子类（Integer, Double, Long 等）
public static <T extends Number> double toDouble(T number) {
    return number.doubleValue();    // 因为 T 是 Number，可以调用 Number 的方法
}
```

**通配符（Wildcards）**

通配符 `?` 用在方法参数中，表示"接受某种泛型类型的各种具体实例"。这是泛型中最容易搞混的部分。

首先要理解一个反直觉的事实：`List<Integer>` 不是 `List<Number>` 的子类型，虽然 `Integer` 是 `Number` 的子类型。这叫泛型的不变性（invariance）：

```java
List<Integer> ints = new ArrayList<>();
// List<Number> nums = ints;    // 编译报错！
```

如果允许这种赋值，就会出现类型安全问题：

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;   // 假设允许
nums.add(3.14);              // 往整数列表里加了个 double
Integer i = ints.get(0);     // 3.14 当 Integer 用，炸了
```

通配符就是为了解决这个问题：

**上界通配符 `? extends T`**——表示"某种 T 的子类型"，用于读取（生产者）：

```java
// 接受 List<Integer>、List<Double>、List<Number> 等
public static double sum(List<? extends Number> list) {
    double total = 0;
    for (Number n : list) {     // 可以当 Number 用（读取安全）
        total += n.doubleValue();
    }
    // list.add(1);             // 编译报错！不知道具体是什么类型，不能写入
    return total;
}

sum(List.of(1, 2, 3));          // List<Integer>
sum(List.of(1.1, 2.2, 3.3));   // List<Double>
```

**下界通配符 `? super T`**——表示"某种 T 的父类型"，用于写入（消费者）：

```java
// 接受 List<Number>、List<Object> 等
public static void addIntegers(List<? super Integer> list) {
    list.add(1);                // 可以安全写入（写入安全）
    list.add(2);
    list.add(3);
    // Integer n = list.get(0); // 编译报错！只能当 Object 用（读取受限）
    Object o = list.get(0);     // 读取只能得到 Object
}

List<Number> nums = new ArrayList<>();
addIntegers(nums);              // 传入 List<Number>，合法
```

**无界通配符 `?`**——表示"任意类型"，用于既不读也不写的场景：

```java
public static int size(List<?> list) {
    return list.size();         // 只调 size()，不涉及元素类型
}

public static void printAll(List<?> list) {
    for (Object o : list) {     // 读出来是 Object
        System.out.println(o);
    }
}
```

**PECS 原则**

这是记住通配符用法的口诀：Producer Extends, Consumer Super。如果一个参数是"生产数据给你用的"，用 `? extends T`；如果是"消费你提供的数据的"，用 `? super T`。Java 标准库的 `Collections.copy` 就是经典例子：

```java
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));    // 从 src 读（extends），往 dest 写（super）
    }
}
```

**类型擦除（Type Erasure）**

这是 Java 泛型最深层的设计决策。编译器在编译期做类型检查后，会把泛型信息擦除掉——运行时的 `List<String>` 和 `List<Integer>` 实际上是同一个类（`List`），JVM 根本不知道泛型参数的具体类型。

这带来几个限制：

```java
// 1. 不能用基本类型作为泛型参数
// List<int> list;          // 报错，只能用 List<Integer>

// 2. 不能创建泛型类型的实例
// T obj = new T();         // 报错，运行时不知道 T 是什么

// 3. 不能创建泛型类型的数组
// T[] arr = new T[10];     // 报错

// 4. 不能对泛型类型做 instanceof
// if (obj instanceof List<String>) { }  // 报错，运行时没有 <String> 信息
if (obj instanceof List<?>) { }          // 可以，用通配符

// 5. 泛型类的静态成员不能用类的类型参数
public class Box<T> {
    // static T defaultValue;     // 报错，静态成员属于类本身，不属于某个参数化实例
    static Object defaultVal;     // 可以
}
```

类型擦除是 Java 为了向后兼容（Java 5 之前的代码不使用泛型也能运行）而做出的妥协。代价是泛型在某些场景下不够"完整"，但换来了运行时不需要改动 JVM 的好处。相比之下，C# 的泛型是运行时保留类型信息的（reified generics），没有擦除的限制，但也无法和非泛型代码无缝互操作。

**泛型中的钻石操作符 `<>`**

Java 7 引入了钻石操作符，让编译器自动推断构造函数的泛型参数：

```java
// Java 7 之前
Map<String, List<Integer>> map = new HashMap<String, List<Integer>>();

// Java 7 起
Map<String, List<Integer>> map = new HashMap<>();

// Java 9 起，匿名内部类也支持
List<String> list = new ArrayList<>() {
    // 自定义匿名子类
};
```

**泛型的递归类型边界**

在实现可链式调用的类或 `Comparable` 时经常见到的写法：

```java
// Comparable 自身的定义就是 <T extends Comparable<T>>
public class User implements Comparable<User> {
    private int age;

    @Override
    public int compareTo(User other) {
        return Integer.compare(this.age, other.age);
    }
}

// Builder 模式中的链式调用
public abstract class Builder<T extends Builder<T>> {
    protected String name;

    @SuppressWarnings("unchecked")
    public T setName(String name) {
        this.name = name;
        return (T) this;
    }
}

public class UserBuilder extends Builder<UserBuilder> {
    private int age;

    public UserBuilder setAge(int age) {
        this.age = age;
        return this;
    }
}

// 链式调用，子类方法返回子类型
new UserBuilder().setName("Alice").setAge(30);
```

泛型是 Java 类型系统的基石之一，集合框架（`List<E>`、`Map<K, V>`）、Stream API（`Stream<T>`）、Optional（`Optional<T>`）全都建立在泛型之上。理解类型边界和通配符（尤其是 PECS 原则）是掌握泛型的关键，类型擦除则是理解泛型限制的核心。