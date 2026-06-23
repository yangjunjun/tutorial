# 06 - 环境与配置（Profiles & Resources）

## 本章目标

- 掌握 Maven Profile 多环境切换
- 理解资源过滤（Resource Filtering）机制
- 学会通过属性占位符实现配置参数化

## 1. 问题场景

应用通常需要在不同环境运行，每个环境配置不同：

| 环境 | 数据库 | 日志级别 | API 地址 |
|------|--------|---------|---------|
| dev | localhost:3306 | DEBUG | localhost:8080 |
| test | test-db:3306 | INFO | test-api.internal |
| prod | prod-cluster:3306 | WARN | api.example.com |

Maven Profile 让你在构建时选择环境，Resource Filtering 将对应的值注入配置文件。

## 2. Profile 定义

在 `pom.xml` 中定义 Profile：

```xml
<profiles>
    <!-- 开发环境（默认激活） -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <env>dev</env>
            <db.url>jdbc:mysql://localhost:3306/myapp</db.url>
            <db.username>root</db.username>
            <db.password>dev123</db.password>
            <log.level>DEBUG</log.level>
        </properties>
    </profile>

    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <properties>
            <env>prod</env>
            <db.url>jdbc:mysql://prod-cluster:3306/myapp</db.url>
            <db.username>app_user</db.username>
            <db.password>${env.DB_PASSWORD}</db.password>
            <log.level>WARN</log.level>
        </properties>
    </profile>
</profiles>
```

## 3. 激活 Profile

```bash
# 使用默认 Profile（dev）
$ mvn package

# 指定 Profile
$ mvn package -Pproduction

# 激活多个 Profile
$ mvn package -Pproduction,logging

# 查看当前激活的 Profile
$ mvn help:active-profiles
```

### 自动激活条件

除了 `-P` 手动激活，Profile 还支持自动激活：

```xml
<profile>
    <id>windows</id>
    <activation>
        <!-- 在 Windows 系统自动激活 -->
        <os>
            <family>windows</family>
        </os>
    </activation>
</profile>

<profile>
    <id>java17</id>
    <activation>
        <!-- JDK 17 时自动激活 -->
        <jdk>17</jdk>
    </activation>
</profile>

<profile>
    <id>ci</id>
    <activation>
        <!-- 环境变量 CI=true 时自动激活 -->
        <property>
            <name>env.CI</name>
            <value>true</value>
        </property>
    </activation>
</profile>
```

## 4. 资源过滤（Resource Filtering）

资源过滤让 Maven 在复制资源文件时，将 `${占位符}` 替换为实际属性值。

### 4.1 启用过滤

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>true</filtering>
        </resource>
    </resources>
</build>
```

### 4.2 资源文件中使用占位符

`src/main/resources/application.properties`：

```properties
app.name=${project.artifactId}
app.version=${project.version}
app.env=${env}

db.url=${db.url}
db.username=${db.username}
db.password=${db.password}

logging.level=${log.level}
```

### 4.3 构建时替换

```bash
# 使用 dev Profile 构建
$ mvn resources:resources -Pdev

# 查看生成的文件（占位符已被替换）
$ cat target/classes/application.properties
```

输出：

```properties
app.name=profile-demo
app.version=1.0.0
app.env=dev

db.url=jdbc:mysql://localhost:3306/myapp
db.username=root
db.password=dev123

logging.level=DEBUG
```

## 5. 多配置文件方案

另一种常见模式是为每个环境准备独立的配置文件：

```
src/main/resources/
├── application.properties           # 公共配置
├── application-dev.properties       # 开发环境
├── application-prod.properties      # 生产环境
└── application-test.properties      # 测试环境
```

在构建时通过 Profile 决定加载哪一个：

```xml
<profiles>
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <build>
            <resources>
                <resource>
                    <directory>src/main/resources</directory>
                    <includes>
                        <include>application.properties</include>
                        <include>application-dev.properties</include>
                    </includes>
                    <filtering>true</filtering>
                </resource>
            </resources>
        </build>
    </profile>
</profiles>
```

## 6. 示例项目

`profile-demo/` 演示了 Profile + Resource Filtering 的完整流程：

```bash
$ cd profile-demo

# 使用开发环境构建
$ mvn clean package -Pdev
$ java -jar target/profile-demo-1.0.0.jar

# 使用生产环境构建
$ mvn clean package -Pprod
$ java -jar target/profile-demo-1.0.0.jar

# 对比两次构建的 application.properties
$ mvn resources:resources -Pdev && cat target/classes/application.properties
$ mvn resources:resources -Pprod && cat target/classes/application.properties
```

## 7. 最佳实践

1. **不要把密码写在 POM 里** — 生产密码应通过环境变量 `${env.DB_PASSWORD}` 或 Maven settings.xml 传入
2. **dev 设为默认** — 开发者无需记住加 `-P` 参数
3. **保持 Profile 精简** — Profile 只覆盖环境差异，公共配置放在主 POM
4. **二进制文件不要过滤** — 图片、字体等二进制资源要排除在 filtering 之外：

```xml
<resource>
    <directory>src/main/resources</directory>
    <filtering>true</filtering>
    <excludes>
        <exclude>**/*.png</exclude>
        <exclude>**/*.jpg</exclude>
    </excludes>
</resource>
```

## 8. 小结

- Profile 实现"一次编写，多环境构建"
- Resource Filtering 在构建时将占位符替换为属性值
- 用 `-P` 手动激活 Profile，或通过 OS/JDK/环境变量自动激活
- 敏感配置不要硬编码在 POM 中，用环境变量注入
