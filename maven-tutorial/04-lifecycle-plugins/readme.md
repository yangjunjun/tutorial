# 04 - 生命周期与插件

## 本章目标

- 理解 Maven 的三大生命周期
- 掌握 Phase 与 Goal 的关系
- 学会配置和使用常用插件
- 自定义构建行为

## 1. 三大生命周期

Maven 定义了三个**独立**的生命周期，每个生命周期由若干 **Phase（阶段）** 组成：

### 1.1 Clean 生命周期

| Phase | 作用 |
|-------|------|
| `pre-clean` | 清理前准备 |
| `clean` | 删除 target/ 目录 |
| `post-clean` | 清理后操作 |

### 1.2 Default 生命周期（最核心）

| Phase | 作用 | 绑定的默认插件 |
|-------|------|---------------|
| `validate` | 验证项目配置 | - |
| `compile` | 编译主代码 | maven-compiler-plugin |
| `test-compile` | 编译测试代码 | maven-compiler-plugin |
| `test` | 运行单元测试 | maven-surefire-plugin |
| `package` | 打包（jar/war） | maven-jar-plugin |
| `verify` | 运行集成测试检查 | - |
| `install` | 安装到本地仓库 | maven-install-plugin |
| `deploy` | 部署到远程仓库 | maven-deploy-plugin |

### 1.3 Site 生命周期

| Phase | 作用 |
|-------|------|
| `pre-site` | 生成站点前准备 |
| `site` | 生成项目文档站点 |
| `post-site` | 生成后处理 |
| `site-deploy` | 部署站点 |

### 关键规则

**执行某个 Phase 时，会先执行该生命周期中它前面的所有 Phase：**

```bash
# mvn package 实际执行：
# validate → compile → test-compile → test → package
$ mvn package

# mvn install 实际执行：
# validate → compile → test-compile → test → package → verify → install
$ mvn install
```

不同生命周期之间是独立的：

```bash
# clean 和 default 是两个独立生命周期，需要同时指定
$ mvn clean package
```

## 2. Phase 与 Goal

### 2.1 关系

- **Phase** 是生命周期中的一个阶段（抽象）
- **Goal** 是插件中的一个具体任务（实现）
- Phase 通过**绑定**一个或多个 Goal 来执行实际工作

```
Phase: compile  →  绑定  →  Goal: compiler:compile
Phase: test     →  绑定  →  Goal: surefire:test
Phase: package  →  绑定  →  Goal: jar:jar
```

### 2.2 直接执行 Goal

可以绕过生命周期，直接运行插件 Goal：

```bash
# 直接运行 compiler 插件的 compile Goal
$ mvn compiler:compile

# 直接运行 dependency 插件的 tree Goal
$ mvn dependency:tree

# 直接运行 exec 插件的 java Goal
$ mvn exec:java -Dexec.mainClass="com.example.App"
```

## 3. 常用插件配置

### 3.1 maven-compiler-plugin（编译器）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.12.1</version>
    <configuration>
        <source>17</source>
        <target>17</target>
        <!-- 或使用 release 替代 source + target -->
        <!-- <release>17</release> -->
        <compilerArgs>
            <arg>-parameters</arg>  <!-- 保留方法参数名 -->
        </compilerArgs>
    </configuration>
</plugin>
```

### 3.2 maven-shade-plugin（Fat Jar）

将所有依赖打入一个可执行 jar：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.5.1</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <transformers>
                    <transformer implementation=
                        "org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <mainClass>com.example.PluginDemo</mainClass>
                    </transformer>
                </transformers>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 3.3 exec-maven-plugin（运行主类）

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.1.0</version>
    <configuration>
        <mainClass>com.example.PluginDemo</mainClass>
    </configuration>
</plugin>
```

使用：`mvn exec:java`

### 3.4 maven-resources-plugin（资源处理）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <encoding>UTF-8</encoding>
    </configuration>
</plugin>
```

## 4. 自定义绑定

可以把任意 Goal 绑定到某个 Phase：

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.1.0</version>
    <executions>
        <execution>
            <id>print-version</id>
            <!-- 绑定到 validate 阶段 -->
            <phase>validate</phase>
            <goals>
                <goal>java</goal>
            </goals>
            <configuration>
                <mainClass>com.example.PrintVersion</mainClass>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## 5. 示例项目

`plugin-demo/` 演示了多个插件的组合使用：

```bash
$ cd plugin-demo

# 查看有效 POM（包含所有继承和默认配置）
$ mvn help:effective-pom

# 编译并运行
$ mvn compile exec:java

# 打包成 fat jar 并运行
$ mvn clean package
$ java -jar target/plugin-demo-1.0.0.jar

# 跳过测试打包
$ mvn package -DskipTests
```

## 6. 小结

- 三大生命周期相互独立：Clean、Default、Site
- Phase 是阶段，Goal 是具体任务，Phase 通过绑定 Goal 工作
- 执行某 Phase 会自动执行前面所有 Phase
- 插件是 Maven 的核心扩展机制，几乎所有构建行为都由插件完成
- shade-plugin 打 fat jar、exec-plugin 直接运行 Java 类是高频操作
