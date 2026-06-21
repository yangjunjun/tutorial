# Dockerfile 语法详解与镜像构建

## 1. Dockerfile 是什么

Dockerfile 是一个文本文件，包含了构建 Docker 镜像所需的全部指令。Docker 引擎读取 Dockerfile 中的指令，按顺序执行，最终生成一个可用的镜像。

可以将 Dockerfile 理解为"镜像的配方"——它描述了从基础镜像出发，经过哪些步骤（安装依赖、复制代码、配置环境变量等），最终得到一个可运行的容器镜像。

**基本工作流程：**

```
编写 Dockerfile  →  docker build 构建镜像  →  docker run 运行容器
```

**命名规范：**
- 默认文件名为 `Dockerfile`（无扩展名），Docker 会自动识别
- 也可以使用 `-f` 参数指定其他文件名，如 `Dockerfile.dev`、`Dockerfile.prod`

---

## 2. 核心指令详解

### 2.1 FROM — 基础镜像选择

`FROM` 是 Dockerfile 中最重要的指令，它指定了构建的起点——基础镜像。每个 Dockerfile 必须以 `FROM` 指令开头（`ARG` 除外）。

**语法：**

```dockerfile
FROM <镜像名>:<标签>
FROM <镜像名>:<标签> AS <阶段名>   # 多阶段构建
```

**标签规范：**

| 标签类型 | 示例 | 说明 |
|---------|------|------|
| 具体版本号 | `node:18.17.0` | 最精确，生产环境推荐 |
| 小版本号 | `node:18.17` | 允许补丁更新 |
| 大版本号 | `node:18` | 允许小版本更新 |
| `latest` | `node:latest` | 不推荐，结果不可预测 |
| 变体标签 | `node:18-alpine` | 指定发行版变体 |

**示例：**

```dockerfile
# 推荐：使用精确版本 + alpine 变体
FROM node:18-alpine

# 推荐：Python slim 变体
FROM python:3.11-slim

# 多阶段构建
FROM node:18-alpine AS builder
FROM node:18-alpine AS production
```

**常用基础镜像变体：**

- `alpine`：基于 Alpine Linux，体积极小（~5MB），适合生产环境
- `slim`：Debian 的精简版，比完整版小很多，兼容性比 alpine 好
- `distroless`：Google 推出的超小镜像，只包含运行时，没有包管理器
- 无后缀：完整版，体积大，但工具齐全，适合开发调试

---

### 2.2 WORKDIR — 工作目录设置

`WORKDIR` 设置后续指令（`RUN`、`CMD`、`ENTRYPOINT`、`COPY`、`ADD`）的工作目录。如果目录不存在，Docker 会自动创建。

**语法：**

```dockerfile
WORKDIR <路径>
```

**示例：**

```dockerfile
# 设置工作目录
WORKDIR /app

# 后续的 COPY 和 RUN 都在 /app 下执行
COPY package.json .
RUN npm install

# 可以多次调用，改变当前工作目录
WORKDIR /app/src
```

**最佳实践：**
- 使用绝对路径，避免歧义
- 在 Dockerfile 开头就设置好 WORKDIR
- 不要使用 `/root` 或 `/` 作为工作目录

---

### 2.3 COPY vs ADD — 文件复制

`COPY` 和 `ADD` 都能将文件从宿主机复制到镜像中，但功能有所不同。

**语法：**

```dockerfile
COPY <源路径> <目标路径>
COPY ["<源路径>", "<目标路径>"]    # 路径含空格时使用

ADD <源路径> <目标路径>
ADD ["<源路径>", "<目标路径>"]
```

**区别对比：**

| 特性 | COPY | ADD |
|------|------|-----|
| 复制本地文件 | 支持 | 支持 |
| 复制目录 | 支持 | 支持 |
| 自动解压 tar 包 | 不支持 | 支持 |
| 下载远程 URL | 不支持 | 支持（不推荐） |
| 从构建阶段复制 | 支持（`--from`） | 不支持 |

**示例：**

```dockerfile
# 推荐用 COPY 复制普通文件
COPY package.json package-lock.json ./
COPY src/ ./src/

# ADD 的自动解压功能
ADD app.tar.gz /app/    # 自动解压到 /app/

# 多阶段构建中，只能使用 COPY --from
COPY --from=builder /app/dist ./dist
```

**最佳实践：**
- **优先使用 `COPY`**，语义更明确，行为更可预测
- 只在需要自动解压 tar 包时使用 `ADD`
- 不要用 `ADD` 下载远程文件，应使用 `RUN curl` 或 `RUN wget` 代替
- 分开复制不常变动的文件（如依赖清单）和频繁变动的文件（如源代码），以利用构建缓存

---

### 2.4 RUN — 执行命令

`RUN` 指令在构建阶段执行命令，每条 `RUN` 指令都会创建一个新的镜像层。

**语法：**

```dockerfile
# Shell 形式（默认，使用 /bin/sh -c）
RUN <命令>

# Exec 形式
RUN ["命令", "参数1", "参数2"]
```

**减少层数的技巧：**

```dockerfile
# 不好：3 条 RUN = 3 层
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# 好：用 && 连接，1 条 RUN = 1 层
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
```

**常见示例：**

```dockerfile
# Debian/Ubuntu 安装软件
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Alpine 安装软件
RUN apk add --no-cache curl git

# Node.js 安装依赖
RUN npm ci --only=production

# Python 安装依赖
RUN pip install --no-cache-dir -r requirements.txt
```

**注意事项：**
- `RUN` 在构建时执行，不是在容器运行时执行
- 每条 `RUN` 都会产生新的层，层数过多会导致镜像臃肿
- 使用 `\` 换行提高可读性
- 安装完软件后清理包管理器缓存，减小镜像体积

---

### 2.5 ENV — 环境变量

`ENV` 设置环境变量，在构建阶段和容器运行阶段都生效。

**语法：**

```dockerfile
# 形式一：key=value（推荐，支持多个）
ENV KEY1=value1 KEY2=value2

# 形式二：key value（旧语法，一次只能设一个）
ENV KEY value
```

**示例：**

```dockerfile
# 设置 Node.js 环境
ENV NODE_ENV=production
ENV PORT=3000

# 设置 Python 环境
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 多个变量一起设置
ENV APP_HOME=/app \
    APP_USER=appuser \
    LOG_LEVEL=info
```

**在运行时覆盖：**

```bash
# 使用 -e 参数覆盖环境变量
docker run -e NODE_ENV=development -p 3000:3000 myapp
```

---

### 2.6 EXPOSE — 端口声明

`EXPOSE` 声明容器在运行时监听的端口，仅作文档用途，**不会实际映射端口**。

**语法：**

```dockerfile
EXPOSE <端口号>
EXPOSE <端口号>/<协议>    # 协议可选 tcp 或 udp，默认 tcp
```

**示例：**

```dockerfile
# 声明单个端口
EXPOSE 3000

# 声明多个端口
EXPOSE 80 443

# 指定协议
EXPOSE 53/udp
```

**重要说明：**

```bash
# EXPOSE 不会自动映射端口！运行时仍需 -p 参数
docker run -p 3000:3000 myapp

# -P（大写）会自动映射所有 EXPOSE 的端口到随机宿主机端口
docker run -P myapp
```

---

### 2.7 CMD vs ENTRYPOINT — 容器启动命令

`CMD` 和 `ENTRYPOINT` 都定义了容器启动时执行的命令，但行为不同。

**语法：**

```dockerfile
# CMD 语法
CMD ["命令", "参数1"]         # Exec 形式（推荐）
CMD 命令 参数1                # Shell 形式
CMD ["参数1"]                 # 作为 ENTRYPOINT 的默认参数

# ENTRYPOINT 语法
ENTRYPOINT ["命令", "参数1"]  # Exec 形式（推荐）
ENTRYPOINT 命令 参数1         # Shell 形式（不推荐）
```

**区别对比：**

| 特性 | CMD | ENTRYPOINT |
|------|-----|------------|
| 是否可被 `docker run` 参数覆盖 | 可以，直接替换 | 不可以（需要 `--entrypoint`） |
| 用途 | 提供默认命令 | 定义容器的主进程 |
| 推荐形式 | Exec 形式 | Exec 形式 |

**示例：**

```dockerfile
# 仅使用 CMD — 可被覆盖
CMD ["node", "server.js"]
# docker run myapp bash  → 运行 bash 而非 node

# 仅使用 ENTRYPOINT — 不可被简单覆盖
ENTRYPOINT ["node", "server.js"]
# docker run myapp bash  → 运行 node server.js bash（bash 被当作参数）

# CMD + ENTRYPOINT 组合使用（推荐）
ENTRYPOINT ["node"]
CMD ["server.js"]
# docker run myapp          → node server.js
# docker run myapp app.js   → node app.js（覆盖 CMD）
```

**最佳实践：**
- 优先使用 Exec 形式（JSON 数组），避免 Shell 解析问题
- 如果容器有一个明确的主进程，用 `ENTRYPOINT`
- 如果需要灵活切换启动命令，用 `CMD`
- 组合使用时，`ENTRYPOINT` 放主程序，`CMD` 放默认参数

---

### 2.8 ARG — 构建参数

`ARG` 定义构建时变量，仅在构建阶段有效，不会存在于最终镜像中。

**语法：**

```dockerfile
ARG <变量名>=<默认值>
ARG <变量名>                # 无默认值，构建时必须传入
```

**示例：**

```dockerfile
# 定义构建参数
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine

# 构建时使用 ARG 控制行为
ARG APP_ENV=production
RUN npm install --only=${APP_ENV}

# 将 ARG 转为 ENV（如果需要运行时使用）
ARG BUILD_TIME
ENV BUILD_TIME=${BUILD_TIME}
```

**构建时传入参数：**

```bash
# 传入 ARG
docker build --build-arg NODE_VERSION=20 -t myapp .
docker build --build-arg APP_ENV=development -t myapp .
```

**ARG vs ENV 对比：**

| 特性 | ARG | ENV |
|------|-----|-----|
| 构建阶段可用 | 是 | 是 |
| 运行时可用 | 否 | 是 |
| 构建时传入 | `--build-arg` | 不适用 |
| 写入镜像 | 否 | 是 |
| 典型用途 | 版本号、构建配置 | 运行时配置 |

---

### 2.9 VOLUME — 数据卷声明

`VOLUME` 声明容器中的挂载点，用于持久化数据。

**语法：**

```dockerfile
VOLUME ["/data"]
VOLUME /data
VOLUME ["/data", "/logs"]
```

**示例：**

```dockerfile
# 声明数据卷
VOLUME /app/data
VOLUME /var/log/app

# 运行时指定宿主机路径
# docker run -v /host/data:/app/data myapp
```

**注意：** Dockerfile 中的 `VOLUME` 只是声明，实际挂载路径在运行时通过 `-v` 或 `--mount` 指定。

---

### 2.10 USER — 用户切换

`USER` 设置后续指令和容器运行时使用的用户身份。

**语法：**

```dockerfile
USER <用户名|UID>[:<用户组|GID>]
```

**示例：**

```dockerfile
# 创建专用用户并切换
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 使用 UID/GID（更安全，不依赖用户名）
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser:appgroup
```

---

### 2.11 LABEL — 元数据

`LABEL` 为镜像添加键值对形式的元数据。

**语法：**

```dockerfile
LABEL <键>=<值>
```

**示例：**

```dockerfile
LABEL maintainer="zhangsan@example.com"
LABEL version="1.0.0"
LABEL description="用户管理服务"

# OCI 标准标签
LABEL org.opencontainers.image.source="https://github.com/example/app"
LABEL org.opencontainers.image.licenses="MIT"
```

---

### 2.12 .dockerignore — 忽略文件

`.dockerignore` 文件放在构建上下文根目录，用于排除不需要发送到 Docker 守护进程的文件，类似于 `.gitignore`。

**语法示例：**

```
# 注释行
node_modules
npm-debug.log
.git
.gitignore
.env
*.md
Dockerfile
.dockerignore
.vscode
coverage
```

**为什么要用 .dockerignore：**
- **减小构建上下文体积**：大文件发送到守护进程会拖慢构建速度
- **保护敏感信息**：防止 `.env`、密钥文件等被意外复制进镜像
- **避免缓存失效**：排除频繁变动但不影响构建的文件（如测试文件），防止 `COPY` 缓存失效

---

## 3. 镜像构建最佳实践

### 3.1 选择合适的基础镜像

| 镜像变体 | 大小 | 适用场景 | 说明 |
|---------|------|---------|------|
| `alpine` | ~5MB | 生产环境 | 最小体积，使用 musl libc，部分 C 扩展可能有兼容问题 |
| `slim` | ~80MB | 生产环境（需要 glibc） | Debian 精简版，兼容性好 |
| `distroless` | ~20MB | 高安全要求 | 无 Shell、无包管理器，攻击面最小 |
| 完整版 | ~900MB | 开发/调试 | 工具齐全，但不适合生产 |

**建议：**

```dockerfile
# Node.js 应用：优先 alpine
FROM node:18-alpine

# Python 应用：优先 slim（alpine 对 Python C 扩展支持不佳）
FROM python:3.11-slim

# Go 应用：多阶段构建 + distroless
FROM golang:1.21 AS builder
# ... 编译 ...
FROM gcr.io/distroless/static
COPY --from=builder /app/main /main
```

### 3.2 利用构建缓存（层顺序优化）

Docker 按顺序逐层构建，每一层会利用上一次的缓存（如果该层指令和输入没有变化）。**一旦某层缓存失效，后续所有层都会重新构建。**

**不好的顺序：**

```dockerfile
# 源代码变动 → 整个依赖重新安装
COPY . .
RUN npm install        # 每次改代码都要重装依赖！
```

**好的顺序：**

```dockerfile
# 1. 先复制不常变动的依赖清单
COPY package.json package-lock.json ./

# 2. 安装依赖（只要 package.json 不变，就会用缓存）
RUN npm ci

# 3. 再复制频繁变动的源代码
COPY . .
```

**层顺序原则：不常变动的在前，频繁变动的在后。**

### 3.3 减小镜像体积的技巧

```dockerfile
# 1. 使用 alpine 或 slim 基础镜像
FROM python:3.11-slim

# 2. 合并 RUN 指令，安装后清理缓存
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 3. pip 安装时加 --no-cache-dir
RUN pip install --no-cache-dir -r requirements.txt

# 4. npm 安装时加 --only=production
RUN npm ci --only=production && npm cache clean --force

# 5. 使用多阶段构建，丢弃构建工具
FROM node:18-alpine AS builder
RUN npm ci && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist ./dist
# 最终镜像不包含 node_modules 中的开发依赖

# 6. 不要安装不必要的软件
# 不好：安装完整 vim
RUN apt-get install -y vim
# 好：不需要就不装，需要时用 vi 或 nano
```

### 3.4 安全性 — 非 root 用户

容器默认以 root 用户运行，这在生产环境中存在安全隐患。最佳实践是创建专用用户。

```dockerfile
# Debian/Ubuntu 方式
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser

# Alpine 方式
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
```

**安全清单：**
- 始终以非 root 用户运行应用
- 使用 `COPY --chown` 确保文件属主正确
- 不要在镜像中硬编码密钥或密码
- 定期更新基础镜像修复安全漏洞
- 使用只读文件系统 `docker run --read-only`

### 3.5 .dockerignore 的作用

一个完善的 `.dockerignore` 文件应该包含：

```
# 版本控制
.git
.gitignore

# 依赖目录（容器内会重新安装）
node_modules
__pycache__
.venv
venv

# 构建产物
dist
build

# IDE 配置
.vscode
.idea

# 文档
*.md
LICENSE

# Docker 文件本身
Dockerfile
docker-compose.yml
.dockerignore

# 测试文件
coverage
.nyc_output
*.test.js
*.spec.ts

# 敏感文件
.env
.env.*
*.pem
*.key
```

---

## 4. docker build 命令详解

### 基本语法

```bash
docker build [选项] <构建上下文路径>
```

### 常用参数

#### `-t`：为镜像打标签

```bash
# 指定名称和标签
docker build -t myapp:1.0.0 .
docker build -t myapp:latest .

# 可以同时打多个标签
docker build -t myapp:1.0.0 -t myapp:latest .
```

#### `--no-cache`：禁用构建缓存

```bash
# 强制重新构建所有层，不使用缓存
docker build --no-cache -t myapp .

# 适用场景：
# - 怀疑缓存导致问题
# - 需要确保拉取最新的基础镜像
# - RUN 指令中有 apt-get update 等需要最新数据的命令
```

#### `--build-arg`：传入构建参数

```bash
# 传入单个参数
docker build --build-arg NODE_VERSION=20 -t myapp .

# 传入多个参数
docker build \
    --build-arg NODE_VERSION=20 \
    --build-arg APP_ENV=staging \
    -t myapp .

# 对应的 Dockerfile 中使用 ARG 接收
# ARG NODE_VERSION=18
# FROM node:${NODE_VERSION}-alpine
```

#### `-f`：指定 Dockerfile 路径

```bash
# 使用非默认名称的 Dockerfile
docker build -f Dockerfile.prod -t myapp .
docker build -f docker/Dockerfile.dev -t myapp-dev .

# 适用场景：不同环境使用不同的 Dockerfile
# Dockerfile.dev   → 开发环境
# Dockerfile.prod  → 生产环境
# Dockerfile.test  → 测试环境
```

### 完整构建示例

```bash
# 生产构建
docker build \
    -f Dockerfile.prod \
    -t myapp:1.0.0 \
    -t myapp:latest \
    --build-arg NODE_ENV=production \
    --no-cache \
    .

# 开发构建
docker build \
    -f Dockerfile.dev \
    -t myapp:dev \
    --build-arg NODE_ENV=development \
    .
```

### 查看镜像构建历史

```bash
# 查看镜像的每一层信息
docker history myapp:latest

# 查看镜像详细信息
docker inspect myapp:latest
```

---

## 附录：指令速查表

| 指令 | 作用 | 示例 |
|------|------|------|
| `FROM` | 指定基础镜像 | `FROM node:18-alpine` |
| `WORKDIR` | 设置工作目录 | `WORKDIR /app` |
| `COPY` | 复制文件到镜像 | `COPY src/ ./src/` |
| `ADD` | 复制文件（支持解压/URL） | `ADD app.tar.gz /app/` |
| `RUN` | 构建时执行命令 | `RUN npm ci` |
| `ENV` | 设置环境变量 | `ENV NODE_ENV=production` |
| `EXPOSE` | 声明端口 | `EXPOSE 3000` |
| `CMD` | 容器启动命令（可覆盖） | `CMD ["node", "server.js"]` |
| `ENTRYPOINT` | 容器启动命令（不可覆盖） | `ENTRYPOINT ["node"]` |
| `ARG` | 构建时变量 | `ARG VERSION=1.0` |
| `VOLUME` | 声明数据卷 | `VOLUME /data` |
| `USER` | 切换用户 | `USER appuser` |
| `LABEL` | 添加元数据 | `LABEL version="1.0"` |
