package com.example.blog.exception;

/**
 * 业务异常（第 14 章测试工程最小骨架）
 * <p>完整实现见第 04 章。</p>
 */
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
