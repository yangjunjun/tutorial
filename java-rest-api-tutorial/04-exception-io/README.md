# 第 04 章：异常处理与 IO

> 异常处理和 IO 是构建可靠应用的基础。本章学习 Java 异常体系、文件操作和 JSON 处理。

## 学习目标

- 理解 Java 异常体系（checked vs unchecked）
- 掌握 try-with-resources 自动资源管理
- 学会文件读写操作
- 使用 Jackson 处理 JSON（后续项目核心依赖）

## 知识要点

### 1. 异常体系

```
Throwable
├── Error（不应捕获，如 OutOfMemoryError）
└── Exception
    ├── RuntimeException（unchecked，如 NullPointerException）
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   └── NoSuchElementException
    └── IOException（checked，必须处理）
        ├── FileNotFoundException
        └── EOFException
```

- **Checked 异常**：编译时强制处理（try-catch 或 throws）
- **Unchecked 异常**：运行时异常，通常由代码逻辑错误引起

### 2. 自定义异常

```java
public class TaskNotFoundException extends RuntimeException {
    private final int taskId;
    
    public TaskNotFoundException(int taskId) {
        super("任务不存在: id=" + taskId);
        this.taskId = taskId;
    }
    
    public int getTaskId() { return taskId; }
}
```

### 3. try-with-resources

```java
// 自动关闭实现了 AutoCloseable 的资源
try (var reader = Files.newBufferedReader(path);
     var writer = Files.newBufferedWriter(output)) {
    String line;
    while ((line = reader.readLine()) != null) {
        writer.write(line.toUpperCase());
    }
} // reader 和 writer 自动关闭
```

### 4. Jackson JSON 处理

```java
ObjectMapper mapper = new ObjectMapper();

// 对象 → JSON 字符串
String json = mapper.writeValueAsString(task);

// JSON 字符串 → 对象
Task task = mapper.readValue(json, Task.class);
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `ExceptionDemo.java` | 异常处理全流程：try-catch、自定义异常、链式异常 |
| `FileDemo.java` | 文件读写、NIO.2、try-with-resources |
| `JsonDemo.java` | Jackson 序列化/反序列化 |

## 依赖

JSON 示例需要 Jackson 库。如果使用 Maven：

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
</dependency>
```

或手动下载 jar 放入 classpath。

## 编译与运行

```bash
cd 04-exception-io
javac -d out src/com/tutorial/exceptionio/*.java
java -cp out com.tutorial.exceptionio.ExceptionDemo
java -cp out com.tutorial.exceptionio.FileDemo
# JsonDemo 需要 Jackson 依赖
```

## 练习

1. 创建一个 `ValidationException`，包含字段名和错误信息的列表
2. 写一个方法读取文本文件，统计行数、单词数、字符数
3. 用 Jackson 将一个 `List<Task>` 写入 JSON 文件，再读取回来

## 下一章

[05 - 函数式编程 →](../05-functional/)
