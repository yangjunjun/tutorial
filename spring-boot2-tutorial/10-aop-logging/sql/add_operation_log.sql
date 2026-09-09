-- =====================================================
-- 操作日志表
-- 用于存储 AOP 切面自动记录的操作日志
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4（支持 emoji 等 Unicode 字符）
-- =====================================================

CREATE TABLE IF NOT EXISTS `operation_log` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `module`          VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '操作模块（如：文章管理、用户管理）',
    `type`            VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '操作类型（如：创建、修改、删除）',
    `description`     VARCHAR(256) NOT NULL DEFAULT '' COMMENT '操作描述',
    `method`          VARCHAR(256) NOT NULL DEFAULT '' COMMENT '请求方法（类名.方法名）',
    `request_method`  VARCHAR(16)  NOT NULL DEFAULT '' COMMENT 'HTTP 请求方法（GET/POST/PUT/DELETE）',
    `request_url`     VARCHAR(512) NOT NULL DEFAULT '' COMMENT '请求URL',
    `request_params`  TEXT         NULL     COMMENT '请求参数（JSON 格式）',
    `response_result` TEXT         NULL     COMMENT '响应结果（JSON 格式）',
    `operator_id`     BIGINT       NULL     COMMENT '操作人ID',
    `operator_name`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '操作人姓名',
    `ip`              VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '操作人IP地址',
    `user_agent`      VARCHAR(512) NOT NULL DEFAULT '' COMMENT '浏览器 User-Agent',
    `cost_time`       BIGINT       NOT NULL DEFAULT 0 COMMENT '耗时（毫秒）',
    `status`          TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1-成功 0-失败',
    `error_msg`       TEXT         NULL     COMMENT '错误信息（方法执行失败时的异常信息）',
    `request_time`    DATETIME     NULL     COMMENT '请求时间',
    `create_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_module` (`module`),
    KEY `idx_type` (`type`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_status` (`status`),
    KEY `idx_request_time` (`request_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =====================================================
-- 示例数据（可选，用于测试）
-- =====================================================
-- INSERT INTO operation_log (module, type, description, method, request_method, request_url,
--     operator_name, ip, cost_time, status, request_time)
-- VALUES
-- ('文章管理', '创建', '创建新文章', 'ArticleController.create', 'POST', '/api/articles',
--  'admin', '127.0.0.1', 128, 1, NOW()),
-- ('用户管理', '修改', '修改用户角色', 'UserController.updateRole', 'PUT', '/api/admin/users/1/role',
--  'admin', '127.0.0.1', 56, 1, NOW()),
-- ('评论管理', '删除', '删除垃圾评论', 'CommentController.delete', 'DELETE', '/api/admin/comments/5',
--  'admin', '192.168.1.100', 23, 1, NOW());
