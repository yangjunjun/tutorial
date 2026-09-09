package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据访问接口（Mapper）
 *
 * 继承 BaseMapper&lt;User&gt; 后，自动获得 MyBatis-Plus 内置的 CRUD 方法（无需编写任何代码）：
 *
 * 查询：
 * - User selectById(Serializable id)                 根据 ID 查询单个用户
 * - User selectOne(Wrapper&lt;T&gt; queryWrapper)          条件查询单条记录
 * - List&lt;User&gt; selectList(Wrapper&lt;T&gt; queryWrapper)   条件查询列表
 * - Long selectCount(Wrapper&lt;T&gt; queryWrapper)        条件查询记录总数
 *
 * 插入 / 更新 / 删除：
 * - int insert(User entity)                          插入一条用户记录
 * - int updateById(User entity)                      根据 ID 更新用户（仅更新非 null 字段）
 * - int deleteById(Serializable id)                  根据 ID 删除用户
 *
 * @Mapper 注解说明：
 * 标注在接口上，告诉 MyBatis 为这个接口创建动态代理对象。
 * 也可以在启动类上使用 @MapperScan("com.example.blog.mapper") 统一扫描。
 *
 * @author tutorial
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    // ============================================================
    // 此处无需编写任何代码，BaseMapper 已提供完整的 CRUD 方法。
    // 如需自定义 SQL，可在下方添加方法声明，并在 XML 中编写实现。
    // ============================================================
}
