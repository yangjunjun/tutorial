package com.example.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hello World 控制器 —— 用于验证 Spring Boot 项目是否正常启动和运行
 *
 * 这是一个最简单的 REST 控制器示例。在生产项目中，Controller 层负责：
 * 1. 接收 HTTP 请求（GET / POST / PUT / DELETE 等）
 * 2. 参数校验和转换
 * 3. 调用 Service 层处理业务逻辑
 * 4. 将处理结果包装为统一的响应格式返回给客户端
 *
 * @RestController 注解的作用：
 * - 它等价于 @Controller + @ResponseBody
 * - @Controller：将该类注册为 Spring MVC 的控制器组件
 * - @ResponseBody：将方法返回值直接序列化为 HTTP 响应体（JSON 或纯文本）
 *   而不是作为视图名称去查找模板文件
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@RestController
public class HelloController {

    /**
     * Hello World 接口
     *
     * 请求方式：GET
     * 请求路径：/hello
     * 返回类型：String（纯文本）
     *
     * @GetMapping 是 @RequestMapping(method = RequestMethod.GET) 的简写形式
     * 当客户端发送 GET 请求到 /hello 时，Spring MVC 会调用此方法，
     * 并将返回值 "Hello, Blog API!" 直接写入 HTTP 响应体。
     *
     * 测试方法：
     *   curl http://localhost:8080/hello
     *   或在浏览器中访问 http://localhost:8080/hello
     *
     * @return 返回问候字符串
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Blog API!";
    }
}
