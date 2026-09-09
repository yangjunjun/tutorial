package com.example.blog.controller;

import com.example.blog.entity.User;
import com.example.blog.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户管理 Controller —— 用于测试 MyBatis-Plus CRUD 功能
 *
 * 这是一个简单的 RESTful 控制器，演示了如何通过 Service 层调用
 * MyBatis-Plus 提供的 CRUD 方法，并通过 HTTP 接口暴露给客户端。
 *
 * 接口列表：
 * - POST   /api/users       新增用户
 * - GET    /api/users/{id}  根据 ID 查询用户
 * - GET    /api/users       查询所有用户
 * - PUT    /api/users/{id}  更新用户
 * - DELETE /api/users/{id}  删除用户
 *
 * @RestController：标识为 REST 控制器（等价于 @Controller + @ResponseBody）
 * @RequestMapping("/api/users")：设置所有接口的基础路径前缀
 * @RequiredArgsConstructor：Lombok 注解，为所有 final 字段生成有参构造器
 *   配合 final 字段实现构造器注入，比 @Autowired 字段注入更推荐
 *
 * @author Spring Boot 2.5 Tutorial
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    /**
     * 注入 UserService
     *
     * 使用 final + @RequiredArgsConstructor 实现构造器注入
     * 这是 Spring 官方推荐的依赖注入方式，优于 @Autowired 字段注入
     *
     * 好处：
     * 1. 依赖不可变（final），更安全
     * 2. 可以在单元测试中通过构造器传入 Mock 对象
     * 3. 启动时就能发现依赖缺失问题（字段注入在运行时才报错）
     */
    private final UserService userService;

    /**
     * 新增用户
     *
     * POST /api/users
     * Content-Type: application/json
     *
     * 请求体示例：
     * {
     *   "username": "wangwu",
     *   "password": "abc123",
     *   "nickname": "王五",
     *   "email": "wangwu@example.com",
     *   "role": "USER",
     *   "status": 0
     * }
     *
     * @RequestBody：将请求体中的 JSON 自动反序列化为 User 对象
     *
     * 测试命令：
     * curl -X POST http://localhost:8080/api/users \
     *   -H "Content-Type: application/json" \
     *   -d '{"username":"wangwu","password":"abc123","nickname":"王五","email":"wangwu@example.com","role":"USER","status":0}'
     *
     * @param user 从请求体反序列化的用户对象
     * @return 插入数据库后的用户对象（包含自动生成的 ID）
     */
    @PostMapping
    public User create(@RequestBody User user) {
        log.info("新增用户：{}", user.getUsername());
        // 调用 IService.save() 方法插入数据
        // 内部调用 Mapper.insert()，执行 INSERT INTO user ...
        // 插入成功后，user.id 会被自动回填（数据库自增 ID）
        userService.save(user);
        log.info("用户创建成功，ID：{}", user.getId());
        return user;
    }

    /**
     * 根据 ID 查询用户
     *
     * GET /api/users/{id}
     *
     * @PathVariable 从 URL 路径中提取变量值
     *   例如 GET /api/users/1，则 id = 1
     *
     * 测试命令：
     * curl http://localhost:8080/api/users/1
     *
     * @param id 用户 ID
     * @return 用户对象，如果不存在则返回 null
     */
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        log.info("查询用户，ID：{}", id);
        // 调用 IService.getById() 方法
        // 内部调用 Mapper.selectById()，执行 SELECT * FROM user WHERE id = ?
        User user = userService.getById(id);
        if (user == null) {
            log.warn("用户不存在，ID：{}", id);
        }
        return user;
    }

    /**
     * 查询所有用户
     *
     * GET /api/users
     *
     * 测试命令：
     * curl http://localhost:8080/api/users
     *
     * @return 所有用户的列表（JSON 数组）
     */
    @GetMapping
    public List<User> list() {
        log.info("查询所有用户");
        // 调用 IService.list() 方法
        // 内部调用 Mapper.selectList(null)，执行 SELECT * FROM user
        // 参数 null 表示不加任何条件，查询所有记录
        return userService.list();
    }

    /**
     * 更新用户
     *
     * PUT /api/users/{id}
     * Content-Type: application/json
     *
     * 请求体示例（只传需要更新的字段）：
     * {
     *   "nickname": "王五（已修改）",
     *   "email": "wangwu_new@example.com"
     * }
     *
     * 测试命令：
     * curl -X PUT http://localhost:8080/api/users/3 \
     *   -H "Content-Type: application/json" \
     *   -d '{"nickname":"王五（已修改）","email":"wangwu_new@example.com"}'
     *
     * @param id 从 URL 路径获取的用户 ID
     * @param user 从请求体获取的更新数据（只包含需要更新的字段）
     * @return 更新后的用户对象
     */
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) {
        log.info("更新用户，ID：{}", id);
        // 设置 ID，MyBatis-Plus 会根据 ID 生成 UPDATE 语句
        // 注意：updateById() 默认只更新非 null 字段
        // 如果请求体中没有传某个字段，该字段为 null，不会被更新
        user.setId(id);
        // 调用 IService.updateById() 方法
        // 内部调用 Mapper.updateById()，执行 UPDATE user SET ... WHERE id = ?
        userService.updateById(user);
        // 返回更新后的完整用户数据
        return userService.getById(id);
    }

    /**
     * 删除用户
     *
     * DELETE /api/users/{id}
     *
     * 测试命令：
     * curl -X DELETE http://localhost:8080/api/users/3
     *
     * @param id 要删除的用户 ID
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        log.info("删除用户，ID：{}", id);
        // 调用 IService.removeById() 方法
        // 内部调用 Mapper.deleteById()，执行 DELETE FROM user WHERE id = ?
        userService.removeById(id);
        log.info("用户删除成功，ID：{}", id);
    }
}
