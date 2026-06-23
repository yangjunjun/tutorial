`System.out.printf` 是 Java 中用于格式化输出的方法，语法和 C 语言的 `printf` 非常接近。它接收一个格式字符串和若干参数，将参数按照格式字符串中的占位符替换后输出。

**基本用法**

```java
String name = "Alice";
int age = 30;
double score = 95.678;

System.out.printf("姓名：%s，年龄：%d，成绩：%.2f%n", name, age, score);
// 输出：姓名：Alice，年龄：30，成绩：95.68
```

`%n` 是平台无关的换行符（Windows 上输出 `\r\n`，Linux/macOS 上输出 `\n`），比直接写 `\n` 更规范。

**格式说明符的结构**

每个占位符的完整形式是 `%[flags][width][.precision]conversion`，其中 `conversion` 是必填的，其余都是可选的。

**常用转换符（conversion）**

```java
// 字符串
System.out.printf("%s%n", "hello");          // hello

// 整数
System.out.printf("%d%n", 42);               // 42
System.out.printf("%o%n", 42);               // 52（八进制）
System.out.printf("%x%n", 255);              // ff（十六进制，小写）
System.out.printf("%X%n", 255);              // FF（十六进制，大写）

// 浮点数
System.out.printf("%f%n", 3.14159);          // 3.141590（默认 6 位小数）
System.out.printf("%.2f%n", 3.14159);        // 3.14
System.out.printf("%e%n", 12345.6);          // 1.234560e+04（科学计数法）
System.out.printf("%g%n", 12345.6);          // 12345.6（自动选 %f 或 %e）

// 字符
System.out.printf("%c%n", 'A');              // A
System.out.printf("%c%n", 65);               // A（Unicode 码点）

// 布尔值
System.out.printf("%b%n", true);             // true
System.out.printf("%b%n", null);             // false（null 视为 false）
System.out.printf("%B%n", true);             // TRUE（大写）

// 百分号和换行
System.out.printf("100%%%n");                // 100%
System.out.printf("第一行%n第二行%n");         // 两行输出

// 哈希值
System.out.printf("%h%n", "hello");          // 5e918d2（对象的 hashCode 十六进制）
```

**宽度与对齐（width & flags）**

`width` 指定输出的最小字符数，不够时用空格填充，默认右对齐：

```java
System.out.printf("|%10s|%n", "hi");         // |        hi|
System.out.printf("|%-10s|%n", "hi");        // |hi        |  （- 左对齐）
System.out.printf("|%10d|%n", 42);           // |        42|
System.out.printf("|%-10d|%n", 42);          // |42        |

// 用 0 填充（仅数字）
System.out.printf("|%08d|%n", 42);           // |00000042|
System.out.printf("|%010.2f|%n", 3.14);      // |0000003.14|

// 千位分隔符（,）
System.out.printf("%,d%n", 1234567);         // 1,234,567
System.out.printf("%,.2f%n", 1234567.89);    // 1,234,567.89

// 正数显示加号（+）
System.out.printf("%+d%n", 42);              // +42
System.out.printf("%+d%n", -7);              // -7

// 空格前缀（正数前加空格，负数前加减号）
System.out.printf("% d%n", 42);              // " 42"
System.out.printf("% d%n", -7);              // "-7"

// 括号包裹负数（常用于财务）
System.out.printf("%(d%n", -100);            // (100)
System.out.printf("%(d%n", 100);             // 100
```

**精度（precision）**

对浮点数来说，精度控制小数位数；对字符串来说，精度控制最大输出长度：

```java
// 浮点数精度（四舍五入）
System.out.printf("%.0f%n", 3.14159);        // 3
System.out.printf("%.1f%n", 3.14159);        // 3.1
System.out.printf("%.3f%n", 3.14159);        // 3.142
System.out.printf("%.4f%n", 3.14159);        // 3.1416

// 字符串截断
System.out.printf("%.5s%n", "Hello World");   // Hello
```

**参数索引**

可以通过 `n$` 语法引用特定位置的参数（从 1 开始），或者用 `<` 引用上一个参数：

```java
// 按索引引用
System.out.printf("%2$s 在 %1$s 前面%n", "world", "hello");
// 输出：hello 在 world 前面

// 重复使用同一个参数
System.out.printf("%d + %d = %<d%n", 3, 5, 3 + 5);
// 这里 %<d 不对，应该是用索引或分开写
// 正确用法：
System.out.printf("%1$d 的平方是 %1$d × %1$d%n", 5);
// 输出：5 的平方是 5 × 5
```

**日期时间格式化**

`printf` 也能格式化日期时间对象，用 `%t` 或 `%T` 配合后缀：

```java
import java.util.Date;
import java.util.Calendar;

Date now = new Date();

System.out.printf("%tF%n", now);      // 2026-06-23（ISO 日期）
System.out.printf("%tT%n", now);      // 14:30:25（24 小时时间）
System.out.printf("%tr%n", now);      // 02:30:25 下午（12 小时时间）
System.out.printf("%tD%n", now);      // 06/23/26（美式日期）
System.out.printf("%tc%n", now);      // 完整的日期时间字符串

// 单独取各部分
System.out.printf("%tY-%<tm-%<td%n", now);   // 2026-06-23
System.out.printf("%tH:%<tM:%<tS%n", now);   // 14:30:25

// 中文星期和月份
System.out.printf("%tA%n", now);      // 星期二
System.out.printf("%tB%n", now);      // 六月
```

常用的日期后缀包括：`%tY`（四位年）、`%ty`（两位年）、`%tm`（月）、`%td`（日）、`%tH`（24 小时）、`%tM`（分）、`%tS`（秒）、`%tA`（星期全称）、`%tB`（月份全称）等。

**实战示例：格式化表格输出**

`printf` 非常适合对齐输出表格数据：

```java
System.out.printf("%-10s | %5s | %8s%n", "姓名", "年龄", "成绩");
System.out.printf("----------------------------------%n");

String[][] data = {
    {"Alice", "30", "95.5"},
    {"Bob", "25", "88.0"},
    {"Charlie", "28", "92.3"}
};

for (String[] row : data) {
    System.out.printf("%-10s | %5s | %8s%n", row[0], row[1], row[2]);
}

// 输出：
// 姓名       |  年龄 |     成绩
// ----------------------------------
// Alice      |    30 |     95.5
// Bob        |    25 |     88.0
// Charlie    |    28 |     92.3
```

**printf vs format**

`System.out.printf` 和 `String.format` 底层用的是同一套格式化引擎，区别只是 `printf` 直接输出到控制台，`String.format` 返回格式化后的字符串：

```java
// 直接输出
System.out.printf("Hello %s%n", "world");

// 返回字符串
String msg = String.format("Hello %s", "world");

// 等价于 printf 的内部实现
System.out.print(String.format("Hello %s%n", "world"));
```

**常见坑**

类型不匹配会抛出 `IllegalFormatConversionException`，比如用 `%d` 格式化 `double`；参数个数不够会抛出 `MissingFormatArgumentException`；宽度小于实际内容长度时不会截断数字（只截断字符串）。另外 `printf` 没有自动换行，记得手动加 `%n`，否则后续输出会挤在同一行。

总的来说，`printf` 在需要精确控制输出对齐和格式的场景（比如命令行工具、日志输出、报表打印）中非常实用，比字符串拼接写出来的代码可读性好很多。