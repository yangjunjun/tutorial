-- ============================================================
-- 测试用建表脚本（H2 MODE=MySQL）
-- ============================================================

CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `nickname` VARCHAR(50) DEFAULT NULL,
    `avatar` VARCHAR(255) DEFAULT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    `status` INT DEFAULT 1,
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `deleted` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `article` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(500) DEFAULT NULL,
    `content` TEXT,
    `author_id` BIGINT NOT NULL,
    `category_id` BIGINT DEFAULT NULL,
    `status` INT DEFAULT 0,
    `view_count` BIGINT DEFAULT 0,
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `deleted` INT DEFAULT 0
);
