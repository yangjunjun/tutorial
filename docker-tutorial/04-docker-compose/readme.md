# Docker Compose 编排多容器应用

在实际生产环境中，一个应用通常由多个容器组成：Web 服务器、数据库、缓存、消息队列等。如果每次都手动用 `docker run` 逐个启动，不仅繁琐而且容易出错。**Docker Compose** 正是为了解决这个问题而生的。

---

## 1. Docker Compose 是什么

Docker Compose 是 Docker 官方提供的一个工具，用于**定义和运行多容器 Docker 应用**。它通过一个 YAML 配置文件（`docker-compose.yml`）来描述所有服务及其依赖关系，然后用一条命令即可启动、停止或管理整个应用栈。

### 它解决了什么问题？

| 问题 | 传统方式 | Docker Compose |
|------|---------|----------------|
| 启动多个服务 | 多次 `docker run`，参数复杂 | 一条命令 `docker compose up` |
| 服务间依赖 | 手动控制启动顺序 | `depends_on` 自动管理 |
| 网络配置 | 手动创建网络并连接 | 自动创建专用网络 |
| 环境变量 | 每次手动传入 | `.env` 文件统一管理 |
| 团队协作 | 口头/文档传递运行参数 | 配置文件版本控制 |
| 重复开发环境搭建 | 依赖安装手册 | 一键拉起完整环境 |

### Docker Compose V2

从 Docker Desktop 2021 年起，Docker Compose 已升级为 V2 版本：

- **旧版（V1）**：独立 Python 程序，命令是 `docker-compose`（带横杠）
- **新版（V2）**：集成到 Docker CLI 插件，命令是 `docker compose`（空格分隔）

```bash
# 检查版本
docker compose version
```

---

## 2. docker-compose.yml 核心语法详解

一个典型的 `docker-compose.yml` 文件结构如下：

```yaml
services:
  service_name:
    # 服务配置...
```

下面逐一讲解每个核心配置项。

### 2.1 version（版本声明）

```yaml
# 旧版写法（V1 需要，V2 不再需要）
version: "3.8"

services:
  web:
    image: nginx
```

> **注意**：Docker Compose V2 已不再需要 `version` 字段。写上也不会报错，但建议省略，保持文件简洁。

---

### 2.2 services（服务定义）

`services` 是 `docker-compose.yml` 的**根节点**，所有容器服务都定义在它下面。每个 service 名称会自动成为 DNS 域名，容器间可以通过服务名互相访问。

```yaml
services:
  web:          # 服务名，容器间可用此名称作为主机名访问
    image: nginx
  db:
    image: postgres
```

在同一个 Compose 网络内，`web` 容器可以通过 `http://db:5432` 访问数据库。

---

### 2.3 image vs build（使用镜像 vs 构建）

**使用现成镜像（image）：**

```yaml
services:
  redis:
    image: redis:7-alpine    # 直接拉取官方镜像
```

**从 Dockerfile 构建（build）：**

```yaml
services:
  web:
    build: .                 # 当前目录下的 Dockerfile
    # 或者详细写法：
    build:
      context: .             # 构建上下文目录
      dockerfile: Dockerfile # Dockerfile 文件名
      args:                  # 构建参数
        NODE_ENV: production
```

**两者不能同时省略**，但可以同时存在（构建后给镜像打标签）：

```yaml
services:
  web:
    build: .
    image: myapp:latest      # 构建后的镜像名称
```

---

### 2.4 ports（端口映射）

```yaml
services:
  web:
    ports:
      - "8080:80"            # 宿主机端口:容器端口
      - "443:443"
      - "127.0.0.1:3000:3000" # 只绑定本机回环地址，外部无法访问
```

> **安全提示**：数据库等服务建议**不暴露端口**到宿主机，只在内部网络通信。

---

### 2.5 environment / env_file（环境变量）

**内联方式（environment）：**

```yaml
services:
  db:
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret123
    # 或者列表写法：
    # environment:
    #   - POSTGRES_DB=myapp
    #   - POSTGRES_USER=admin
```

**引用 .env 文件（env_file）：**

```yaml
services:
  db:
    env_file:
      - .env                 # 相对于 docker-compose.yml 的路径
      - ./config/db.env
```

**.env 文件格式：**

```ini
POSTGRES_DB=myapp
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret123
```

> 变量也可以直接在 `docker-compose.yml` 中用 `${VAR}` 引用 `.env` 文件中的值：
> ```yaml
> services:
>   db:
>     image: postgres:15
>     environment:
>       POSTGRES_DB: ${DB_NAME}   # 从 .env 读取 DB_NAME
> ```

---

### 2.6 volumes（数据卷挂载）

```yaml
services:
  db:
    volumes:
      - db_data:/var/lib/postgresql/data   # 命名卷（持久化，推荐）
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # 绑定挂载（开发用）
      - /absolute/path:/container/path     # 绝对路径挂载

volumes:
  db_data:    # 声明命名卷，可加驱动选项
    driver: local
```

| 类型 | 语法 | 适用场景 |
|------|------|---------|
| 命名卷 | `卷名:容器路径` | 数据持久化，跨容器共享 |
| 绑定挂载 | `宿主机路径:容器路径` | 开发时热更新，配置文件 |
| 临时卷 | 不声明 | 容器删除后数据也消失 |

---

### 2.7 depends_on（依赖关系）

```yaml
services:
  web:
    depends_on:
      - db           # 简单依赖：db 启动后再启动 web
      - redis

  db:
    image: postgres:15
```

**带条件等待（推荐，配合 healthcheck）：**

```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy     # 等待 db 健康检查通过
      redis:
        condition: service_started     # 只等容器启动（默认行为）

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5
```

> **重要**：`depends_on` 只控制**启动顺序**，不保证服务就绪。务必配合 `healthcheck` 使用。

---

### 2.8 networks（网络配置）

```yaml
services:
  web:
    networks:
      - frontend
      - backend    # web 同时连接两个网络

  db:
    networks:
      - backend    # db 只在 backend 网络，外部不可访问

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true   # 禁止外部访问（适合数据库等内部服务）
```

Compose 默认会创建一个网络，所有服务自动加入。自定义网络可以实现**网络隔离**，提升安全性。

---

### 2.9 restart（重启策略）

```yaml
services:
  web:
    restart: unless-stopped   # 推荐：除非手动停止，否则自动重启
```

| 策略 | 说明 |
|------|------|
| `no` | 默认值，不自动重启 |
| `always` | 总是重启（包括手动停止后 Docker 重启时） |
| `unless-stopped` | 除非手动停止，否则自动重启（推荐） |
| `on-failure` | 仅在非零退出码时重启，可加次数限制 `on-failure:3` |

---

### 2.10 healthcheck（健康检查）

```yaml
services:
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d myapp"]
      interval: 10s       # 检查间隔
      timeout: 5s         # 超时时间
      retries: 5          # 连续失败几次标记为 unhealthy
      start_period: 30s   # 启动宽限期（不计入失败次数）

  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

健康检查状态可通过 `docker compose ps` 查看，也可以被 `depends_on` 的 `condition: service_healthy` 引用。

---

### 2.11 command / entrypoint（覆盖默认命令）

```yaml
services:
  web:
    command: npm run dev                # 覆盖 CMD
    # 或者列表形式：
    # command: ["npm", "run", "dev"]

  worker:
    entrypoint: /bin/sh                 # 覆盖 ENTRYPOINT
    command: -c "celery -A tasks worker"
```

> **区别**：`entrypoint` 是容器的主命令，`command` 是传给 entrypoint 的参数。通常只需修改 `command`。

---

### 2.12 labels / logging

**标签（labels）：**

```yaml
services:
  web:
    labels:
      - "com.example.description=Web 服务"
      - "com.example.team=backend"
    # 或字典写法：
    # labels:
    #   com.example.description: "Web 服务"
```

**日志配置（logging）：**

```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"      # 单个日志文件最大 10MB
        max-file: "3"        # 最多保留 3 个日志文件
```

---

## 3. 常用 docker compose 命令

### 启动服务

```bash
# 后台启动所有服务（推荐）
docker compose up -d

# 前台启动，查看实时日志（调试用）
docker compose up

# 启动指定服务
docker compose up -d web db

# 强制重新构建后启动
docker compose up -d --build
```

### 停止服务

```bash
# 停止并移除容器、网络（保留数据卷）
docker compose down

# 停止并移除容器、网络和数据卷（危险！会删除持久化数据）
docker compose down -v

# 停止并移除容器、网络，同时删除镜像
docker compose down --rmi all
```

### 查看状态

```bash
# 查看服务状态
docker compose ps

# 查看服务状态（详细）
docker compose ps -a
```

### 查看日志

```bash
# 查看所有服务日志
docker compose logs

# 实时追踪日志
docker compose logs -f

# 查看指定服务日志
docker compose logs -f web

# 查看最近 100 行日志
docker compose logs --tail=100 web
```

### 进入容器

```bash
# 在指定服务中执行命令
docker compose exec web sh
docker compose exec db psql -U admin -d myapp

# 执行一次性命令
docker compose exec web npm run migrate
```

### 构建镜像

```bash
# 重新构建所有有 build 配置的服务
docker compose build

# 只构建指定服务
docker compose build web

# 不使用缓存重新构建
docker compose build --no-cache
```

### 拉取镜像

```bash
# 拉取所有服务的最新镜像
docker compose pull

# 拉取指定服务
docker compose pull web
```

### 验证配置

```bash
# 检查 docker-compose.yml 语法是否正确
docker compose config

# 输出解析后的完整配置（包含变量替换结果）
docker compose config > resolved-config.yml
```

### 其他实用命令

```bash
# 重启指定服务
docker compose restart web

# 暂停/恢复服务（不销毁容器）
docker compose pause
docker compose unpause

# 查看服务使用的镜像
docker compose images

# 查看资源占用
docker compose top
```

---

## 4. 示例1：简单 Web 应用栈

一个典型的三层层应用：Node.js Web 应用 + Redis 缓存 + PostgreSQL 数据库。

### 目录结构

```
simple-stack/
├── docker-compose.yml
└── .env
```

### docker-compose.yml

```yaml
services:
  web:
    build:
      context: ../../02-dockerfile
      dockerfile: Dockerfile
    container_name: simple-web
    ports:
      - "${WEB_PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: simple-redis
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - app-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: simple-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 启动

```bash
cd simple-stack
docker compose up -d
docker compose ps
docker compose logs -f web
```

---

## 5. 示例2：全栈应用

一个完整的前后端分离应用：React 前端 + FastAPI 后端 + PostgreSQL 数据库 + Nginx 反向代理。

### 目录结构

```
full-stack/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   └── Dockerfile
└── nginx/
    └── nginx.conf
```

### 架构说明

```
用户请求
   │
   ▼
[Nginx:80]
   │
   ├── /api/*  ──►  [Backend:8000]  ──►  [PostgreSQL:5432]
   │
   └── /*      ──►  [Frontend:3000]
```

### 启动

```bash
cd full-stack

# 验证配置
docker compose config

# 构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 访问 http://localhost
```

详细文件内容请参考本目录下的完整文件。

---

## 6. 环境变量管理：.env 文件

Docker Compose 支持多种环境变量来源，优先级从高到低：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1（最高） | Shell 环境变量 | 当前终端已 export 的变量 |
| 2 | `.env` 文件 | 与 `docker-compose.yml` 同目录下的 `.env` |
| 3 | `env_file` 指定文件 | 服务配置中 `env_file` 指定的文件 |
| 4 | `environment` 字段 | 直接在 yml 中写死的值 |

### .env 文件规范

```ini
# 这是注释
POSTGRES_DB=myapp
POSTGRES_USER=admin
POSTGRES_PASSWORD=supersecret

# 端口配置
WEB_PORT=8080

# 可以引用其他变量（部分 shell 支持）
# DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

### 在 docker-compose.yml 中使用变量

```yaml
services:
  web:
    ports:
      - "${WEB_PORT:-80}:80"    # ${变量名:-默认值} 语法

  db:
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
```

### 多环境管理

```bash
# 使用不同 .env 文件
docker compose --env-file .env.development up -d
docker compose --env-file .env.production up -d
```

> **安全提醒**：`.env` 文件包含敏感信息，务必加入 `.gitignore`，不要提交到版本库。

---

## 7. 最佳实践

### 7.1 配置文件规范

```yaml
# 好的做法：清晰的注释和分组
services:
  # ============ Web 应用 ============
  web:
    build: .
    # ...

  # ============ 数据层 ============
  db:
    image: postgres:15-alpine
    # ...
```

### 7.2 开发 vs 生产环境分离

使用 `docker-compose.override.yml` 覆盖开发配置：

```yaml
# docker-compose.yml（基础配置，提交到 Git）
services:
  web:
    build: .
    ports:
      - "3000:3000"

# docker-compose.override.yml（开发覆盖，不提交到 Git）
services:
  web:
    volumes:
      - .:/app           # 绑定挂载，代码修改即时生效
    environment:
      NODE_ENV: development
```

```bash
# 开发（自动加载 override）
docker compose up -d

# 生产（只使用基础配置）
docker compose -f docker-compose.yml up -d
```

### 7.3 资源限制

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

### 7.4 安全实践

```yaml
services:
  web:
    # 不以 root 用户运行
    user: "1000:1000"
    # 只读根文件系统
    read_only: true
    tmpfs:
      - /tmp
    # 限制能力
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 7.5 日志与监控

```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### 7.6 常见陷阱

| 陷阱 | 说明 | 解决方法 |
|------|------|---------|
| 端口冲突 | 宿主机端口已被占用 | 使用 `${PORT:-默认值}` 灵活配置 |
| 数据库未就绪 | `depends_on` 不等待服务就绪 | 配合 `healthcheck` + `condition: service_healthy` |
| 数据丢失 | `docker compose down` 未保留卷 | 使用命名卷而非匿名卷 |
| 镜像过旧 | 缓存导致使用旧版本 | 定期执行 `docker compose pull` |
| .env 泄露 | 密码提交到 Git | 将 `.env` 加入 `.gitignore` |

---

## 总结

Docker Compose 是多容器应用编排的标准工具，掌握它可以大幅提升开发和部署效率。核心要点：

1. **一个 YAML 文件**描述所有服务及其关系
2. **一条命令**启动/停止整个应用栈
3. **healthcheck + depends_on**确保服务按正确顺序启动
4. **命名卷**保障数据持久化
5. **自定义网络**实现服务隔离与安全
6. **.env 文件**统一管理环境变量，敏感信息不入版本库

---

## 下一步

- [05-docker-networking](../05-docker-networking/) - Docker 网络深入解析
- [06-docker-volumes](../06-docker-volumes/) - 数据持久化与卷管理
