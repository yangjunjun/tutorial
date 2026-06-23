# 01 - Maven 基础入门

## 本章目标

- 理解 Maven 是什么、解决什么问题
- 验证 Maven 安装环境
- 理解 Maven 的核心概念（POM、坐标、仓库）
- 创建并运行第一个 Maven 项目

## 1. Maven 是什么

Maven 是 Java 生态中最主流的**项目构建和依赖管理工具**。它解决的核心问题：

| 没有 Maven | 有 Maven |
|-----------|---------|
| 手动下载 jar 包，放到 lib/ 目录 | 声明依赖坐标，自动下载 |
| 手动执行 javac、java 命令编译 | `mvn compile` 一键编译 |
| 不同项目结构五花八门 | 统一的标准目录结构 |
| 打包部署流程靠脚本 | `mvn package` 标准化构建 |

## 2. 环境验证

```bash
# 检查 Java 版本（需要 17+）
$ java -version

# 检查 Maven 版本（需要 3.9+）
$ mvn -version
```

预期输出：

```
Apache Maven 3.9.x
Maven home: /path/to/maven
Java version: 17.x.x
```

> 如果 `mvn` 命令找不到，需要将 Maven 的 `bin` 目录加入 PATH 环境变量。

## 3. 核心概念

### 3.1 POM（Project Object Model）

每个 Maven 项目的根目录都有一个 `pom.xml` 文件，它是项目的"身份证 + 配置中心"：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>hello-maven</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
</project>
```

### 3.2 Maven 坐标（GAV）

Maven 用三个元素唯一标识一个项目或依赖：

| 元素 | 说明 | 示例 |
|------|------|------|
| `groupId` | 组织/公司标识（反向域名） | `com.example` |
| `artifactId` | 项目名称 | `hello-maven` |
| `version` | 版本号 | `1.0.0` |

类比：groupId 是出版社，artifactId 是书名，version 是版次。

### 3.3 仓库（Repository）

```
本地仓库（~/.m2/repository）
    ↑ 下载缓存
中央仓库（repo.maven.apache.org）
    ↑ 还找不到？
私有仓库（公司 Nexus/Artifactory）
```

- **本地仓库**：你机器上的缓存目录，下载过的依赖都存在这里
- **中央仓库**：Maven 官方的公共仓库，包含几乎所有开源 Java 库
- **私有仓库**：公司内部搭建的仓库，存放内部组件

## 4. 创建第一个项目

### 4.1 项目结构

```
hello-maven/
├── pom.xml
└── src/
    └── main/
        └── java/
            └── com/
                └── example/
                    └── App.java
```

### 4.2 pom.xml

见 `hello-maven/pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>hello-maven</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 配置 manifest，使 jar 可执行 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.3.0</version>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass>com.example.App</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 4.3 源代码

见 `hello-maven/src/main/java/com/example/App.java`：

```java
package com.example;

public class App {
    public static void main(String[] args) {
        System.out.println("Hello, Maven!");
        System.out.println("Java version: " + System.getProperty("java.version"));
        System.out.println("Project built with Maven successfully.");
    }
}
```

### 4.4 构建与运行

```bash
$ cd hello-maven

# 编译项目
$ mvn compile

# 打包成 jar
$ mvn package

# 运行
$ java -jar target/hello-maven-1.0.0.jar
```

预期输出：

```
Hello, Maven!
Java version: 17.0.x
Project built with Maven successfully.
```

## 5. 常用命令速查

| 命令 | 作用 |
|------|------|
| `mvn compile` | 编译 src/main 下的源代码 |
| `mvn test` | 运行测试 |
| `mvn package` | 编译 + 测试 + 打包 |
| `mvn clean` | 删除 target/ 目录 |
| `mvn clean package` | 先清理再打包（最常用） |
| `mvn install` | 打包并安装到本地仓库 |
| `mvn dependency:tree` | 查看依赖树 |

## 6. 小结

本章你学到了：
- Maven 的核心价值：统一构建 + 依赖管理
- POM 文件是项目的核心配置
- GAV 坐标系统唯一标识每个构件
- 仓库的三级结构：本地 → 中央 → 私有

下一章我们将深入了解 Maven 项目的标准目录结构和 POM 的更多配置项。
