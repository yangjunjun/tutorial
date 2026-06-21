# 第六章：数据持久化 -- Volume 与 Bind Mount

> **核心问题**：容器是临时的，但数据不能是临时的。

---

## 6.1 为什么需要数据持久化

Docker 容器的设计哲学是**短暂性**（ephemeral）——容器可以随时被创建、销毁、重建。
然而，大多数真实应用都需要数据在容器生命周期之外继续存在：

```
容器生命周期：  [启动] ---> [运行] ---> [停止/删除]
                      ↑                    |
                      |                    v
                 容器内产生的数据        数据随之丢失！
```

**没有持久化时的典型问题**：

| 场景 | 后果 |
|------|------|
| 数据库容器被删除 | 所有数据记录丢失 |
| 应用容器重启 | 用户上传的文件消失 |
| 容器升级（删除旧容器 + 启动新容器） | 配置和状态数据全部丢失 |

**数据持久化的本质**：将数据的生命周期与容器的生命周期解耦。

```
容器生命周期：  [启动] ---> [运行] ---> [停止/删除]
                      |
                      v
               数据存储在容器外部（Volume / Bind Mount）
                      |
                      v
新容器启动：  [启动] ---> 挂载同一份数据 ---> 数据完好无损
```

---

## 6.2 三种持久化方式对比

Docker 提供三种将数据持久化到宿主机的机制：

### 6.2.1 Named Volumes（命名卷）

由 Docker 引擎管理的存储区域，具有独立的名称和生命周期。

```bash
# 创建命名卷
docker volume create mydata

# 在容器中使用
docker run -d \
  --name myapp \
  -v mydata:/app/data \
  myapp:latest
```

**存储位置**（Linux 默认）：
```
/var/lib/docker/volumes/mydata/_data
```

**特点**：
- Docker 完全托管，跨平台兼容
- 通过卷名称引用，无需关心宿主机具体路径
- 适合数据库、上传文件等需要持久存储的场景
- 多个容器可以同时挂载同一个命名卷

### 6.2.2 Bind Mounts（绑定挂载）

将宿主机文件系统中的任意目录或文件直接挂载到容器中。

```bash
docker run -d \
  --name myapp \
  -v /home/user/project/config:/app/config \
  myapp:latest
```

**特点**：
- 直接引用宿主机的具体路径
- 宿主机和容器之间实时同步（修改立即可见）
- 非常适合开发环境（热重载、调试配置文件）
- 需要管理宿主机路径的权限问题

### 6.2.3 tmpfs Mounts（临时文件系统）

数据存储在宿主机内存中，容器停止后自动清除，不会写入磁盘。

```bash
docker run -d \
  --name myapp \
  --tmpfs /app/tmp \
  myapp:latest
```

**特点**：
- 速度极快（内存读写）
- 不持久化到磁盘
- 适合存放临时文件、敏感信息（如密钥）
- 仅 Linux 支持（Windows 上等效方式不同）

### 对比总览

| 特性 | Named Volume | Bind Mount | tmpfs |
|------|:---:|:---:|:---:|
| 持久化到磁盘 | 是 | 是 | 否 |
| 宿主机路径可控 | 否（Docker 管理） | 是（用户指定） | 不适用 |
| 跨平台兼容 | 是 | 是 | 仅 Linux |
| 适合生产环境 | 推荐 | 谨慎使用 | 特定场景 |
| 适合开发环境 | 一般 | 推荐 | 一般 |
| 多容器共享 | 支持 | 支持 | 不支持 |
| 性能 | 良好 | 良好 | 极佳 |
| 权限管理 | Docker 管理 | 需手动管理 | 不涉及 |

---

## 6.3 常用卷命令

### 创建卷

```bash
# 创建命名卷
docker volume create mydata

# 创建时指定驱动和选项
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/export/data \
  nfs_volume
```

### 列出所有卷

```bash
docker volume ls

# 输出示例：
# DRIVER    VOLUME NAME
# local     mydata
# local     postgres_data
# local     redis_data
```

### 查看卷详细信息

```bash
docker volume inspect mydata

# 输出示例：
# [
#     {
#         "CreatedAt": "2025-01-15T10:30:00+08:00",
#         "Driver": "local",
#         "Labels": {},
#         "Mountpoint": "/var/lib/docker/volumes/mydata/_data",
#         "Name": "mydata",
#         "Options": {},
#         "Scope": "local"
#     }
# ]
```

### 删除卷

```bash
# 删除单个卷
docker volume rm mydata

# 注意：如果卷正在被容器使用，删除会失败
# Error: volume mydata is in use
```

### 清理未使用的卷

```bash
# 交互式清理（会提示确认）
docker volume prune

# 强制清理（跳过确认）
docker volume prune -f

# 清理所有未使用的卷（包括匿名卷）
docker volume prune --all -f
```

### 查找孤立卷（排查问题时有用）

```bash
# 列出所有未被任何容器引用的卷
docker volume ls -qf dangling=true
```

---

## 6.4 `-v` 与 `--mount` 的区别

Docker 提供两种语法来挂载存储，二者功能基本等价，但语义和灵活性不同。

### `-v` / `--volume`（传统语法）

```bash
# Named Volume
docker run -v mydata:/app/data myapp:latest

# Bind Mount
docker run -v /host/path:/container/path myapp:latest

# 只读挂载
docker run -v /host/path:/container/path:ro myapp:latest
```

语法格式：
```
-v <source>:<target>[:options]
```

其中 options 可以是 `ro`（只读）、`rw`（读写，默认）、`z`/`Z`（SELinux 标签）等，用逗号分隔。

### `--mount`（推荐语法）

```bash
# Named Volume
docker run --mount source=mydata,target=/app/data myapp:latest

# Bind Mount
docker run --mount type=bind,source=/host/path,target=/container/path myapp:latest

# 只读挂载
docker run --mount type=bind,source=/host/path,target=/container/path,readonly myapp:latest

# tmpfs
docker run --mount type=tmpfs,target=/app/tmp myapp:latest
```

语法格式：
```
--mount type=<type>,source=<src>,target=<tgt>[,option=value]
```

### 主要区别

| 方面 | `-v` | `--mount` |
|------|------|-----------|
| 语法 | 简洁，冒号分隔 | 冗长，键值对 |
| 可读性 | 一般 | 更好 |
| 参数校验 | 宽松（路径不存在时自动创建目录） | 严格（路径不存在时报错） |
| 指定卷驱动选项 | 不支持 | 支持（`volume-driver`、`volume-opt`） |
| 指定 tmpfs 大小 | 不支持 | 支持（`tmpfs-size`） |
| Docker 官方推荐 | 旧版兼容 | **推荐** |

> **建议**：新项目优先使用 `--mount`，语法更清晰、功能更完整。旧脚本中大量使用 `-v`，需要了解以便维护。

---

## 6.5 在 docker-compose.yml 中配置 Volumes

### 基本结构

```yaml
version: "3.9"

services:
  app:
    image: myapp:latest
    volumes:
      - app_data:/app/data           # 命名卷
      - ./config:/app/config         # bind mount（相对路径）
      - /var/log/myapp:/app/logs     # bind mount（绝对路径）

volumes:
  app_data:                          # 声明命名卷
    driver: local
```

### 高级配置

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    volumes:
      - pg_data:/var/lib/postgresql/data
      - type: bind
        source: ./init-scripts
        target: /docker-entrypoint-initdb.d
        read_only: true

  app:
    image: myapp:latest
    volumes:
      - shared_data:/app/shared
      - type: volume
        source: pg_data
        target: /db-snapshot
        read_only: true

volumes:
  pg_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/postgres         # 将命名卷绑定到指定宿主机目录
  shared_data:
    driver: local
```

### 使用外部卷

```yaml
volumes:
  existing_volume:
    external: true                   # 使用已存在的卷，不由 compose 管理
    name: my_existing_volume         # 指定实际卷名
```

---

## 6.6 实战：MySQL / PostgreSQL 数据持久化

### MySQL 持久化

```yaml
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-server
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      # 数据持久化
      - mysql_data:/var/lib/mysql
      # 自定义配置
      - ./config/my.cnf:/etc/mysql/conf.d/custom.cnf:ro
      # 初始化脚本（仅首次启动执行）
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    ports:
      - "3306:3306"

volumes:
  mysql_data:
    driver: local
```

**验证数据持久化**：

```bash
# 1. 启动容器并写入数据
docker compose up -d
docker exec -it mysql-server mysql -u root -p
# 创建数据库和表，插入数据
mysql> CREATE DATABASE test_db;
mysql> USE test_db;
mysql> CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50));
mysql> INSERT INTO users (name) VALUES ('Alice'), ('Bob');
mysql> SELECT * FROM users;
mysql> EXIT;

# 2. 销毁容器（注意：不带 -v，否则卷也会被删除！）
docker compose down

# 3. 重新启动
docker compose up -d

# 4. 验证数据仍在
docker exec -it mysql-server mysql -u root -p
mysql> USE test_db;
mysql> SELECT * FROM users;
# 结果：Alice 和 Bob 仍然在！
```

### PostgreSQL 持久化

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: postgres-server
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      # 数据持久化
      - pg_data:/var/lib/postgresql/data
      # 初始化脚本
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"

volumes:
  pg_data:
    driver: local
```

**PostgreSQL 备份与恢复**：

```bash
# 备份
docker exec postgres-server pg_dump -U postgres mydb > backup_$(date +%Y%m%d).sql

# 恢复
cat backup_20250115.sql | docker exec -i postgres-server psql -U postgres mydb

# 使用 pg_basebackup 进行物理备份（适合大型数据库）
docker exec postgres-server pg_basebackup -U postgres -D /tmp/backup -Ft -z
docker cp postgres-server:/tmp/backup ./pg_backup_$(date +%Y%m%d)
```

---

## 6.7 最佳实践

### 6.7.1 备份卷

**方法一：使用临时容器 + tar**

```bash
# 备份
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mydata_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# 恢复
docker run --rm \
  -v mydata:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mydata_backup_20250115_120000.tar.gz -C /target
```

**方法二：使用专用备份容器**

```yaml
version: "3.9"

services:
  backup:
    image: alpine
    volumes:
      - pg_data:/source:ro
      - ./backups:/backup
    command: >
      sh -c "tar czf /backup/pg_data_$$(date +%Y%m%d_%H%M%S).tar.gz -C /source ."
    profiles:
      - backup    # 不会随 docker compose up 自动启动
```

```bash
# 执行备份
docker compose run --rm backup
```

**方法三：数据库原生备份（推荐用于数据库）**

```bash
# PostgreSQL
docker exec postgres-server pg_dumpall -U postgres | gzip > full_backup_$(date +%Y%m%d).sql.gz

# MySQL
docker exec mysql-server mysqldump -u root -p --all-databases | gzip > full_backup_$(date +%Y%m%d).sql.gz
```

### 6.7.2 卷权限管理

**常见权限问题及解决方案**：

```bash
# 问题：容器内进程无法写入挂载目录
# 原因：宿主机目录的所有者与容器内运行用户的 UID 不匹配

# 方案 1：在 Dockerfile 中设置用户
# USER appuser

# 方案 2：在 docker-compose.yml 中指定用户
services:
  app:
    image: myapp:latest
    user: "1000:1000"       # 使用宿主机用户的 UID:GID
    volumes:
      - app_data:/app/data

# 方案 3：使用 entrypoint 脚本修复权限
# entrypoint.sh:
#   chown -R appuser:appuser /app/data
#   exec "$@"
```

**只读挂载原则**：

```yaml
# 配置文件：只读
volumes:
  - ./config:/app/config:ro

# 数据目录：读写
volumes:
  - app_data:/app/data:rw
```

### 6.7.3 开发环境 vs 生产环境

#### 开发环境（推荐 Bind Mount）

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      # 源码挂载 —— 实现热重载
      - ./src:/app/src
      # 配置文件挂载 —— 修改即时生效
      - ./config:/app/config
      # node_modules 例外 —— 使用容器内的版本
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

**开发环境特点**：
- 源码直接挂载，修改后容器内实时反映
- 方便调试，无需重新构建镜像
- 配置修改不需要重启容器

#### 生产环境（推荐 Named Volume）

```yaml
version: "3.9"

services:
  app:
    image: myapp:1.0.0
    volumes:
      # 使用命名卷 —— 由 Docker 管理
      - app_data:/app/data
      - app_logs:/app/logs
      # 配置文件打包在镜像中或使用 ConfigMap
    environment:
      - NODE_ENV=production

volumes:
  app_data:
    driver: local
  app_logs:
    driver: local
```

**生产环境特点**：
- 数据与代码分离，镜像不可变
- 命名卷由 Docker 统一管理，便于迁移和备份
- 避免宿主机路径依赖，提升可移植性

#### 环境选择决策树

```
需要持久化数据吗？
├── 否 → 不需要卷（或使用 tmpfs 存放临时文件）
└── 是 → 是开发环境吗？
    ├── 是 → 需要实时同步代码/配置吗？
    │   ├── 是 → Bind Mount
    │   └── 否 → Named Volume
    └── 否（生产/测试） → Named Volume
        └── 需要高性能或特殊存储需求？
            ├── 是 → 自定义驱动（NFS、Ceph 等）
            └── 否 → Named Volume（local 驱动）
```

### 6.7.4 其他注意事项

1. **不要在 docker compose down 时加 `-v` 参数**，除非你确定不再需要数据：
   ```bash
   # 危险！这会删除所有关联的命名卷！
   docker compose down -v

   # 安全：仅停止容器，保留数据卷
   docker compose down
   ```

2. **定期清理匿名卷**：
   ```bash
   # 匿名卷（没有名称的卷）容易堆积，占用磁盘空间
   docker volume prune
   ```

3. **为卷设置有意义的名称**：
   ```yaml
   volumes:
     # 好：清晰表达用途
     postgres_data:
     redis_cache:
     app_uploads:

     # 差：含义模糊
     data:
     storage:
   ```

4. **日志轮转**：避免卷空间无限增长
   ```bash
   # 在 Docker daemon 配置中设置日志大小限制
   # /etc/docker/daemon.json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

---

## 小结

| 知识点 | 要点 |
|--------|------|
| 为什么需要持久化 | 容器是临时的，数据不能是临时的 |
| Named Volume | 生产环境首选，Docker 托管，安全可控 |
| Bind Mount | 开发环境利器，实时同步，注意权限 |
| tmpfs | 特殊场景，内存存储，容器停止即清除 |
| `-v` vs `--mount` | 新项目推荐 `--mount`，功能更完整 |
| 备份策略 | 数据库用原生工具，通用卷用 tar |
| 环境差异 | 开发用 Bind Mount，生产用 Named Volume |

---

**下一章**：[07 - Docker 网络详解](../07-docker-networking/readme.md)
