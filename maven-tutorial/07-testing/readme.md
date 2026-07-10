# 07 - 测试集成

## 本章目标

- 掌握 Maven 中单元测试和集成测试的分离方式
- 了解 Surefire 和 Failsafe 插件的区别
- 学会配置 JaCoCo 代码覆盖率报告
- 掌握测试相关的常用 Maven 命令

## 1. Surefire vs Failsafe

Maven 用两个不同的插件运行两类测试：

| | Surefire | Failsafe |
|--|----------|----------|
| 用途 | 单元测试 | 集成测试 |
| 绑定的 Phase | `test` | `integration-test` + `verify` |
| 文件命名约定 | `*Test.java`, `Test*.java` | `*IT.java`, `IT*.java` |
| 失败行为 | 立即失败 | 先完成后报告（确保资源清理） |

```bash
# 只跑单元测试
$ mvn test

# 跑单元测试 + 集成测试
$ mvn verify

# 跳过所有测试
$ mvn package -DskipTests

# 跳过测试编译和运行
$ mvn package -Dmaven.test.skip=true
```

## 2. 项目结构

```
test-demo/
├── pom.xml
└── src/
    ├── main/java/com/example/
    │   ├── Calculator.java
    │   └── UserRepository.java
    └── test/java/com/example/
        ├── CalculatorTest.java         # 单元测试（Surefire）
        └── UserRepositoryIT.java       # 集成测试（Failsafe）
```

## 3. 插件配置

### 3.1 Surefire（单元测试）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.3</version>
    <configuration>
        <!-- 默认已包含 *Test.java，可自定义 -->
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <!-- 排除集成测试 -->
        <excludes>
            <exclude>**/*IT.java</exclude>
        </excludes>
    </configuration>
</plugin>
```

### 3.2 Failsafe（集成测试）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <version>3.2.3</version>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 3.3 JaCoCo（覆盖率报告）

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## 4. 编写测试

### 4.1 单元测试（CalculatorTest.java）

```java
class CalculatorTest {
    private Calculator calc;

    @BeforeEach
    void setUp() {
        calc = new Calculator();
    }

    @Test
    void addShouldReturnSum() {
        assertEquals(5, calc.add(2, 3));
    }

    @ParameterizedTest
    @CsvSource({"1,1,2", "0,0,0", "-1,1,0"})
    void addParameterized(int a, int b, int expected) {
        assertEquals(expected, calc.add(a, b));
    }
}
```

### 4.2 集成测试（UserRepositoryIT.java）

```java
class UserRepositoryIT {
    private UserRepository repo;

    @BeforeEach
    void setUp() {
        repo = new UserRepository(); // 连接真实存储
    }

    @Test
    void shouldSaveAndRetrieveUser() {
        repo.save("alice", "alice@example.com");
        var user = repo.findByName("alice");
        assertTrue(user.isPresent());
        assertEquals("alice@example.com", user.get().email());
    }
}
```

## 5. 运行测试与报告

```bash
$ cd test-demo

# 只跑单元测试
$ mvn test

# 单元测试 + 集成测试 + 验证
$ mvn verify

# 生成覆盖率报告
$ mvn test jacoco:report

# 报告位置：
# target/site/jacoco/index.html
```

### 常用测试参数

```bash
# 只运行某个测试类
$ mvn test -Dtest=CalculatorTest

# 只运行某个测试方法
$ mvn test -Dtest="CalculatorTest#addShouldReturnSum"

# 运行匹配模式的测试
$ mvn test -Dtest="*Calc*"

# 测试失败时继续构建（CI 场景）
$ mvn test -Dmaven.test.failure.ignore=true
```

## 6. 示例项目

```bash
$ cd test-demo

# 运行所有测试并查看报告
$ mvn clean verify

# 生成覆盖率 HTML 报告
$ mvn clean test jacoco:report
$ open target/site/jacoco/index.html
```

## 7. 小结

- Surefire 跑单元测试（`*Test.java`），绑定 `test` Phase
- Failsafe 跑集成测试（`*IT.java`），绑定 `verify` Phase
- JaCoCo 生成覆盖率报告，集成到 Maven 生命周期
- `mvn test` = 单元测试，`mvn verify` = 单元 + 集成测试
- `-DskipTests` 跳过执行但仍编译，`-Dmaven.test.skip` 全跳
