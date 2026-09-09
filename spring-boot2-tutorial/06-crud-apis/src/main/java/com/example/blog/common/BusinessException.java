package com.example.blog.common;

/**
 * 自定义业务异常
 * <p>
 * 当业务逻辑检测到不符合预期的情况时（如资源不存在、参数不合法、无操作权限等），
 * 主动抛出此异常。全局异常处理器 {@link GlobalExceptionHandler} 会捕获该异常，
 * 并将其转换为统一格式的 JSON 响应返回给前端。
 * </p>
 *
 * <h3>使用示例：</h3>
 * <pre>{@code
 * // 使用 ResultCode 枚举抛出异常
 * throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
 *
 * // 使用 ResultCode 枚举 + 自定义消息
 * throw new BusinessException(ResultCode.PARAM_ERROR, "文章标题不能为空");
 *
 * // 使用自定义 code 和消息
 * throw new BusinessException(1010, "评论功能已关闭");
 * }</pre>
 *
 * <h3>设计说明：</h3>
 * <ul>
 *   <li>继承 RuntimeException（非受检异常），避免在方法签名中声明 throws</li>
 *   <li>提供多种构造方式，方便在不同场景下快速创建</li>
 *   <li>code 字段与 ResultCode 枚举保持一致，便于全局处理</li>
 * </ul>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * 业务错误码
     */
    private final int code;

    /**
     * 通过 ResultCode 枚举构造业务异常
     *
     * @param resultCode 响应码枚举
     */
    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    /**
     * 通过 ResultCode 枚举 + 自定义消息构造业务异常
     *
     * @param resultCode 响应码枚举
     * @param message    自定义错误消息
     */
    public BusinessException(ResultCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }

    /**
     * 通过自定义 code 和消息构造业务异常
     *
     * @param code    业务错误码
     * @param message 错误消息
     */
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * 通过 ResultCode 枚举 + 原始异常构造业务异常
     *
     * @param resultCode 响应码枚举
     * @param cause      原始异常
     */
    public BusinessException(ResultCode resultCode, Throwable cause) {
        super(resultCode.getMessage(), cause);
        this.code = resultCode.getCode();
    }

    public int getCode() {
        return code;
    }
}
