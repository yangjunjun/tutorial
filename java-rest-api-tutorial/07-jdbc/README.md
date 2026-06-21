# 第 07 章：JDBC 数据库操作

> 本章学习 Java 通过 JDBC 操作数据库。使用 SQLite 作为嵌入式数据库，无需额外安装。

## 学习目标

- 理解 JDBC 的核心流程：连接 → 语句 → 结果集
- 掌握 CRUD 操作与 PreparedStatement
- 学会使用 try-with-resources 管理数据库资源
- 了解基本的连接池概念

## 知识要点

### 1. JDBC 核心流程

```java
// 1. 获取连接
Connection conn = DriverManager.getConnection("jdbc:sqlite:tasks.db");

// 2. 创建语句
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM tasks WHERE id = ?");
stmt.setInt(1, 42);

// 3. 执行查询
ResultSet rs = stmt.executeQuery();
while (rs.next()) {
    String title = rs.getString("title");
}

// 4. 关闭资源（用 try-with-resources 自动处理）
```

### 2. PreparedStatement vs Statement

永远使用 PreparedStatement，避免 SQL 注入：

```java
// 错误：字符串拼接（有 SQL 注入风险）
String sql = "SELECT * FROM users WHERE name = '" + name + "'";

// 正确：参数化查询
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement stmt = conn.prepareStatement(sql);
stmt.setString(1, name);
```

### 3. 事务管理

```java
conn.setAutoCommit(false);
try {
    // 多个操作...
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
    throw e;
} finally {
    conn.setAutoCommit(true);
}
```

## 依赖

SQLite JDBC 驱动：

```xml
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.45.0.0</version>
</dependency>
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `DatabaseSetup.java` | 建表、插入初始数据 |
| `CrudDemo.java` | 完整的增删改查操作 |
| `ConnectionPool.java` | 简易连接池实现 |

## 编译与运行

```bash
cd 07-jdbc
# 需要 SQLite JDBC jar
javac -cp sqlite-jdbc.jar -d out src/com/tutorial/jdbc/*.java
java -cp out:sqlite-jdbc.jar com.tutorial.jdbc.DatabaseSetup
java -cp out:sqlite-jdbc.jar com.tutorial.jdbc.CrudDemo
```

## 练习

1. 创建一个 `UserDao` 类，封装用户的增删改查
2. 实现批量插入：一次插入 100 条数据，使用事务保证性能
3. 给 `CrudDemo` 添加分页查询功能

## 下一章

[08 - 项目搭建 →](../08-project-setup/)
