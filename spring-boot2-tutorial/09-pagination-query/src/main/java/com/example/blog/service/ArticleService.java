package com.example.blog.service;

import com.example.blog.dto.ArticleQueryDTO;
import com.example.blog.vo.ArticleListVO;
import com.example.blog.vo.PageVO;

/**
 * 文章服务接口
 * <p>
 * 定义文章相关的业务方法，包括分页查询、条件查询等。
 *
 * @author tutorial
 */
public interface ArticleService {

    /**
     * 分页查询文章列表
     * <p>
     * 支持多种查询条件：
     * - 按分类 ID 筛选
     * - 按标签 ID 筛选
     * - 按关键词搜索（标题/摘要模糊匹配）
     * - 按状态筛选
     * - 按创建时间/浏览量/点赞数排序
     * <p>
     * 返回的列表中：
     * - 包含分类名和作者名（多表联查）
     * - 包含标签列表（需要额外查询）
     * - 不包含文章全文（content），减少数据传输量
     *
     * @param queryDTO 查询参数 DTO
     * @return 分页结果
     */
    PageVO<ArticleListVO> getArticlePage(ArticleQueryDTO queryDTO);

    /**
     * 分页查询公开文章列表（前台接口）
     * <p>
     * 只返回已发布的文章（status = 1），
     * 供前台文章列表页使用，无需登录。
     *
     * @param queryDTO 查询参数 DTO
     * @return 分页结果
     */
    PageVO<ArticleListVO> getPublicArticlePage(ArticleQueryDTO queryDTO);
}
