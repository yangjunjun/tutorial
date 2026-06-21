# 第 15 章：Docker 部署

> 本章源码目录：`15-docker-deploy/`

## 本章导读

经过前面 14 章的学习，我们的博客系统已经具备了完整的功能。本章将学习如何使用 Docker 将整个应用容器化部署，实现"一次构建，到处运行"的目标。我们将从 Docker 基础概念讲起，逐步完成应用镜像构建、多容器编排、Nginx 反向代理等完整的部署流程。

**本章你将学到：**
- Docker 核心概念（镜像、容器、仓库）
- Dockerfile 编写与多阶段构建
- docker-compose 多容器编排
- MySQL、Redis 容器化配置
- 环境变量与多环境部署
- 数据卷持久化
- Nginx 反向代理
- 健康检查与日志管理
- CI/CD 自动部署思路

---

## 15.1 Docker 基础概念

### 15.1.1 什么是 Docker？

Docker 是一个开源的容器化平台，它可以将应用及其所有依赖（运行时、系统工具、库）打包到一个标准化的单元（容器）中。与传统的虚拟机不同，容器直接共享宿主机的操作系统内核，因此更加轻量和高效。

### 15.1.2 三大核心概念

```
┌─────────────────────────────────────────────────┐
│              Docker 架构                         │
│                                                  │
│  ┌──────────┐   构建    ┌──────────┐   推送    │
│  │ 代码+    │ ───────→  │  镜像    │ ───────→  │
│  │ Dockerfile│          │ (Image)  │          │
│  └──────────┘          └────┬─────┘          │
│                              │ 运行            │
│                              ▼                 │
│                        ┌──────────┐            │
│                        │  容器    │            │
│                        │(Container)│            │
│                        └──────────┘            │
│                              │ 推送/拉取        │
│                              ▼                 │
│  ┌──────────────────────────────────────┐      │
│  │           Docker Hub（仓库）           │      │
│  │    hub.docker.com                     │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

| 概念 | 说明 | 类比 |
|------|------|------|
| **镜像（Image）** | 只读的应用模板，包含代码、运行时、库、环境变量 | 安装光盘 / ISO 文件 |
| **容器（Container）** | 镜像的运行实例，可以被创建、启动、停止、删除 | 运行中的虚拟机 |
| **仓库（Registry）** | 存放和分发镜像的服务，如 Docker Hub | 应用商店 |

### 15.1.3 Docker 与虚拟机的对比

```
     Docker 容器                    传统虚拟机
┌─────┐ ┌─────┐ ┌─────┐     ┌─────┐ ┌─────┐ ┌─────┐
│App A│ │App B│ │App C│     │App A│ │App B│ │App C│
├─────┤ ├─────┤ ├─────┤     ├─────┤ ├─────┤ ├─────┤
│Bins │ │Bins │ │Bins │     │Bins │ │Bins │ │Bins │
├─────┴─┴─────┴─┴─────┤     ├─────┤ ├─────┤ ├─────┤
│    Docker Engine     │     │Guest│ │Guest│ │Guest│
├──────────────────────┤     │  OS │ │  OS │ │  OS │
│     Host OS          │     ├─────┴─┴─────┴─┴─────┤
├──────────────────────┤     │      Hypervisor      │
│      Hardware        │     ├──────────────────────┤
└──────────────────────┘     │      Host OS         │
                             ├──────────────────────┤
                             │      Hardware        │
                             └──────────────────────┘
```

**Docker 的优势：**
- **启动快**：秒级启动（虚拟机需要分钟级）
- **体积小**：MB 级别（虚拟机 GB 级别）
- **资源利用率高**：共享宿主机内核
- **环境一致性**：开发、测试、生产环境完全一致

### 15.1.4 安装 Docker

**Linux（Ubuntu/Debian）：**

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin
```

**Windows / macOS：**

推荐使用 Docker Desktop：https://www.docker.com/products/docker-desktop/

验证安装：

```bash
docker --version
docker compose version
```

---

## 15.2 Dockerfile 编写详解

Dockerfile 是一个文本文件，包含了构建 Docker 镜像所需的全部指令。

### 15.2.1 基础 Dockerfile（单阶段）

最简单的 Dockerfile：

```dockerfile
# 使用 JDK 17 作为基础镜像
FROM eclipse-temurin:17-jdk

# 设置工作目录
WORKDIR /app

# 复制 JAR 文件到容器
COPY target/blog-system-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**问题**：这个镜像大约 500MB+，因为包含了完整的 JDK。而且需要先在本地构建 JAR。

### 15.2.2 多阶段构建（推荐）

多阶段构建的核心思想：在第一个阶段（构建阶段）编译代码，在第二个阶段（运行阶段）只复制产物。这样最终的镜像只包含运行时所需的最小内容。

> 完整文件：`Dockerfile`

```dockerfile
# ============================================================
# 阶段一：构建阶段
# 使用包含 Maven 和 JDK 的镜像来编译项目
# ============================================================
FROM maven:3.9-eclipse-temurin-17 AS builder

# 设置工作目录
WORKDIR /build

# 先复制 pom.xml，利用 Docker 缓存层加速依赖下载
COPY pom.xml .

# 预下载依赖（只有 pom.xml 变化时才会重新下载）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 执行构建（跳过测试，测试应该在 CI 阶段完成）
RUN mvn clean package -DskipTests -B

# ============================================================
# 阶段二：运行阶段
# 使用仅包含 JRE 的精简镜像来运行应用
# ============================================================
FROM eclipse-temurin:17-jre AS runtime

# 创建非 root 用户运行应用（安全最佳实践）
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 JAR 文件
COPY --from=builder /build/target/*.jar app.jar

# 创建必要的目录
RUN mkdir -p /app/logs /app/uploads && \
    chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

# JVM 参数（可通过环境变量覆盖）
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# 暴露应用端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**多阶段构建的优势：**

| 特性 | 单阶段 | 多阶段 |
|------|--------|--------|
| 镜像大小 | ~500MB | ~200MB |
| 包含 Maven | 否（需本地安装） | 仅构建阶段 |
| 包含 JDK | 是 | 仅 JRE |
| 包含源码 | 否 | 仅构建阶段 |
| 安全性 | root 运行 | 非 root 运行 |

### 15.2.3 构建镜像

```bash
# 在项目根目录（Dockerfile 所在目录）执行
docker build -t blog-app:latest .

# 指定镜像名称和版本
docker build -t blog-app:1.0.0 .

# 构建时不使用缓存
docker build --no-cache -t blog-app:latest .

# 查看构建的镜像
docker images | grep blog-app
```

---

## 15.3 docker-compose 编排

在实际部署中，我们的博客系统需要多个服务协同工作：Spring Boot 应用、MySQL 数据库、Redis 缓存。docker-compose 允许我们用一个 YAML 文件定义和管理所有这些容器。

### 15.3.1 docker-compose.yml 完整配置

> 完整文件：`docker-compose.yml`

```yaml
version: '3.8'

# ============================================================
# 服务定义
# ============================================================
services:

  # ---------- Spring Boot 博客应用 ----------
  blog-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: blog-app
    restart: unless-stopped
    ports:
      - "${APP_PORT:-8080}:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}
      - SPRING_DATASOURCE_URL=jdbc:mysql://blog-mysql:3306/${MYSQL_DATABASE:-blog}?useUnicode=true&characterEncoding=utf-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
      - SPRING_DATASOURCE_USERNAME=${MYSQL_USER:-blog}
      - SPRING_DATASOURCE_PASSWORD=${MYSQL_PASSWORD:-blog123456}
      - SPRING_DATA_REDIS_HOST=blog-redis
      - SPRING_DATA_REDIS_PORT=6379
      - SPRING_DATA_REDIS_PASSWORD=${REDIS_PASSWORD:-}
      - JWT_SECRET=${JWT_SECRET:-your-256-bit-secret-key-for-jwt-token-generation}
      - JWT_EXPIRATION=${JWT_EXPIRATION:-86400000}
      - JAVA_OPTS=${JAVA_OPTS:--Xms256m -Xmx512m}
    volumes:
      - blog-uploads:/app/uploads
      - blog-logs:/app/logs
    networks:
      - blog-network
    depends_on:
      blog-mysql:
        condition: service_healthy
      blog-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # ---------- MySQL 数据库 ----------
  blog-mysql:
    image: mysql:8.0
    container_name: blog-mysql
    restart: unless-stopped
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root123456}
      - MYSQL_DATABASE=${MYSQL_DATABASE:-blog}
      - MYSQL_USER=${MYSQL_USER:-blog}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD:-blog123456}
      - TZ=Asia/Shanghai
    volumes:
      - blog-mysql-data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - blog-network
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --default-authentication-plugin=mysql_native_password
      --max-connections=200
      --innodb-buffer-pool-size=256M
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD:-root123456}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  # ---------- Redis 缓存 ----------
  blog-redis:
    image: redis:7-alpine
    container_name: blog-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - blog-redis-data:/data
    networks:
      - blog-network
    command: >
      redis-server
      --appendonly yes
      --maxmemory 128mb
      --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

# ============================================================
# 数据卷定义（持久化存储）
# ============================================================
volumes:
  # MySQL 数据持久化
  blog-mysql-data:
    driver: local
  # Redis 数据持久化
  blog-redis-data:
    driver: local
  # 上传文件持久化
  blog-uploads:
    driver: local
  # 应用日志持久化
  blog-logs:
    driver: local

# ============================================================
# 网络定义
# ============================================================
networks:
  blog-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### 15.3.2 关键配置解读

**服务依赖（depends_on + healthcheck）：**

```yaml
depends_on:
  blog-mysql:
    condition: service_healthy   # 等 MySQL 健康检查通过后才启动应用
```

这确保了启动顺序：MySQL/Redis 先启动并就绪 → 然后 Spring Boot 应用才启动。

**环境变量传递：**

```yaml
environment:
  - SPRING_DATASOURCE_URL=jdbc:mysql://blog-mysql:3306/blog
```

注意容器间通信用的是 **服务名称**（`blog-mysql`）而不是 IP 地址，Docker 内部 DNS 会自动解析。

**数据卷映射：**

```yaml
volumes:
  - blog-mysql-data:/var/lib/mysql          # 命名卷：持久化 MySQL 数据
  - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # 绑定挂载：初始化脚本
```

---

## 15.4 MySQL 初始化脚本

MySQL 容器在首次启动时会自动执行 `/docker-entrypoint-initdb.d/` 目录下的 SQL 脚本。

> 完整文件：`sql/init.sql`

```sql
-- ============================================================
-- 博客系统数据库初始化脚本
-- 此脚本在 MySQL 容器首次启动时自动执行
-- ============================================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 选择数据库（docker-compose 已通过 MYSQL_DATABASE 创建）
USE blog;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户 ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（BCrypt 加密）',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER' COMMENT '角色',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=禁用 1=正常',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0=未删除 1=已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 文章表
-- ============================================================
CREATE TABLE IF NOT EXISTS `article` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '文章 ID',
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `summary` VARCHAR(500) DEFAULT NULL COMMENT '摘要',
    `content` LONGTEXT NOT NULL COMMENT '正文内容（Markdown）',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `category_id` BIGINT DEFAULT NULL COMMENT '分类 ID',
    `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图 URL',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=草稿 1=已发布',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
    `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT NOT NULL DEFAULT 0 COMMENT '评论数',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    KEY `idx_author_id` (`author_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- ============================================================
-- 分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================================
-- 标签表
-- ============================================================
CREATE TABLE IF NOT EXISTS `tag` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '标签 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ============================================================
-- 文章标签关联表
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_tag` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关联 ID',
    `article_id` BIGINT NOT NULL COMMENT '文章 ID',
    `tag_id` BIGINT NOT NULL COMMENT '标签 ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_article_tag` (`article_id`, `tag_id`),
    KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签关联表';

-- ============================================================
-- 评论表
-- ============================================================
CREATE TABLE IF NOT EXISTS `comment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '评论 ID',
    `article_id` BIGINT NOT NULL COMMENT '文章 ID',
    `user_id` BIGINT NOT NULL COMMENT '评论者 ID',
    `parent_id` BIGINT DEFAULT NULL COMMENT '父评论 ID（用于回复）',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=待审核 1=已通过',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_article_id` (`article_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================================
-- 插入初始数据
-- ============================================================

-- 初始管理员账号（密码：admin123，BCrypt 加密）
INSERT INTO `user` (`id`, `username`, `password`, `email`, `nickname`, `role`, `status`)
VALUES (1, 'admin', '$2a$10$EqKcp1WFKVQISheBxMdyoOKCylMFIU/ynJGfDKSvUym3BLoxNOGcO',
        'admin@example.com', '管理员', 'ROLE_ADMIN', 1);

-- 初始分类
INSERT INTO `category` (`id`, `name`, `description`, `sort_order`) VALUES
(1, '技术教程', '编程技术相关的教程和笔记', 1),
(2, '生活随笔', '日常生活的记录与感悟', 2),
(3, '读书笔记', '读书心得和摘要', 3);

-- 初始标签
INSERT INTO `tag` (`id`, `name`) VALUES
(1, 'Spring Boot'),
(2, 'Java'),
(3, 'Docker'),
(4, 'MySQL'),
(5, '前端');

-- 示例文章
INSERT INTO `article` (`id`, `title`, `summary`, `content`, `author_id`, `category_id`, `status`, `view_count`)
VALUES (1, '欢迎来到我的博客', '这是博客系统的第一篇文章',
        '# 欢迎来到我的博客\n\n这是使用 Spring Boot 3 搭建的个人博客系统。\n\n## 功能特性\n\n- 文章管理\n- 分类标签\n- 用户认证\n- Docker 部署',
        1, 1, 1, 100);
```

---

## 15.5 环境变量与多环境配置

### 15.5.1 .env 文件

docker-compose 会自动读取同级目录下的 `.env` 文件。我们提供 `.env.example` 作为模板：

> 完整文件：`.env.example`

```bash
# ============================================================
# 博客系统 Docker 部署 - 环境变量配置
# 复制此文件为 .env 并修改对应的值
# ============================================================

# ---------- 应用配置 ----------
APP_PORT=8080
SPRING_PROFILES_ACTIVE=prod
JAVA_OPTS=-Xms256m -Xmx512m -XX:+UseG1GC

# ---------- MySQL 配置 ----------
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=blog
MYSQL_USER=blog
MYSQL_PASSWORD=your_secure_blog_password
MYSQL_PORT=3306

# ---------- Redis 配置 ----------
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# ---------- JWT 配置 ----------
JWT_SECRET=your-256-bit-secret-key-change-this-in-production
JWT_EXPIRATION=86400000
```

使用方法：

```bash
# 复制模板
cp .env.example .env

# 编辑 .env 文件，填入实际的值
vim .env

# 启动（docker-compose 自动读取 .env）
docker compose up -d
```

### 15.5.2 生产环境覆盖配置（docker-compose.prod.yml）

对于生产环境，我们可以使用覆盖文件来修改开发环境的配置：

> 完整文件：`docker-compose.prod.yml`

```yaml
version: '3.8'

# ============================================================
# 生产环境覆盖配置
# 使用方式：docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# ============================================================

services:

  blog-app:
    # 生产环境使用预构建的镜像，不再本地构建
    image: your-registry/blog-app:${APP_VERSION:-latest}
    build: !reset
    restart: always
    # 生产环境不直接暴露端口，由 Nginx 代理
    ports: !reset
    expose:
      - "8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      # 生产环境的 JVM 参数可以适当调大
      - JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/app/logs/
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2'
        reservations:
          memory: 512M
          cpus: '1'

  blog-mysql:
    restart: always
    # 生产环境不暴露 MySQL 端口
    ports: !reset
    expose:
      - "3306"
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'

  blog-redis:
    restart: always
    ports: !reset
    expose:
      - "6379"
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'

  # 生产环境增加 Nginx 服务
  blog-nginx:
    image: nginx:1.25-alpine
    container_name: blog-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - blog-nginx-logs:/var/log/nginx
    networks:
      - blog-network
    depends_on:
      blog-app:
        condition: service_healthy

volumes:
  blog-nginx-logs:
    driver: local
```

### 15.5.3 生产环境 Spring Boot 配置

> 完整文件：`src/main/resources/application-prod.yml`

```yaml
# ============================================================
# 生产环境配置
# 所有敏感信息通过环境变量注入，不硬编码在配置文件中
# ============================================================

spring:
  # ---------- 数据源 ----------
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initial-size: 5
      min-idle: 5
      max-active: 50
      max-wait: 60000
      time-between-eviction-runs-millis: 60000
      min-evictable-idle-time-millis: 300000
      validation-query: SELECT 1
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false

  # ---------- Redis ----------
  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST:localhost}
      port: ${SPRING_DATA_REDIS_PORT:6379}
      password: ${SPRING_DATA_REDIS_PASSWORD:}
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5
          max-wait: 3000ms

  # ---------- Jackson ----------
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai

# ---------- 文件上传 ----------
servlet:
  multipart:
    max-file-size: 10MB
    max-request-size: 20MB

# ---------- MyBatis-Plus ----------
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    # 生产环境关闭 SQL 日志
    log-impl: org.apache.ibatis.logging.nologging.NoLoggingImpl

# ---------- JWT ----------
jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:86400000}

# ---------- 日志 ----------
logging:
  level:
    root: WARN
    com.example.blog: INFO
    org.springframework.security: WARN
  file:
    name: /app/logs/blog-app.log
  logback:
    rollingpolicy:
      max-file-size: 50MB
      max-history: 30
      total-size-cap: 1GB
```

---

## 15.6 数据卷持久化

### 15.6.1 为什么需要数据卷？

容器的文件系统是临时的——容器被删除后，里面的数据也会消失。数据卷（Volume）是 Docker 管理的持久化存储机制，独立于容器的生命周期。

### 15.6.2 我们的数据卷规划

| 数据卷 | 挂载路径 | 用途 |
|--------|---------|------|
| `blog-mysql-data` | `/var/lib/mysql` | MySQL 数据文件 |
| `blog-redis-data` | `/data` | Redis RDB/AOF 持久化 |
| `blog-uploads` | `/app/uploads` | 用户上传的文件（图片等） |
| `blog-logs` | `/app/logs` | 应用日志文件 |

### 15.6.3 数据卷管理命令

```bash
# 查看所有数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect blog-mysql-data

# 备份 MySQL 数据卷
docker run --rm \
  -v blog-mysql-data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mysql-backup-$(date +%Y%m%d).tar.gz -C /source .

# 恢复数据卷
docker run --rm \
  -v blog-mysql-data:/target \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/mysql-backup-20240101.tar.gz -C /target

# 删除数据卷（谨慎！数据会丢失）
docker volume rm blog-mysql-data
```

---

## 15.7 网络配置

### 15.7.1 Docker 网络类型

| 类型 | 说明 |
|------|------|
| `bridge` | 默认网络，容器之间通过虚拟网桥通信 |
| `host` | 容器直接使用宿主机网络（性能最好，但端口可能冲突） |
| `none` | 不使用网络 |

### 15.7.2 自定义网络

我们在 docker-compose 中使用自定义 bridge 网络：

```yaml
networks:
  blog-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**自定义网络的优势：**
1. **DNS 解析**：容器可以通过服务名称互相访问（如 `blog-mysql:3306`）
2. **网络隔离**：不同项目的容器互不影响
3. **固定子网**：避免 IP 冲突

```bash
# 查看网络详情
docker network ls
docker network inspect blog-network
```

---

## 15.8 健康检查（Healthcheck）

健康检查让 Docker 自动监测容器的运行状态，是实现自动重启和服务依赖的基础。

### 15.8.1 各服务的健康检查

**Spring Boot 应用：**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
  interval: 30s       # 每 30 秒检查一次
  timeout: 10s        # 超时时间 10 秒
  retries: 5          # 失败 5 次标记为 unhealthy
  start_period: 60s   # 启动宽限期 60 秒（Spring Boot 启动较慢）
```

**MySQL：**

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 10s
  timeout: 5s
  retries: 10
  start_period: 30s
```

**Redis：**

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### 15.8.2 查看健康状态

```bash
# 查看所有容器的健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"

# 输出示例：
# NAMES         STATUS
# blog-app      Up 2 minutes (healthy)
# blog-mysql    Up 3 minutes (healthy)
# blog-redis    Up 3 minutes (healthy)
```

---

## 15.9 Nginx 反向代理配置

Nginx 作为反向代理，处理外部请求并转发到 Spring Boot 应用，同时提供静态资源缓存、Gzip 压缩、HTTPS 等功能。

> 完整文件：`nginx/nginx.conf`

```nginx
# ============================================================
# Nginx 反向代理配置 - 博客系统
# ============================================================

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # ---------- 日志格式 ----------
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # ---------- 性能优化 ----------
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # ---------- Gzip 压缩 ----------
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # ---------- 限流配置 ----------
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # ---------- 上游服务 ----------
    upstream blog_backend {
        server blog-app:8080;
        keepalive 32;
    }

    # ---------- HTTP 服务（自动跳转 HTTPS） ----------
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # 生产环境建议开启 HTTPS 重定向
        # return 301 https://$host$request_uri;

        # API 请求转发到 Spring Boot
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://blog_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时配置
            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 登录接口额外限流（防暴力破解）
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;

            proxy_pass http://blog_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 静态资源缓存
        location /uploads/ {
            proxy_pass http://blog_backend;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }

        # 健康检查端点（不限流）
        location /actuator/health {
            proxy_pass http://blog_backend;
        }
    }

    # ---------- HTTPS 服务（可选） ----------
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com www.your-domain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #     ssl_prefer_server_ciphers on;
    #
    #     # ... 同上面的 location 配置 ...
    # }
}
```

---

## 15.10 完整部署流程

### 15.10.1 开发环境部署

```bash
# 1. 准备环境变量
cp .env.example .env
vim .env  # 编辑配置

# 2. 构建并启动所有服务
docker compose up -d --build

# 3. 查看启动日志
docker compose logs -f blog-app

# 4. 验证服务状态
docker compose ps

# 5. 测试 API
curl http://localhost:8080/api/articles
```

### 15.10.2 生产环境部署

```bash
# 1. 克隆代码到服务器
git clone https://github.com/your-repo/blog-system.git
cd blog-system/docker

# 2. 配置环境变量
cp .env.example .env
vim .env  # 填入生产环境的密码和密钥

# 3. 使用生产环境覆盖配置启动
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. 验证所有服务健康
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 5. 查看 Nginx 访问日志
docker compose logs -f blog-nginx
```

### 15.10.3 常用运维命令

```bash
# ===== 容器管理 =====
docker compose start          # 启动已停止的容器
docker compose stop           # 停止容器（不删除）
docker compose restart        # 重启容器
docker compose down           # 停止并删除容器（不删除数据卷）
docker compose down -v        # 停止并删除容器和数据卷（危险！）
docker compose up -d --build  # 重新构建并启动

# ===== 日志查看 =====
docker compose logs                    # 所有服务日志
docker compose logs -f blog-app       # 实时查看应用日志
docker compose logs --tail=100 blog-app  # 最后 100 行
docker compose logs --since="2024-01-01" # 指定时间之后的日志

# ===== 进入容器 =====
docker exec -it blog-app sh            # 进入应用容器
docker exec -it blog-mysql mysql -u blog -p  # 进入 MySQL 命令行
docker exec -it blog-redis redis-cli   # 进入 Redis 命令行

# ===== 资源监控 =====
docker stats                           # 实时资源使用情况
docker top blog-app                    # 容器内进程
```

---

## 15.11 日志查看和常见问题排查

### 15.11.1 常见启动失败场景

**场景 1：MySQL 连接失败**

```
Communications link failure - The last packet sent successfully was 0 milliseconds ago
```

**排查步骤：**

```bash
# 1. 检查 MySQL 容器是否在运行
docker compose ps blog-mysql

# 2. 检查 MySQL 日志
docker compose logs blog-mysql

# 3. 检查网络连通性
docker exec blog-app ping blog-mysql

# 4. 检查 MySQL 是否就绪
docker exec blog-mysql mysqladmin ping -h localhost -u root -p
```

**场景 2：端口被占用**

```
Bind for 0.0.0.0:8080 failed: port is already allocated
```

```bash
# 查看端口占用
sudo lsof -i :8080
# 或修改 .env 中的端口配置
```

**场景 3：内存不足（OOM）**

```
Java heap space / Container killed due to OOM
```

```bash
# 增加 JVM 堆内存
JAVA_OPTS=-Xms512m -Xmx1024m

# 增加容器内存限制
# 在 docker-compose.prod.yml 中修改 deploy.resources.limits.memory
```

**场景 4：初始化 SQL 未执行**

```bash
# 检查 init.sql 是否正确挂载
docker exec blog-mysql ls -la /docker-entrypoint-initdb.d/

# 注意：init.sql 只在数据卷首次初始化时执行
# 如果已经初始化过，需要手动执行或清空数据卷
docker volume rm blog-mysql-data
docker compose up -d blog-mysql
```

### 15.11.2 应用日志持久化

Spring Boot 应用日志配置在 `application-prod.yml` 中：

```yaml
logging:
  file:
    name: /app/logs/blog-app.log
  logback:
    rollingpolicy:
      max-file-size: 50MB    # 单个文件最大 50MB
      max-history: 30        # 保留 30 天
      total-size-cap: 1GB    # 日志总量不超过 1GB
```

```bash
# 查看应用日志文件
docker exec blog-app ls -la /app/logs/

# 复制日志到宿主机
docker cp blog-app:/app/logs/blog-app.log ./logs/

# 实时查看日志
docker compose logs -f --tail=50 blog-app
```

---

## 15.12 CI/CD 自动部署简介

### 15.12.1 GitHub Actions 自动部署思路

下面是一个 GitHub Actions 工作流的示例思路：

```yaml
# .github/workflows/deploy.yml（仅供参考，需根据实际环境调整）

name: Build and Deploy Blog

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run Tests
        run: mvn test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: your-registry/blog-app:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/blog-system
            docker compose pull
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 15.12.2 CI/CD 流程图

```
  代码提交 → GitHub Actions 触发
      │
      ├── 1. 运行单元测试（mvn test）
      │      └── 失败 → 通知开发者
      │
      ├── 2. 构建 Docker 镜像
      │
      ├── 3. 推送到镜像仓库（Docker Hub / 阿里云 ACR）
      │
      └── 4. SSH 到服务器 → 拉取新镜像 → 重启容器
              └── 验证健康检查通过
```

---

## 15.13 本章小结

| 组件 | 技术 | 端口 | 说明 |
|------|------|------|------|
| 博客应用 | Spring Boot 3 + JDK 17 | 8080 | 多阶段构建，非 root 运行 |
| 数据库 | MySQL 8.0 | 3306 | utf8mb4，自动初始化 |
| 缓存 | Redis 7 Alpine | 6379 | AOF 持久化，内存限制 128MB |
| 反向代理 | Nginx 1.25 Alpine | 80/443 | Gzip 压缩，限流，静态资源缓存 |

**部署检查清单：**

- [ ] 修改 `.env` 文件中的所有密码和密钥
- [ ] 确认 `sql/init.sql` 中的建表语句正确
- [ ] 验证 MySQL 数据卷已正确持久化
- [ ] 测试应用健康检查端点 `/actuator/health`
- [ ] 配置 Nginx 的域名和 HTTPS（如需要）
- [ ] 备份策略已就绪（定期备份 MySQL 数据卷）

---

## 附：本章文件清单

```
15-docker-deploy/
├── Dockerfile                          # 多阶段构建 Dockerfile
├── docker-compose.yml                  # 基础编排文件
├── docker-compose.prod.yml             # 生产环境覆盖配置
├── .env.example                        # 环境变量模板
├── readme.md                           # 本章文档
├── nginx/
│   └── nginx.conf                      # Nginx 反向代理配置
├── sql/
│   └── init.sql                        # MySQL 初始化脚本
└── src/main/resources/
    └── application-prod.yml            # 生产环境 Spring Boot 配置
```
