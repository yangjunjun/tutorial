# 第 13 章：Redis 缓存

> **个人博客系统** — Spring Boot 3 实战教程
>
> 本章源码路径：`13-redis-cache/`

---

## 目录

- [13.1 Redis 简介与应用场景](#131-redis-简介与应用场景)
- [13.2 Spring Boot 集成 Redis](#132-spring-boot-集成-redis)
- [13.3 RedisTemplate 序列化配置](#133-redistemplate-序列化配置)
- [13.4 Spring Cache 抽象](#134-spring-cache-抽象)
- [13.5 实战：文章详情缓存](#135-实战文章详情缓存)
- [13.6 实战：文章更新时清除缓存](#136-实战文章更新时清除缓存)
- [13.7 实战：热门文章排行榜（ZSet）](#137-实战热门文章排行榜zset)
- [13.8 缓存穿透、击穿、雪崩](#138-缓存穿透击穿雪崩)
- [13.9 缓存与数据库一致性策略](#139-缓存与数据库一致性策略)
- [13.10 测试缓存功能](#1310-测试缓存功能)
- [13.11 本章小结](#1311-本章小结)

---

## 13.1 Redis 简介与应用场景

**Redis（Remote Dictionary Server）** 是一个开源的、基于内存的高性能键值存储数据库。它支持多种数据结构，读写性能极高，常用于缓存、消息队列、实时排行等场景。

### 性能对比

| 存储介质   | 读取延迟      | 写入延迟      | 典型用途             |
| ---------- | ------------- | ------------- | -------------------- |
| Redis      | ~0.1 ms       | ~0.1 ms       | 缓存、会话、排行榜   |
| MySQL      | ~1-10 ms      | ~1-10 ms      | 持久化数据存储       |
| 磁盘文件   | ~10-100 ms    | ~10-100 ms    | 文件存储             |

### 在博客系统中的应用场景

| 场景             | Redis 数据结构 | 说明                                     |
| ---------------- | -------------- | ---------------------------------------- |
| 文章详情缓存     | String         | 缓存热点文章详情，减少数据库查询         |
| 用户会话（Token）| String / Hash  | 存储 JWT Token 的黑名单或白名单          |
| 热门文章排行榜   | ZSet（有序集合）| 按阅读量/点赞数排序的实时排行榜          |
| 文章阅读量计数   | String         | 原子递增操作，定时同步到数据库           |
| 标签云           | Hash           | 标签名称和对应的文章数                   |
| 验证码           | String + TTL   | 登录/注册验证码，设置过期时间            |

---

## 13.2 Spring Boot 集成 Redis

### Maven 依赖

```xml
<!-- Spring Data Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- 连接池（推荐 Lettuce，Spring Boot 3 默认使用） -->
<!-- Lettuce 已内置，无需额外依赖 -->

<!-- 如果需要 Apache Commons Pool2 连接池 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
```

### Redis 客户端对比

| 客户端       | 说明                                    | 推荐程度 |
| ------------ | --------------------------------------- | -------- |
| Lettuce      | Spring Boot 2.x+ 默认客户端，线程安全  | 推荐     |
| Jedis        | 经典客户端，非线程安全                  | 不推荐   |
| Redisson     | 功能丰富，支持分布式锁等高级特性        | 特殊场景 |

### application-dev.yml 配置

> 完整代码见 `src/main/resources/application-dev.yml`

```yaml
spring:
  data:
    redis:
      host: localhost          # Redis 服务器地址
      port: 6379               # Redis 端口（默认 6379）
      password:                # Redis 密码（无密码则留空）
      database: 0              # 使用的数据库编号（0-15）
      timeout: 10000ms         # 连接超时时间
      lettuce:
        pool:
          max-active: 16       # 最大活跃连接数
          max-idle: 8          # 最大空闲连接数
          min-idle: 2          # 最小空闲连接数
          max-wait: 3000ms     # 获取连接的最大等待时间
```

---

## 13.3 RedisTemplate 序列化配置

> 完整代码见 `src/main/java/com/example/blog/config/RedisConfig.java`

### 为什么需要自定义序列化？

Spring Boot 默认的 `RedisTemplate<Object, Object>` 使用 `JdkSerializationRedisSerializer`，序列化后的数据是 Java 二进制格式，有以下缺点：

1. **可读性差**：在 Redis 客户端中看到的是乱码
2. **跨语言不兼容**：其他语言无法解析 Java 序列化数据
3. **数据体积大**：序列化后的数据比 JSON 大很多

### 推荐配置：使用 JSON 序列化

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // Key 使用 String 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Value 使用 JSON 序列化
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
```

### 序列化前后对比

```
# JDK 序列化（默认）
redis> get article:1
"\xac\xed\x00\x05sr\x00'com.example.blog.vo.ArticleVO..."

# JSON 序列化（推荐）
redis> get article:1
"{\"@class\":\"com.example.blog.vo.ArticleVO\",\"id\":1,\"title\":\"Spring Boot 入门\"}"
```

---

## 13.4 Spring Cache 抽象

Spring Cache 提供了一套基于注解的缓存抽象层，开发者只需添加注解即可实现缓存逻辑，无需手动操作 Redis。

### 启用缓存

在启动类或配置类上添加 `@EnableCaching`：

```java
@SpringBootApplication
@EnableCaching  // 启用 Spring Cache
public class BlogApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }
}
```

### 核心注解

| 注解           | 说明                                   | 常用场景           |
| -------------- | -------------------------------------- | ------------------ |
| `@Cacheable`   | 方法执行前检查缓存，命中则直接返回     | 查询方法           |
| `@CacheEvict`  | 清除指定缓存                           | 更新/删除方法      |
| `@CachePut`    | 执行方法并将结果写入缓存               | 更新方法           |
| `@Caching`     | 组合多个缓存注解                       | 复杂场景           |
| `@CacheConfig` | 类级别的缓存公共配置                   | 统一配置           |

### @Cacheable 详解

```java
@Cacheable(
    value = "article",           // 缓存名称（对应 Redis 中的 key 前缀）
    key = "#id",                 // 缓存 key（SpEL 表达式）
    unless = "#result == null",  // 条件：结果为 null 时不缓存
    condition = "#id > 0"       // 条件：参数满足条件时才缓存
)
public ArticleVO getById(Long id) {
    // 首次调用：执行方法，结果存入缓存
    // 后续调用：直接从缓存返回，不执行方法
}
```

### SpEL 表达式常用写法

| 表达式                    | 说明                       |
| ------------------------- | -------------------------- |
| `#id`                     | 方法参数 id 的值           |
| `#p0` 或 `#a0`           | 第一个参数的值             |
| `#result`                 | 方法返回值（用于 unless）  |
| `#dto.id`                | 参数对象的属性             |
| `'article:' + #id`       | 字符串拼接                 |
| `#root.methodName`       | 当前方法名                 |

---

## 13.5 实战：文章详情缓存

> 完整代码见 `src/main/java/com/example/blog/service/impl/ArticleServiceImpl.java`

### 缓存策略

```
请求获取文章详情
    │
    ▼
┌──────────────────┐
│ 检查 Redis 缓存  │
└──────┬───────────┘
       │
  ┌────┴────┐
  │ 命中?   │
  └────┬────┘
   Yes │ No
   │   │
   ▼   ▼
返回缓存   查询数据库
   │          │
   │          ▼
   │      存入缓存
   │          │
   │          ▼
   └──── 返回结果
```

### 代码实现

```java
@Service
@RequiredArgsConstructor
@CacheConfig(cacheNames = "article")  // 类级别配置：统一缓存名称
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;

    /**
     * 获取文章详情（带缓存）
     * <p>
     * 缓存 key: article::{id}
     * 过期时间: 30 分钟
     * 条件: 结果不为 null 时才缓存
     * </p>
     */
    @Cacheable(key = "#id", unless = "#result == null")
    @Override
    public ArticleVO getDetail(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException("文章不存在");
        }
        return convertToVO(article);
    }
}
```

---

## 13.6 实战：文章更新时清除缓存

当文章被修改或删除时，对应的缓存需要清除，否则前端会看到旧数据。

### 更新文章 — 清除缓存

```java
/**
 * 更新文章
 * 使用 @CacheEvict 清除该文章的缓存
 */
@CacheEvict(key = "#id")
@Override
public void update(Long id, ArticleUpdateDTO dto) {
    Article article = articleMapper.selectById(id);
    if (article == null) {
        throw new BusinessException("文章不存在");
    }
    // 更新字段...
    articleMapper.updateById(article);
}
```

### 删除文章 — 清除缓存

```java
/**
 * 删除文章
 * 同时清除缓存
 */
@CacheEvict(key = "#id")
@Override
public void delete(Long id) {
    articleMapper.deleteById(id);
}
```

### @CachePut — 更新并刷新缓存

如果你希望更新方法同时将新结果写入缓存（而不是等下次查询时再缓存），可以使用 `@CachePut`：

```java
@CachePut(key = "#id")
@Override
public ArticleVO updateAndGet(Long id, ArticleUpdateDTO dto) {
    // 更新文章...
    return getDetail(id); // 返回最新数据，自动写入缓存
}
```

### @CacheEvict 常用参数

| 参数          | 说明                           |
| ------------- | ------------------------------ |
| `key`         | 要清除的缓存 key               |
| `allEntries`  | true 表示清除该缓存下所有条目  |
| `beforeInvocation` | true 表示方法执行前清除    |

```java
// 清除所有文章缓存（管理员操作后使用）
@CacheEvict(allEntries = true)
public void batchUpdateStatus(List<Long> ids, Integer status) {
    // ...
}
```

---

## 13.7 实战：热门文章排行榜（ZSet）

> 完整代码见 `src/main/java/com/example/blog/service/ArticleRankingService.java` 和 `impl/ArticleRankingServiceImpl.java`

### Redis ZSet（有序集合）

ZSet 是 Redis 中非常适合做排行榜的数据结构：

- 每个元素关联一个 **score**（分数），按 score 排序
- 元素唯一（不会重复）
- 支持范围查询（Top N）
- 操作时间复杂度 O(log N)

### 排行榜设计

```
Redis Key: article:ranking:views
Member:    文章ID（如 "1", "2", "3"）
Score:     阅读量

# 文章被访问时，增加 score
ZINCRBY article:ranking:views 1 "100"    # 文章ID=100，阅读量+1

# 获取 Top 10
ZREVRANGE article:ranking:views 0 9      # 降序取前 10
```

### Service 接口

```java
public interface ArticleRankingService {
    /** 文章阅读量 +1 */
    void incrementViewCount(Long articleId);

    /** 获取热门文章排行榜（Top N） */
    List<ArticleRankingVO> getTopArticles(int count);

    /** 获取文章阅读量 */
    Long getViewCount(Long articleId);

    /** 重置排行榜 */
    void resetRanking();
}
```

### 实现

```java
@Service
@RequiredArgsConstructor
public class ArticleRankingServiceImpl implements ArticleRankingService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ArticleMapper articleMapper;

    private static final String RANKING_KEY = "article:ranking:views";

    @Override
    public void incrementViewCount(Long articleId) {
        stringRedisTemplate.opsForZSet()
                .incrementScore(RANKING_KEY,
                                String.valueOf(articleId), 1);
    }

    @Override
    public List<ArticleRankingVO> getTopArticles(int count) {
        // 从 ZSet 中获取分数最高的 N 个（降序）
        Set<ZSetOperations.TypedTuple<String>> tuples =
                stringRedisTemplate.opsForZSet()
                        .reverseRangeWithScores(RANKING_KEY, 0, count - 1);

        if (tuples == null || tuples.isEmpty()) {
            return Collections.emptyList();
        }

        // 组装返回数据
        return tuples.stream().map(tuple -> {
            Long articleId = Long.valueOf(tuple.getValue());
            Article article = articleMapper.selectById(articleId);
            ArticleRankingVO vo = new ArticleRankingVO();
            vo.setArticleId(articleId);
            vo.setTitle(article.getTitle());
            vo.setViewCount(tuple.getScore().longValue());
            return vo;
        }).collect(Collectors.toList());
    }
}
```

---

## 13.8 缓存穿透、击穿、雪崩

这三个问题是使用缓存时必须了解的"经典问题"。

### 缓存穿透

**定义**：查询一个**不存在的数据**，缓存中没有，每次都打到数据库。

```
请求: GET /api/articles/99999 （文章不存在）
  → 缓存未命中
  → 查询数据库：null
  → 不写入缓存
  → 下次同样的请求，还是穿透到数据库
```

**解决方案**：

```java
/**
 * 方案一：缓存空值
 * 即使查询结果为 null，也缓存一个空对象，设置较短的过期时间
 */
@Cacheable(key = "#id", unless = "#result != null && #result.isDeleted()")
public ArticleVO getDetail(Long id) {
    Article article = articleMapper.selectById(id);
    if (article == null) {
        // 返回一个标记对象，缓存后会阻止穿透
        return ArticleVO.empty();
    }
    return convertToVO(article);
}

/**
 * 方案二：布隆过滤器（适合大量无效请求的场景）
 * 在缓存前加一层布隆过滤器，快速判断数据是否存在
 */
```

### 缓存击穿

**定义**：一个**热点 key** 在过期瞬间，大量并发请求同时穿透到数据库。

```
时间线：
t0: 缓存存在，正常返回
t1: 缓存过期（TTL 到达）
t2: 1000 个并发请求同时到达
    → 全部未命中缓存
    → 全部查询数据库（数据库压力骤增）
```

**解决方案**：

```java
/**
 * 方案一：互斥锁（推荐）
 * 使用 Redis 分布式锁，保证同一时间只有一个线程查询数据库
 */
public ArticleVO getDetailWithLock(Long id) {
    // 1. 先查缓存
    ArticleVO cached = getFromCache(id);
    if (cached != null) return cached;

    // 2. 获取分布式锁
    String lockKey = "lock:article:" + id;
    boolean locked = Boolean.TRUE.equals(
            stringRedisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "1", Duration.ofSeconds(10)));

    if (locked) {
        try {
            // 3. 双重检查
            cached = getFromCache(id);
            if (cached != null) return cached;

            // 4. 查询数据库并写入缓存
            ArticleVO result = queryFromDb(id);
            setCache(id, result, Duration.ofMinutes(30));
            return result;
        } finally {
            stringRedisTemplate.delete(lockKey); // 释放锁
        }
    } else {
        // 5. 未获取到锁，短暂等待后重试
        Thread.sleep(50);
        return getDetailWithLock(id);
    }
}

/**
 * 方案二：逻辑过期
 * 不设置 Redis TTL，而是在 value 中记录过期时间。
 * 查询时判断是否过期，过期则异步更新。
 */
```

### 缓存雪崩

**定义**：**大量 key 同时过期**，或 Redis 宕机，导致所有请求打到数据库。

**解决方案**：

| 方案                 | 说明                                          |
| -------------------- | --------------------------------------------- |
| 随机过期时间         | 在基础 TTL 上加随机值，避免同时过期           |
| 多级缓存             | 本地缓存（Caffeine）+ Redis，双重保障         |
| 服务降级             | Redis 不可用时，返回默认数据或限流            |
| Redis 集群           | 主从 + 哨兵 / Cluster，保证高可用             |

```java
/**
 * 随机过期时间实现
 * 基础 TTL = 30 分钟，随机范围 = 0-10 分钟
 * 这样即使同时写入的缓存，过期时间也不同
 */
private Duration randomTTL() {
    long baseMinutes = 30;
    long randomMinutes = ThreadLocalRandom.current().nextLong(0, 10);
    return Duration.ofMinutes(baseMinutes + randomMinutes);
}
```

### 三者对比

```
缓存穿透：查不存在的数据 → 缓存+数据库都无效
缓存击穿：热点 key 过期  → 大量并发同时查数据库
缓存雪崩：大量 key 过期  → 整体请求压垮数据库
```

---

## 13.9 缓存与数据库一致性策略

缓存和数据库之间的数据一致性是分布式系统的经典问题。在博客系统中，我们采用以下策略：

### Cache Aside Pattern（旁路缓存模式）

这是最常用的一致性策略：

```
读操作：
  1. 先读缓存 → 命中则返回
  2. 缓存未命中 → 读数据库 → 写入缓存 → 返回

写操作：
  1. 先更新数据库
  2. 再删除缓存（而非更新缓存）
```

> **为什么是删除缓存而不是更新缓存？**
>
> 因为并发写场景下，更新缓存可能导致数据不一致：
> - 线程 A 更新数据库为 v1
> - 线程 B 更新数据库为 v2
> - 线程 B 更新缓存为 v2
> - 线程 A 更新缓存为 v1（覆盖了 B 的更新）
>
> 删除缓存则不会有这个问题，下次读取时会从数据库加载最新值。

### 在我们的实现中

```java
// 读：@Cacheable 自动实现"先查缓存，未命中则查库并写入缓存"
@Cacheable(key = "#id")
public ArticleVO getDetail(Long id) { ... }

// 写：@CacheEvict 实现"先更新数据库，再删除缓存"
@CacheEvict(key = "#id")
public void update(Long id, ArticleUpdateDTO dto) {
    // 更新数据库（@CacheEvict 会在方法执行后自动删除缓存）
}
```

### 最终一致性

对于博客系统这类**读多写少**的场景，最终一致性已经足够。如果对一致性要求更高，可以考虑：

- **延迟双删**：更新数据库后，先删缓存，延迟一段时间后再删一次
- **消息队列**：通过 MQ 异步更新缓存
- **Canal 监听**：监听 MySQL binlog，自动同步缓存

---

## 13.10 测试缓存功能

### 13.10.1 测试文章缓存

```bash
# 第一次请求（缓存未命中，查数据库）
curl http://localhost:8080/api/articles/1

# 查看控制台日志：
# SELECT * FROM article WHERE id = 1
# [缓存] MISS - article::1, 写入缓存

# 第二次请求（缓存命中，不查数据库）
curl http://localhost:8080/api/articles/1

# 查看控制台日志：
# [缓存] HIT - article::1, 直接返回

# 验证 Redis 中的缓存数据
redis> get article::1
"{\"@class\":\"com.example.blog.vo.ArticleVO\",\"id\":1,\"title\":\"...\"}"
```

### 13.10.2 测试缓存清除

```bash
# 更新文章
curl -X PUT http://localhost:8080/api/articles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"title": "更新后的标题"}'

# 查看控制台日志：
# UPDATE article SET ... WHERE id = 1
# [缓存] EVICT - article::1, 清除缓存

# 验证缓存已被删除
redis> get article::1
(nil)

# 再次请求文章详情（缓存未命中，重新查库）
curl http://localhost:8080/api/articles/1

# 日志显示重新查询数据库并写入缓存
```

### 13.10.3 测试热门排行

```bash
# 模拟文章被访问（调用多次）
for i in {1..10}; do
  curl http://localhost:8080/api/articles/1
done

for i in {1..5}; do
  curl http://localhost:8080/api/articles/2
done

# 获取热门排行 Top 10
curl http://localhost:8080/api/articles/ranking?count=10

# 预期响应：
# {
#   "code": 200,
#   "data": [
#     {"articleId": 1, "title": "...", "viewCount": 10},
#     {"articleId": 2, "title": "...", "viewCount": 5}
#   ]
# }

# 查看 Redis 中的排行数据
redis> ZREVRANGE article:ranking:views 0 -1 WITHSCORES
# 1) "1"      2) "10"
# 3) "2"      4) "5"
```

---

## 13.11 本章小结

本章我们学习了：

| 知识点               | 要点                                                     |
| -------------------- | -------------------------------------------------------- |
| Redis 基础           | Redis 简介、数据结构、应用场景                           |
| Spring Boot 集成     | spring-boot-starter-data-redis + Lettuce 连接池          |
| 序列化配置           | GenericJackson2JsonRedisSerializer 替代 JDK 序列化        |
| Spring Cache         | @EnableCaching + @Cacheable/@CacheEvict/@CachePut         |
| 文章详情缓存         | @Cacheable 实现查询缓存，@CacheEvict 实现写时清除        |
| 热门文章排行榜       | RedisTemplate + ZSet 实现实时排行                         |
| 缓存三大问题         | 穿透、击穿、雪崩的定义和解决方案                         |
| 一致性策略           | Cache Aside Pattern，先更新数据库再删除缓存             |

### 下一章预告

下一章我们将实现**全局异常处理**，统一项目的错误响应格式，提升 API 的规范性和用户体验。

---

## 附录：本章文件清单

| 文件路径 | 说明 |
| -------- | ---- |
| `config/RedisConfig.java` | Redis 配置类（序列化 + CacheManager） |
| `service/impl/ArticleServiceImpl.java` | 文章 Service（加入缓存注解） |
| `service/ArticleRankingService.java` | 热门排行 Service 接口 |
| `service/impl/ArticleRankingServiceImpl.java` | 热门排行 Service 实现 |
| `controller/ArticleController.java` | 文章 Controller（新增排行接口） |
| `application-dev.yml` | Redis 连接配置 |
