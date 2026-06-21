package com.example.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.blog.entity.Article;
import com.example.blog.vo.ArticleListVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 文章 Mapper 接口
 * <p>
 * 继承 {@link BaseMapper} 获得 MyBatis-Plus 的基础 CRUD 能力，
 * 同时定义自定义的查询方法（多表联查）。
 * <p>
 * MyBatis-Plus BaseMapper 提供的方法：
 * <pre>
 * insert(T entity)              -- 插入
 * deleteById(Serializable id)   -- 按 ID 删除
 * updateById(T entity)          -- 按 ID 更新
 * selectById(Serializable id)   -- 按 ID 查询
 * selectList(Wrapper)           -- 条件查询列表
 * selectPage(Page, Wrapper)     -- 分页查询
 * selectCount(Wrapper)          -- 统计数量
 * </pre>
 * <p>
 * 对于需要多表联查的复杂场景（如文章列表需要展示分类名、作者名），
 * 我们通过自定义 SQL 实现，定义在对应的 XML 映射文件中。
 *
 * @author tutorial
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {

    /**
     * 分页查询文章列表（多表联查）
     * <p>
     * 联查 category 表获取分类名，联查 user 表获取作者名。
     * 支持按分类 ID、状态、关键词筛选，支持排序。
     * <p>
     * 方法参数说明：
     * - {@code Page<ArticleListVO> page}：MyBatis-Plus 分页对象，分页插件会自动拦截
     * - {@code @Param("categoryId") Long categoryId}：分类 ID 筛选条件
     * - {@code @Param("status") Integer status}：文章状态筛选条件
     * - {@code @Param("keyword") String keyword}：关键词筛选条件
     * - {@code @Param("sortBy") String sortBy}：排序字段
     * - {@code @Param("sortOrder") String sortOrder}：排序方向
     * <p>
     * 返回值说明：
     * - 返回 {@code IPage<ArticleListVO>}，包含分页信息和当前页数据
     * - MyBatis-Plus 分页插件会自动执行 COUNT 查询并改写 SQL
     * <p>
     * 对应的 SQL 定义在 resources/mapper/ArticleMapper.xml 中。
     *
     * @param page      分页参数对象
     * @param categoryId 分类 ID（可选）
     * @param status    文章状态（可选）
     * @param keyword   搜索关键词（可选）
     * @param sortBy    排序字段（可选）
     * @param sortOrder 排序方向（可选）
     * @return 分页结果
     */
    IPage<ArticleListVO> selectArticlePage(Page<ArticleListVO> page,
                                           @Param("categoryId") Long categoryId,
                                           @Param("status") Integer status,
                                           @Param("keyword") String keyword,
                                           @Param("sortBy") String sortBy,
                                           @Param("sortOrder") String sortOrder);

    /**
     * 根据标签 ID 分页查询文章列表
     * <p>
     * 需要通过 article_tag 中间表关联查询。
     * 适用于"按标签筛选文章"的场景。
     *
     * @param page    分页参数对象
     * @param tagId   标签 ID
     * @param status  文章状态（可选）
     * @return 分页结果
     */
    IPage<ArticleListVO> selectArticlePageByTagId(Page<ArticleListVO> page,
                                                  @Param("tagId") Long tagId,
                                                  @Param("status") Integer status);
}
