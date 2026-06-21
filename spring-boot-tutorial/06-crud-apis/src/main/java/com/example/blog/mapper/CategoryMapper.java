package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分类 Mapper 接口
 * <p>
 * 继承 MyBatis-Plus 的 {@link BaseMapper}，自动获得常用的 CRUD 方法：
 * <ul>
 *   <li>{@code insert(Category entity)} — 插入</li>
 *   <li>{@code deleteById(Serializable id)} — 根据 ID 删除（逻辑删除）</li>
 *   <li>{@code updateById(Category entity)} — 根据 ID 更新</li>
 *   <li>{@code selectById(Serializable id)} — 根据 ID 查询</li>
 *   <li>{@code selectList(Wrapper queryWrapper)} — 条件查询列表</li>
 *   <li>{@code selectCount(Wrapper queryWrapper)} — 条件查询数量</li>
 * </ul>
 * </p>
 *
 * <h3>使用 {@code @Mapper} 注解：</h3>
 * <p>
 * 让 MyBatis 自动为此接口生成代理实现类。
 * 也可以在启动类上添加 {@code @MapperScan("com.example.blog.mapper")} 来统一扫描。
 * </p>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {

    // 简单的 CRUD 已由 BaseMapper 提供，无需额外定义方法。
    // 如需复杂查询（如多表联查），可以在此定义方法并在 XML 中编写 SQL。
}
