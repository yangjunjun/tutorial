package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.entity.Category;
import com.example.blog.service.CategoryService;
import javax.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类 Controller
 * <p>
 * 提供文章分类的 RESTful API。
 * 分类管理相对简单，分为前台接口（查询启用分类）和管理接口（增删改）。
 * </p>
 *
 * <h3>API 端点一览：</h3>
 * <table>
 *   <tr><th>方法</th><th>路径</th><th>说明</th></tr>
 *   <tr><td>GET</td><td>/api/categories</td><td>查询启用的分类列表（前台）</td></tr>
 *   <tr><td>GET</td><td>/api/categories/{id}</td><td>查询分类详情</td></tr>
 *   <tr><td>POST</td><td>/api/categories/admin</td><td>创建分类（管理员）</td></tr>
 *   <tr><td>PUT</td><td>/api/categories/admin/{id}</td><td>更新分类（管理员）</td></tr>
 *   <tr><td>DELETE</td><td>/api/categories/admin/{id}</td><td>删除分类（管理员）</td></tr>
 * </table>
 *
 * <h3>注意：</h3>
 * <p>
 * 本示例中管理类接口暂时不加权限控制（后续章节引入 Spring Security / JWT 后补充）。
 * 实际项目中，管理员接口应进行角色权限校验。
 * </p>
 *
 * @author spring-boot2-tutorial
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/categories")
@Validated // 类级别 @Validated，支持对方法简单参数的校验
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // ============================================================
    // 查询启用的分类列表（前台接口）
    // ============================================================

    /**
     * 查询所有启用的分类列表
     * <p>
     * 前台页面使用，只返回 status=1 的分类，按 sort_order 升序排列。
     * </p>
     *
     * @return 分类列表
     */
    @GetMapping
    public Result<List<Category>> listCategories() {
        List<Category> categories = categoryService.listActiveCategories();
        return Result.success(categories);
    }

    // ============================================================
    // 查询分类详情
    // ============================================================

    /**
     * 根据 ID 查询分类详情
     *
     * @param id 分类 ID（路径参数，使用 @Min 校验必须大于 0）
     * @return 分类详情
     */
    @GetMapping("/{id}")
    public Result<Category> getCategoryById(
            @PathVariable @Min(value = 1, message = "分类 ID 必须大于 0") Long id) {
        Category category = categoryService.getCategoryById(id);
        if (category == null) {
            return Result.fail(404, "分类不存在");
        }
        return Result.success(category);
    }

    // ============================================================
    // 创建分类（管理员接口）
    // ============================================================

    /**
     * 创建分类
     * <p>
     * 使用请求体接收 JSON 格式的分类数据。
     * 此处通过创建一个临时的 Category 对象来接收参数，
     * 实际项目中建议定义 CategoryCreateDTO。
     * </p>
     *
     * @param category 分类实体
     * @return 包含新分类 ID 的统一响应
     */
    @PostMapping("/admin")
    public Result<Long> createCategory(@RequestBody Category category) {
        // 基本的参数检查（实际项目中应通过 DTO + @Validated 实现）
        // 注意：JDK 8 中 String 没有 isBlank()，使用 trim().isEmpty() 等价实现
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            return Result.fail(400, "分类名称不能为空");
        }
        if (category.getName().length() > 50) {
            return Result.fail(400, "分类名称不能超过 50 个字符");
        }

        Long id = categoryService.createCategory(category);
        return Result.success("分类创建成功", id);
    }

    // ============================================================
    // 更新分类（管理员接口）
    // ============================================================

    /**
     * 更新分类
     *
     * @param id       分类 ID（路径参数）
     * @param category 分类实体（请求体）
     * @return 统一响应
     */
    @PutMapping("/admin/{id}")
    public Result<Void> updateCategory(@PathVariable Long id,
                                       @RequestBody Category category) {
        category.setId(id);
        categoryService.updateCategory(category);
        return Result.success();
    }

    // ============================================================
    // 删除分类（管理员接口）
    // ============================================================

    /**
     * 删除分类（逻辑删除）
     * <p>
     * 如果该分类下存在文章，将无法删除（Service 层会抛出 BusinessException）。
     * </p>
     *
     * @param id 分类 ID
     * @return 统一响应
     */
    @DeleteMapping("/admin/{id}")
    public Result<Void> deleteCategory(
            @PathVariable @Min(value = 1, message = "分类 ID 必须大于 0") Long id) {
        categoryService.deleteCategory(id);
        return Result.success();
    }
}
