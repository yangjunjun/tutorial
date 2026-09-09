package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.blog.entity.Article;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章 Mapper（第 14 章测试工程最小骨架）
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
