package com.example.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvc 配置类
 * <p>
 * 主要功能：配置静态资源映射，使上传到磁盘的文件可以通过 HTTP URL 访问。
 * </p>
 *
 * <p>映射规则：</p>
 * <pre>
 * URL 路径                     → 磁盘路径
 * /uploads/avatar/xxx.jpg      → /data/blog/uploads/avatar/xxx.jpg
 * /uploads/cover/2025/01/a.jpg → /data/blog/uploads/cover/2025/01/a.jpg
 * </pre>
 *
 * <p>如果项目中使用了 Spring Security（2.5 对应 Spring Security 5.5，
 * 使用 WebSecurityConfigurerAdapter 配置方式），需要在 Security 配置中放行静态资源路径：</p>
 * <pre>{@code
 * @Override
 * protected void configure(HttpSecurity http) throws Exception {
 *     http.authorizeRequests()
 *         .antMatchers("/uploads/**").permitAll();
 * }
 * }</pre>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 文件存储根目录（与 FileServiceImpl 中的 basePath 保持一致）
     */
    @Value("${file.upload.base-path:/data/blog/uploads}")
    private String basePath;

    /**
     * URL 访问前缀
     */
    @Value("${file.upload.url-prefix:/uploads}")
    private String urlPrefix;

    /**
     * 配置静态资源映射
     * <p>
     * 将 URL 前缀映射到磁盘目录，使上传的文件可以通过 HTTP 访问。
     * </p>
     *
     * <p>参数说明：</p>
     * <ul>
     *   <li>addResourceHandler: 指定 URL 匹配模式（如 /uploads/**）</li>
     *   <li>addResourceLocations: 指定磁盘目录（必须以 / 结尾，使用 file: 前缀）</li>
     * </ul>
     *
     * @param registry 资源处理器注册器
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(urlPrefix + "/**")
                .addResourceLocations("file:" + basePath + "/");
    }
}
