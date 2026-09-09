package com.example.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.common.Result;
import com.example.blog.entity.OperationLogEntity;
import com.example.blog.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 操作日志查询 Controller
 * <p>
 * 提供管理后台使用的日志查询接口，支持：
 * - 分页查询（按模块、操作人、时间范围筛选）
 * - 查看日志详情
 * - 按模块统计日志数量
 * - 查询每日性能统计
 * </p>
 *
 * <p>注意：这些接口仅限管理员访问，需要在 Security 配置中限制权限。</p>
 *
 * <p>Spring Boot 2.5 适配说明：本示例未依赖 Swagger 注解，
 * 如需接口文档，请参考第 12 章 springfox 3.0.0 的 @Api/@ApiOperation 注解用法。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
public class LogController {

    private final OperationLogMapper operationLogMapper;

    /**
     * 分页查询操作日志
     * <p>
     * 支持以下筛选条件：
     * - module：按操作模块模糊搜索
     * - operatorName：按操作人姓名模糊搜索
     * - type：按操作类型精确匹配
     * - status：按状态筛选（1-成功，0-失败）
     * </p>
     *
     * @param pageNum      页码，默认 1
     * @param pageSize     每页数量，默认 10
     * @param module       操作模块（可选）
     * @param operatorName 操作人姓名（可选）
     * @param type         操作类型（可选）
     * @param status       状态（可选）
     * @return 分页结果
     */
    @GetMapping
    public Result<Page<OperationLogEntity>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {

        // 构建分页对象
        Page<OperationLogEntity> page = new Page<>(pageNum, pageSize);

        // 构建查询条件
        LambdaQueryWrapper<OperationLogEntity> wrapper = new LambdaQueryWrapper<>();

        // 按模块模糊搜索
        wrapper.like(StringUtils.hasText(module),
                OperationLogEntity::getModule, module);

        // 按操作人姓名模糊搜索
        wrapper.like(StringUtils.hasText(operatorName),
                OperationLogEntity::getOperatorName, operatorName);

        // 按操作类型精确匹配
        wrapper.eq(StringUtils.hasText(type),
                OperationLogEntity::getType, type);

        // 按状态筛选
        wrapper.eq(status != null,
                OperationLogEntity::getStatus, status);

        // 按创建时间降序排列（最新的在前面）
        wrapper.orderByDesc(OperationLogEntity::getCreateTime);

        // 执行分页查询
        Page<OperationLogEntity> result = operationLogMapper.selectPage(page, wrapper);
        return Result.ok(result);
    }

    /**
     * 查询日志详情
     *
     * @param id 日志ID
     * @return 日志详情
     */
    @GetMapping("/{id}")
    public Result<OperationLogEntity> getById(@PathVariable Long id) {
        OperationLogEntity entity = operationLogMapper.selectById(id);
        if (entity == null) {
            return Result.fail("日志不存在");
        }
        return Result.ok(entity);
    }

    /**
     * 按模块统计日志数量
     * <p>用于管理后台展示各模块的操作频次饼图/柱状图</p>
     *
     * @return 模块名称和对应的日志数量列表
     */
    @GetMapping("/stats/module")
    public Result<List<Map<String, Object>>> statsByModule() {
        return Result.ok(operationLogMapper.countByModule());
    }

    /**
     * 查询每日性能统计
     * <p>返回最近 N 天每天的请求量、平均耗时、最大耗时</p>
     *
     * @param days 天数，默认 7 天
     * @return 每天的统计数据
     */
    @GetMapping("/stats/daily")
    public Result<List<Map<String, Object>>> dailyStats(
            @RequestParam(defaultValue = "7") Integer days) {
        return Result.ok(operationLogMapper.dailyStatistics(days));
    }

    /**
     * 清空操作日志（谨慎使用）
     * <p>仅超级管理员可操作，建议在生产环境中禁用或添加二次确认</p>
     *
     * @return 删除的记录数
     */
    @DeleteMapping("/clean")
    public Result<Integer> clean() {
        // 生产环境中建议添加权限校验和二次确认
        int count = operationLogMapper.delete(null);
        return Result.ok(count);
    }
}
