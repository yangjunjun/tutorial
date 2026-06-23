# 03 - 依赖管理

## 本章目标

- 理解依赖声明与 Scope 机制
- 掌握传递依赖的工作原理
- 学会排除依赖、解决版本冲突
- 理解 BOM（Bill of Materials）的用途

## 1. 依赖声明

在 `<dependencies>` 中添加依赖坐标：

```xml
<dependencies>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
</dependencies>
```

Maven 会自动从仓库下载该依赖及其传递依赖，放入本地仓库。

## 2. Dependency Scope

Scope 控制依赖在何时可用：

| Scope | 编译 | 测试 | 运行 | 打包 | 典型场景 |
|-------|------|------|------|------|---------|
| `compile`（默认） | ✓ | ✓ | ✓ | ✓ | 绝大多数依赖 |
| `provided` | ✓ | ✓ | ✗ | ✗ | Servlet API（容器提供） |
| `runtime` | ✗ | ✓ | ✓ | ✓ | JDBC 驱动 |
| `test` | ✗ | ✓ | ✗ | ✗ | JUnit、Mockito |
| `system` | ✓ | ✓ | ✗ | ✗ | 本地 jar（不推荐） |

### 示例

```xml
<!-- 只在测试时使用 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.1</version>
    <scope>test</scope>
</dependency>

<!-- 编译时需要，运行时由容器提供 -->
<dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>6.0.0</version>
    <scope>provided</scope>
</dependency>

<!-- 只在运行时需要（代码中不直接 import） -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
    <scope>runtime</scope>
</dependency>
```

## 3. 传递依赖

当你依赖 A，而 A 依赖 B，Maven 会自动引入 B，这就是传递依赖：

```
你的项目 → spring-web → spring-core → spring-jcl
                      → spring-beans
```

查看依赖树：

```bash
$ mvn dependency:tree
```

输出示例：

```
[INFO] com.example:dep-demo:jar:1.0.0
[INFO] +- org.apache.httpcomponents.client5:httpclient5:jar:5.3:compile
[INFO] |  +- org.apache.httpcomponents.core5:httpcore5:jar:5.2.3:compile
[INFO] |  +- org.apache.httpcomponents.core5:httpcore5-h2:jar:5.2.3:compile
[INFO] |  \- org.slf4j:slf4j-api:jar:1.7.36:compile
[INFO] \- com.google.code.gson:gson:jar:2.10.1:compile
```

## 4. 依赖冲突与排除

### 4.1 冲突场景

当两个依赖引入了同一个库的不同版本：

```
项目 → A → commons-lang3:3.12
项目 → B → commons-lang3:3.14
```

Maven 的解决策略：**最短路径优先**，路径相同则**先声明优先**。

### 4.2 排除依赖

```xml
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.3</version>
    <exclusions>
        <!-- 排除传递引入的旧版 slf4j -->
        <exclusion>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 显式声明我们需要的版本 -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>2.0.9</version>
</dependency>
```

### 4.3 分析冲突

```bash
# 查看冲突详情
$ mvn dependency:tree -Dverbose -Dincludes=org.slf4j

# 分析依赖冲突
$ mvn enforcer:enforce
```

## 5. BOM（Bill of Materials）

BOM 是一种特殊的 POM，用于集中管理一组相关依赖的版本号：

### 5.1 使用 BOM

```xml
<dependencyManagement>
    <dependencies>
        <!-- 引入 Spring Boot BOM -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- 无需指定版本，由 BOM 统一管理 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```

### 5.2 BOM 的好处

- 版本号集中管理，避免不一致
- 确保一组依赖之间版本兼容
- 用户无需操心版本选择

## 6. 示例项目

`dep-demo/` 项目演示了以上所有概念：

```bash
$ cd dep-demo
$ mvn clean compile

# 查看完整依赖树
$ mvn dependency:tree

# 运行主程序
$ mvn exec:java -Dexec.mainClass="com.example.DepDemo"
```

## 7. 小结

- Scope 控制依赖的可见范围，选对 scope 能减少打包体积
- 传递依赖让你不必手动管理间接依赖
- 遇到版本冲突时，用 `exclusion` 排除 + 显式声明
- BOM 是大型项目管理版本一致性的最佳实践
- `mvn dependency:tree` 是排查依赖问题的第一工具
