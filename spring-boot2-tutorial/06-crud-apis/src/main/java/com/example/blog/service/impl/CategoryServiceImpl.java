package com.example.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.common.BusinessException;
import com.example.blog.common.ResultCode;
import com.example.blog.entity.Article;
import com.example.blog.entity.Category;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.CategoryMapper;
import com.example.blog.service.CategoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 分类 Service 实现类
 * <p>
 * 实现分类的增删改查业务逻辑。
 * 删除分类时需要额外检查该分类下是否关联了文章。
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryServiceImpl.class);

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ArticleMapper articleMapper;

    // ==================== 查询启用的分类 ====================

    @Override
    public List<Category> listActiveCategories() {
        LambdaQueryWrapper<Category> queryWrapper = new LambdaQueryWrapper<Category>();
        queryWrapper.eq(Category::getStatus, 1)       // 只查询启用的分类
                .orderByAsc(Category::getSortOrder);   // 按排序序号升序
        return categoryMapper.selectList(queryWrapper);
    }

    // ==================== 查询所有分类（管理员） ====================

    @Override
    public List<Category> listAllCategories() {
        LambdaQueryWrapper<Category> queryWrapper = new LambdaQueryWrapper<Category>();
        queryWrapper.orderByAsc(Category::getSortOrder);
        return categoryMapper.selectList(queryWrapper);
    }

    // ==================== 根据 ID 查询 ====================

    @Override
    public Category getCategoryById(Long id) {
        return categoryMapper.selectById(id);
    }

    // ==================== 创建分类 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCategory(Category category) {
        // 1. 检查分类名称是否已存在
        LambdaQueryWrapper<Category> queryWrapper = new LambdaQueryWrapper<Category>();
        queryWrapper.eq(Category::getName, category.getName());
        Long count = categoryMapper.selectCount(queryWrapper);
        if (count > 0) {
            throw new BusinessException(400, "分类名称 '" + category.getName() + "' 已存在");
        }

        // 2. 设置默认值
        if (category.getSortOrder() == null) {
            category.setSortOrder(0);
        }
        if (category.getStatus() == null) {
            category.setStatus(1); // 默认启用
        }

        // 3. 插入数据库
        categoryMapper.insert(category);

        log.info("分类创建成功: id={}, name={}", category.getId(), category.getName());
        return category.getId();
    }

    // ==================== 更新分类 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCategory(Category category) {
        // 1. 检查分类是否存在
        Category existing = categoryMapper.selectById(category.getId());
        if (existing == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // 2. 如果修改了名称，检查新名称是否与其他分类重复
        if (category.getName() != null && !category.getName().equals(existing.getName())) {
            LambdaQueryWrapper<Category> queryWrapper = new LambdaQueryWrapper<Category>();
            queryWrapper.eq(Category::getName, category.getName())
                    .ne(Category::getId, category.getId()); // 排除自身
            Long count = categoryMapper.selectCount(queryWrapper);
            if (count > 0) {
                throw new BusinessException(400, "分类名称 '" + category.getName() + "' 已存在");
            }
        }

        // 3. 更新数据库
        categoryMapper.updateById(category);

        log.info("分类更新成功: id={}", category.getId());
    }

    // ==================== 删除分类 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategory(Long id) {
        // 1. 检查分类是否存在
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // 2. 检查该分类下是否有文章
        LambdaQueryWrapper<Article> queryWrapper = new LambdaQueryWrapper<Article>();
        queryWrapper.eq(Article::getCategoryId, id);
        Long articleCount = articleMapper.selectCount(queryWrapper);
        if (articleCount > 0) {
            throw new BusinessException(ResultCode.CATEGORY_HAS_ARTICLES,
                    "分类 '" + category.getName() + "' 下有 " + articleCount + " 篇文章，无法删除");
        }

        // 3. 逻辑删除
        categoryMapper.deleteById(id);

        log.info("分类删除成功: id={}, name={}", id, category.getName());
    }
}
