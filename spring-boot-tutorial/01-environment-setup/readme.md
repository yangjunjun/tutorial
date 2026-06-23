# 第 01 章：环境搭建与 Hello World

> **本章目标**：从零开始搭建 Spring Boot 3 开发环境，创建个人博客系统后端项目，并运行第一个 Hello World 接口。

---

## 目录

- [1.1 技术栈总览](#11-技术栈总览)
- [1.2 环境要求与安装](#12-环境要求与安装)
  - [1.2.1 安装 JDK 17](#121-安装-jdk-17)
  - [1.2.2 安装 Maven](#122-安装-maven)
  - [1.2.3 安装 IntelliJ IDEA](#123-安装-intellij-idea)
  - [1.2.4 安装 MySQL 8](#124-安装-mysql-8)
- [1.3 使用 Spring Initializr 创建项目](#13-使用-spring-initializr-创建项目)
- [1.4 项目结构解读](#14-项目结构解读)
- [1.5 pom.xml 详解](#15-pomxml-详解)
- [1.6 编写入口类 BlogApplication](#16-编写入口类-blogapplication)
- [1.7 编写第一个 Controller](#17-编写第一个-controller)
- [1.8 配置文件 application.yml](#18-配置文件-applicationyml)
- [1.9 运行项目](#19-运行项目)
- [1.10 测试接口](#110-测试接口)
- [1.11 本章小结](#111-本章小结)

---

## 1.1 技术栈总览

本教程"个人博客系统"后端项目使用的核心技术栈如下：

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.x | 应用框架核心 |
| JDK | 17 (LTS) | Java 运行环境 |
| Maven | 3.8+ | 项目构建与依赖管理 |
| MyBatis-Plus | 3.5.5+ | ORM 持久层框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Lombok | (Spring Boot 管理) | 简化 Java 代码 |

---

## 1.2 环境要求与安装

### 1.2.1 安装 JDK 17

Spring Boot 3 要求 JDK 17 或更高版本。推荐使用以下任一发行版：

- **Oracle JDK 17**：https://www.oracle.com/java/technologies/downloads/#java17
- **Eclipse Temurin (Adoptium)**：https://adoptium.net/
- **Amazon Corretto 17**：https://aws.amazon.com/corretto/

安装完成后，在终端中验证：

```bash
java -version
# 预期输出包含 "17.x.x"

javac -version
# 预期输出包含 "17.x.x"
```

**配置环境变量（Windows）**：

1. 新建系统变量 `JAVA_HOME`，值为 JDK 安装路径，如 `C:\Program Files\Java\jdk-17`
2. 编辑 `Path` 变量，添加 `%JAVA_HOME%\bin`

**配置环境变量（macOS / Linux）**：

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### 1.2.2 安装 Maven

Maven 是 Java 生态中最常用的项目构建和依赖管理工具。

下载地址：https://maven.apache.org/download.cgi

下载 Binary zip archive，解压到任意目录（如 `C:\apache-maven-3.9.6`），然后配置环境变量：

**Windows**：

1. 新建系统变量 `MAVEN_HOME`，值为 Maven 解压路径
2. 编辑 `Path` 变量，添加 `%MAVEN_HOME%\bin`

**验证安装**：

```bash
mvn -version
# 预期输出包含 Maven 版本号及 JDK 信息
```

**配置 Maven 镜像（推荐）**：

编辑 Maven 配置文件 `conf/settings.xml`，在 `<mirrors>` 标签中添加阿里云镜像：

```xml
<mirrors>
    <mirror>
        <id>aliyunmaven</id>
        <mirrorOf>*</mirrorOf>
        <name>阿里云公共仓库</name>
        <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
</mirrors>
```

这样可以大幅加速国内依赖下载。

### 1.2.3 安装 IntelliJ IDEA

推荐使用 **IntelliJ IDEA Ultimate**（旗舰版），学生可申请免费教育许可证。社区版（Community）也可以完成本教程的学习。

下载地址：https://www.jetbrains.com/idea/download/

安装后建议安装以下插件：

- **Lombok**（新版 IDEA 已内置）：支持 Lombok 注解
- **Spring Boot Assistant**：Spring Boot 配置提示

### 1.2.4 安装 MySQL 8

下载地址：https://dev.mysql.com/downloads/installer/

安装过程中记住设置的 root 密码（后续配置会用到）。安装完成后验证：

```bash
mysql -u root -p
# 输入密码后进入 MySQL 命令行
mysql> SELECT VERSION();
# 预期输出 8.0.x
```

也可以使用 Docker 快速启动 MySQL：

```bash
docker run -d \
  --name mysql8 \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root123456 \
  mysql:8.0
```

---

## 1.3 使用 Spring Initializr 创建项目

Spring Initializr 是 Spring 官方提供的项目脚手架工具，可以快速生成 Spring Boot 项目骨架。

### 方式一：通过网页创建

1. 打开浏览器，访问 https://start.spring.io/
2. 按照下表填写表单：

| 选项 | 值 |
|------|------|
| Project | Maven |
| Language | Java |
| Spring Boot | 3.2.x（选最新稳定版） |
| Group | com.example |
| Artifact | blog |
| Name | blog |
| Description | Personal Blog System API |
| Package name | com.example.blog |
| Packaging | Jar |
| Java | 17 |

3. 点击左侧 **"ADD DEPENDENCIES"**，添加以下依赖：
   - **Spring Web** — Spring MVC 框架，提供 RESTful 接口支持
   - **Lombok** — 通过注解自动生成 getter/setter/构造器等代码

4. 点击 **"GENERATE"** 按钮，下载 zip 包
5. 解压到本地工作目录

### 方式二：通过 IDEA 创建（推荐）

1. 打开 IDEA，选择 **File → New → Project**
2. 左侧选择 **Spring Initializr**
3. 填写项目信息（与上表一致）
4. 勾选 **Spring Web** 和 **Lombok** 依赖
5. 点击 **Create**，IDEA 会自动创建项目并导入

### 方式三：使用 curl 命令行创建

```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,lombok \
  -d type=maven-project \
  -d javaVersion=17 \
  -d bootVersion=3.2.5 \
  -d groupId=com.example \
  -d artifactId=blog \
  -d packageName=com.example.blog \
  -o blog.zip
```

解压后即可使用。

---

## 1.4 项目结构解读

创建完成后，项目目录结构如下：

```
blog/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── blog/
│   │   │               └── BlogApplication.java      # 应用入口类
│   │   └── resources/
│   │       ├── application.properties                # 配置文件
│   │       ├── static/                               # 静态资源目录
│   │       └── templates/                            # 模板文件目录
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── blog/
│                       └── BlogApplicationTests.java # 测试类
├── mvnw                                             # Maven Wrapper (Unix)
├── mvnw.cmd                                         # Maven Wrapper (Windows)
├── pom.xml                                          # Maven 项目配置文件
└── .mvn/
    └── wrapper/
        └── maven-wrapper.properties
```

**关键文件说明**：

- `BlogApplication.java`：Spring Boot 应用的入口，包含 `main` 方法
- `application.properties`：应用的配置文件，我们将改用 `.yml` 格式
- `pom.xml`：Maven 的核心配置文件，管理项目依赖
- `mvnw` / `mvnw.cmd`：Maven Wrapper，使项目可以在未安装 Maven 的环境中构建

---

## 1.5 pom.xml 详解

Spring Initializr 生成的 `pom.xml` 已经包含了基本的依赖配置。我们来详细解读一下，并做小幅调整。

完整的 `pom.xml` 内容如下（见项目文件 `01-environment-setup/pom.xml`）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- Spring Boot 父工程：统一管理依赖版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <!-- 项目坐标 -->
    <groupId>com.example</groupId>
    <artifactId>blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>blog</name>
    <description>Personal Blog System API</description>

    <!-- Java 版本属性 -->
    <properties>
        <java.version>17</java.version>
    </properties>

    <!-- 依赖列表 -->
    <dependencies>
        <!-- Spring Web：包含 Spring MVC、Tomcat 等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Lombok：通过注解简化 Java 代码 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot Test：测试框架 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- 构建插件 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**关键点解读**：

1. **`spring-boot-starter-parent`**：这是 Spring Boot 的父 POM，它统一管理所有 Spring Boot 官方依赖的版本号，我们在引入依赖时不需要手动指定版本。

2. **`spring-boot-starter-web`**：这是一个 Starter（启动器），它会自动引入 Spring MVC、内嵌 Tomcat、Jackson（JSON 处理）等一系列 Web 开发所需的依赖。

3. **`lombok`**：标记为 `<optional>true</optional>`，表示这个依赖不会被传递到依赖此项目的其他项目中。同时在打包插件中排除了 Lombok，因为 Lombok 只在编译期使用。

4. **`spring-boot-maven-plugin`**：这个插件可以将项目打包成一个可执行的 "Fat JAR"（包含所有依赖的 JAR 文件）。

---

## 1.6 编写入口类 BlogApplication

Spring Boot 应用的入口是一个包含 `main` 方法的 Java 类。Spring Initializr 已经自动生成了这个类，我们来详细看看它的内容：

```java
package com.example.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 个人博客系统 - 应用入口类
 *
 * @SpringBootApplication 是一个组合注解，包含了：
 * - @SpringBootConfiguration：标识这是一个 Spring Boot 配置类
 * - @EnableAutoConfiguration：启用自动配置，Spring Boot 会根据依赖自动配置 Bean
 * - @ComponentScan：启用组件扫描，会扫描当前包及子包下的所有 @Component
 */
@SpringBootApplication
public class BlogApplication {

    public static void main(String[] args) {
        // SpringApplication.run() 方法负责启动 Spring Boot 应用
        // 它会创建 Spring 容器、加载配置、启动内嵌 Web 服务器
        SpringApplication.run(BlogApplication.class, args);
    }
}
```

**要点说明**：

- `@SpringBootApplication` 是 Spring Boot 的核心注解，它是一个"三合一"注解
- `main` 方法中的 `SpringApplication.run()` 负责启动整个应用
- 入口类必须放在根包（`com.example.blog`）下，这样组件扫描才能发现所有子包中的组件

---

## 1.7 编写第一个 Controller

接下来我们编写第一个 REST 接口，验证项目能正常运行。

在 `com.example.blog.controller` 包下创建 `HelloController.java`：

```java
package com.example.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hello World 控制器 —— 用于验证 Spring Boot 项目是否正常启动
 *
 * @RestController 是 @Controller + @ResponseBody 的组合注解：
 * - @Controller：标识这是一个 Spring MVC 控制器类
 * - @ResponseBody：将方法返回值直接作为 HTTP 响应体返回（而不是视图名）
 */
@RestController
public class HelloController {

    /**
     * GET /hello 接口
     *
     * @GetMapping 是 @RequestMapping(method = RequestMethod.GET) 的简写
     * 当浏览器或 Postman 发送 GET 请求到 /hello 时，会调用此方法
     *
     * @return 返回字符串 "Hello, Blog API!"
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Blog API!";
    }
}
```

**注解详解**：

- `@RestController`：标注在类上，表示这是一个 REST 风格的控制器。与传统的 `@Controller` 不同的是，它返回的数据直接写入 HTTP 响应体，不会经过视图解析器。
- `@GetMapping("/hello")`：映射 GET 请求到 `/hello` 路径。等价于 `@RequestMapping(value = "/hello", method = RequestMethod.GET)`。

Spring Boot 还内置了其他常用的请求映射注解：

| 注解 | HTTP 方法 | 常见用途 |
|------|-----------|----------|
| `@GetMapping` | GET | 查询数据 |
| `@PostMapping` | POST | 新增数据 |
| `@PutMapping` | PUT | 修改数据 |
| `@DeleteMapping` | DELETE | 删除数据 |
| `@PatchMapping` | PATCH | 部分更新 |

---

## 1.8 配置文件 application.yml

Spring Initializr 默认生成的是 `application.properties` 文件。在实际开发中，我们更推荐使用 YAML 格式（`.yml`），因为它的层级结构更清晰。

**第一步**：删除 `src/main/resources/application.properties`

**第二步**：创建 `src/main/resources/application.yml`，内容如下：

```yaml
# ============================================
# Spring Boot 应用基础配置
# ============================================
spring:
  application:
    # 应用名称，会在日志中显示，也用于服务注册发现
    name: blog

# ============================================
# 服务器配置
# ============================================
server:
  # 应用启动端口，默认 8080
  # 如果 8080 被占用，可以改为其他端口（如 8081、9090 等）
  port: 8080
```

**YAML 语法要点**：

1. 使用缩进表示层级关系，**只能使用空格，不能使用 Tab**
2. 冒号后面必须有空格：`key: value`
3. `#` 开头表示注释
4. 大小写敏感

**配置项说明**：

- `spring.application.name`：应用名称，在日志、服务注册发现、配置中心中作为服务标识
- `server.port`：内嵌 Web 服务器的监听端口，默认 8080

---

## 1.9 运行项目

### 方式一：在 IDEA 中运行（推荐）

1. 在 IDEA 中打开项目
2. 等待 Maven 依赖下载完成（右下角进度条）
3. 找到 `BlogApplication.java`，右键点击 → **Run 'BlogApplication'**
4. 观察控制台输出，看到类似以下日志即表示启动成功：

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.5)

2024-xx-xx INFO  com.example.blog.BlogApplication : Starting BlogApplication ...
2024-xx-xx INFO  o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 8080 (http)
2024-xx-xx INFO  com.example.blog.BlogApplication : Started BlogApplication in x.xxx seconds
```

关键信息：**Tomcat started on port(s): 8080 (http)** — 表示内嵌 Tomcat 服务器已在 8080 端口启动。

### 方式二：使用 Maven 命令行运行

在项目根目录下（`pom.xml` 所在目录）执行：

```bash
# 使用系统安装的 Maven
mvn spring-boot:run

# 或者使用 Maven Wrapper（不需要安装 Maven）
# Windows:
mvnw.cmd spring-boot:run

# macOS / Linux:
./mvnw spring-boot:run
```

Maven 会自动编译代码、下载依赖、启动应用。首次运行可能需要较长时间下载依赖。

### 方式三：打包为 JAR 后运行

```bash
# 先打包（跳过测试）
mvn clean package -DskipTests

# 然后运行 JAR
java -jar target/blog-0.0.1-SNAPSHOT.jar
```

这种方式适用于生产环境部署。

---

## 1.10 测试接口

项目启动成功后，打开浏览器或使用命令行工具测试我们编写的接口：

### 浏览器测试

直接在浏览器地址栏输入：

```
http://localhost:8080/hello
```

如果页面显示 `Hello, Blog API!`，恭喜你，第一个 Spring Boot 接口已经成功了！

### 命令行测试

**使用 curl（推荐）**：

```bash
curl http://localhost:8080/hello
# 预期输出：Hello, Blog API!
```

**使用 PowerShell（Windows）**：

```powershell
Invoke-WebRequest -Uri http://localhost:8080/hello | Select-Object -ExpandProperty Content
# 预期输出：Hello, Blog API!
```

### 使用 Postman 测试

1. 打开 Postman（https://www.postman.com/）
2. 新建请求：选择 **GET** 方法
3. 输入 URL：`http://localhost:8080/hello`
4. 点击 **Send**
5. 在响应区域看到 `Hello, Blog API!`

### 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 端口被占用 | 8080 端口已被其他程序使用 | 修改 `application.yml` 中的 `server.port` |
| 编译错误 | Maven 依赖未下载完成 | 在 IDEA 中点击 Maven 刷新按钮，或执行 `mvn clean install` |
| 404 Not Found | 接口路径不正确 | 确认 URL 为 `http://localhost:8080/hello` |
| 启动失败 | JDK 版本不匹配 | 确认使用 JDK 17+，检查 `java -version` |

---

## 1.11 本章小结

在本章中，我们完成了以下工作：

1. **环境准备**：安装了 JDK 17、Maven、IntelliJ IDEA 和 MySQL 8
2. **创建项目**：通过 Spring Initializr 生成了 Spring Boot 3.2 项目骨架
3. **理解结构**：了解了项目目录结构和 `pom.xml` 的作用
4. **编写代码**：完成了入口类 `BlogApplication` 和 `HelloController`
5. **配置应用**：使用 YAML 格式配置了应用名称和端口
6. **运行测试**：通过 IDEA 和命令行两种方式启动项目，并成功访问了 Hello World 接口

### 下一章预告

在第 02 章中，我们将规划项目的分层架构，学习 Controller → Service → Mapper 的分层设计模式，理解 DTO 与 VO 的概念，并搭建完整的项目骨架。

---

> **本章源码**：参见 `01-environment-setup/` 目录下的完整文件。
