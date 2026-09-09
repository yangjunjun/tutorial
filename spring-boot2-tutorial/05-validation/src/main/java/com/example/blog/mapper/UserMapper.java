package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户 Mapper 接口（第 05 章最小化版本）
 * <p>
 * 仅供 {@link com.example.blog.common.validation.UniqueUsernameValidator}
 * 查询用户表使用。继承 MyBatis-Plus 的 {@link BaseMapper} 后，
 * 可以直接调用 {@code selectCount()}、{@code selectById()} 等通用方法。
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
