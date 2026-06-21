# NestJS Docker 容器化部署完整指南

> **阶段 5：生产部署与 DevOps** - 本项目是一个生产就绪的 NestJS 应用，配备完整的 Docker 容器化、CI/CD 流水线、健康检查和监控体系。

---

## 目录

- [项目概述](#项目概述)
- [核心知识点](#核心知识点)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [Docker 容器化](#docker-容器化)
  - [Dockerfile 详解](#dockerfile-详解)
  - [多阶段构建原理](#多阶段构建原理)
  - [Docker Compose 使用](#docker-compose-使用)
- [CI/CD 流水线](#cicd-流水线)
- [健康检查机制](#健康检查机制)
  - [Liveness Probe](#liveness-probe-存活探针)
  - [Readiness Probe](#readiness-probe-就绪探针)
  - [Startup Probe](#startup-probe-启动探针)
- [监控指标](#监控指标)
  - [Prometheus 集成](#prometheus-集成)
  - [自定义指标](#自定义指标)
- [安全最佳实践](#安全最佳实践)
- [环境变量参考](#环境变量参考)
- [Kubernetes 部署参考](#kubernetes-部署参考)
- [性能优化](#性能优化)
- [常见问题排查](#常见问题排查)

---

## 项目概述

本项目演示了如何将 NestJS 应用从开发到部署的完整 DevOps 流程。涵盖以下核心主题：

| 主题 | 说明 |
|------|------|
| Docker 多阶段构建 | 优化镜像大小，分离构建和运行环境 |
| Docker Compose | 编排多容器应用（应用 + 数据库 + Redis） |
| CI/CD 流水线 | GitHub Actions 自动化测试和部署 |
| 健康检查 | Kubernetes 存活/就绪/启动探针 |
| 监控指标 | Prometheus 格式的指标暴露 |
| 安全加固 | Helmet、非 root 用户、资源限制 |
| 优雅关闭 | 处理 SIGTERM，完成未完成的请求 |

---

## 核心知识点

### 为什么需要容器化？

```
传统部署:    代码 → 手动配置服务器 → 祈祷能跑 → 出了问题很难复现
容器化部署:  代码 → Dockerfile → 镜像 → 任何环境一致运行
```

**容器化的优势：**
1. **环境一致性** - 开发、测试、生产使用完全相同的运行环境
2. **快速部署** - 秒级启动，无需手动安装依赖
3. **资源隔离** - 每个容器有自己的 CPU、内存、网络隔离
4. **水平扩展** - 轻松创建多个副本应对流量高峰
5. **回滚便捷** - 保留历史镜像标签，随时回滚到稳定版本

---

## 项目结构

```
16-docker-deploy/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD 流水线配置
├── src/
│   ├── app/
│   │   ├── app.controller.ts   # 应用控制器（路由处理）
│   │   ├── app.module.ts       # 根模块（应用配置）
│   │   └── app.service.ts      # 应用服务（业务逻辑）
│   ├── common/
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts  # 全局异常过滤器
│   │   └── middleware/
│   │       ├── request-id.middleware.ts     # 请求 ID 中间件
│   │       └── logging.middleware.ts        # 结构化日志中间件
│   ├── config/
│   │   └── app.config.ts       # 应用配置（含环境变量验证）
│   ├── health/
│   │   ├── health.controller.ts # 健康检查端点
│   │   └── health.module.ts    # 健康检查模块
│   ├── metrics/
│   │   ├── metrics.controller.ts # 指标暴露端点
│   │   ├── metrics.interceptor.ts # 请求指标拦截器
│   │   ├── metrics.module.ts   # 指标模块
│   │   └── metrics.service.ts  # 指标收集服务
│   └── main.ts                 # 应用入口文件
├── test/
│   ├── app.e2e-spec.ts         # 应用 E2E 测试
│   ├── health.e2e-spec.ts      # 健康检查 E2E 测试
│   └── jest-e2e.json           # E2E 测试配置
├── .dockerignore               # Docker 构建忽略文件
├── .env.example                # 环境变量模板
├── .eslintrc.js                # ESLint 配置
├── .gitignore                  # Git 忽略文件
├── .prettierrc                 # Prettier 配置
├── docker-compose.yml          # Docker Compose 配置（生产+开发）
├── docker-compose.dev.yml      # Docker Compose 开发覆盖配置
├── Dockerfile                  # 多阶段 Docker 构建文件
├── nest-cli.json               # NestJS CLI 配置
├── package.json                # 项目依赖和脚本
├── tsconfig.json               # TypeScript 配置
├── tsconfig.build.json         # 编译专用配置
└── README.md                   # 本文档
```

---

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 8+
- Docker 和 Docker Compose（容器化部署时需要）

### 方式一：本地运行

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量文件
cp .env.example .env

# 3. 开发模式启动（带热重载）
pnpm start:dev

# 4. 访问应用
# http://localhost:3000          - API 信息
# http://localhost:3000/health   - 健康检查
# http://localhost:3000/metrics  - 监控指标
```

### 方式二：Docker 运行

```bash
# 1. 构建并启动生产容器
docker compose up -d app

# 2. 访问应用
# http://localhost:3000

# 3. 查看日志
docker compose logs -f app

# 4. 停止
docker compose down
```

### 方式三：Docker 开发环境（含数据库和 Redis）

```bash
# 启动开发环境（应用 + PostgreSQL + Redis）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 应用: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 开发模式（文件变更自动重启）
pnpm start:dev

# 调试模式（支持断点调试）
pnpm start:debug

# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 运行单元测试
pnpm test

# 运行测试覆盖率
pnpm test:cov

# 运行 E2E 测试
pnpm test:e2e
```

### 项目脚本说明

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `start:dev` | 开发模式，文件变更自动重启 | 日常开发 |
| `start:debug` | 调试模式，支持 Inspector | 断点调试 |
| `start:prod` | 生产模式，直接运行编译产物 | 生产环境 |
| `build` | 编译 TypeScript 为 JavaScript | 构建部署包 |
| `lint` | ESLint 代码检查 | 提交前检查 |
| `format` | Prettier 格式化 | 统一代码风格 |
| `test` | 运行单元测试 | 开发验证 |
| `test:cov` | 运行覆盖率测试 | CI/CD 质量门禁 |
| `test:e2e` | 运行端到端测试 | 部署前验证 |

---

## Docker 容器化

### Dockerfile 详解

本项目使用**多阶段构建**（Multi-stage Build），这是生产级 Docker 镜像的核心模式。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stage 1: deps  │───▶│  Stage 2: build │───▶│ Stage 3: prod   │
│                 │    │                 │    │                 │
│ - package.json  │    │ - node_modules  │    │ - prod deps     │
│ - pnpm install  │    │ - source code   │    │ - dist/         │
│ - all deps      │    │ - pnpm build    │    │ - non-root user │
│   (含 devDeps)  │    │ - TypeScript    │    │ - HEALTHCHECK   │
│                 │    │   → JavaScript  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
      安装依赖               编译代码              最终镜像
```

**每个阶段的详细说明：**

#### Stage 1: 依赖安装（deps）

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
```

- **为什么先复制 package.json？** 利用 Docker 层缓存。只要 package.json 和 lock 文件不变，这一层就不会重新执行 `pnpm install`，大幅加快构建速度。
- **为什么使用 `--frozen-lockfile`？** 确保安装的依赖与 lock 文件完全一致，避免"在我机器上能跑"的问题。
- **为什么安装 devDependencies？** 编译 TypeScript 需要 `@nestjs/cli`、`typescript` 等开发工具。

#### Stage 2: 编译构建（build）

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build
```

- **从 deps 阶段复制 node_modules**：避免重复安装
- **COPY . .**：复制所有源代码（.dockerignore 会排除不需要的文件）
- **pnpm build**：编译 TypeScript 为 JavaScript，输出到 `dist/` 目录

#### Stage 3: 生产运行（production）

```dockerfile
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3000/health/live || exit 1
CMD ["node", "dist/main.js"]
```

- **只安装生产依赖**：`--prod` 跳过 devDependencies，大幅减小镜像体积
- **非 root 用户**：安全最佳实践，防止容器逃逸攻击
- **HEALTHCHECK**：Docker 内置的健康检查
- **直接运行 JavaScript**：使用 `node dist/main.js` 而不是 `nest start`，更高效

### 多阶段构建原理

**镜像大小对比：**

| 构建方式 | 包含内容 | 镜像大小（约） |
|----------|----------|----------------|
| 单阶段（含 devDeps） | 所有依赖 + 源码 + 编译产物 | ~800MB |
| 单阶段（仅 prodDeps） | 生产依赖 + 编译产物 | ~200MB |
| 多阶段构建 | 生产依赖 + 编译产物 | ~150MB |

**构建缓存优化：**

```
Layer 1: FROM node:20-alpine          ← 基础镜像（缓存命中率高）
Layer 2: COPY package.json lock.yaml  ← 依赖描述（变更频率低）
Layer 3: RUN pnpm install             ← 依赖安装（变更频率低，缓存命中率高）
Layer 4: COPY . .                     ← 源代码（变更频率高）
Layer 5: RUN pnpm build               ← 编译（每次代码变更都重新执行）
```

### Docker Compose 使用

#### 生产环境

```bash
# 启动生产服务
docker compose up -d app

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app

# 重新构建（代码更新后）
docker compose up -d --build app

# 停止服务
docker compose down
```

#### 开发环境（含完整服务栈）

```bash
# 启动开发环境（应用 + PostgreSQL + Redis）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 只启动依赖服务（数据库 + Redis），本地运行应用
docker compose -f docker-compose.dev.yml up postgres redis

# 清理数据卷（重置数据库）
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

#### 常用 Docker 命令

```bash
# 构建镜像（不使用缓存）
docker build --no-cache -t nestjs-app .

# 运行容器
docker run -d --name my-app -p 3000:3000 nestjs-app

# 进入容器 Shell
docker exec -it my-app sh

# 查看容器资源使用
docker stats

# 查看镜像大小
docker images nestjs-app

# 清理未使用的镜像和容器
docker system prune -f
```

---

## CI/CD 流水线

本项目使用 GitHub Actions 实现自动化 CI/CD 流水线。

### 流水线架构

```
  Push/PR 触发
       │
       ▼
┌──────────────┐
│ lint-and-test │  ← 代码检查 + 单元测试 + 覆盖率
└──────┬───────┘
       │ (成功)
       ▼
┌──────────────┐
│    build     │  ← 构建 Docker 镜像 + 测试镜像
└──────┬───────┘
       │ (成功 + main 分支)
       ▼
┌──────────────┐
│   deploy     │  ← 部署到生产环境
└──────────────┘
```

### 各阶段说明

#### 阶段 1：代码检查和测试（lint-and-test）

```yaml
steps:
  - pnpm install --frozen-lockfile  # 安装依赖
  - pnpm lint                        # ESLint 代码检查
  - pnpm test                        # 单元测试
  - pnpm test:cov                    # 覆盖率测试
```

**目的：** 确保代码质量和功能正确性，是所有后续阶段的前置条件。

#### 阶段 2：构建 Docker 镜像（build）

```yaml
steps:
  - docker build -t nestjs-app .    # 构建镜像
  - docker run -d nestjs-app        # 启动容器
  - curl -f http://localhost:3000/health/live  # 验证健康检查
```

**目的：** 验证 Dockerfile 能正确构建镜像，并且镜像能正常运行。

#### 阶段 3：部署（deploy）

仅在 push 到 main 分支时触发。部署步骤需要根据目标平台配置：

| 平台 | 推荐方式 |
|------|----------|
| AWS ECS/EKS | ECR + Task Definition |
| GCP GKE/Cloud Run | GCR + kubectl |
| Azure AKS | ACR + Helm |
| 自托管服务器 | SSH + docker compose |

### CI/CD 最佳实践

1. **Fail Fast**：lint 和 test 失败时立即停止，不浪费时间构建镜像
2. **缓存优化**：使用 pnpm 缓存加速依赖安装
3. **唯一标签**：使用 commit SHA 作为 Docker 镜像标签
4. **镜像测试**：构建后自动启动容器并验证健康检查
5. **分支保护**：main 分支要求 PR 通过所有 CI 检查

---

## 健康检查机制

健康检查是容器编排系统（如 Kubernetes）判断服务状态的核心机制。

### Liveness Probe（存活探针）

**端点：** `GET /health/live`

**用途：** 判断应用是否存活。如果失败，Kubernetes 会**重启容器**。

**设计原则：**
- 应该尽量简单和轻量
- **不要检查外部依赖**（数据库、Redis 等）
- 因为外部依赖不可用不应该导致应用重启

```yaml
# Kubernetes 配置
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10    # 启动后等待 10 秒再开始检查
  periodSeconds: 30          # 每 30 秒检查一次
  timeoutSeconds: 3          # 超时 3 秒
  failureThreshold: 3        # 连续失败 3 次才重启
```

### Readiness Probe（就绪探针）

**端点：** `GET /health/ready`

**用途：** 判断应用是否准备好接收流量。如果失败，Kubernetes 会将 Pod 从 Service 中**移除**（但不重启）。

**适用场景：**
- 数据库连接暂时断开
- 正在加载必要数据
- 依赖的外部服务暂时不可用

```yaml
# Kubernetes 配置
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5     # 启动后等待 5 秒
  periodSeconds: 10          # 每 10 秒检查一次
  timeoutSeconds: 3          # 超时 3 秒
  failureThreshold: 3        # 连续失败 3 次移除
```

### Startup Probe（启动探针）

**用途：** 检查应用是否已完成启动。在启动探针成功前，不会执行 liveness 和 readiness 探针。

**适用场景：** 启动时间较长（加载大量数据、执行数据库迁移等）

```yaml
# Kubernetes 配置
startupProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30       # 最多等待 150 秒启动
```

### 健康检查响应格式

成功时（HTTP 200）：
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "disk_storage": { "status": "up" },
    "database": { "status": "up" }
  },
  "error": {},
  "details": { ... }
}
```

失败时（HTTP 503）：
```json
{
  "status": "error",
  "info": { ... },
  "error": {
    "database": {
      "status": "down",
      "message": "数据库连接超时"
    }
  },
  "details": { ... }
}
```

---

## 监控指标

### Prometheus 集成

本项目的 `/metrics` 端点返回 Prometheus 格式的纯文本数据。

**访问方式：**
```bash
curl http://localhost:3000/metrics
```

**输出示例：**
```
# HELP http_requests_total HTTP 请求总数
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/items"} 42
http_requests_total{method="POST",path="/api/v1/items"} 5

# HELP http_request_duration_seconds HTTP 请求耗时统计
# TYPE http_request_duration_seconds gauge
http_request_duration_seconds{quantile="avg"} 0.045123
http_request_duration_seconds{quantile="max"} 0.321456

# HELP nodejs_heap_size_bytes Node.js 堆内存使用
# TYPE nodejs_heap_size_bytes gauge
nodejs_heap_size_bytes{type="used"} 52428800
nodejs_heap_size_bytes{type="total"} 67108864
nodejs_heap_size_bytes{type="rss"} 83886080

# HELP nodejs_uptime_seconds Node.js 进程运行时间
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds 3600.25
```

### 自定义指标

本项目跟踪的指标：

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `http_requests_total` | Counter | HTTP 请求总数（按方法和路径分组） |
| `http_request_duration_seconds` | Gauge | 请求耗时（平均、最大、最小） |
| `nodejs_heap_size_bytes` | Gauge | Node.js 堆内存使用 |
| `nodejs_uptime_seconds` | Gauge | 进程运行时间 |

### JSON 格式摘要

访问 `/metrics/summary` 获取 JSON 格式的人类可读指标：

```bash
curl http://localhost:3000/metrics/summary | jq
```

```json
{
  "totalRequests": 47,
  "requestsByPath": {
    "GET /api/v1/items": 42,
    "POST /api/v1/items": 5
  },
  "averageDuration": 45.12,
  "maxDuration": 321.45,
  "processInfo": {
    "uptime": 3600,
    "memoryUsage": { "heapUsed": 52428800, "heapTotal": 67108864 },
    "nodeVersion": "v20.10.0"
  }
}
```

### Prometheus 配置示例

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nestjs-app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['nestjs-app:3000']
    # 抓取间隔
    scrape_interval: 10s
```

### Grafana 仪表盘

可以导入以下 Grafana 仪表盘模板：
- **Node.js Application Dashboard** (ID: 11159)
- **NestJS Monitoring** (ID: 12545)
- **Node Exporter Full** (ID: 1860)

---

## 安全最佳实践

### 1. 使用非 root 用户运行

```dockerfile
# Dockerfile 中
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
USER nestjs
```

**原因：** 如果容器被攻破，攻击者只能获得受限用户的权限，而不是 root。

### 2. Helmet 安全头

```typescript
// main.ts
app.use(helmet());
```

Helmet 自动设置以下安全头：
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-XSS-Protection: 1; mode=block` - XSS 过滤
- `Strict-Transport-Security` - 强制 HTTPS

### 3. 资源限制

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

防止单个容器消耗过多资源影响其他服务。

### 4. 环境变量安全

- **不要** 在代码中硬编码密钥
- **不要** 将 .env 文件提交到 Git
- **使用** Docker Secrets 或云密钥管理服务
- **使用** Kubernetes Secret（base64 编码，配合 RBAC）

### 5. 镜像安全

- 使用 Alpine 基础镜像（最小攻击面）
- 定期扫描镜像漏洞（Trivy, Snyk）
- 固定基础镜像版本（不要用 `latest`）
- 使用 `.dockerignore` 排除敏感文件

---

## 环境变量参考

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | `production` |
| `PORT` | 应用端口 | `3000` | `8080` |
| `APP_NAME` | 应用名称 | `nestjs-docker-demo` | `my-api` |
| `APP_VERSION` | 应用版本 | `1.0.0` | `2.1.0` |
| `LOG_LEVEL` | 日志级别 | `info` | `debug` |
| `CORS_ORIGIN` | CORS 允许的来源 | `*` | `https://example.com` |
| `API_KEY` | API 密钥 | - | `sk-abc123` |
| `HEALTH_MEMORY_THRESHOLD` | 内存阈值 (MB) | `300` | `512` |
| `HEALTH_DISK_THRESHOLD` | 磁盘阈值 (%) | `90` | `85` |

### 环境变量注入方式

**本地开发：**
```bash
# 方式 1：使用 .env 文件
cp .env.example .env
# 编辑 .env 文件

# 方式 2：命令行
PORT=8080 LOG_LEVEL=debug pnpm start:dev
```

**Docker：**
```bash
# 方式 1：docker run 参数
docker run -e PORT=8080 -e LOG_LEVEL=info nestjs-app

# 方式 2：docker-compose environment
# 在 docker-compose.yml 中配置
```

**Kubernetes：**
```yaml
# ConfigMap（非敏感配置）
envFrom:
  - configMapRef:
      name: app-config

# Secret（敏感配置）
envFrom:
  - secretRef:
      name: app-secrets
```

---

## Kubernetes 部署参考

### Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
  labels:
    app: nestjs-app
spec:
  replicas: 3                    # 3 个副本实现高可用
  selector:
    matchLabels:
      app: nestjs-app
  template:
    metadata:
      labels:
        app: nestjs-app
    spec:
      # 使用非 root 用户（与 Dockerfile 中一致）
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001

      containers:
        - name: nestjs-app
          image: nestjs-app:1.0.0
          ports:
            - containerPort: 3000

          # 资源限制
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi

          # 存活探针
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 3
            failureThreshold: 3

          # 就绪探针
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          # 启动探针（可选）
          startupProbe:
            httpGet:
              path: /health/live
              port: 3000
            failureThreshold: 30
            periodSeconds: 5

          # 环境变量
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"

          # 优雅关闭
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

### Service 配置

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nestjs-app-service
spec:
  selector:
    app: nestjs-app
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### HPA（自动水平扩展）

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nestjs-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nestjs-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 性能优化

### 1. Node.js 集群模式

在生产环境中，可以使用 Node.js 的 cluster 模块利用多核 CPU：

```typescript
// main.ts (集群模式示例)
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 启动 NestJS 应用
  bootstrap();
}
```

**或者使用 PM2：**
```bash
pm2 start dist/main.js -i max
```

### 2. 响应压缩

```typescript
// 在 main.ts 中添加
import * as compression from 'compression';
app.use(compression());
```

### 3. 请求限流

防止恶意请求耗尽资源：

```typescript
// 使用 @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 时间窗口（毫秒）
      limit: 10,     // 最大请求数
    }]),
  ],
})
```

### 4. Docker 镜像优化

- 使用 `node:20-alpine`（~50MB vs ~900MB for full image）
- 多阶段构建（排除 devDependencies）
- 合并 RUN 指令减少层数
- 使用 `.dockerignore` 减小构建上下文

---

## 常见问题排查

### 容器无法启动

```bash
# 查看容器日志
docker logs <container-name>

# 检查容器状态
docker inspect <container-name>

# 常见问题：
# 1. 端口被占用 → 修改端口映射
# 2. 内存不足 → 增加资源限制
# 3. 环境变量缺失 → 检查 .env 文件
```

### 健康检查失败

```bash
# 手动测试健康检查端点
curl -v http://localhost:3000/health/live

# 查看健康检查状态
docker inspect --format='{{json .State.Health}}' <container-name>

# 常见原因：
# 1. 应用还没启动完成 → 增加 start_period
# 2. 内存超过阈值 → 调整阈值或增加内存限制
# 3. 磁盘空间不足 → 清理磁盘
```

### 构建缓慢

```bash
# 1. 检查 .dockerignore 是否排除了大文件
cat .dockerignore

# 2. 使用 BuildKit 加速
DOCKER_BUILDKIT=1 docker build -t nestjs-app .

# 3. 使用构建缓存
docker build --cache-from nestjs-app:latest -t nestjs-app .
```

### 内存泄漏排查

```bash
# 1. 监控内存使用
docker stats <container-name>

# 2. 查看 Node.js 内存详情
curl http://localhost:3000/metrics/summary | jq .processInfo.memoryUsage

# 3. 生成堆快照（需要 heapdump 模块）
# 4. 使用 Chrome DevTools 分析
```

---

## 学习路线

本项目的知识按以下顺序递进：

```
1. 理解 NestJS 基础（模块、控制器、服务、中间件）
   ↓
2. 掌握 Docker 基础（镜像、容器、Dockerfile）
   ↓
3. 学习多阶段构建（优化镜像大小和安全加固）
   ↓
4. 使用 Docker Compose 编排多服务应用
   ↓
5. 实现健康检查和监控（可观测性基础）
   ↓
6. 配置 CI/CD 流水线（自动化测试和部署）
   ↓
7. 部署到 Kubernetes（生产级容器编排）
```

---

## 总结

本项目覆盖了 NestJS 应用从开发到生产部署的完整链路：

| 环节 | 关键工具/概念 | 核心价值 |
|------|---------------|----------|
| 容器化 | Docker, 多阶段构建 | 环境一致、快速部署 |
| 编排 | Docker Compose, Kubernetes | 服务管理、自动扩展 |
| 健康检查 | Liveness/Readiness Probe | 自动故障恢复 |
| 监控 | Prometheus, Grafana | 实时感知系统状态 |
| CI/CD | GitHub Actions | 自动化质量保证 |
| 安全 | Helmet, 非 root, 资源限制 | 减小攻击面 |

**生产就绪的检查清单：**
- [x] 多阶段 Docker 构建
- [x] 非 root 用户运行
- [x] 健康检查端点（存活 + 就绪）
- [x] 监控指标暴露
- [x] 结构化日志
- [x] 请求追踪 ID
- [x] 全局异常处理
- [x] 优雅关闭
- [x] 安全 HTTP 头
- [x] 资源限制
- [x] CI/CD 流水线
- [x] 环境变量验证
