package com.example.blog.config;

import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.oas.annotations.EnableOpenApi;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.Contact;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.service.SecurityScheme;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.plugins.Docket;

import java.util.Collections;
import java.util.List;

/**
 * Springfox Swagger 3.0.0 配置类
 * <p>
 * 负责配置 API 文档的基本信息、接口分组和安全认证方案。
 * 配置完成后，可通过以下地址访问：
 * <ul>
 *   <li>Swagger UI: http://localhost:8080/swagger-ui/index.html</li>
 *   <li>OpenAPI JSON: http://localhost:8080/v3/api-docs</li>
 * </ul>
 * </p>
 *
 * <p><b>Spring Boot 2.5.x + springfox 3.0.0 兼容性说明（重要）：</b></p>
 * <ol>
 *   <li>Spring Boot 2.5.x 与 springfox 3.0.0 存在已知的 NPE 兼容问题
 *       （documentationPluginsBootstrapper 启动失败 / ProviderUtils 相关空指针），
 *       原因是 springfox 依赖 AntPathMatcher 的路径匹配元数据，
 *       而 Spring 5.3 引入的 PathPatternParser 选项会破坏其初始化。</li>
 *   <li>解决方式一：在 application.yml 中显式配置
 *       {@code spring.mvc.pathmatch.matching-strategy: ant_path_matcher}</li>
 *   <li>解决方式二：在本配置类中注册一个 BeanPostProcessor（见
 *       {@link #springfoxHandlerMappingConfigurer()}），将
 *       RequestMappingHandlerMapping 的 PathMatcher 固定为 AntPathMatcher</li>
 *   <li>两者需要同时配置，这是社区验证过的稳定 workaround</li>
 * </ol>
 *
 * <p>其他注意事项：</p>
 * <ul>
 *   <li>生产环境建议通过 {@code @Profile({"dev","test"})} 或配置开关关闭 Swagger</li>
 *   <li>需要在 Spring Security（5.5.x）中放行 Swagger 相关路径
 *       （/swagger-ui/**、/v3/api-docs/**、/swagger-resources/**、/webjars/**）</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Configuration
@EnableOpenApi
public class SwaggerConfig {

    // ==================== API 基本信息 ====================

    /**
     * OpenAPI 3.0 文档 Docket 配置（默认分组）
     * <p>
     * 使用 {@link DocumentationType#OAS_30} 生成 OpenAPI 3.0 格式文档，
     * 同时兼容 Swagger 2 风格注解（@Api / @ApiOperation）。
     * </p>
     *
     * @return Docket 配置对象
     */
    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.OAS_30)
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.any())
                .build()
                // JWT 安全认证配置：使 Swagger UI 出现 Authorize 按钮
                .securitySchemes(securitySchemes())
                .securityContexts(securityContexts());
    }

    /**
     * API 基本信息
     * <p>
     * 包括：标题、描述、版本、联系人等。
     * </p>
     */
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("个人博客系统 API")
                .description("Spring Boot 2.5 实战教程 — 个人博客系统后端接口文档。\n\n"
                        + "## 使用说明\n"
                        + "1. 大部分接口需要登录后才能访问\n"
                        + "2. 先调用【认证接口】中的登录接口获取 Token\n"
                        + "3. 点击右上角 Authorize 按钮，输入 Token\n"
                        + "4. 之后所有请求会自动携带 Authorization Header")
                .version("v1.0.0")
                .contact(new Contact("Blog Team",
                        "https://github.com/example/blog",
                        "blog@example.com"))
                .build();
    }

    // ==================== 接口分组 ====================

    /**
     * 认证接口分组
     * <p>包括：登录、注册、刷新 Token、退出登录</p>
     */
    @Bean
    public Docket authApi() {
        return new Docket(DocumentationType.OAS_30)
                .groupName("1-认证接口")
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.ant("/api/auth/**"))
                .build();
    }

    /**
     * 文章接口分组
     * <p>包括：文章的增删改查、分类管理、标签管理</p>
     */
    @Bean
    public Docket articleApi() {
        return new Docket(DocumentationType.OAS_30)
                .groupName("2-文章接口")
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.ant("/api/articles/**"))
                .build();
    }

    /**
     * 文件接口分组
     * <p>包括：文件上传、文件删除</p>
     */
    @Bean
    public Docket fileApi() {
        return new Docket(DocumentationType.OAS_30)
                .groupName("3-文件接口")
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.ant("/api/files/**"))
                .build();
    }

    /**
     * 管理后台接口分组
     * <p>包括：操作日志、用户管理、系统配置等管理员专用接口</p>
     */
    @Bean
    public Docket adminApi() {
        return new Docket(DocumentationType.OAS_30)
                .groupName("4-管理后台")
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example.blog.controller"))
                .paths(PathSelectors.ant("/api/admin/**"))
                .build();
    }

    // ==================== 兼容性处理（重要） ====================

    /**
     * Spring Boot 2.5.x + springfox 3.0.0 的 NPE 兼容 workaround。
     * <p>
     * 部分环境下，springfox 的文档插件在扫描 RequestMapping 时依赖
     * AntPathMatcher 风格的路径元数据，若容器中的
     * RequestMappingHandlerMapping 使用了 PathPatternParser 或
     * PathMatcher 未初始化完成，会在 ProviderUtils 等工具类中抛出
     * NullPointerException，导致 documentationPluginsBootstrapper 启动失败。
     * </p>
     * <p>
     * 本 BeanPostProcessor 在所有 Bean 初始化完成后，将
     * RequestMappingHandlerMapping 的 PathMatcher 显式设置为
     * {@link AntPathMatcher}，保证 springfox 扫描路径时不再出现空指针。
     * </p>
     * <p>
     * 注意：方法必须是 static 的，否则会因宿主类的依赖注入过早触发而报错。
     * </p>
     *
     * @return BeanPostProcessor 实例
     */
    @Bean
    public static BeanPostProcessor springfoxHandlerMappingConfigurer() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof RequestMappingHandlerMapping) {
                    ((RequestMappingHandlerMapping) bean).setPathMatcher(new AntPathMatcher());
                }
                return bean;
            }
        };
    }

    // ==================== 安全认证（JWT） ====================

    /**
     * 安全方案：请求头中的 Authorization 字段
     * <p>
     * 配置后，Swagger UI 会显示 Authorize 按钮。
     * 点击后输入 JWT Token，所有请求会自动添加 Authorization Header。
     * </p>
     *
     * @return ApiKey 安全方案列表
     */
    private List<SecurityScheme> securitySchemes() {
        // 注意：Docket.securitySchemes() 的参数类型是 List<SecurityScheme>，
        // 由于泛型不变性，不能直接返回 List<ApiKey>，需按 SecurityScheme 声明
        return Collections.<SecurityScheme>singletonList(
                new ApiKey("Bearer Auth", "Authorization", "header"));
    }

    /**
     * 安全上下文：对除认证接口外的所有接口启用全局 Token
     * <p>
     * 这样 Swagger UI 调试时会自动带上 Authorization Header。
     * </p>
     *
     * @return SecurityContext 列表
     */
    private List<SecurityContext> securityContexts() {
        return Collections.singletonList(SecurityContext.builder()
                .securityReferences(defaultAuth())
                .build());
    }

    /**
     * 全局安全引用规则
     */
    private List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope =
                new AuthorizationScope("global", "全局访问权限");
        AuthorizationScope[] scopes = {authorizationScope};
        return Collections.singletonList(
                new SecurityReference("Bearer Auth", scopes));
    }
}
