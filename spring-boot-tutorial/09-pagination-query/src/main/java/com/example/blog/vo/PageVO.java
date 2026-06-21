package com.example.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 通用分页响应 VO
 * <p>
 * 封装分页查询的响应数据，适用于所有分页接口。
 * <p>
 * 与 MyBatis-Plus 的 Page 对象的关系：
 * - Page 对象包含分页参数 + 查询结果
 * - PageVO 只包含需要返回给前端的数据（去掉内部实现细节）
 * <p>
 * 响应 JSON 示例：
 * <pre>
 * {
 *   "code": 200,
 *   "data": {
 *     "records": [...],
 *     "total": 156,
 *     "size": 10,
 *     "current": 1,
 *     "pages": 16
 *   }
 * }
 * </pre>
 * <p>
 * 前端可以根据 total 和 size 计算总页数，也可以直接使用 pages 字段。
 *
 * @param <T> 记录的类型（如 ArticleListVO）
 * @author tutorial
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageVO<T> {

    /**
     * 当前页的记录列表
     * <p>
     * 泛型 T 允许不同类型的分页响应，如：
     * - PageVO&lt;ArticleListVO&gt;：文章列表分页
     * - PageVO&lt;CommentVO&gt;：评论列表分页
     * - PageVO&lt;UserVO&gt;：用户列表分页
     */
    private List<T> records;

    /**
     * 总记录数
     * <p>
     * 符合查询条件的记录总数（不包含分页限制）。
     * 由 MyBatis-Plus 的 COUNT 查询自动计算。
     */
    private Long total;

    /**
     * 每页记录数
     * <p>
     * 与请求参数中的 size 一致。
     */
    private Long size;

    /**
     * 当前页码
     * <p>
     * 与请求参数中的 current 一致。
     */
    private Long current;

    /**
     * 总页数
     * <p>
     * 由 MyBatis-Plus 自动计算：pages = ceil(total / size)
     * <p>
     * 示例：
     * - total = 156, size = 10 → pages = 16
     * - total = 20, size = 10 → pages = 2
     * - total = 0, size = 10 → pages = 0
     */
    private Long pages;

    /**
     * 从 MyBatis-Plus 的 Page 对象构建 PageVO
     * <p>
     * 这是一个静态工厂方法，方便在 Service 层快速转换：
     * <pre>
     * Page&lt;Article&gt; page = articleMapper.selectPage(...);
     * PageVO&lt;ArticleListVO&gt; pageVO = PageVO.of(page, articleListVOList);
     * </pre>
     *
     * @param page    MyBatis-Plus 的 Page 对象（包含分页参数）
     * @param records 转换后的记录列表
     * @param <T>     记录类型
     * @return PageVO 分页响应对象
     */
    public static <T> PageVO<T> of(com.baomidou.mybatisplus.extension.plugins.pagination.Page<?> page,
                                    List<T> records) {
        return PageVO.<T>builder()
                .records(records)
                .total(page.getTotal())
                .size(page.getSize())
                .current(page.getCurrent())
                .pages(page.getPages())
                .build();
    }
}
