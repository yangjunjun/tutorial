package com.example.blog.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Redis 配置类
 * <p>
 * 主要完成两件事：
 * <ol>
 *   <li>配置 RedisTemplate 的序列化方式（使用 JSON 替代 JDK 默认序列化）</li>
 *   <li>配置 Spring Cache 的 CacheManager（基于 Redis 的缓存管理器）</li>
 * </ol>
 * </p>
 *
 * <p>使用说明：</p>
 * <ul>
 *   <li>RedisTemplate — 用于直接操作 Redis（如 ZSet 排行榜、计数器等）</li>
 *   <li>CacheManager — 用于 @Cacheable/@CacheEvict 等缓存注解</li>
 * </ul>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Configuration
@EnableCaching  // 启用 Spring Cache 缓存抽象
public class RedisConfig {

    // ==================== RedisTemplate 配置 ====================

    /**
     * 自定义 RedisTemplate
     * <p>
     * 默认的 RedisTemplate&lt;Object, Object&gt; 使用 JDK 序列化，
     * 序列化后的数据在 Redis 中是乱码，且跨语言不兼容。
     * 这里改为 JSON 序列化，数据可读且跨语言兼容。
     * </p>
     *
     * <p>序列化策略：</p>
     * <ul>
     *   <li>Key: StringRedisSerializer — 字符串序列化，保证 key 可读</li>
     *   <li>Value: GenericJackson2JsonRedisSerializer — JSON 序列化</li>
     *   <li>Hash Key: StringRedisSerializer</li>
     *   <li>Hash Value: GenericJackson2JsonRedisSerializer</li>
     * </ul>
     *
     * @param connectionFactory Redis 连接工厂（Spring Boot 自动配置）
     * @return 配置好的 RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 创建 JSON 序列化器
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();

        // Key 序列化器：使用 String
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // Value 序列化器：使用 JSON
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        // 初始化配置（必须在设置完所有序列化器后调用）
        template.afterPropertiesSet();
        return template;
    }

    // ==================== CacheManager 配置 ====================

    /**
     * 配置基于 Redis 的 CacheManager
     * <p>
     * 用于 Spring Cache 注解（@Cacheable, @CacheEvict, @CachePut）。
     * 配置项：
     * <ul>
     *   <li>默认 TTL（过期时间）：30 分钟</li>
     *   <li>不缓存 null 值（防止缓存穿透的一种方式）</li>
     *   <li>Key 使用 String 序列化</li>
     *   <li>Value 使用 JSON 序列化</li>
     * </ul>
     * </p>
     *
     * @param connectionFactory Redis 连接工厂
     * @return CacheManager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 创建 JSON 序列化器
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();

        // 默认缓存配置
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                // 默认过期时间：30 分钟
                .entryTtl(Duration.ofMinutes(30))
                // Key 序列化
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                // Value 序列化
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                jsonSerializer))
                // 不缓存 null 值（可选，根据业务需求调整）
                .disableCachingNullValues();

        // 构建 CacheManager
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                // 可以为不同的缓存名称配置不同的 TTL
                .withCacheConfiguration("article",
                        defaultConfig.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("user",
                        defaultConfig.entryTtl(Duration.ofHours(1)))
                .withCacheConfiguration("config",
                        defaultConfig.entryTtl(Duration.ofHours(24)))
                // 事务感知：在事务提交后才写入缓存
                .transactionAware()
                .build();
    }

    // ==================== 私有方法 ====================

    /**
     * 创建 JSON 序列化器
     * <p>
     * 使用 GenericJackson2JsonRedisSerializer，它会在 JSON 中保存类型信息
     * （@class 字段），这样反序列化时能正确还原为原始类型。
     * </p>
     *
     * <pre>
     * 序列化示例：
     * {
     *   "@class": "com.example.blog.vo.ArticleVO",
     *   "id": 1,
     *   "title": "Spring Boot 入门"
     * }
     * </pre>
     *
     * @return 配置好的 JSON 序列化器
     */
    private GenericJackson2JsonRedisSerializer createJsonSerializer() {
        // 创建自定义 ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();

        // 注册 Java 8 时间模块（支持 LocalDateTime 等类型的序列化）
        objectMapper.registerModule(new JavaTimeModule());
        // 禁用将日期序列化为时间戳
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 启用默认类型信息，让 JSON 中包含 @class 字段
        // 这样反序列化时能正确还原为原始 Java 类型
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        // 设置所有字段可见（包括 private 字段）
        objectMapper.setVisibility(
                objectMapper.getSerializationConfig()
                        .getDefaultVisibilityChecker()
                        .withFieldVisibility(com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.ANY)
                        .withGetterVisibility(com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.NONE)
                        .withSetterVisibility(com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.NONE)
                        .withCreatorVisibility(com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.NONE)
        );

        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
}
