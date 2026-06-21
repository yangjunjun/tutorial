package com.example.blog.common;

import java.io.Serializable;

/**
 * 统一响应封装类
 * <p>
 * 所有 Controller 接口统一返回此对象，保证前后端交互的数据格式一致。
 * 前端只需判断 {@code code} 字段即可知道请求是否成功，无需解析其他字段。
 * </p>
 *
 * <h3>JSON 结构示例：</h3>
 * <pre>{@code
 * {
 *   "code": 200,
 *   "message": "操作成功",
 *   "data": { ... }
 * }
 * }</pre>
 *
 * <h3>使用方式：</h3>
 * <pre>{@code
 * // 成功，携带数据
 * return Result.success(userVO);
 *
 * // 成功，无数据
 * return Result.success();
 *
 * // 失败，使用枚举
 * return Result.fail(ResultCode.NOT_FOUND);
 *
 * // 失败，自定义消息
 * return Result.fail(ResultCode.PARAM_ERROR, "用户名不能为空");
 * }</pre>
 *
 * @param <T> data 字段的类型，可以是任意对象、列表或 null
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应状态码，200 表示成功，其他值表示各种错误
     */
    private int code;

    /**
     * 响应提示信息，面向开发者的可读描述
     */
    private String message;

    /**
     * 响应数据，成功时携带业务数据，失败时为 null
     */
    private T data;

    /**
     * 私有构造，强制通过静态工厂方法创建实例
     */
    private Result() {
    }

    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // ==================== 成功响应 ====================

    /**
     * 成功响应（无数据）
     *
     * @return Result<Void>
     */
    public static Result<Void> success() {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), null);
    }

    /**
     * 成功响应（携带数据）
     *
     * @param data 业务数据
     * @param <T>  数据类型
     * @return Result<T>
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    /**
     * 成功响应（自定义消息 + 数据）
     *
     * @param message 自定义成功消息
     * @param data    业务数据
     * @param <T>     数据类型
     * @return Result<T>
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
    }

    // ==================== 失败响应 ====================

    /**
     * 失败响应（使用 ResultCode 枚举）
     *
     * @param resultCode 响应码枚举
     * @return Result<Void>
     */
    public static Result<Void> fail(ResultCode resultCode) {
        return new Result<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    /**
     * 失败响应（使用 ResultCode 枚举 + 自定义消息）
     * <p>适用于需要在枚举消息基础上补充细节的场景。</p>
     *
     * @param resultCode 响应码枚举
     * @param message    自定义错误消息（覆盖枚举默认消息）
     * @return Result<Void>
     */
    public static Result<Void> fail(ResultCode resultCode, String message) {
        return new Result<>(resultCode.getCode(), message, null);
    }

    /**
     * 失败响应（自定义 code + 消息）
     * <p>适用于临时定义未在枚举中列出的错误码。</p>
     *
     * @param code    错误码
     * @param message 错误消息
     * @return Result<Void>
     */
    public static Result<Void> fail(int code, String message) {
        return new Result<>(code, message, null);
    }

    // ==================== Getter / Setter ====================

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "Result{" +
                "code=" + code +
                ", message='" + message + '\'' +
                ", data=" + data +
                '}';
    }
}
