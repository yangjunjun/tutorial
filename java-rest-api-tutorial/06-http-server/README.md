# 第 06 章：HTTP 服务器基础

> 本章是项目的核心基础。Java 内置了 `com.sun.net.httpserver.HttpServer`，无需任何外部框架即可搭建 HTTP 服务。

## 学习目标

- 理解 HttpServer 的核心 API
- 掌握请求解析（路径、参数、Body）
- 实现响应构建（状态码、Header、JSON Body）
- 设计一个简单的路由器

## 知识要点

### 1. HttpServer 核心

```java
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.createContext("/api/hello", exchange -> {
    // 处理请求...
    String response = "Hello World";
    exchange.sendResponseHeaders(200, response.getBytes().length);
    exchange.getResponseBody().write(response.getBytes());
    exchange.close();
});
server.start();
```

### 2. HttpExchange（请求-响应的载体）

```java
// 请求
exchange.getRequestMethod();     // "GET", "POST"...
exchange.getRequestURI();        // URI 对象
exchange.getRequestBody();       // InputStream
exchange.getRequestHeaders();     // Headers 映射

// 响应
exchange.getResponseHeaders().set("Content-Type", "application/json");
exchange.sendResponseHeaders(200, bodyLength);
exchange.getResponseBody().write(body);
exchange.close();  // 必须关闭！
```

### 3. 路由器设计模式

```java
// 路由器将请求路径映射到对应的 Handler
Router router = new Router();
router.GET("/api/tasks", taskHandler::listAll);
router.GET("/api/tasks/:id", taskHandler::getById);
router.POST("/api/tasks", taskHandler::create);
```

## 示例代码

| 文件 | 说明 |
|------|------|
| `SimpleServer.java` | 最简 HTTP 服务器：Hello World |
| `RequestHandler.java` | 请求解析：方法、路径、参数、Body |
| `RouterDemo.java` | 简易路由器设计与使用 |

## 编译与运行

```bash
cd 06-http-server
javac -d out src/com/tutorial/http/*.java

# 启动服务器
java -cp out com.tutorial.http.SimpleServer
# 另开终端测试：
curl http://localhost:8080/hello
curl http://localhost:8080/time

# 请求解析演示
java -cp out com.tutorial.http.RequestHandler
curl "http://localhost:8081/api/search?q=java&limit=10"

# 路由器演示
java -cp out com.tutorial.http.RouterDemo
curl http://localhost:8082/api/tasks
curl -X POST http://localhost:8082/api/tasks -d '{"title":"新任务"}'
```

## 练习

1. 给 `SimpleServer` 添加一个 `/echo` 接口，返回请求的所有 Header
2. 实现一个 `/api/calc?a=10&b=20&op=add` 的计算器接口
3. 扩展路由器支持 `PUT` 和 `DELETE` 方法

## 下一章

[07 - JDBC 数据库操作 →](../07-jdbc/)
