-- ============================================================
-- 博客系统 - MySQL 数据库初始化脚本（Spring Boot 2.5 版）
-- ============================================================
--
-- 此脚本在 MySQL 容器首次启动时自动执行
-- 挂载路径：/docker-entrypoint-initdb.d/01-init.sql
--
-- 包含内容：
--   1. 建表语句（用户、文章、分类、标签、评论等）
--   2. 索引定义
--   3. 初始管理员账号
--   4. 示例数据
--
-- 注意事项：
--   - 此脚本仅在数据卷首次初始化时执行一次
--   - 如需重新执行，需先删除 MySQL 数据卷：
--     docker volume rm blog-mysql-data
--   - 所有表使用 utf8mb4 字符集，支持 Emoji
--   - 使用 InnoDB 引擎，支持事务
--
-- ============================================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 选择数据库（由 docker-compose 的 MYSQL_DATABASE 环境变量自动创建）
USE blog;

-- ============================================================
-- 1. 用户表
-- ============================================================
-- 存储博客系统的用户信息
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户 ID（主键自增）',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名（登录名，唯一）',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（BCrypt 加密存储）',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱地址（唯一）',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称（显示名称）',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
    `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER' COMMENT '角色：ROLE_USER=普通用户, ROLE_ADMIN=管理员',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '账号状态：0=禁用, 1=正常',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除标记：0=未删除, 1=已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_role` (`role`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户表';

-- ============================================================
-- 2. 分类表
-- ============================================================
-- 文章分类，支持排序
CREATE TABLE IF NOT EXISTS `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称（唯一）',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值（越小越靠前）',
    `article_count` INT NOT NULL DEFAULT 0 COMMENT '该分类下的文章数（冗余字段）',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='文章分类表';

-- ============================================================
-- 3. 标签表
-- ============================================================
-- 文章标签，多对多关系
CREATE TABLE IF NOT EXISTS `tag` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '标签 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '标签名称（唯一）',
    `article_count` INT NOT NULL DEFAULT 0 COMMENT '该标签下的文章数（冗余字段）',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='标签表';

-- ============================================================
-- 4. 文章表
-- ============================================================
-- 博客文章，核心表
CREATE TABLE IF NOT EXISTS `article` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '文章 ID',
    `title` VARCHAR(200) NOT NULL COMMENT '文章标题',
    `summary` VARCHAR(500) DEFAULT NULL COMMENT '文章摘要（用于列表展示）',
    `content` LONGTEXT NOT NULL COMMENT '文章正文（Markdown 格式）',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID（关联 user.id）',
    `category_id` BIGINT DEFAULT NULL COMMENT '分类 ID（关联 category.id）',
    `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图 URL',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '发布状态：0=草稿, 1=已发布',
    `is_top` TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶：0=否, 1=是',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
    `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT NOT NULL DEFAULT 0 COMMENT '评论数',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除标记：0=未删除, 1=已删除',
    PRIMARY KEY (`id`),
    KEY `idx_author_id` (`author_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status_create_time` (`status`, `create_time`),
    KEY `idx_is_top` (`is_top`),
    KEY `idx_view_count` (`view_count`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_update_time` (`update_time`),
    CONSTRAINT `fk_article_author` FOREIGN KEY (`author_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_article_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='文章表';

-- ============================================================
-- 5. 文章标签关联表
-- ============================================================
-- 文章和标签的多对多关系
CREATE TABLE IF NOT EXISTS `article_tag` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关联 ID',
    `article_id` BIGINT NOT NULL COMMENT '文章 ID',
    `tag_id` BIGINT NOT NULL COMMENT '标签 ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_article_tag` (`article_id`, `tag_id`),
    KEY `idx_tag_id` (`tag_id`),
    CONSTRAINT `fk_at_article` FOREIGN KEY (`article_id`) REFERENCES `article` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_at_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='文章标签关联表';

-- ============================================================
-- 6. 评论表
-- ============================================================
-- 文章评论，支持嵌套回复（通过 parent_id）
CREATE TABLE IF NOT EXISTS `comment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '评论 ID',
    `article_id` BIGINT NOT NULL COMMENT '文章 ID',
    `user_id` BIGINT NOT NULL COMMENT '评论者 ID',
    `parent_id` BIGINT DEFAULT NULL COMMENT '父评论 ID（NULL 表示顶级评论）',
    `reply_to_user_id` BIGINT DEFAULT NULL COMMENT '回复目标用户 ID',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '审核状态：0=待审核, 1=已通过, 2=已拒绝',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除标记',
    PRIMARY KEY (`id`),
    KEY `idx_article_id` (`article_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_comment_article` FOREIGN KEY (`article_id`) REFERENCES `article` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `comment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='评论表';

-- ============================================================
-- 7. 操作日志表（可选）
-- ============================================================
-- 记录用户的操作行为，便于审计和分析
-- 对应第 10 章 AOP 操作日志功能
CREATE TABLE IF NOT EXISTS `operation_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
    `user_id` BIGINT DEFAULT NULL COMMENT '操作用户 ID',
    `operation` VARCHAR(100) NOT NULL COMMENT '操作描述',
    `method` VARCHAR(200) DEFAULT NULL COMMENT '请求方法（类名.方法名）',
    `params` TEXT DEFAULT NULL COMMENT '请求参数',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT '操作 IP 地址',
    `duration` BIGINT DEFAULT NULL COMMENT '执行时长（毫秒）',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '操作结果：0=失败, 1=成功',
    `error_msg` TEXT DEFAULT NULL COMMENT '错误信息',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_operation` (`operation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='操作日志表';


-- ============================================================
-- 插入初始数据
-- ============================================================

-- 初始管理员账号
-- 用户名：admin
-- 密码：admin123（BCrypt 加密后的值）
-- 注意：实际部署时请立即修改管理员密码！
INSERT INTO `user` (`id`, `username`, `password`, `email`, `nickname`, `bio`, `role`, `status`)
VALUES (
    1,
    'admin',
    '$2a$10$EqKcp1WFKVQISheBxMdyoOKCylMFIU/ynJGfDKSvUym3BLoxNOGcO',
    'admin@example.com',
    '管理员',
    '博客系统管理员，热爱技术分享。',
    'ROLE_ADMIN',
    1
);

-- 初始测试用户
INSERT INTO `user` (`id`, `username`, `password`, `email`, `nickname`, `bio`, `role`, `status`)
VALUES (
    2,
    'testuser',
    '$2a$10$EqKcp1WFKVQISheBxMdyoOKCylMFIU/ynJGfDKSvUym3BLoxNOGcO',
    'test@example.com',
    '测试用户',
    '这是一个测试账号。',
    'ROLE_USER',
    1
);

-- 初始分类
INSERT INTO `category` (`id`, `name`, `description`, `sort_order`, `article_count`) VALUES
(1, '技术教程', '编程技术相关的教程和学习笔记', 1, 2),
(2, '生活随笔', '日常生活的记录与感悟', 2, 1),
(3, '读书笔记', '读书心得、书摘和推荐', 3, 0),
(4, '开源项目', '开源项目介绍和使用经验', 4, 0);

-- 初始标签
INSERT INTO `tag` (`id`, `name`, `article_count`) VALUES
(1, 'Spring Boot', 2),
(2, 'Java', 2),
(3, 'Docker', 1),
(4, 'MySQL', 1),
(5, '前端', 0),
(6, 'Linux', 1),
(7, 'Redis', 0),
(8, '微服务', 0);

-- 示例文章 1：欢迎文章
INSERT INTO `article` (`id`, `title`, `summary`, `content`, `author_id`, `category_id`, `status`, `is_top`, `view_count`, `like_count`)
VALUES (
    1,
    '欢迎来到我的博客',
    '这是博客系统的第一篇文章，介绍了博客系统的主要功能和技术栈。',
    '# 欢迎来到我的博客\n\n这是使用 **Spring Boot 2.5**（JDK 8）搭建的个人博客系统。\n\n## 技术栈\n\n- **后端**：Spring Boot 2.5.12 + JDK 8\n- **ORM**：MyBatis-Plus 3.5.1\n- **数据库**：MySQL 8.0\n- **缓存**：Redis 7\n- **认证**：Spring Security 5.5 + JWT\n- **部署**：Docker + docker-compose\n\n## 功能特性\n\n- 用户注册与登录\n- 文章 CRUD（创建、阅读、更新、删除）\n- 分类与标签管理\n- 文章评论系统\n- 文件上传（封面图、头像）\n- Redis 热点数据缓存\n- Docker 容器化部署\n\n## 快速开始\n\n```bash\n# 克隆项目\ngit clone https://github.com/your-repo/blog-system.git\n\n# 启动所有服务\ncd blog-system/docker\ndocker compose up -d\n\n# 访问博客\ncurl http://localhost:8080/api/articles\n```\n\n感谢阅读，欢迎留言交流！',
    1, 1, 1, 1, 256, 42
);

-- 示例文章 2：Spring Boot 教程
INSERT INTO `article` (`id`, `title`, `summary`, `content`, `author_id`, `category_id`, `status`, `is_top`, `view_count`, `like_count`)
VALUES (
    2,
    'Spring Boot 2.5 入门指南',
    '从零开始学习 Spring Boot 2.5，包括项目创建、配置和常用功能。',
    '# Spring Boot 2.5 入门指南\n\n## 什么是 Spring Boot？\n\nSpring Boot 是基于 Spring 框架的快速开发脚手架，它简化了 Spring 应用的初始搭建和开发过程。\n\n## 核心特性\n\n### 1. 自动配置\n\nSpring Boot 根据引入的依赖自动配置 Spring 应用。\n\n### 2. Starter 依赖\n\n提供了一系列 starter POM，简化 Maven 配置。\n\n### 3. 内嵌服务器\n\n内置 Tomcat/Jetty/Undertow，无需部署 WAR 文件。\n\n## 创建第一个项目\n\n访问 [Spring Initializr](https://start.spring.io/) 生成项目模板（选择 Maven + Java 8 + Spring Boot 2.5.x）。\n\n```java\n@SpringBootApplication\npublic class BlogApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(BlogApplication.class, args);\n    }\n}\n```\n\n更多内容请持续关注本博客！',
    1, 1, 1, 0, 189, 28
);

-- 示例文章 3：生活随笔
INSERT INTO `article` (`id`, `title`, `summary`, `content`, `author_id`, `category_id`, `status`, `is_top`, `view_count`, `like_count`)
VALUES (
    3,
    '搭建个人博客的心路历程',
    '记录从零搭建个人博客系统的过程和遇到的问题。',
    '# 搭建个人博客的心路历程\n\n## 为什么搭建博客？\n\n作为一个开发者，拥有自己的博客不仅可以记录学习笔记，还能锻炼写作能力和技术深度。\n\n## 技术选型\n\n经过对比，最终选择了 Spring Boot 2.5（JDK 8）作为后端框架，兼顾稳定性和企业主流环境...\n\n## 遇到的挑战\n\n1. 数据库设计\n2. 安全认证\n3. 性能优化\n4. Docker 部署\n\n## 总结\n\n搭建博客系统是一个很好的全栈练习项目，涵盖了后端开发的方方面面。',
    1, 2, 1, 0, 134, 15
);

-- 为示例文章添加标签关联
INSERT INTO `article_tag` (`article_id`, `tag_id`) VALUES
(1, 1), -- 欢迎文章 - Spring Boot
(1, 2), -- 欢迎文章 - Java
(1, 3), -- 欢迎文章 - Docker
(2, 1), -- Spring Boot 教程 - Spring Boot
(2, 2), -- Spring Boot 教程 - Java
(3, 6); -- 心路历程 - Linux

-- 为示例文章添加示例评论
INSERT INTO `comment` (`article_id`, `user_id`, `content`, `status`) VALUES
(1, 2, '很棒的博客系统，学习了！', 1),
(1, 1, '感谢支持，后续会持续更新更多教程。', 1),
(2, 2, 'Spring Boot 2.5 的知识总结得很好，收藏了。', 1);

-- 更新文章的评论计数
UPDATE `article` SET `comment_count` = 2 WHERE `id` = 1;
UPDATE `article` SET `comment_count` = 1 WHERE `id` = 2;
