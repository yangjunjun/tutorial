package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.Article;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章 Mapper 接口
 * <p>
 * 继承 MyBatis-Plus 的 {@link BaseMapper}，自动获得常用的 CRUD 方法
 * （insert、deleteById、updateById、selectById、selectPage、selectBatchIds 等）。
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
