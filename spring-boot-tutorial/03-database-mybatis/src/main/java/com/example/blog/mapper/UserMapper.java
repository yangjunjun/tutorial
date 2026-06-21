package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据访问接口（Mapper）
 *
 * 继承 BaseMapper<User> 后，自动获得以下内置 CRUD 方法（无需编写任何代码）：
 *
 * 插入：
 * - int insert(User entity)                          插入一条用户记录
 *
 * 删除：
 * - int deleteById(Serializable id)                  根据 ID 删除用户
 * - int deleteByMap(Map<String, Object> columnMap)   根据列名条件删除
 * - int delete(Wrapper<T> queryWrapper)              根据条件构造器删除
 * - int deleteBatchIds(Collection<?> idList)         根据 ID 列表批量删除
 *
 * 更新：
 * - int updateById(User entity)                      根据 ID 更新用户（仅更新非 null 字段）
 * - int update(User entity, Wrapper<T> updateWrapper) 根据条件更新
 *
 * 查询：
 * - User selectById(Serializable id)                 根据 ID 查询单个用户
 * - List<User> selectBatchIds(Collection<?> idList)  根据 ID 列表批量查询
 * - List<User> selectByMap(Map<String, Object> map)  根据列名条件查询
 * - List<User> selectList(Wrapper<T> queryWrapper)   条件查询列表
 * - User selectOne(Wrapper<T> queryWrapper)          条件查询单条记录
 * - Long selectCount(Wrapper<T> queryWrapper)        条件查询记录总数
 *
 * 如果需要自定义 SQL（如复杂的多表关联查询），可以在本接口中声明方法，
 * 然后在 resources/mapper/UserMapper.xml 文件中编写对应的 SQL。
 *
 * @Mapper 注解说明：
 * 标注在接口上，告诉 MyBatis 为这个接口创建动态代理对象。
 * 也可以在启动类上使用 @MapperScan("com.example.blog.mapper") 统一扫描。
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    // ============================================================
    // 此处无需编写任何代码，BaseMapper 已提供完整的 CRUD 方法。
    // 如需自定义 SQL，可在下方添加方法声明，并在 XML 中编写实现。
    // ============================================================

    // 示例：自定义查询方法（需在 UserMapper.xml 中编写 SQL）
    // @Select("SELECT * FROM user WHERE username = #{username}")
    // User selectByUsername(@Param("username") String username);
}
