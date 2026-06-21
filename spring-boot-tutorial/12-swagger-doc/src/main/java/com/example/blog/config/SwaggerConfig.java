package com.example.blog.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SpringDoc OpenAPI（Swagger）配置类
 * <p>
 * 负责配置 API 文档的基本信息、接口分组和安全认证方案。
 * 配置完成后，可通过以下地址访问：
 * <ul>
 *   <li>Swagger UI: http://localhost:8080/swagger-ui.html</li>
 *   <li>OpenAPI JSON: http://localhost:8080/v3/api-docs</li>
 * </ul>
 * </p>
 *
 * <p>注意事项：</p>
 * <ol>
 *   <li>SpringDoc 2.x 用于 Spring Boot 3.x，1.x 用于 Spring Boot 2.x</li>
 *   <li>生产环境建议关闭 Swagger（在 application-prod.yml 中设置 enabled: false）</li>
 *   <li>需要在 Spring Security 中放行 Swagger 相关路径</li>
 * </ol>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Configuration
public class SwaggerConfig {

    // ==================== API 基本信息 ====================

    /**
     * 配置 OpenAPI 基本信息
     * <p>
     * 包括：标题、描述、版本、联系人、许可证等。
     * 同时配置 JWT 安全认证方案，使 Swagger UI 支持 Token 认证。
     * </p>
     *
     * @return OpenAPI 配置对象
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                // ---- API 基本信息 ----
                .info(new Info()
                        .title("个人博客系统 API")
                        .description("Spring Boot 3 实战教程 — 个人博客系统后端接口文档。\n\n"
                                + "## 使用说明\n"
                                + "1. 大部分接口需要登录后才能访问\n"
                                + "2. 先调用【认证接口】中的登录接口获取 Token\n"
                                + "3. 点击右上角 Authorize 按钮，输入 Token\n"
                                + "4. 之后所有请求会自动携带 Authorization Header")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Blog Team")
                                .email("blog@example.com")
                                .url("https://github.com/example/blog"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                // ---- 服务器列表（可选，用于标注不同环境的地址） ----
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("本地开发环境"),
                        new Server().url("https://api.blog.example.com").description("生产环境")
                ))
                // ---- 安全认证配置 ----
                .addSecurityItem(new SecurityRequirement().addList("Bearer Auth"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Auth", createBearerScheme()));
    }

    // ==================== 接口分组 ====================

    /**
     * 认证接口分组
     * <p>包括：登录、注册、刷新 Token、退出登录</p>
     */
    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("1-认证接口")
                .pathsToMatch("/api/auth/**")
                .build();
    }

    /**
     * 文章接口分组
     * <p>包括：文章的增删改查、分类管理、标签管理</p>
     */
    @Bean
    public GroupedOpenApi articleApi() {
        return GroupedOpenApi.builder()
                .group("2-文章接口")
                .pathsToMatch("/api/articles/**", "/api/categories/**", "/api/tags/**")
                .build();
    }

    /**
     * 用户接口分组
     * <p>包括：用户信息查看、修改个人资料、头像上传</p>
     */
    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("3-用户接口")
                .pathsToMatch("/api/user/**", "/api/users/**")
                .build();
    }

    /**
     * 文件接口分组
     * <p>包括：文件上传、文件删除</p>
     */
    @Bean
    public GroupedOpenApi fileApi() {
        return GroupedOpenApi.builder()
                .group("4-文件接口")
                .pathsToMatch("/api/files/**")
                .build();
    }

    /**
     * 管理后台接口分组
     * <p>包括：操作日志、用户管理、系统配置等管理员专用接口</p>
     */
    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("5-管理后台")
                .pathsToMatch("/api/admin/**")
                .build();
    }

    // ==================== 私有方法 ====================

    /**
     * 创建 Bearer Token 认证方案
     * <p>
     * 配置后，Swagger UI 会显示 Authorize 按钮。
     * 点击后输入 JWT Token，所有请求会自动添加 Authorization: Bearer xxx Header。
     * </p>
     *
     * @return SecurityScheme 配置
     */
    private SecurityScheme createBearerScheme() {
        return new SecurityScheme()
                .name("Bearer Auth")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("请输入 JWT Token（不需要加 'Bearer ' 前缀）");
    }
}
