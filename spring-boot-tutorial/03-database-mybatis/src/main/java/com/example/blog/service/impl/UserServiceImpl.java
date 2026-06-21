package com.example.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import com.example.blog.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现类
 *
 * ServiceImpl<UserMapper, User> 的含义：
 * - 第一个泛型 UserMapper：该实体对应的 Mapper 接口类型
 * - 第二个泛型 User：实体类类型
 *
 * ServiceImpl 内部机制：
 * 1. 自动注入了 UserMapper 对象，变量名为 baseMapper
 *    可以直接使用 baseMapper.insert()、baseMapper.selectById() 等方法
 * 2. 实现了 IService<User> 接口的所有方法
 *    如 save()、getById()、list()、count() 等
 * 3. 提供了批量操作的实现（内部使用循环 + 事务）
 *
 * @Service 注解：
 * 将该类注册为 Spring 容器中的 Bean，
 * Controller 层可以通过 @Autowired 注入 UserService 接口来使用。
 *
 * @Slf4j 注解（Lombok）：
 * 自动生成 log 变量，可直接使用 log.info()、log.error() 等方法记录日志。
 * 等价于：private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);
 *
 * @author Spring Boot Tutorial
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    // ============================================================
    // 此处无需编写任何代码即可获得 IService 提供的所有 CRUD 方法。
    // 如需自定义业务逻辑，可在下方添加方法实现。
    // ============================================================

    // 示例：根据用户名查询用户
    // @Override
    // public User getByUsername(String username) {
    //     return baseMapper.selectOne(
    //         new LambdaQueryWrapper<User>()
    //             .eq(User::getUsername, username)
    //     );
    // }

    // 示例：用户注册
    // @Override
    // @Transactional  // 开启事务
    // public boolean register(UserRegisterDTO registerDTO) {
    //     // 1. 检查用户名是否已存在
    //     User existing = getByUsername(registerDTO.getUsername());
    //     if (existing != null) {
    //         throw new RuntimeException("用户名已存在");
    //     }
    //     // 2. 创建用户实体
    //     User user = User.builder()
    //         .username(registerDTO.getUsername())
    //         .password(BCrypt.hashpw(registerDTO.getPassword()))  // 密码加密
    //         .nickname(registerDTO.getNickname())
    //         .email(registerDTO.getEmail())
    //         .role("USER")
    //         .status(0)
    //         .build();
    //     // 3. 保存到数据库
    //     return save(user);
    // }

    // 示例：用户登录
    // @Override
    // public String login(UserLoginDTO loginDTO) {
    //     // 1. 根据用户名查询用户
    //     User user = getByUsername(loginDTO.getUsername());
    //     if (user == null) {
    //         throw new RuntimeException("用户名不存在");
    //     }
    //     // 2. 验证密码
    //     if (!BCrypt.checkpw(loginDTO.getPassword(), user.getPassword())) {
    //         throw new RuntimeException("密码错误");
    //     }
    //     // 3. 生成 JWT Token 并返回
    //     return jwtUtil.generateToken(user.getId());
    // }
}
