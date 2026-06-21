package com.tutorial.taskapi.model;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一 API 响应格式
 * 
 * 所有 API 返回统一结构：
 * {
 *   "success": true/false,
 *   "data": {...},
 *   "error": {"code": 404, "message": "..."}
 * }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ErrorInfo error;
    private Pagination pagination;

    // ===== 工厂方法 =====

    public static <T> ApiResponse<T> ok(T data) {
        var resp = new ApiResponse<T>();
        resp.success = true;
        resp.data = data;
        return resp;
    }

    public static <T> ApiResponse<T> ok(T data, Pagination pagination) {
        var resp = new ApiResponse<T>();
        resp.success = true;
        resp.data = data;
        resp.pagination = pagination;
        return resp;
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        var resp = new ApiResponse<T>();
        resp.success = false;
        resp.error = new ErrorInfo(code, message);
        return resp;
    }

    // ===== Getters & Setters =====

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public ErrorInfo getError() { return error; }
    public void setError(ErrorInfo error) { this.error = error; }

    public Pagination getPagination() { return pagination; }
    public void setPagination(Pagination pagination) { this.pagination = pagination; }

    // ===== 内部类 =====

    public record ErrorInfo(int code, String message) {}

    public record Pagination(int page, int size, long total) {
        public int totalPages() {
            return (int) Math.ceil((double) total / size);
        }
    }
}
