# 02 - 项目结构详解

## 本章目标

- 掌握 Maven 标准目录布局
- 深入理解 POM 文件的各个配置节
- 学会使用属性和变量管理配置
- 理解 Maven Wrapper 的作用

## 1. 标准目录布局

Maven 采用"约定优于配置"（Convention over Configuration）原则，规定了标准的目录结构：

```
my-project/
├── pom.xml                          # 项目配置文件
├── src/
│   ├── main/
│   │   ├── java/                    # 主源代码
│   │   │   └── com/example/
│   │   │       └── App.java
│   │   └── resources/               # 主资源文件（配置、模板等）
│   │       └── application.properties
│   └── test/
│       ├── java/                    # 测试源代码
│       │   └── com/example/
│       │       └── AppTest.java
│       └── resources/               # 测试资源文件
│           └── test-data.json
├── target/                          # 构建输出（自动生成，不提交到 Git）
│   ├── classes/                     # 编译后的 .class 文件
│   ├── test-classes/                # 编译后的测试 .class
│   └── my-project-1.0.0.jar        # 打包产物
└── .mvn/                            # Maven Wrapper 配置
    └── wrapper/
        └── maven-wrapper.properties
```

### 关键约定

| 目录 | 用途 | 对应的 Maven 阶段 |
|------|------|------------------|
| `src/main/java` | 应用源代码 | compile |
| `src/main/resources` | 应用配置/资源 | compile（复制到 classpath） |
| `src/test/java` | 测试代码 | test-compile |
| `src/test/resources` | 测试专用资源 | test-compile |
| `target/` | 所有构建输出 | clean 阶段删除 |

## 2. POM 文件详解

### 2.1 完整 POM 结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 1. 项目坐标 -->
    <groupId>com.example</groupId>
    <artifactId>structure-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <!-- 2. 项目信息（可选） -->
    <name>Structure Demo</name>
    <description>Maven 项目结构示例</description>

    <!-- 3. 属性定义 -->
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <gson.version>2.10.1</gson.version>
    </properties>

    <!-- 4. 依赖声明 -->
    <dependencies>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>${gson.version}</version>
        </dependency>
    </dependencies>

    <!-- 5. 构建配置 -->
    <build>
        <plugins>
            <!-- 插件配置 -->
        </plugins>
    </build>
</project>
```

### 2.2 packaging 类型

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| `jar` | Java 归档（默认） | 普通 Java 应用/库 |
| `war` | Web 应用归档 | Servlet/JSP 应用 |
| `pom` | 仅 POM 文件 | 父项目、BOM |
| `maven-plugin` | Maven 插件 | 自定义 Maven 插件 |

## 3. 属性与变量

### 3.1 自定义属性

在 `<properties>` 中定义，用 `${属性名}` 引用：

```xml
<properties>
    <java.version>17</java.version>
    <spring.version>3.2.0</spring.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <version>${spring.version}</version>
    </dependency>
</dependencies>
```

### 3.2 内置属性

| 属性 | 含义 |
|------|------|
| `${project.basedir}` | 项目根目录 |
| `${project.version}` | 当前项目版本 |
| `${project.artifactId}` | 当前项目名称 |
| `${maven.compiler.source}` | 编译器源码版本 |
| `${settings.localRepository}` | 本地仓库路径 |

### 3.3 属性的好处

- **版本集中管理**：多个依赖同版本时只改一处
- **避免硬编码**：编译器版本、编码等统一设置
- **多模块共享**：父 POM 定义，子模块继承

## 4. Maven Wrapper

Maven Wrapper (mvnw) 让项目自带 Maven，不要求开发者全局安装特定版本：

```bash
# 为项目生成 Maven Wrapper
$ mvn wrapper:wrapper -Dmaven=3.9.6
```

生成的文件：

```
.mvn/wrapper/maven-wrapper.properties    # Maven 版本配置
mvnw                                      # Linux/Mac 启动脚本
mvnw.cmd                                  # Windows 启动脚本
```

使用方式（替代 `mvn`）：

```bash
$ ./mvnw clean package
```

## 5. 示例项目

本章的示例项目 `structure-demo/` 展示了一个标准的 Maven 项目：

```bash
$ cd structure-demo
$ mvn clean package
$ java -jar target/structure-demo-1.0.0.jar
```

示例中包含：
- 主源代码使用 Gson 处理 JSON
- 资源文件 `config.properties` 从 classpath 加载
- 完整的标准目录结构

## 6. 小结

- Maven 的"约定优于配置"减少了样板配置
- `src/main` 是产品代码，`src/test` 是测试代码
- `resources/` 下的文件会复制到 classpath
- 属性机制让版本和配置集中可控
- Maven Wrapper 确保团队使用一致的 Maven 版本
