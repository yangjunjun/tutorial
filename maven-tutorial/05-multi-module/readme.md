# 05 - 多模块项目

## 本章目标

- 理解多模块项目的结构和用途
- 掌握父 POM 的继承机制
- 区分 `<dependencies>` 与 `<dependencyManagement>`
- 学会模块间的依赖引用

## 1. 为什么需要多模块

单模块项目适合小型应用，但随着项目增长：

| 问题 | 多模块方案 |
|------|----------|
| 所有代码混在一起，职责不清 | 按功能拆分模块（model、service、web） |
| 修改一处要全量编译 | 只编译修改的模块 |
| 无法独立复用某些组件 | 模块可独立发布和引用 |
| 版本管理混乱 | 父 POM 统一管理 |

## 2. 项目结构

```
multi-module-demo/
├── pom.xml                    # 父 POM（packaging: pom）
├── common/                    # 公共模块（工具类、常量）
│   ├── pom.xml
│   └── src/main/java/
├── model/                     # 数据模型模块
│   ├── pom.xml
│   └── src/main/java/
├── service/                   # 业务逻辑模块（依赖 model + common）
│   ├── pom.xml
│   └── src/main/java/
└── app/                       # 应用入口模块（依赖 service）
    ├── pom.xml
    └── src/main/java/
```

## 3. 父 POM

父 POM 的 `packaging` 必须是 `pom`，它负责：
- 列出所有子模块（`<modules>`）
- 统一管理依赖版本（`<dependencyManagement>`）
- 统一管理插件版本（`<pluginManagement>`）
- 定义公共属性和配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>multi-module-demo</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <!-- 聚合：列出所有子模块 -->
    <modules>
        <module>common</module>
        <module>model</module>
        <module>service</module>
        <module>app</module>
    </modules>

    <!-- 版本统一管理 -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.google.code.gson</groupId>
                <artifactId>gson</artifactId>
                <version>2.10.1</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

## 4. 继承 vs 聚合

| 特性 | 继承（Inheritance） | 聚合（Aggregation） |
|------|-------------------|--------------------|
| 关键字 | `<parent>` | `<modules>` |
| 方向 | 子 → 父 | 父 → 子 |
| 作用 | 子模块继承父 POM 的配置 | 父 POM 统一构建所有子模块 |
| 是否必须 | 子模块可以不继承 | 聚合模块可以不做父模块 |

在实践中，通常同时使用继承和聚合。

## 5. dependencyManagement vs dependencies

这是最容易混淆的概念：

```xml
<!-- 父 POM 中 -->
<dependencyManagement>
    <!-- 只声明版本，子模块不会自动获得这些依赖 -->
    <dependencies>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- 这里声明的依赖会被所有子模块继承 -->
</dependencies>
```

| | `<dependencyManagement>` | `<dependencies>` |
|--|-------------------------|------------------|
| 作用 | **锁定版本**，子模块按需引用 | **直接引入**依赖 |
| 子模块是否自动拥有 | 否，需显式声明（但无需写版本号） | 是 |
| 使用场景 | 版本管理（推荐） | 所有模块都需要的依赖 |

子模块中引用：

```xml
<!-- 子 POM：无需写 version，从父 POM 的 dependencyManagement 继承 -->
<dependencies>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
    </dependency>
</dependencies>
```

## 6. 模块间依赖

子模块之间可以互相依赖：

```xml
<!-- service 模块的 pom.xml -->
<dependencies>
    <!-- 依赖同项目的 model 模块 -->
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>model</artifactId>
        <version>${project.version}</version>
    </dependency>
    <!-- 依赖同项目的 common 模块 -->
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>common</artifactId>
        <version>${project.version}</version>
    </dependency>
</dependencies>
```

## 7. 示例项目

`multi-module-demo/` 是一个完整的四模块项目：

```bash
$ cd multi-module-demo

# 从父 POM 构建所有模块
$ mvn clean package

# 只构建某个模块及其依赖
$ mvn clean package -pl app -am

# 运行应用
$ java -jar app/target/app-1.0.0.jar
```

**命令说明：**
- `-pl app`：只构建 app 模块（Project List）
- `-am`：同时构建 app 所依赖的模块（Also Make）

## 8. 小结

- 多模块项目通过分层提高了可维护性和可复用性
- 父 POM 使用 `<modules>` 聚合、`<parent>` 继承
- `dependencyManagement` 只管版本不引入依赖，`dependencies` 直接引入
- 模块间用 `${project.version}` 保持版本同步
- `-pl` 和 `-am` 是多模块开发中最常用的构建参数
