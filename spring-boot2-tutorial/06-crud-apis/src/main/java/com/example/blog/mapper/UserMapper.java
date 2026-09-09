package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户 Mapper 接口（第 06 章最小化版本）
 * <p>
 * 供文章模块关联查询作者信息使用（作者昵称、头像）。
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
