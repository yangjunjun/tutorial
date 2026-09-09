package com.example.blog.common;

/**
 * 统一响应码枚举
 * <p>
 * 定义系统中所有标准化的响应状态码和对应的提示信息。
 * 前端可以根据 code 值统一判断请求结果，而不需要解析 message 文本。
 * </p>
 *
 * <h3>设计规范：</h3>
 * <ul>
 *   <li>200 — 请求成功</li>
 *   <li>4xx — 客户端错误（参数错误、未认证、无权限、资源不存在等）</li>
 *   <li>5xx — 服务端错误（内部异常）</li>
 *   <li>1xxx — 业务自定义错误码（可按模块分段）</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
public enum ResultCode {

    // ==================== 成功 ====================
    /** 操作成功 */
    SUCCESS(200, "操作成功"),

    // ==================== 客户端错误 4xx ====================
    /** 请求参数错误（通用） */
    PARAM_ERROR(400, "请求参数错误"),
    /** 未认证（未登录或 Token 过期） */
    UNAUTHORIZED(401, "未认证，请先登录"),
    /** 无权限访问 */
    FORBIDDEN(403, "没有操作权限"),
    /** 资源不存在 */
    NOT_FOUND(404, "请求的资源不存在"),

    // ==================== 服务端错误 5xx ====================
    /** 服务器内部错误 */
    INTERNAL_ERROR(500, "服务器内部错误，请稍后重试"),

    // ==================== 业务自定义错误码 1xxx ====================
    /** 用户名已存在 */
    USERNAME_ALREADY_EXISTS(1001, "用户名已存在"),
    /** 邮箱已被注册 */
    EMAIL_ALREADY_REGISTERED(1002, "邮箱已被注册"),
    /** 文章不存在 */
    ARTICLE_NOT_FOUND(1003, "文章不存在"),
    /** 分类不存在 */
    CATEGORY_NOT_FOUND(1004, "分类不存在"),
    /** 分类下存在文章，无法删除 */
    CATEGORY_HAS_ARTICLES(1005, "该分类下存在文章，无法删除");

    /**
     * 响应状态码
     */
    private final int code;

    /**
     * 响应提示信息
     */
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
