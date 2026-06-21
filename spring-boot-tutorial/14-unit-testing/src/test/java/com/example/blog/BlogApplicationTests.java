package com.example.blog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 博客应用上下文加载测试
 *
 * <p>这是最基本的集成测试，验证 Spring Boot 应用上下文能否正常加载。
 * 如果 Bean 之间存在依赖冲突、配置错误等问题，这个测试会直接失败。
 *
 * <p>使用 @ActiveProfiles("test") 激活测试环境配置（application-test.yml），
 * 避免测试时连接真实的 MySQL 数据库。
 *
 * <p>运行方式：
 * <ul>
 *   <li>IDEA：右键点击类名 → Run 'BlogApplicationTests'</li>
 *   <li>Maven：{@code mvn test -Dtest=BlogApplicationTests}</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("博客应用 - 上下文加载测试")
class BlogApplicationTests {

    /**
     * Spring 应用上下文
     * 通过注入 ApplicationContext 可以验证 Bean 的注册情况
     */
    @Autowired
    private ApplicationContext applicationContext;

    /**
     * 最基础的测试：验证应用上下文能否正常加载。
     *
     * <p>如果以下情况发生，此测试将失败：
     * <ul>
     *   <li>Bean 定义冲突</li>
     *   <li>循环依赖</li>
     *   <li>配置缺失或错误</li>
     *   <li>数据库连接失败（如果未使用 H2）</li>
     * </ul>
     */
    @Test
    @DisplayName("Spring 应用上下文应正常加载")
    void contextLoads() {
        // 如果上下文加载失败，@SpringBootTest 会自动报错
        // 这里加一个显式断言，使测试意图更清晰
        assertNotNull(applicationContext, "应用上下文不应为 null");
    }

    /**
     * 验证关键 Bean 是否已正确注册到容器中。
     *
     * <p>确保核心组件（Controller、Service、Mapper 等）都能被 Spring 管理。
     */
    @Test
    @DisplayName("核心 Bean 应已注册到容器中")
    void coreBeansShouldBeRegistered() {
        // 验证 Controller 层 Bean
        assertTrue(
            applicationContext.containsBean("articleController"),
            "ArticleController 应已注册"
        );
        assertTrue(
            applicationContext.containsBean("authController"),
            "AuthController 应已注册"
        );

        // 验证 Service 层 Bean
        assertTrue(
            applicationContext.containsBean("articleServiceImpl"),
            "ArticleServiceImpl 应已注册"
        );
        assertTrue(
            applicationContext.containsBean("authServiceImpl"),
            "AuthServiceImpl 应已注册"
        );

        // 验证工具类 Bean
        assertTrue(
            applicationContext.containsBean("jwtUtil"),
            "JwtUtil 应已注册"
        );
    }

    /**
     * 验证测试环境使用的是 H2 数据库而非 MySQL。
     *
     * <p>这是一个安全检查，确保测试不会影响到生产数据库。
     */
    @Test
    @DisplayName("测试环境应使用 H2 数据库")
    void shouldUseH2DatabaseInTestProfile() {
        String activeProfile = applicationContext.getEnvironment()
            .getActiveProfiles()[0];
        assertEquals("test", activeProfile, "激活的 Profile 应为 test");

        // 验证数据源 URL 包含 h2
        String datasourceUrl = applicationContext.getEnvironment()
            .getProperty("spring.datasource.url");
        assertNotNull(datasourceUrl, "数据源 URL 不应为 null");
        assertTrue(
            datasourceUrl.contains("h2"),
            "测试环境应使用 H2 数据库，当前 URL: " + datasourceUrl
        );
    }

    /**
     * 验证应用配置的 Bean 总数在合理范围内。
     *
     * <p>如果 Bean 数量突然大幅变化，可能意味着配置出现了问题。
     */
    @Test
    @DisplayName("Bean 总数应在合理范围内")
    void beanCountShouldBeReasonable() {
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        int beanCount = beanNames.length;

        // Spring Boot 应用通常有 100-500 个 Bean
        assertTrue(beanCount > 50, "Bean 数量过少，可能有配置遗漏: " + beanCount);
        assertTrue(beanCount < 1000, "Bean 数量异常多，请检查: " + beanCount);

        System.out.println("应用上下文中共有 " + beanCount + " 个 Bean");
    }
}
