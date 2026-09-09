package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.OperationLogEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 操作日志 Mapper
 * <p>
 * 继承 MyBatis-Plus 的 BaseMapper，自动获得基础 CRUD 能力。
 * 额外的统计查询通过 @Select 注解实现。
 * </p>
 *
 * <p>本教程使用 MyBatis-Plus 3.5.1（在 pom.xml 中显式指定版本）。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLogEntity> {

    /**
     * 按模块统计操作日志数量
     * <p>用于管理后台展示各模块的操作频次</p>
     *
     * @return 模块名称和对应的日志数量
     */
    @Select("SELECT module AS name, COUNT(*) AS value FROM operation_log " +
            "GROUP BY module ORDER BY value DESC")
    List<Map<String, Object>> countByModule();

    /**
     * 统计最近 N 天每天的请求量和平均耗时
     * <p>用于性能趋势分析</p>
     *
     * @param days 天数
     * @return 每天的统计数据
     */
    @Select("SELECT DATE(create_time) AS date, " +
            "COUNT(*) AS total, " +
            "AVG(cost_time) AS avgCostTime, " +
            "MAX(cost_time) AS maxCostTime " +
            "FROM operation_log " +
            "WHERE create_time >= DATE_SUB(NOW(), INTERVAL #{days} DAY) " +
            "GROUP BY DATE(create_time) " +
            "ORDER BY date DESC")
    List<Map<String, Object>> dailyStatistics(int days);
}
