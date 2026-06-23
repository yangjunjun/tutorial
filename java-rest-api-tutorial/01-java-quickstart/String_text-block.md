好的，来详细展开 Java 文本块的语法。

**基本语法**

文本块用三个双引号 `"""` 作为起止标记，开头 `"""` 后面必须换行，结尾的 `"""` 可以在内容最后一行之后，也可以和内容在同一行：

```java
String json = """
        {
            "name": "Alice",
            "age": 30
        }
        """;
```

它本质上还是一个 `String` 对象，和传统字符串完全等价，只是写法更直观。

**缩进处理（最重要的机制）**

文本块不是简单地把所有字符原样保留，编译器会自动计算**公共缩进（incidental whitespace）**并将其剥离。规则是：找到所有非空行中最小的前导空白数，然后从每一行开头去掉这么多空白。

```java
String html = """
        <html>
            <body>
                <p>Hello</p>
            </body>
        </html>
        """;
```

上面所有非空行的最小缩进是 8 个空格（`<html>` 那一行），所以编译器会从每一行去掉 8 个空格，最终结果是：

```
<html>
    <body>
        <p>Hello</p>
    </body>
</html>
```

结尾 `"""` 的位置也参与公共缩进的计算。如果把结尾 `"""` 左移到和第一列对齐，公共缩进就会变成 0，所有空白都会保留：

```java
String html = """
        <html>
            <body>
            </body>
        </html>
""";
// 此时每行的 8 个空格前缀都会保留在结果中
```

这个机制让你可以把文本块缩进到和周围代码对齐的位置，同时输出的内容保持干净的格式。

**换行符**

文本块中的换行统一转换为 `\n`（LF），不管你的源文件是 Windows 的 `\r\n` 还是 macOS/Linux 的 `\n`。这保证了跨平台行为一致。如果确实需要 Windows 风格的换行，可以手动调用：

```java
String text = """
        line1
        line2
        """.replace("\n", "\r\n");
```

最后一行和结尾 `"""` 之间有没有换行也有讲究。结尾 `"""` 紧接在最后一行内容后面，就不会有尾部换行：

```java
String a = """
        hello""";    // 结果是 "hello"，没有尾部换行

String b = """
        hello
        """;         // 结果是 "hello\n"，有尾部换行
```

**转义字符**

文本块支持所有传统字符串的转义字符（`\n`、`\t`、`\"`、`\\` 等），但因为三引号本身不会和单个双引号冲突，所以内容里的双引号不需要转义：

```java
String json = """
        {"key": "value", "nested": {"a": 1}}
        """;
// 不需要写 \"，直接写 " 就行
```

Java 14 引入了一个新的转义符 `\`（行末反斜杠），用来抑制换行，把物理上的多行拼接成逻辑上的一行：

```java
String sql = """
        SELECT id, name, email \
        FROM users \
        WHERE age > 18
        """;
// 结果是 "SELECT id, name, email FROM users WHERE age > 18\n"
```

还有一个新的转义符 `\s`，代表一个空格。它的实际用途是防止编译器剥离尾部空白——因为编译器在计算公共缩进时会忽略每行末尾的空白，但如果你确实需要保留某些尾部空格，可以用 `\s` 来"锚定"：

```java
String text = """
        as·\s
        bs·\s
        """;
// \s 确保每行末尾的空格被保留
```

**字符串插值与拼接**

文本块不支持直接插值（不像 Groovy 的 GString 或 Kotlin 的 `$name`），但可以和普通字符串一样用 `+` 拼接或 `String.formatted()`、`String.format()` 来格式化：

```java
String name = "Alice";
int age = 30;

// 方式一：拼接
String msg1 = """
        姓名：%s
        年龄：%d
        """.formatted(name, age);

// 方式二：String.format()
String msg2 = String.format("""
        姓名：%s
        年龄：%d
        """, name, age);

// 方式三：+ 拼接
String msg3 = """
        欢迎，
        """ + name + """
        ，你今天看起来不错。
        """;
```

其中 `String.formatted()` 是 Java 15 伴随文本块正式化一起加入的实例方法，比 `String.format()` 写起来更自然。

**常见使用场景**

```java
// SQL 查询
String sql = """
        SELECT u.id, u.name, o.order_id
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE u.status = 'ACTIVE'
        ORDER BY o.created_at DESC
        """;

// JSON 数据
String json = """
        {
            "users": [
                {"name": "Alice", "role": "admin"},
                {"name": "Bob",   "role": "user"}
            ]
        }
        """;

// HTML 模板
String html = """
        <!DOCTYPE html>
        <html>
        <head><title>%s</title></head>
        <body>
            <h1>%s</h1>
        </body>
        </html>
        """.formatted(title, heading);

// 多行正则或测试数据
String csv = """
        name,age,city
        Alice,30,Beijing
        Bob,25,Shanghai
        """;
```

**几个注意事项**：开头 `"""` 后面如果直接跟内容而不换行，编译会报错；文本块不能用作注解的参数值；如果内容中恰好有三个连续双引号，需要转义其中一个：`\"""`。

总结来说，文本块的核心价值就是让多行字符串在 Java 代码中终于有了可读性，不用再用 `"..." + "..." + "..."` 或者 `\n` 拼接这种反人类的方式了。配合缩进自动剥离和行末续行符，大部分场景下都能写出既美观又准确的文本内容。