package com.example.blog.service;

import com.example.blog.dto.ArticleCreateDTO;
import com.example.blog.dto.ArticleUpdateDTO;
import com.example.blog.vo.ArticleDetailVO;
import com.example.blog.vo.ArticleVO;

import java.util.List;

/**
 * 文章 Service 接口
 * <p>
 * 定义文章模块的核心业务方法。Service 层负责：
 * <ul>
 *   <li>业务逻辑处理（权限检查、数据校验、状态流转等）</li>
 *   <li>DTO → Entity 转换（接收前端数据，转换为数据库实体）</li>
 *   <li>Entity → VO 转换（查询数据库结果，转换为前端展示对象）</li>
 *   <li>调用 Mapper 层执行数据库操作</li>
 * </ul>
 * </p>
 *
 * <h3>设计原则：</h3>
 * <ul>
 *   <li>Controller 层只做参数接收和校验，不包含业务逻辑</li>
 *   <li>Service 层是业务核心，所有规则判断在此完成</li>
 *   <li>Mapper 层只负责数据库操作，不包含业务判断</li>
 * </ul>
 *
 * @author spring-boot-tutorial
 * @since 1.0.0
 */
public interface ArticleService {

    /**
     * 创建文章
     * <p>
     * 流程：
     * <ol>
     *   <li>校验分类是否存在</li>
     *   <li>DTO → Entity 转换</li>
     *   <li>自动截取摘要（如果前端未提供）</li>
     *   <li>设置默认统计值（浏览量为 0 等）</li>
     *   <li>插入数据库</li>
     *   <li>返回新文章的 ID</li>
     * </ol>
     * </p>
     *
     * @param dto    创建文章 DTO
     * @param authorId 当前登录用户的 ID
     * @return 新创建的文章 ID
     */
    Long createArticle(ArticleCreateDTO dto, Long authorId);

    /**
     * 更新文章
     * <p>
     * 流程：
     * <ol>
     *   <li>根据 ID 查询文章是否存在</li>
     *   <li>检查当前用户是否有权限修改（是否为作者）</li>
     *   <li>如果修改了分类 ID，校验新分类是否存在</li>
     *   <li>DTO → Entity 转换，更新字段</li>
     *   <li>更新数据库</li>
     * </ol>
     * </p>
     *
     * @param dto      更新文章 DTO
     * @param operatorId 当前操作用户的 ID
     */
    void updateArticle(ArticleUpdateDTO dto, Long operatorId);

    /**
     * 根据 ID 查询文章详情
     * <p>
     * 流程：
     * <ol>
     *   <li>查询文章基本信息</li>
     *   <li>关联查询分类名称</li>
     *   <li>关联查询作者信息</li>
     *   <li>浏览量 +1</li>
     *   <li>Entity → DetailVO 转换</li>
     * </ol>
     * </p>
     *
     * @param id 文章 ID
     * @return 文章详情 VO
     */
    ArticleDetailVO getArticleDetail(Long id);

    /**
     * 分页查询文章列表
     * <p>
     * 只返回已发布的文章，按创建时间倒序排列。
     * </p>
     *
     * @param pageNum  页码（从 1 开始）
     * @param pageSize 每页条数
     * @param categoryId 分类 ID（可选，为 null 时查询所有分类）
     * @return 文章列表 VO
     */
    List<ArticleVO> listArticles(int pageNum, int pageSize, Long categoryId);

    /**
     * 删除文章（逻辑删除）
     * <p>
     * 只有文章作者或管理员可以删除。
     * 逻辑删除不会真正从数据库中移除记录，而是将 is_deleted 标记为 1。
     * </p>
     *
     * @param id         文章 ID
     * @param operatorId 当前操作用户的 ID
     */
    void deleteArticle(Long id, Long operatorId);
}
