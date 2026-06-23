Java 中的数组是一种最基础的数据结构，用来存储固定数量的同类型元素。一旦创建，长度不可变。

**声明与创建**

```java
// 方式一：声明后创建
int[] numbers;            // 声明（推荐写法，类型和 [] 紧挨着）
numbers = new int[5];     // 创建长度为 5 的数组，默认值全为 0

// 方式二：声明时直接初始化
int[] primes = {2, 3, 5, 7, 11};                   // 简写形式
String[] names = new String[]{"Alice", "Bob"};       // 完整形式
int[] empty = new int[0];                            // 空数组（合法）

// 不推荐的 C 风格写法
int numbers[];            // 能编译通过，但不符合 Java 惯例
```

数组元素通过下标访问，从 0 开始：

```java
primes[0]   // 2
primes[4]   // 11
primes[5]   // 抛出 ArrayIndexOutOfBoundsException
```

**长度与遍历**

数组有一个 `length` 属性（注意不是方法，没有括号）：

```java
int[] arr = {10, 20, 30};
System.out.println(arr.length);  // 3
```

遍历有几种方式：

```java
int[] numbers = {10, 20, 30, 40, 50};

// 经典 for
for (int i = 0; i < numbers.length; i++) {
    System.out.println(numbers[i]);
}

// 增强 for（for-each）
for (int n : numbers) {
    System.out.println(n);
}

// Java 8+ Stream
Arrays.stream(numbers).forEach(System.out::println);

// Java 8+ IntStream（带下标）
IntStream.range(0, numbers.length)
    .forEach(i -> System.out.println(i + ": " + numbers[i]));
```

**默认值**

数组创建后元素会自动初始化为默认值：`int`/`long`/`short`/`byte` 为 `0`，`float`/`double` 为 `0.0`，`boolean` 为 `false`，`char` 为 `\u0000`，所有引用类型（对象、数组）为 `null`。

**多维数组**

Java 的多维数组本质上是"数组的数组"，每一维的长度可以不同（锯齿数组）：

```java
// 规则二维数组
int[][] matrix = new int[3][4];     // 3 行 4 列

// 初始化
int[][] grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 锯齿数组：每行长度不同
int[][] jagged = new int[3][];
jagged[0] = new int[]{1, 2};
jagged[1] = new int[]{3, 4, 5, 6};
jagged[2] = new int[]{7};

// 三维数组
int[][][] cube = new int[2][3][4];
```

**常用工具方法（Arrays 类）**

`java.util.Arrays` 提供了大量静态方法来操作数组：

```java
int[] arr = {5, 3, 8, 1, 9, 2};

// 排序
Arrays.sort(arr);                    // [1, 2, 3, 5, 8, 9]

// 二分查找（必须先排序）
int index = Arrays.binarySearch(arr, 5);  // 返回 3

// 填充
Arrays.fill(arr, 0);                 // 全部填 0
Arrays.fill(arr, 1, 4, 99);          // 下标 1~3 填 99

// 比较
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};
a == b;                              // false（比较引用）
Arrays.equals(a, b);                 // true（比较内容）

// 拷贝
int[] copy = Arrays.copyOf(arr, 10);         // 新数组长度 10，多余部分填默认值
int[] sub  = Arrays.copyOfRange(arr, 1, 4);  // 拷贝下标 1~3

// 转字符串（调试用）
System.out.println(Arrays.toString(arr));        // [1, 2, 3]
System.out.println(Arrays.deepToString(grid));   // 多维数组用 deepToString

// 并行排序（大数组更快）
Arrays.parallelSort(arr);

// 转为 List
List<Integer> list = Arrays.asList(1, 2, 3);  // 注意：返回的 List 不能 add/remove
List<Integer> mutable = new ArrayList<>(Arrays.asList(1, 2, 3));
```

**数组的底层特性**

Java 的数组是对象，继承自 `Object`，实现了 `Cloneable` 和 `java.io.Serializable`。数组类型在 JVM 中有特殊的运行时表示，比如 `int[]` 的 class name 是 `[I`，`String[]` 是 `[Ljava.lang.String;`。

数组在内存中是连续分配的（对于基本类型数组），这意味着按索引访问非常快（O(1)），但插入和删除需要移动元素。

**数组的拷贝**

有几种方式，性能和使用场景不同：

```java
int[] src = {1, 2, 3, 4, 5};

// 1. System.arraycopy() —— 最快，底层 native 实现
int[] dest1 = new int[5];
System.arraycopy(src, 0, dest1, 0, 5);

// 2. Arrays.copyOf() —— 内部调用 arraycopy，更方便
int[] dest2 = Arrays.copyOf(src, 5);

// 3. clone() —— 数组自带的方法
int[] dest3 = src.clone();

// 4. 手动循环 —— 最慢，但可以做变换
int[] dest4 = new int[src.length];
for (int i = 0; i < src.length; i++) {
    dest4[i] = src[i] * 2;
}
```

**数组 vs 集合的选择**

数组的优势是性能高、内存紧凑、类型安全（编译期确定元素类型），适合对性能敏感的场景和已知固定大小的数据集。劣势是长度固定、缺乏高级操作方法（没有内置的 `contains`、`remove`、`sort by` 等）。日常开发中，如果集合大小会变化或需要丰富的操作，通常会选择 `ArrayList`、`LinkedList` 等集合类，它们的底层其实也是用数组（或链表）实现的。

```java
// 数组和 List 互转
List<String> list = List.of("a", "b", "c");
String[] arr = list.toArray(new String[0]);       // List → 数组
List<String> back = Arrays.asList(arr);            // 数组 → List（不可变大小）
List<String> mutable = new ArrayList<>(back);      // 可变版本
```

数组虽然是 Java 最"古老"的数据结构之一，但在高性能计算、底层框架开发、以及与集合框架交互的场景中仍然是不可替代的。理解数组的行为对理解 `ArrayList`、`HashMap` 等集合类的实现原理也有直接帮助。