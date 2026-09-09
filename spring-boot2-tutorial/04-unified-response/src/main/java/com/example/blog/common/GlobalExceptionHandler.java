package com.example.blog.common;

import javax.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * <p>
 * 通过 {@code @RestControllerAdvice} 注解拦截 Controller 层抛出的所有异常，
 * 将其转换为统一格式的 JSON 响应，避免前端收到原始的 HTTP 500 错误页面或堆栈信息。
 * </p>
 *
 * <h3>处理的异常类型：</h3>
 * <ul>
 *   <li>{@link BusinessException} — 业务异常，返回业务定义的错误码和消息</li>
 *   <li>{@link MethodArgumentNotValidException} — @Valid 校验失败（@RequestBody 参数）</li>
 *   <li>{@link BindException} — @Valid 校验失败（表单参数绑定）</li>
 *   <li>{@link Exception} — 其他未预知的异常，统一返回 500</li>
 * </ul>
 *
 * <h3>设计说明：</h3>
 * <ul>
 *   <li>使用 SLF4J 记录异常详情，方便排查问题</li>
 *   <li>校验异常会拼接所有字段的错误信息，一次性返回给前端</li>
 *   <li>未知异常对外只暴露友好提示，不泄露堆栈信息（安全考虑）</li>
 *   <li>{@code @ResponseStatus} 设置 HTTP 状态码，便于前端通过 HTTP 状态做初步判断</li>
 * </ul>
 *
 * <p>注意：Spring Boot 2.5.12（Spring 5.3）使用 {@code javax.servlet} 包，
 * 而 Spring Boot 3.x 才迁移到 {@code jakarta.servlet}。</p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理自定义业务异常
     * <p>
     * 业务代码中主动抛出的 {@link BusinessException}，
     * 携带业务错误码和错误消息，直接返回给前端。
     * </p>
     *
     * @param e       业务异常实例
     * @param request 当前 HTTP 请求（用于日志记录）
     * @return 统一响应
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK) // 业务异常统一返回 HTTP 200，由 code 字段区分成功/失败
    public Result<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("业务异常 [URI={}]: code={}, message={}", request.getRequestURI(), e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    /**
     * 处理 @Valid 校验异常（@RequestBody 参数）
     * <p>
     * 当 Controller 方法参数使用 {@code @Valid} 或 {@code @Validated} 注解，
     * 且请求体为 JSON（{@code @RequestBody}）时，校验失败会抛出此异常。
     * </p>
     * <p>
     * 示例：{@code @PostMapping public Result<?> create(@Valid @RequestBody ArticleDTO dto)}
     * </p>
     *
     * @param e       校验异常实例
     * @param request 当前 HTTP 请求
     * @return 统一响应，message 包含所有校验失败的字段信息
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {
        // 提取所有字段的校验错误信息，拼接为一条完整的提示
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 处理 @Valid 校验异常（表单参数绑定）
     * <p>
     * 当 Controller 方法参数使用 {@code @ModelAttribute} 或直接绑定表单字段时，
     * 校验失败会抛出 {@link BindException}。
     * </p>
     *
     * @param e       绑定异常实例
     * @param request 当前 HTTP 请求
     * @return 统一响应
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException e, HttpServletRequest request) {
        String errorMessage = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数绑定失败 [URI={}]: {}", request.getRequestURI(), errorMessage);
        return Result.fail(ResultCode.PARAM_ERROR, errorMessage);
    }

    /**
     * 处理所有未预知的异常（兜底处理器）
     * <p>
     * 捕获 NullPointerException、数据库异常等所有其他异常。
     * 对外只返回友好提示，详细堆栈通过日志记录。
     * </p>
     *
     * @param e       未知异常实例
     * @param request 当前 HTTP 请求
     * @return 统一响应
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("系统异常 [URI={}]: {}", request.getRequestURI(), e.getMessage(), e);
        return Result.fail(ResultCode.INTERNAL_ERROR);
    }
}
