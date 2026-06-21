# 第 12 章：测试与安全

> 测试是软件质量的保障。本章学习 JUnit 5 单元测试、集成测试和安全最佳实践。

## 学习目标

- 掌握 JUnit 5 的基本使用
- 学会编写单元测试和集成测试
- 了解 REST API 安全最佳实践
- 理解常见安全漏洞和防御方法

## 知识要点

### 1. JUnit 5 基础

```java
@Test
void testAdd() {
    assertEquals(5, calculator.add(2, 3));
}

@ParameterizedTest
@ValueSource(ints = {1, 2, 3})
void testPositive(int n) {
    assertTrue(n > 0);
}

@BeforeEach
void setUp() { ... }

@AfterEach
void tearDown() { ... }
```

### 2. 测试分层

- **单元测试**：测试单个方法/类（快速、隔离）
- **集成测试**：测试多个组件协作（如 DAO + 数据库）
- **端到端测试**：测试完整请求链路

### 3. 安全最佳实践

- SQL 注入防御：使用 PreparedStatement
- XSS 防御：输出编码
- 密码存储：bcrypt 或 SHA-256 加盐
- HTTPS：生产环境必须使用
- 输入验证：永远不信任用户输入
- CORS：限制跨域访问来源

## 示例代码

| 文件 | 说明 |
|------|------|
| `TaskServiceTest.java` | Service 层单元测试 |
| `RouterTest.java` | 路由器集成测试 |
| `SecurityNotes.java` | 安全实践演示 |

## 运行测试

```bash
cd 12-testing
mvn test
# 或运行特定测试
mvn test -Dtest=TaskServiceTest
```

## 恭喜完成全部教程！

你已经从零开始，使用纯 Java 构建了一个功能完整的 RESTful API 项目。

接下来可以探索的方向：
- Spring Boot 框架
- Docker 容器化部署
- 消息队列（Kafka / RabbitMQ）
- 微服务架构
