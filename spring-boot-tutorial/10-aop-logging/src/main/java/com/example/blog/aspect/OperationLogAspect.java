package com.example.blog.aspect;

import com.example.blog.entity.OperationLogEntity;
import com.example.blog.mapper.OperationLogMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日志 AOP 切面
 * <p>
 * 拦截所有标注了 {@link OperationLog} 注解的方法，
 * 自动记录操作人、操作类型、请求参数、响应结果、耗时、IP 地址等信息。
 * </p>
 *
 * <p>实现原理：</p>
 * <ol>
 *   <li>通过 @Pointcut 定义切点，匹配 @OperationLog 注解的方法</li>
 *   <li>通过 @Around 环绕通知，在方法执行前后收集信息</li>
 *   <li>构建 OperationLogEntity 并异步保存到数据库</li>
 * </ol>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;
    private final ObjectMapper objectMapper;

    // ==================== 切点定义 ====================

    /**
     * 切点：匹配所有标注了 @OperationLog 注解的方法
     * <p>
     * 使用 {@code @annotation} 切点表达式，当方法上有 @OperationLog 注解时触发。
     * </p>
     */
    @Pointcut("@annotation(com.example.blog.aspect.OperationLog)")
    public void operationLogPointcut() {
        // 切点定义，不需要方法体
    }

    // ==================== 环绕通知 ====================

    /**
     * 环绕通知：拦截切点匹配的方法，记录操作日志
     * <p>
     * 执行流程：
     * 1. 记录开始时间
     * 2. 获取注解信息、请求信息、操作人信息
     * 3. 执行目标方法（proceed）
     * 4. 记录结束时间，计算耗时
     * 5. 异步保存日志到数据库
     * </p>
     *
     * @param joinPoint 连接点，包含目标方法和参数的信息
     * @return 目标方法的返回值
     * @throws Throwable 目标方法抛出的异常
     */
    @Around("operationLogPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        // ---- 1. 记录开始时间 ----
        long startTime = System.currentTimeMillis();

        // ---- 2. 获取当前 HTTP 请求 ----
        HttpServletRequest request = getRequest();

        // ---- 3. 获取 @OperationLog 注解信息 ----
        OperationLog operationLog = getAnnotation(joinPoint);

        // ---- 4. 构建日志实体并填充基础信息 ----
        OperationLogEntity logEntity = new OperationLogEntity();
        logEntity.setModule(operationLog.module());
        logEntity.setType(operationLog.type());
        logEntity.setDescription(operationLog.description());
        logEntity.setMethod(getMethodName(joinPoint));
        logEntity.setRequestTime(LocalDateTime.now());

        // 填充 HTTP 请求信息
        if (request != null) {
            logEntity.setRequestMethod(request.getMethod());
            logEntity.setRequestUrl(request.getRequestURI());
            logEntity.setIp(getClientIp(request));
            logEntity.setUserAgent(getUserAgent(request));
        }

        // 填充请求参数
        logEntity.setRequestParams(getRequestParams(joinPoint));

        // 填充操作人信息（从 Spring Security 上下文获取）
        fillOperatorInfo(logEntity);

        // ---- 5. 执行目标方法 ----
        Object result = null;
        try {
            result = joinPoint.proceed();
            logEntity.setStatus(1); // 成功
            logEntity.setResponseResult(truncate(toJson(result), 2000));
        } catch (Throwable ex) {
            logEntity.setStatus(0); // 失败
            logEntity.setErrorMsg(truncate(ex.getMessage(), 2000));
            throw ex; // 继续抛出异常，不影响业务逻辑
        } finally {
            // ---- 6. 计算耗时 ----
            long costTime = System.currentTimeMillis() - startTime;
            logEntity.setCostTime(costTime);

            // ---- 7. 异步保存日志 ----
            saveLog(logEntity);

            // 控制台打印日志摘要
            log.info("[操作日志] {} - {} | {} | 操作人: {} | 耗时: {}ms | 状态: {}",
                    logEntity.getModule(),
                    logEntity.getType(),
                    logEntity.getDescription(),
                    logEntity.getOperatorName(),
                    logEntity.getCostTime(),
                    logEntity.getStatus() == 1 ? "成功" : "失败");
        }

        return result;
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取当前 HTTP 请求
     *
     * @return HttpServletRequest，如果不在 HTTP 请求上下文中则返回 null
     */
    private HttpServletRequest getRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            log.warn("获取 HttpServletRequest 失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 获取方法上的 @OperationLog 注解
     *
     * @param joinPoint 连接点
     * @return @OperationLog 注解实例
     */
    private OperationLog getAnnotation(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        return method.getAnnotation(OperationLog.class);
    }

    /**
     * 获取方法名称（类名.方法名）
     *
     * @param joinPoint 连接点
     * @return 方法全限定名
     */
    private String getMethodName(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        return className + "." + methodName;
    }

    /**
     * 获取请求参数（JSON 格式）
     * <p>
     * 将方法参数序列化为 JSON 字符串，便于后续审计查看。
     * 对过长的参数进行截断，避免占用过多存储空间。
     * </p>
     *
     * @param joinPoint 连接点
     * @return 参数 JSON 字符串
     */
    private String getRequestParams(ProceedingJoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args == null || args.length == 0) {
                return null;
            }
            // 过滤掉 HttpServletRequest/Response 等不可序列化的参数
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < args.length; i++) {
                if (i > 0) sb.append(", ");
                String param = toJson(args[i]);
                // 单个参数最多 1000 字符
                sb.append(truncate(param, 1000));
            }
            sb.append("]");
            return truncate(sb.toString(), 4000);
        } catch (Exception e) {
            log.warn("序列化请求参数失败: {}", e.getMessage());
            return "[参数序列化失败]";
        }
    }

    /**
     * 填充操作人信息
     * <p>
     * 从 Spring Security 的 SecurityContext 中获取当前登录用户信息。
     * 如果是匿名访问（未登录），则标记为"匿名"。
     * </p>
     *
     * @param logEntity 日志实体
     */
    private void fillOperatorInfo(OperationLogEntity logEntity) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                // 如果 principal 是自定义的 UserDetails 实现，可以强转获取更多信息
                // 这里简化处理，直接使用 name
                logEntity.setOperatorName(authentication.getName());
                // 如果需要 operatorId，可以从 UserDetails 中获取：
                // Object principal = authentication.getPrincipal();
                // if (principal instanceof LoginUser loginUser) {
                //     logEntity.setOperatorId(loginUser.getUserId());
                // }
            } else {
                logEntity.setOperatorName("匿名");
            }
        } catch (Exception e) {
            log.warn("获取操作人信息失败: {}", e.getMessage());
            logEntity.setOperatorName("未知");
        }
    }

    /**
     * 获取客户端真实 IP 地址
     * <p>
     * 需要处理 Nginx、Apache 等反向代理的情况。
     * 请求经过代理后，remoteAddr 会变成代理服务器的 IP，
     * 真实 IP 存放在 X-Forwarded-For 等请求头中。
     * </p>
     *
     * @param request HTTP 请求
     * @return 客户端真实 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (isBlankIp(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (isBlankIp(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (isBlankIp(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (isBlankIp(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多次反向代理后会有多个 IP，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 判断 IP 是否为空或 unknown
     */
    private boolean isBlankIp(String ip) {
        return !StringUtils.hasText(ip) || "unknown".equalsIgnoreCase(ip);
    }

    /**
     * 获取浏览器 User-Agent
     */
    private String getUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return truncate(userAgent != null ? userAgent : "", 500);
    }

    /**
     * 将对象序列化为 JSON 字符串
     */
    private String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    /**
     * 截断字符串，避免过长
     *
     * @param str       原始字符串
     * @param maxLength 最大长度
     * @return 截断后的字符串
     */
    private String truncate(String str, int maxLength) {
        if (str == null) {
            return null;
        }
        if (str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + "...(truncated)";
    }

    /**
     * 异步保存操作日志到数据库
     * <p>
     * 使用 @Async 注解实现异步保存，不阻塞业务方法的返回。
     * 注意：启动类需要添加 @EnableAsync 注解。
     * </p>
     *
     * @param logEntity 日志实体
     */
    @Async
    public void saveLog(OperationLogEntity logEntity) {
        try {
            operationLogMapper.insert(logEntity);
        } catch (Exception e) {
            // 日志保存失败不应影响业务流程，仅记录错误日志
            log.error("保存操作日志失败: {}", e.getMessage(), e);
        }
    }
}
