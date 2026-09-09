package com.example.blog.service;

import com.example.blog.entity.Category;

import java.util.List;

/**
 * 分类 Service 接口
 * <p>
 * 定义分类模块的业务方法。分类管理相对简单，主要包含：
 * <ul>
 *   <li>查询所有启用的分类</li>
 *   <li>根据 ID 查询分类详情</li>
 *   <li>创建分类（管理员）</li>
 *   <li>更新分类（管理员）</li>
 *   <li>删除分类（管理员，需检查分类下是否有文章）</li>
 * </ul>
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
public interface CategoryService {

    /**
     * 查询所有启用的分类列表
     * <p>
     * 按 sort_order 升序排列（序号小的在前），
     * 只返回 status=1（启用）的分类。
     * </p>
     *
     * @return 分类列表
     */
    List<Category> listActiveCategories();

    /**
     * 查询所有分类（包含禁用的，管理员使用）
     *
     * @return 全部分类列表
     */
    List<Category> listAllCategories();

    /**
     * 根据 ID 查询分类
     *
     * @param id 分类 ID
     * @return 分类实体（不存在时返回 null）
     */
    Category getCategoryById(Long id);

    /**
     * 创建分类
     *
     * @param category 分类实体（需包含 name、description、sortOrder）
     * @return 新分类的 ID
     */
    Long createCategory(Category category);

    /**
     * 更新分类
     *
     * @param category 分类实体（需包含 id 及要更新的字段）
     */
    void updateCategory(Category category);

    /**
     * 删除分类
     * <p>
     * 删除前需检查该分类下是否存在文章，
     * 如果存在则抛出 {@link com.example.blog.common.BusinessException}。
     * </p>
     *
     * @param id 分类 ID
     */
    void deleteCategory(Long id);
}
