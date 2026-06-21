-- ============================================
-- 个人博客系统 - 数据库初始化脚本
-- ============================================
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4（支持 Emoji 表情）
-- 排序规则：utf8mb4_unicode_ci
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS blog_dev
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- 切换到 blog_dev 数据库
USE blog_dev;

-- ============================================
-- 1. 用户表（user）
-- ============================================
-- 存储博客系统的所有用户信息，包括管理员和普通用户
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '用户ID（主键，自增）',
    `username`    VARCHAR(50)  NOT NULL                 COMMENT '用户名（唯一，用于登录，4-50个字符）',
    `password`    VARCHAR(100) NOT NULL                 COMMENT '密码（BCrypt 加密后的哈希值，60字符）',
    `nickname`    VARCHAR(50)  NOT NULL DEFAULT ''      COMMENT '昵称（显示在页面上的名称）',
    `email`       VARCHAR(100) NOT NULL DEFAULT ''      COMMENT '邮箱地址',
    `avatar`      VARCHAR(255) NOT NULL DEFAULT ''      COMMENT '头像 URL',
    `role`        VARCHAR(20)  NOT NULL DEFAULT 'USER'  COMMENT '角色：ADMIN-管理员 / USER-普通用户',
    `status`      TINYINT      NOT NULL DEFAULT 0       COMMENT '账号状态：0-正常 / 1-禁用',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 文章分类表（category）
-- ============================================
-- 存储文章的分类信息，支持排序
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '分类ID（主键，自增）',
    `name`        VARCHAR(50)  NOT NULL                 COMMENT '分类名称',
    `description` VARCHAR(200) NOT NULL DEFAULT ''      COMMENT '分类描述',
    `sort`        INT          NOT NULL DEFAULT 0       COMMENT '排序值（数字越小越靠前）',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- ============================================
-- 3. 文章表（article）
-- ============================================
-- 存储博客文章的核心信息
DROP TABLE IF EXISTS `article`;
CREATE TABLE `article` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '文章ID（主键，自增）',
    `title`       VARCHAR(200) NOT NULL                 COMMENT '文章标题',
    `content`     LONGTEXT     NOT NULL                 COMMENT '文章正文（Markdown 格式）',
    `summary`     VARCHAR(500) NOT NULL DEFAULT ''      COMMENT '文章摘要（用于列表展示）',
    `category_id` BIGINT       NOT NULL DEFAULT 0       COMMENT '分类ID（关联 category 表）',
    `author_id`   BIGINT       NOT NULL                 COMMENT '作者ID（关联 user 表）',
    `cover_image` VARCHAR(255) NOT NULL DEFAULT ''      COMMENT '封面图片 URL',
    `status`      TINYINT      NOT NULL DEFAULT 0       COMMENT '文章状态：0-草稿 / 1-已发布 / 2-已下架',
    `view_count`  BIGINT       NOT NULL DEFAULT 0       COMMENT '浏览量',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_author_id` (`author_id`),
    KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- ============================================
-- 4. 标签表（tag）
-- ============================================
-- 存储文章标签
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '标签ID（主键，自增）',
    `name`        VARCHAR(50)  NOT NULL                 COMMENT '标签名称',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ============================================
-- 5. 文章-标签关联表（article_tag）
-- ============================================
-- 文章与标签是多对多关系，通过此关联表维护
DROP TABLE IF EXISTS `article_tag`;
CREATE TABLE `article_tag` (
    `id`          BIGINT  NOT NULL AUTO_INCREMENT  COMMENT '关联ID（主键，自增）',
    `article_id`  BIGINT  NOT NULL                 COMMENT '文章ID（关联 article 表）',
    `tag_id`      BIGINT  NOT NULL                 COMMENT '标签ID（关联 tag 表）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_article_tag` (`article_id`, `tag_id`),
    KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章-标签关联表';

-- ============================================
-- 6. 评论表（comment）
-- ============================================
-- 存储文章评论，支持嵌套评论（parent_id）
DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '评论ID（主键，自增）',
    `article_id`  BIGINT       NOT NULL                 COMMENT '文章ID（关联 article 表）',
    `user_id`     BIGINT       NOT NULL                 COMMENT '评论者ID（关联 user 表）',
    `content`     TEXT         NOT NULL                 COMMENT '评论内容',
    `parent_id`   BIGINT       NOT NULL DEFAULT 0       COMMENT '父评论ID（0 表示顶级评论，非 0 表示回复）',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_article_id` (`article_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';


-- ============================================
-- 插入示例数据
-- ============================================

-- 用户数据（密码为明文 "123456" 经 BCrypt 加密后的哈希值）
INSERT INTO `user` (`username`, `password`, `nickname`, `email`, `avatar`, `role`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 'admin@example.com', 'https://example.com/avatars/admin.jpg', 'ADMIN', 0),
('zhangsan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张三', 'zhangsan@example.com', 'https://example.com/avatars/zhangsan.jpg', 'USER', 0);

-- 分类数据
INSERT INTO `category` (`name`, `description`, `sort`) VALUES
('Java 后端', 'Java 后端开发相关文章，包括 Spring Boot、MyBatis 等', 1),
('前端开发', '前端技术文章，包括 Vue.js、React、CSS 等', 2),
('技术随笔', '技术思考、读书笔记、经验分享', 3);

-- 文章数据
INSERT INTO `article` (`title`, `content`, `summary`, `category_id`, `author_id`, `cover_image`, `status`, `view_count`) VALUES
(
    'Spring Boot 3 入门指南',
    '# Spring Boot 3 入门指南\n\n## 什么是 Spring Boot？\n\nSpring Boot 是一个基于 Spring 框架的快速开发脚手架...\n\n## 快速开始\n\n### 1. 创建项目\n\n使用 Spring Initializr 创建项目...\n\n### 2. 编写代码\n\n```java\n@SpringBootApplication\npublic class Application {\n    public static void main(String[] args) {\n        SpringApplication.run(Application.class, args);\n    }\n}\n```\n\n## 总结\n\nSpring Boot 大大简化了 Spring 应用的开发...',
    '本文详细介绍 Spring Boot 3 的基础知识，从项目创建到第一个 REST 接口。',
    1, 1, 'https://example.com/images/springboot.jpg', 1, 1024
),
(
    'MyBatis-Plus 实战教程',
    '# MyBatis-Plus 实战教程\n\n## 简介\n\nMyBatis-Plus 是 MyBatis 的增强工具...\n\n## 基本 CRUD\n\n```java\n// 插入\nuserMapper.insert(user);\n\n// 查询\nUser user = userMapper.selectById(1);\n```\n\n## 条件构造器\n\n使用 LambdaQueryWrapper 构建类型安全的查询条件...',
    'MyBatis-Plus 从入门到实战，掌握高效数据访问层开发。',
    1, 1, 'https://example.com/images/mybatis.jpg', 1, 856
),
(
    'Vue 3 Composition API 详解',
    '# Vue 3 Composition API 详解\n\n## 为什么需要 Composition API？\n\n在 Vue 2 的 Options API 中，当组件逻辑变得复杂时...\n\n## setup() 函数\n\n```javascript\nimport { ref, onMounted } from \"vue\"\n\nexport default {\n    setup() {\n        const count = ref(0)\n        return { count }\n    }\n}\n```\n\n## 组合式函数（Composables）\n\n将可复用逻辑提取为独立函数...',
    '深入理解 Vue 3 Composition API，提升前端组件开发效率。',
    2, 2, 'https://example.com/images/vue3.jpg', 1, 632
),
(
    '程序员的读书笔记：《代码整洁之道》',
    '# 《代码整洁之道》读书笔记\n\n## 核心理念\n\n代码应该像散文一样可读...\n\n## 命名规范\n\n- 名称应该揭示意图\n- 避免使用数字命名\n- 使用可搜索的名称\n\n## 函数设计\n\n- 函数应该短小\n- 只做一件事\n- 使用描述性的名称\n\n## 总结\n\n写整洁代码是一种态度，也是一种对专业的追求...',
    '分享《代码整洁之道》的阅读心得，学习如何写出高质量的代码。',
    3, 2, 'https://example.com/images/clean-code.jpg', 1, 445
);

-- 标签数据
INSERT INTO `tag` (`name`) VALUES
('Spring Boot'),
('MyBatis'),
('Vue.js'),
('读书笔记');

-- 文章-标签关联数据
INSERT INTO `article_tag` (`article_id`, `tag_id`) VALUES
(1, 1),  -- Spring Boot 入门指南 -> Spring Boot 标签
(2, 2),  -- MyBatis-Plus 实战 -> MyBatis 标签
(3, 3),  -- Vue 3 Composition API -> Vue.js 标签
(4, 4);  -- 读书笔记 -> 读书笔记 标签

-- 评论数据
INSERT INTO `comment` (`article_id`, `user_id`, `content`, `parent_id`) VALUES
(1, 2, '写得非常详细，学到了很多！感谢分享。', 0),
(1, 1, '谢谢支持，后续会持续更新更多内容。', 1);
