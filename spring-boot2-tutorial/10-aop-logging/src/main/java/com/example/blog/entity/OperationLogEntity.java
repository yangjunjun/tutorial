package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 操作日志实体类
 * <p>
 * 对应数据库表 operation_log，用于存储 AOP 切面记录的操作日志信息。
 * 包含操作模块、操作类型、请求参数、响应结果、操作人、IP 地址、耗时等字段。
 * </p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Data
@TableName("operation_log")
public class OperationLogEntity {

    /**
     * 主键ID（自增）
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 操作模块
     * <p>例如：文章管理、用户管理、评论管理</p>
     */
    private String module;

    /**
     * 操作类型
     * <p>例如：创建、修改、删除、查询</p>
     */
    private String type;

    /**
     * 操作描述
     * <p>对本次操作的详细说明</p>
     */
    private String description;

    /**
     * 请求方法（类名.方法名）
     * <p>例如：ArticleController.create</p>
     */
    private String method;

    /**
     * HTTP 请求方法
     * <p>GET / POST / PUT / DELETE</p>
     */
    private String requestMethod;

    /**
     * 请求URL
     * <p>例如：/api/articles</p>
     */
    private String requestUrl;

    /**
     * 请求参数（JSON 格式）
     * <p>将方法参数序列化后存储，便于后续审计</p>
     */
    private String requestParams;

    /**
     * 响应结果（JSON 格式）
     * <p>将方法返回值序列化后存储</p>
     */
    private String responseResult;

    /**
     * 操作人ID
     * <p>从 Spring Security 上下文获取</p>
     */
    private Long operatorId;

    /**
     * 操作人姓名
     */
    private String operatorName;

    /**
     * 操作人IP地址
     * <p>支持反向代理场景下的真实 IP 获取</p>
     */
    private String ip;

    /**
     * 浏览器 User-Agent
     */
    private String userAgent;

    /**
     * 耗时（毫秒）
     * <p>方法执行的实际耗时，可用于性能监控</p>
     */
    private Long costTime;

    /**
     * 状态：1-成功 0-失败
     */
    private Integer status;

    /**
     * 错误信息
     * <p>方法执行失败时的异常信息</p>
     */
    private String errorMsg;

    /**
     * 操作时间
     */
    private LocalDateTime requestTime;

    /**
     * 记录创建时间（由 MyBatis-Plus 自动填充）
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
