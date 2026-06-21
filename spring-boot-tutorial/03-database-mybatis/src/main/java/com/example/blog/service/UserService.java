package com.example.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.blog.entity.User;

/**
 * 用户服务接口
 *
 * 继承 IService<User> 后，除了 BaseMapper 提供的基本 CRUD 方法外，
 * 还额外获得了以下增强方法：
 *
 * 批量操作：
 * - boolean saveBatch(Collection<User> entityList)       批量插入用户
 * - boolean saveBatch(Collection<User> list, int batchSize) 指定批次大小
 * - boolean saveOrUpdateBatch(Collection<User> list)     批量 saveOrUpdate
 *
 * 便捷方法：
 * - boolean save(User entity)             插入一条记录（等价于 Mapper.insert）
 * - boolean saveOrUpdate(User entity)     有 ID 则更新，无 ID 则插入
 * - boolean removeById(Serializable id)   根据 ID 删除（返回 boolean）
 * - boolean updateById(User entity)       根据 ID 更新（返回 boolean）
 * - User getById(Serializable id)         根据 ID 查询
 * - List<User> list()                     查询所有记录
 * - List<User> list(Wrapper<User> wrapper) 条件查询列表
 * - long count()                          查询总记录数
 *
 * 分页查询（需配合 MyBatis-Plus 分页插件使用）：
 * - Page<User> page(Page<User> page)                  分页查询
 * - Page<User> page(Page<User> page, Wrapper<User> wrapper) 条件分页查询
 *
 * 为什么要定义接口而不是直接用 IService？
 * 1. 可以在接口中声明自定义的业务方法（如根据用户名查询）
 * 2. 面向接口编程，便于后续扩展和单元测试中的 Mock
 * 3. 遵循 Java 最佳实践：Controller 依赖 Service 接口而非实现类
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
public interface UserService extends IService<User> {

    // ============================================================
    // 自定义业务方法声明区
    // 以下方法需要在 UserServiceImpl 中实现
    // ============================================================

    // 示例：根据用户名查询用户（登录时需要）
    // User getByUsername(String username);

    // 示例：用户注册
    // boolean register(UserRegisterDTO registerDTO);

    // 示例：用户登录
    // String login(UserLoginDTO loginDTO);
}
