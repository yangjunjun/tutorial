package com.tutorial.taskapi.exception;

/**
 * API 业务异常
 * 
 * 携带 HTTP 状态码和错误信息
 */
public class ApiException extends RuntimeException {

    private final int statusCode;

    public ApiException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public ApiException(int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    // ===== 常用工厂方法 =====

    public static ApiException notFound(String resource, int id) {
        return new ApiException(404, "%s不存在: id=%d".formatted(resource, id));
    }

    public static ApiException badRequest(String message) {
        return new ApiException(400, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(401, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(403, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(409, message);
    }

    public static ApiException internal(String message) {
        return new ApiException(500, message);
    }
}
