package com.tutorial.taskapi.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.tutorial.taskapi.model.ApiResponse;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * 全局异常处理器
 * 
 * 统一捕获并处理所有异常，返回格式化的错误响应
 */
public class GlobalExceptionHandler {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * 处理异常并发送响应
     */
    public static void handle(HttpExchange exchange, Exception e) {
        int statusCode;
        String message;

        if (e instanceof ApiException apiEx) {
            // 业务异常：使用指定的状态码
            statusCode = apiEx.getStatusCode();
            message = apiEx.getMessage();
        } else if (e instanceof IllegalArgumentException) {
            // 参数错误
            statusCode = 400;
            message = "参数错误: " + e.getMessage();
        } else if (e instanceof NullPointerException) {
            // 空指针
            statusCode = 500;
            message = "内部错误: 空指针异常";
        } else {
            // 未知异常
            statusCode = 500;
            message = "服务器内部错误";
            System.err.println("未处理的异常:");
            e.printStackTrace();
        }

        try {
            String json = mapper.writeValueAsString(
                    ApiResponse.error(statusCode, message));

            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type",
                    "application/json; charset=utf-8");
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        } catch (Exception ex) {
            // 最后的手段
            System.err.println("发送错误响应也失败了: " + ex.getMessage());
        }
    }
}
