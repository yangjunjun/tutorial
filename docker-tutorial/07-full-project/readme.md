# 完整实战项目：全栈应用 Docker 部署

## 项目概述

本项目是一个完整的全栈 Web 应用，将所有前序章节的知识整合在一起，
演示如何使用 Docker 和 Docker Compose 构建、部署和运维一个生产级应用。

**技术栈：**

| 组件     | 技术选型              | 说明                     |
| -------- | --------------------- | ------------------------ |
| 前端     | React 18              | 单页应用，Nginx 托管     |
| 后端 API | Node.js + Express     | RESTful API 服务         |
| 数据库   | PostgreSQL 16         | 主数据存储               |
| 缓存     | Redis 7               | 会话缓存与数据缓存       |
| 反向代理 | Nginx                 | SSL 终端、负载均衡       |

**核心特性：**

- 多阶段构建优化镜像体积
- 开发/生产环境分离
- 完整健康检查机制
- 网络隔离与安全加固
- 数据持久化与备份策略
- 自动化部署脚本

---

## 架构图

```
                          互联网用户
                              │
                              ▼
                    ┌──────────────────┐
                    │    Nginx 反向代理   │
                    │  (SSL 终端 / 80,443)│
                    └───────┬────┬──────┘
                            │    │
              ┌─────────────┘    └─────────────┐
              ▼                                 ▼
    ┌──────────────────┐              ┌──────────────────┐
    │   React 前端      │              │  Express 后端 API │
    │  (静态资源服务)    │              │   (端口 3000)     │
    │   /api/* 代理     │              │                  │
    └──────────────────┘              └──────┬─────┬─────┘
                                             │     │
                              ┌──────────────┘     └──────────────┐
                              ▼                                   ▼
                    ┌──────────────────┐              ┌──────────────────┐
                    │   PostgreSQL     │              │     Redis        │
                    │   (端口 5432)    │              │   (端口 6379)    │
                    └──────────────────┘              └──────────────────┘
```

**网络拓扑：**

```
  frontend-net (前端网络)         backend-net (后端网络)
  ┌─────────────────────┐      ┌─────────────────────────────┐
  │ nginx    ✓          │      │ backend  ✓                  │
  │ frontend ✓          │      │ db       ✓                  │
  │ backend  ✓ (API)   │      │ redis    ✓                  │
  └─────────────────────┘      │ nginx    ✓ (反向代理)       │
                               └─────────────────────────────┘

  说明：
  - nginx 同时连接两个网络，作为前后端的桥梁
  - frontend 容器只能访问 nginx，无法直接访问数据库
  - backend 容器可以访问数据库和 Redis
```

---

## 项目结构

```
07-full-project/
├── docker-compose.yml          # 主 Compose 配置（生产环境）
├── docker-compose.dev.yml      # 开发环境覆盖配置
├── .env                        # 环境变量（含敏感信息，勿提交）
├── .env.example                # 环境变量模板
├── .dockerignore               # Docker 构建排除规则
│
├── backend/                    # 后端服务
│   ├── Dockerfile              # 多阶段构建
│   ├── package.json            # Node.js 依赖
│   └── src/
│       └── app.js              # Express 应用入口
│
├── frontend/                   # 前端应用
│   ├── Dockerfile              # 多阶段构建（node -> nginx）
│   ├── package.json            # React 依赖
│   ├── public/
│   │   └── index.html          # HTML 模板
│   └── src/
│       ├── App.js              # 主组件
│       └── index.js            # React 入口
│
├── nginx/                      # Nginx 配置
│   └── nginx.conf              # 反向代理与 SSL 配置
│
└── scripts/                    # 运维脚本
    ├── deploy.sh               # 自动化部署脚本
    └── backup.sh               # 数据库备份脚本
```

---

## 快速启动

### 前提条件

- Docker Engine 24.0+
- Docker Compose V2（`docker compose` 命令）
- 至少 4GB 可用内存

### 第一步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置必要的密码和密钥
vim .env
```

### 第二步：开发环境启动

```bash
# 使用开发配置启动（含热重载和调试端口）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看所有服务状态
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### 第三步：生产环境启动

```bash
# 使用生产配置启动
docker compose --profile production up -d --build

# 验证所有服务健康状态
docker compose --profile production ps
curl -s http://localhost/api/health | jq .
```

### 第四步：访问应用

| 地址                        | 说明             |
| --------------------------- | ---------------- |
| `http://localhost`          | 前端页面         |
| `http://localhost/api`      | 后端 API         |
| `http://localhost/api/health` | 健康检查端点   |

---

## 开发环境 vs 生产环境

| 特性           | 开发环境                          | 生产环境                        |
| -------------- | --------------------------------- | ------------------------------- |
| 代码加载       | 绑定挂载（bind mount）            | COPY 进镜像                     |
| 热重载         | 启用                              | 不启用                          |
| 调试端口       | 9229（Node Inspector）            | 不暴露                          |
| 数据库         | 开发库（允许重置）                | 生产库（严格备份）              |
| 日志级别       | debug                             | warn                            |
| Nginx SSL      | 不启用                            | 启用（需配置证书）              |
| 资源限制       | 不限制                            | 严格限制 CPU/内存               |
| 重启策略       | 不自动重启                        | unless-stopped                  |
| 构建缓存       | 利用缓存快速迭代                  | 多阶段构建最小化镜像            |
| 网络           | 单网络（方便调试）                | 前后端网络隔离                  |

---

## 部署流程

### 手动部署

```bash
# 1. 在服务器上克隆项目
git clone https://github.com/your-org/fullstack-app.git
cd fullstack-app

# 2. 配置环境变量
cp .env.example .env
vim .env  # 设置生产环境密码和密钥

# 3. 构建并启动
docker compose --profile production up -d --build

# 4. 运行数据库迁移
docker compose --profile production exec backend npm run migrate

# 5. 验证部署
docker compose --profile production ps
curl http://localhost/api/health
```

### 自动化部署（CI/CD）

```bash
# 执行部署脚本
./scripts/deploy.sh production
```

详见 `scripts/deploy.sh` 脚本。

---

## 常见运维操作

### 查看日志

```bash
# 查看所有服务日志
docker compose logs --tail=100

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f nginx --since 1h

# 导出日志到文件
docker compose logs backend > backend-$(date +%Y%m%d).log
```

### 扩容

```bash
# 水平扩展后端服务到 3 个实例
docker compose --profile production up -d --scale backend=3

# 注意：扩容后端需确保应用无状态，且 Nginx 负载均衡已配置
```

### 更新部署

```bash
# 拉取最新镜像
docker compose pull

# 滚动更新（不中断服务）
docker compose --profile production up -d --no-deps --build backend
docker compose --profile production up -d --no-deps --build frontend

# 更新单个服务
docker compose --profile production up -d --force-recreate backend
```

### 备份数据库

```bash
# 手动备份
./scripts/backup.sh

# 自动备份（添加到 crontab）
# 每天凌晨 2 点备份
0 2 * * * /path/to/scripts/backup.sh

# 恢复数据库
docker compose exec -T db psql -U $DB_USER -d $DB_NAME < backup-20250101.sql
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -f

# 清理停止的容器和悬空镜像
docker compose down --rmi local --volumes

# 完全清理（谨慎操作）
docker system prune -af --volumes
```

---

## 性能优化建议

### 镜像构建优化

- 使用多阶段构建，最终镜像仅包含运行时所需文件
- 合理利用构建缓存，将不常变动的层放在前面
- 使用 `.dockerignore` 排除无关文件
- 固定基础镜像版本，避免意外更新

### 运行时优化

- 为容器设置 CPU 和内存限制（`deploy.resources.limits`）
- 启用 Docker BuildKit 加速构建（`DOCKER_BUILDKIT=1`）
- 使用健康检查避免流量进入未就绪的容器
- 合理设置容器重启策略
- 对静态资源使用 CDN 加速

### 数据库优化

- 使用连接池（已在 app.js 中配置 `pg.Pool`）
- 定期执行 `VACUUM ANALYZE` 维护数据库
- 为常用查询字段添加索引
- 监控慢查询日志

### 缓存策略

- Redis 缓存热点数据（用户信息、配置数据）
- 设置合理的缓存 TTL，避免数据过期不及时
- 使用 Nginx 缓存静态资源（CSS/JS/图片）
- 启用 Gzip 压缩减少传输体积

---

## 安全加固清单

- [ ] 修改所有默认密码（数据库、Redis、JWT 密钥）
- [ ] 不在镜像中存储敏感信息（使用 Secrets 或环境变量）
- [ ] 启用 Nginx SSL/TLS（配置 HTTPS 证书）
- [ ] 配置防火墙规则，仅开放 80/443 端口
- [ ] 限制容器 capabilities（`cap_drop: ALL`）
- [ ] 启用只读根文件系统（`read_only: true`）
- [ ] 使用非 root 用户运行容器进程
- [ ] 定期更新基础镜像和依赖包
- [ ] 配置 Nginx 安全响应头（X-Frame-Options、CSP 等）
- [ ] 启用 Docker Content Trust（`DOCKER_CONTENT_TRUST=1`）
- [ ] 配置日志轮转，避免磁盘写满
- [ ] 启用数据库 SSL 连接
- [ ] 限制 Redis 仅监听内网地址
- [ ] 配置容器资源限制，防止资源耗尽攻击
- [ ] 使用 Docker Secrets 管理敏感配置（Swarm 模式）

---

## 故障排查指南

### 服务无法启动

```bash
# 检查容器状态和退出码
docker compose ps -a
docker inspect <container_name> --format '{{.State.ExitCode}}'

# 查看容器日志（含启动错误）
docker compose logs --tail=200 backend

# 检查端口占用
netstat -tlnp | grep -E '(80|443|3000|5432|6379)'
```

### 数据库连接失败

```bash
# 验证数据库容器健康状态
docker compose ps db
docker compose exec db pg_isready

# 测试后端到数据库的网络连通性
docker compose exec backend sh -c "nc -zv db 5432"

# 检查数据库用户权限
docker compose exec db psql -U $DB_USER -d $DB_NAME -c "\du"
```

### Nginx 反向代理异常

```bash
# 验证 Nginx 配置语法
docker compose exec nginx nginx -t

# 重新加载 Nginx 配置（不中断服务）
docker compose exec nginx nginx -s reload

# 检查上游服务是否可达
docker compose exec nginx sh -c "curl -s http://backend:3000/api/health"
```

### 容器内存不足

```bash
# 查看容器资源使用
docker stats --no-stream

# 检查 OOM 事件
docker inspect <container_name> --format '{{.State.OOMKilled}}'

# 调整内存限制后重启
docker compose --profile production up -d --force-recreate backend
```

### 磁盘空间不足

```bash
# 查看 Docker 磁盘使用
docker system df

# 清理未使用资源
docker system prune -f

# 查看卷占用
docker system df -v
```

### 常见问题速查表

| 症状                      | 可能原因                 | 解决方案                         |
| ------------------------- | ------------------------ | -------------------------------- |
| 容器反复重启              | 健康检查失败             | 检查日志，调整健康检查参数       |
| 502 Bad Gateway           | 后端服务未就绪           | 等待后端启动，检查 depends_on    |
| 数据库连接超时            | 网络不通或密码错误       | 检查网络配置和环境变量           |
| 前端页面空白              | API 地址配置错误         | 检查 REACT_APP_API_URL 变量      |
| SSL 证书错误              | 证书路径或权限问题       | 检查证书挂载路径和文件权限       |
| 构建失败                  | 网络问题或依赖缺失       | 检查 DNS 配置，清理构建缓存      |

---

## 下一步

- 集成 CI/CD 流水线（GitHub Actions / GitLab CI）
- 迁移到 Kubernetes 进行大规模编排
- 配置监控告警（Prometheus + Grafana）
- 实现蓝绿部署和金丝雀发布
- 添加分布式追踪（Jaeger / Zipkin）

---

> 本章是 Docker 教程系列的最终实战章节，整合了前六章所有知识点。
> 掌握本项目后，你将具备独立部署和运维容器化全栈应用的能力。
