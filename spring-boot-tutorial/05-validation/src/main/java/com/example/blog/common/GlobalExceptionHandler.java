package com.example.blog.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

/**
 * 全局异常处理器（第 05 章 — 增强版）
 * <p>
 * 在第 04 章基础上增加了参数校验相关的异常处理，
 * 能够捕获各类校验失败异常并返回友好的错误提示信息。
 * </p>
 *
 * <h3>新增处理的异常类型：</h3>
 * <ul>
 *   <li>{@link MethodArgumentNotValidException} — @Valid/@Validated + @RequestBody 校验失败</li>
 *   <li>{@link BindException} — @Valid/@Validated + 表单参数绑定校验失败</li>
 *   <li>{@link ConstraintViolationException} — @Validated + @RequestParam/@PathVariable 校验失败</li>
 *   <li>{@link MissingServletRequestParameterException} — 缺少必需的请求参数</li>
 *   <li>{@link HttpMessageNotReadableException} — 请求体 JSON 解析失败</li>
 *   <li>{@link HttpRequestMethodNotSupportedException} — HTTP 方法不支持</li>
 *   <li>{@link NoResourceFoundException} — 静态资源不存在（Spring Boot 3.2+）</li>
 * </ul>
 *
 * <h3>处理顺序原则：</h3>
 * <p>
 * Spring 按照"最精确匹配"原则选择处理方法。
 * 即先匹配具体的异常子类，最后才匹配通用的 Exception。
 * </p>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ==================== 业务异常 ====================

    /**
     * 处理自定义业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("业务异常 [URI={}]: code={}, message={}",
                request.getRequestURI(), e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    // ==================== 参数校验异常 ====================

    /**
     * 处理 @Valid + @RequestBody 校验失败
     * <p>
     * 当 Controller 方法参数为 {@code @Valid @RequestBody SomeDTO dto} 时，
     * DTO 字段上的校验注解（@NotBlank、@Size 等）不通过，会抛出此异常。
     * </p>
     * <p>
     * 示例：
     * <pre>{@code
     * @PostMapping("/register")
     * public Result<?> register(@Valid @RequestBody UserRegisterDTO dto) { ... }
     * }</pre>
     * 如果 dto 中 username 为空，则抛出 MethodArgumentNotValidException。
     * </p>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e,
                                                               HttpServletRequest request) {
        // 提取所有字段的校验错误信息，拼接为一条完整提示
        // 例如："用户名不能为空; 密码长度必须在 6~20 个字符之间"
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 处理 @Valid + 表单参数绑定校验失败
     * <p>
     * 当 Controller 方法参数为 {@code @Valid @ModelAttribute SomeDTO dto} 或
     * 直接将校验注解标注在方法参数上时，校验失败会抛出此异常。
     * </p>
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException e, HttpServletRequest request) {
        String errorMessage = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数绑定校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 处理 @Validated + @RequestParam / @PathVariable 校验失败
     * <p>
     * 当校验注解（如 @Min、@Max）直接标注在 Controller 方法的简单类型参数上，
     * 且 Controller 类上使用了 {@code @Validated} 注解时，
     * 校验失败会抛出 {@link ConstraintViolationException}。
     * </p>
     * <p>
     * 示例：
     * <pre>{@code
     * @RestController
     * @Validated  // 必须加在类上，才能校验方法参数
     * public class UserController {
     *     @GetMapping("/page")
     *     public Result<?> page(@Min(value = 1, message = "页码最小为 1") @RequestParam int pageNum) { ... }
     * }
     * }</pre>
     * </p>
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleConstraintViolationException(ConstraintViolationException e,
                                                            HttpServletRequest request) {
        // 提取所有违反约束的错误信息
        String errorMessage = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        log.warn("约束校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    // ==================== 请求格式异常 ====================

    /**
     * 处理缺少必需请求参数的异常
     * <p>
     * 当 Controller 方法声明了 {@code @RequestParam String name}（required=true），
     * 但前端未传递该参数时抛出。
     * </p>
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException e, HttpServletRequest request) {
        String message = String.format("缺少必需的请求参数: %s (类型: %s)",
                e.getParameterName(), e.getParameterType());
        log.warn("缺少参数 [URI={}]: {}", request.getRequestURI(), message);
        return Result.fail(ResultCode.PARAM_ERROR, message);
    }

    /**
     * 处理请求体 JSON 解析失败
     * <p>
     * 当前端发送的 JSON 格式不正确（如缺少引号、括号不匹配）时，
     * Spring 无法将其反序列化为 Java 对象，会抛出此异常。
     * </p>
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleHttpMessageNotReadableException(HttpMessageNotReadableException e,
                                                               HttpServletRequest request) {
        log.warn("请求体解析失败 [URI={}]: {}", request.getRequestURI(), e.getMessage());
        return Result.fail(ResultCode.PARAM_ERROR, "请求体 JSON 格式不正确");
    }

    // ==================== HTTP 方法异常 ====================

    /**
     * 处理 HTTP 请求方法不支持
     * <p>
     * 例如接口定义为 POST，但前端使用了 GET 请求。
     * </p>
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        String message = String.format("不支持 %s 请求方法", e.getMethod());
        log.warn("方法不支持 [URI={}]: {}", request.getRequestURI(), message);
        return Result.fail(405, message);
    }

    /**
     * 处理静态资源不存在（Spring Boot 3.2+）
     */
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNoResourceFoundException(NoResourceFoundException e,
                                                        HttpServletRequest request) {
        log.warn("资源不存在 [URI={}]: {}", request.getRequestURI(), e.getResourcePath());
        return Result.fail(ResultCode.NOT_FOUND);
    }

    // ==================== 兜底异常处理 ====================

    /**
     * 处理所有未预知的异常（兜底处理器）
     * <p>
     * 捕获 NullPointerException、数据库异常等所有其他异常。
     * 对外只返回友好提示，详细堆栈通过日志记录。
     * </p>
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("系统异常 [URI={}]: {}", request.getRequestURI(), e.getMessage(), e);
        return Result.fail(ResultCode.INTERNAL_ERROR);
    }
}
