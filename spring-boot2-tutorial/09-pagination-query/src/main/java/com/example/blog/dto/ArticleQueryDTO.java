package com.example.blog.dto;

import lombok.Data;

/**
 * 文章查询参数 DTO
 * <p>
 * 用于接收前端传递的文章列表查询参数，支持多条件筛选和分页。
 * <p>
 * 前端请求示例：
 * <pre>
 * GET /api/articles?keyword=Spring&categoryId=1&status=1&current=1&size=10&sortBy=createTime&sortOrder=desc
 * </pre>
 * <p>
 * 所有查询参数都是可选的，不传则使用默认值或不过滤。
 *
 * @author tutorial
 */
@Data
public class ArticleQueryDTO {

    // ==================== 分页参数 ====================

    /**
     * 当前页码
     * <p>
     * 从 1 开始计数（MyBatis-Plus 的 Page 对象也是从 1 开始）。
     * 默认值为 1（第一页）。
     * <p>
     * 前端传递示例：?current=2 表示查询第二页
     */
    private Integer current = 1;

    /**
     * 每页记录数
     * <p>
     * 默认值为 10，最大值建议不超过 100。
     * MybatisPlusConfig 中设置了 maxLimit = 500 作为安全上限。
     * <p>
     * 前端传递示例：?size=20 表示每页显示 20 条
     */
    private Integer size = 10;

    // ==================== 筛选条件 ====================

    /**
     * 搜索关键词
     * <p>
     * 在文章标题和摘要中进行模糊搜索。
     * 使用 LIKE 语法匹配，前后加 % 通配符。
     * <p>
     * 前端传递示例：?keyword=Spring Boot
     */
    private String keyword;

    /**
     * 分类 ID
     * <p>
     * 按文章分类筛选。传入则只返回该分类下的文章。
     * <p>
     * 前端传递示例：?categoryId=1
     */
    private Long categoryId;

    /**
     * 标签 ID
     * <p>
     * 按标签筛选。由于文章和标签是多对多关系，
     * 需要通过中间表（article_tag）关联查询。
     * <p>
     * 前端传递示例：?tagId=3
     */
    private Long tagId;

    /**
     * 文章状态
     * <p>
     * 按状态筛选：
     * - 0：草稿
     * - 1：已发布
     * - 2：已下架
     * <p>
     * 公开查询接口默认只返回已发布的文章（status=1）。
     * 管理后台可以查看所有状态的文章。
     * <p>
     * 前端传递示例：?status=1
     */
    private Integer status;

    // ==================== 排序参数 ====================

    /**
     * 排序字段
     * <p>
     * 支持的排序字段：
     * - createTime：按创建时间排序（默认）
     * - viewCount：按浏览量排序
     * - likeCount：按点赞数排序
     * - updateTime：按更新时间排序
     * <p>
     * 前端传递示例：?sortBy=viewCount
     */
    private String sortBy = "createTime";

    /**
     * 排序方向
     * <p>
     * - desc：降序（默认，最新的在前面）
     * - asc：升序（最旧的在前面）
     * <p>
     * 前端传递示例：?sortOrder=desc
     */
    private String sortOrder = "desc";
}
