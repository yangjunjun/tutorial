# 08 - 综合实战项目

## 本章目标

- 综合运用前 7 章所有知识点
- 构建一个完整的多模块 Maven 项目
- 体验真实项目中 Maven 的工程化配置

## 1. 项目概述

我们将构建一个**书店管理系统**（Bookstore），它是一个多模块 Maven 项目，展示：

| 知识点 | 对应章节 |
|--------|---------|
| Maven 项目结构 | 01, 02 |
| 依赖管理、Scope、BOM | 03 |
| 插件配置（Shade、Exec） | 04 |
| 多模块继承与聚合 | 05 |
| Profile 多环境切换 | 06 |
| 测试分层（Surefire + Failsafe） | 07 |

## 2. 项目结构

```
bookstore/
├── pom.xml                          # 父 POM
├── bookstore-model/                 # 数据模型
│   ├── pom.xml
│   └── src/main/java/
├── bookstore-service/               # 业务逻辑
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/               # 单元测试
├── bookstore-app/                   # 应用入口（打 fat jar）
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   └── resources/           # 多环境配置
│       └── test/java/               # 集成测试
```

## 3. 构建与运行

```bash
$ cd bookstore

# 构建全部模块
$ mvn clean package

# 使用开发环境（默认）
$ java -jar bookstore-app/target/bookstore-app-1.0.0.jar

# 使用生产环境
$ mvn clean package -Pprod
$ java -jar bookstore-app/target/bookstore-app-1.0.0.jar

# 只构建 app 及其依赖模块
$ mvn clean package -pl bookstore-app -am

# 运行所有测试（单元 + 集成）
$ mvn verify

# 查看完整依赖树
$ mvn dependency:tree
```

## 4. 各模块说明

### 4.1 bookstore-model

纯数据模型，不依赖第三方库：

- `Book` record：书籍实体
- `BookCategory` enum：书籍分类

### 4.2 bookstore-service

业务逻辑层，依赖 model + Gson：

- `BookRepository`：书籍存储（内存实现）
- `BookService`：业务操作（CRUD + 搜索）
- 单元测试：`BookServiceTest`

### 4.3 bookstore-app

应用入口，依赖 service：

- `BookstoreApp`：主程序，演示完整流程
- Resource Filtering：`application.properties` 通过 Profile 注入环境参数
- Shade 插件：打包为可执行 fat jar
- 集成测试：`BookstoreAppIT`

## 5. 关键配置一览

| 配置 | 位置 | 说明 |
|------|------|------|
| Java 版本 + 编码 | 父 POM `<properties>` | 全局统一 |
| 依赖版本管理 | 父 POM `<dependencyManagement>` | 版本集中控制 |
| 插件版本管理 | 父 POM `<pluginManagement>` | 插件版本统一 |
| Profile | 父 POM `<profiles>` | dev / prod 切换 |
| Resource Filtering | bookstore-app 的 `<build>` | 配置文件占位符替换 |
| Shade 打包 | bookstore-app 的 `<plugins>` | 生成 fat jar |
| 测试分层 | 父 POM Surefire + Failsafe | `*Test` 和 `*IT` 分离 |
| JaCoCo 覆盖率 | 父 POM | 全模块覆盖率报告 |

## 6. 小结

恭喜！完成本章后，你已经掌握了 Maven 的核心能力：

- 从零创建和理解 Maven 项目
- 管理依赖及其版本一致性
- 利用生命周期和插件定制构建流程
- 组织多模块项目实现关注点分离
- 通过 Profile 适配多环境部署
- 配置完善的测试策略和覆盖率报告

这些能力覆盖了日常 Java 开发中 Maven 的绝大多数使用场景。
