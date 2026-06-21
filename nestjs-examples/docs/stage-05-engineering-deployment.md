## 第五阶段：工程化与部署篇 / Stage 5: Engineering & Deployment (Week 10)

### 概述 / Overview

**中文：**
经过前四个阶段的学习，我们已经掌握了 NestJS 的核心能力：从 TypeScript 基础、CRUD 操作、认证授权、数据库集成，到测试、微服务、GraphQL 和 WebSocket。然而，一个真正"生产就绪"的应用不仅仅需要业务逻辑 -- 它还需要完善的工程化实践和可靠的部署流程。第五阶段将聚焦于将 NestJS 应用从开发环境带到生产环境的全过程，涵盖 Docker 容器化、CI/CD 自动化流水线、健康检查、监控可观测性、安全防护以及 Kubernetes 编排等关键主题。这些技能是每一位后端工程师从"能写代码"到"能交付产品"的必经之路。

**English:**
After completing the first four stages, we have mastered the core capabilities of NestJS: from TypeScript fundamentals, CRUD operations, authentication and authorization, database integration, to testing, microservices, GraphQL, and WebSocket. However, a truly "production-ready" application requires more than just business logic -- it demands robust engineering practices and reliable deployment pipelines. Stage 5 focuses on the complete journey of bringing a NestJS application from development to production, covering Docker containerization, CI/CD automation, health checks, monitoring and observability, security hardening, and Kubernetes orchestration. These skills are the essential bridge between "writing code" and "delivering products" for every backend engineer.

---

### 项目 16: 生产级部署 / Project 16: Production-Ready Deployment

**中文：**
本项目是整个教程的收官之作。我们将把一个功能完整的 NestJS 应用打包为 Docker 镜像，配置自动化 CI/CD 流水线，实现健康检查和监控指标采集，并按照生产环境的最佳实践进行安全加固。项目代码位于 `16-docker-deploy/` 目录。

**English:**
This project serves as the capstone of the entire tutorial. We will package a fully functional NestJS application into a Docker image, set up an automated CI/CD pipeline, implement health checks and monitoring metrics collection, and apply security hardening following production best practices. The project source code is located in the `16-docker-deploy/` directory.

---

#### 项目结构优化 / Project Structure Optimization

**中文：**
在生产级项目中，合理的目录结构是可维护性和可扩展性的基础。本项目采用了按功能领域（Feature-based）组织的目录结构，而非按技术层次（如 controllers/, services/, models/）划分。这种方式使得每个功能模块都是自包含的，当项目规模增长时可以轻松拆分为独立微服务。

项目的核心目录结构如下：

```
16-docker-deploy/
├── src/
│   ├── main.ts                          # 应用入口，启动配置
│   ├── app/
│   │   ├── app.module.ts                # 根模块
│   │   ├── app.controller.ts            # 应用控制器
│   │   └── app.service.ts              # 应用服务
│   ├── config/
│   │   └── app.config.ts               # 配置工厂和验证 Schema
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── request-id.middleware.ts # 请求 ID 中间件
│   │   │   └── logging.middleware.ts    # 结构化日志中间件
│   │   └── filters/
│   │       └── global-exception.filter.ts # 全局异常过滤器
│   ├── health/
│   │   ├── health.controller.ts         # 健康检查端点
│   │   └── health.module.ts            # 健康检查模块
│   └── metrics/
│       ├── metrics.service.ts           # 指标收集服务
│       ├── metrics.interceptor.ts       # 指标采集拦截器
│       ├── metrics.controller.ts        # 指标暴露端点
│       └── metrics.module.ts            # 指标模块
├── test/                                # 端到端测试
├── Dockerfile                           # 多阶段 Docker 构建
├── docker-compose.yml                   # 生产环境编排
├── docker-compose.dev.yml               # 开发环境覆盖
├── .github/workflows/ci.yml            # CI/CD 流水线
├── .env.example                         # 环境变量模板
└── package.json
```

每个目录职责清晰：`config/` 集中管理所有配置；`common/` 存放跨模块复用的中间件和过滤器；`health/` 和 `metrics/` 分别负责健康检查和监控指标。这种组织方式遵循了 NestJS 官方推荐的模块化设计原则，也与领域驱动设计（DDD）的理念一致。

**English:**
In production-grade projects, a well-organized directory structure is the foundation of maintainability and scalability. This project adopts a feature-based directory organization rather than a layer-based one (e.g., controllers/, services/, models/). This approach makes each feature module self-contained, allowing easy extraction into independent microservices as the project grows.

Each directory has a clear responsibility: `config/` centralizes all configuration; `common/` stores cross-module reusable middleware and filters; `health/` and `metrics/` handle health checks and monitoring metrics respectively. This organization follows NestJS's recommended modular design principles and aligns with Domain-Driven Design (DDD) concepts.

---

#### Docker 容器化 / Docker Containerization

**中文：**
Docker 是现代软件交付的基石。它解决了"在我机器上能跑"这一经典问题，通过将应用及其所有依赖打包为一个标准化的镜像（Image），保证在任何环境中都能一致地运行。容器化带来以下关键优势：

1. **环境一致性（Consistency）**：开发、测试、生产环境使用完全相同的镜像，消除环境差异导致的 Bug。
2. **隔离性（Isolation）**：每个容器运行在独立的命名空间中，互不干扰。
3. **可伸缩性（Scalability）**：容器可以快速启动和销毁，配合编排工具（如 Kubernetes）实现自动伸缩。
4. **可复现性（Reproducibility）**：Dockerfile 是文本文件，可以纳入版本控制，构建过程完全可复现。

**English:**
Docker is the cornerstone of modern software delivery. It solves the classic "it works on my machine" problem by packaging an application and all its dependencies into a standardized image that runs consistently in any environment. Containerization provides the following key advantages:

1. **Consistency**: Development, testing, and production environments use identical images, eliminating environment-specific bugs.
2. **Isolation**: Each container runs in its own namespace without interfering with others.
3. **Scalability**: Containers can be rapidly started and destroyed, enabling auto-scaling with orchestration tools like Kubernetes.
4. **Reproducibility**: Dockerfiles are text files that can be version-controlled, making builds fully reproducible.

---

##### 多阶段构建 / Multi-Stage Builds

**中文：**
多阶段构建是 Docker 生产化的核心技术。传统的单阶段构建会将源代码、开发依赖、编译工具全部打入最终镜像，导致镜像体积庞大（通常超过 1GB）且包含大量不必要的攻击面。多阶段构建通过在一个 Dockerfile 中定义多个阶段，每个阶段使用独立的基础镜像，最终只将运行时所需的文件拷贝到生产镜像中。

本项目的 Dockerfile 定义了三个阶段：

**阶段 1：依赖安装（deps）**

```dockerfile
# 使用 Alpine Linux 作为基础镜像（体积小，约 5MB）
# Node.js 20 是当前 LTS 版本，适合生产环境
FROM node:20-alpine AS deps

WORKDIR /app

# 先复制依赖描述文件
# 【Docker 层缓存技巧】：将 package.json 和 lock 文件单独 COPY
# 这样只要依赖不变，就不会触发后续的 npm install 重新执行
COPY package.json pnpm-lock.yaml ./

# 启用 corepack（Node.js 16.9+ 内置的包管理器管理工具）
# --frozen-lockfile: 确保安装结果与 lock 文件一致
# --prod=false: 安装所有依赖，包含 devDependencies（编译需要）
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
```

这个阶段的要点：使用 Alpine Linux 作为基础镜像可以显著减小镜像体积。`COPY package.json pnpm-lock.yaml ./` 利用了 Docker 的层缓存机制 -- 只要依赖文件没有变化，后续的 `pnpm install` 步骤就会被缓存，大幅加速重复构建。

**阶段 2：编译构建（build）**

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# 从 deps 阶段复制已安装的 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制所有源代码（.dockerignore 会排除不需要的文件）
COPY . .

# 编译 TypeScript 为 JavaScript
RUN pnpm build
```

这个阶段从 deps 阶段复用已安装的 `node_modules`，避免了重复安装。源代码通过 `COPY . .` 复制进来（`.dockerignore` 文件会排除 `.git/`、`node_modules/`、`coverage/` 等不需要的文件），然后执行 TypeScript 编译。

**阶段 3：生产运行（production）**

```dockerfile
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖，跳过 devDependencies
RUN corepack enable && pnpm install --frozen-lockfile --prod

# 从 build 阶段复制编译产物
COPY --from=build /app/dist ./dist

# 安全加固：创建非 root 用户
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health/live || exit 1

CMD ["node", "dist/main.js"]
```

最终阶段只包含：生产依赖（不含 TypeScript 编译器、Jest 测试框架等）、编译后的 JavaScript 代码（`dist/` 目录）。最终镜像体积通常在 100-200MB 左右，远小于单阶段构建的 1GB+。

非 root 用户是一个重要的安全措施。在容器化环境中以 root 身份运行应用意味着：如果容器被攻破，攻击者将获得 root 权限；某些容器逃逸漏洞在 root 下危害更大；Kubernetes Pod Security Standards 明确要求非 root 运行。

**English:**
Multi-stage builds are a core technology for Docker productionization. Traditional single-stage builds bundle source code, development dependencies, and build tools into the final image, resulting in bloated images (often over 1GB) with unnecessary attack surface. Multi-stage builds define multiple stages in a single Dockerfile, each using an independent base image, and only copy runtime-necessary files into the production image.

The project's Dockerfile defines three stages:

- **Stage 1 (deps)**: Installs all dependencies including devDependencies using Alpine Linux. Leverages Docker layer caching by copying `package.json` and lock files separately, so `pnpm install` is cached as long as dependencies remain unchanged.
- **Stage 2 (build)**: Reuses `node_modules` from the deps stage, copies source code, and compiles TypeScript to JavaScript.
- **Stage 3 (production)**: The final image containing only production dependencies and compiled JavaScript. A non-root user is created for security, a HEALTHCHECK instruction is configured, and the application is started with `node dist/main.js`. The final image is typically 100-200MB, far smaller than the 1GB+ from single-stage builds.

---

##### Docker Compose

**中文：**
Docker Compose 是 Docker 的编排工具，用于通过 YAML 文件定义和运行多容器应用。在实际项目中，一个应用通常由多个服务组成：Web 应用、数据库、缓存、消息队列等。Docker Compose 让我们用一条命令启动整个应用栈。

本项目提供了两个 Compose 文件：

**生产环境 (`docker-compose.yml`)**：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production    # 指定构建目标为生产阶段
    container_name: nestjs-app-prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health/live"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

这个配置包含了许多生产环境的关键设置：`target: production` 指定使用多阶段构建的最终阶段；`healthcheck` 定期检查容器健康状态；`restart: unless-stopped` 确保容器在异常退出后自动重启；`deploy.resources` 限制了 CPU 和内存使用量，防止资源滥用；`logging` 配置了日志轮转，避免磁盘被日志撑满。

**开发环境 (`docker-compose.dev.yml`)** 覆盖了基础配置并添加了辅助服务：

```yaml
services:
  app-dev:
    build:
      target: deps          # 使用包含 devDependencies 的阶段
    volumes:
      - .:/app              # 源码挂载，实现热重载
      - /app/node_modules   # 匿名卷，保留容器内的 node_modules
    command: pnpm start:dev # watch 模式启动
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nestjs -d nestjs_dev"]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
```

开发环境的关键设计：Volume 挂载 `.:/app` 将本地源码映射到容器内，修改文件后 NestJS 的 watch 模式会自动重新编译。匿名卷 `/app/node_modules` 是一个重要技巧 -- 它防止本地的 `node_modules` 覆盖容器内已安装的依赖，避免平台和架构差异导致的问题。`depends_on` 配合 `condition: service_healthy` 确保数据库和 Redis 就绪后才启动应用。

**English:**
Docker Compose is Docker's orchestration tool for defining and running multi-container applications via YAML files. This project provides two Compose files: `docker-compose.yml` for production (with resource limits, health checks, restart policies, and log rotation) and `docker-compose.dev.yml` for development (with volume mounts for hot-reload, PostgreSQL and Redis services, and `depends_on` with health conditions).

A critical development pattern is the anonymous volume `/app/node_modules` -- it prevents the host's `node_modules` from overriding the container's installed dependencies, avoiding platform-specific issues.

---

#### CI/CD 流水线 / CI/CD Pipeline

**中文：**
CI/CD（持续集成 / 持续部署）是现代软件交付的核心实践。持续集成（CI）确保每次代码提交都会自动运行测试和代码检查，及时发现问题；持续部署（CD）将通过验证的代码自动部署到目标环境，减少人工操作和人为错误。

本项目使用 GitHub Actions 实现 CI/CD，工作流定义在 `.github/workflows/ci.yml` 中，包含三个阶段：

**阶段 1：代码检查和测试（lint-and-test）**

```yaml
lint-and-test:
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm lint
    - run: pnpm test
    - run: pnpm test:cov
    - uses: actions/upload-artifact@v4
      with:
        name: coverage-report
        path: coverage/
        retention-days: 30
```

这个阶段在每次 push 和 Pull Request 时触发。它依次执行：代码检出、环境配置（安装 pnpm 和 Node.js 20）、依赖安装、ESLint 代码检查、单元测试、覆盖率测试。覆盖率报告作为 Artifact 上传，可以在 GitHub Actions 页面下载查看。`timeout-minutes: 15` 是一个安全保护，防止测试卡死导致 Runner 被长时间占用。

**阶段 2：构建 Docker 镜像（build）**

```yaml
build:
  needs: lint-and-test
  if: github.event_name == 'push'
  steps:
    - uses: actions/checkout@v4
    - run: |
        docker build -t nestjs-app:${{ github.sha }} -t nestjs-app:latest .
    - name: Test Docker image
      run: |
        docker run -d --name test-app -p 3000:3000 nestjs-app:latest
        sleep 5
        curl -f http://localhost:3000/health/live || exit 1
        curl -f http://localhost:3000/ || exit 1
        docker stop test-app && docker rm test-app
```

这个阶段仅在 push 时触发（PR 只需通过测试即可）。它构建 Docker 镜像，然后启动容器进行冒烟测试：调用健康检查端点和根路径，验证镜像能正确运行。使用 Git Commit SHA 作为镜像标签确保每次构建唯一可追溯。

**阶段 3：部署到生产环境（deploy）**

```yaml
deploy:
  needs: build
  if: github.ref == 'refs/heads/main'
  environment:
    name: production
    url: https://your-app.example.com
```

部署阶段仅在 push 到 `main` 分支时触发。本项目提供了一个占位步骤，实际部署需要根据目标平台配置：AWS ECS/EKS 使用 `aws-actions/amazon-ecr-login`；GCP GKE 使用 `google-github-actions/deploy-gke`；Azure AKS 使用 `azure/aks-deploy`；自托管服务器使用 SSH + docker compose。`environment` 字段使用了 GitHub Environments 功能，可以在 GitHub 仓库设置中配置审批流程和环境保护规则。

**English:**
CI/CD (Continuous Integration / Continuous Deployment) is a core practice of modern software delivery. This project uses GitHub Actions with a three-stage pipeline defined in `.github/workflows/ci.yml`:

1. **lint-and-test**: Runs on every push and PR -- checks out code, sets up Node.js 20 with pnpm caching, installs dependencies, runs ESLint, unit tests, and coverage tests, then uploads the coverage report as an artifact.
2. **build**: Runs only on pushes -- builds the Docker image, starts a container, and performs smoke tests against the health check and root endpoints. Uses Git Commit SHA as the image tag for traceability.
3. **deploy**: Runs only on pushes to `main` -- a placeholder step that should be replaced with actual deployment commands for the target platform (AWS ECS/EKS, GCP GKE, Azure AKS, or self-hosted via SSH + docker compose). Uses GitHub Environments for approval workflows.

---

#### 健康检查 / Health Checks

**中文：**
健康检查是容器化和 Kubernetes 环境中保证服务可用性的关键机制。它让编排系统能够自动检测应用状态，并在出问题时自动恢复。Kubernetes 定义了三种探针：

1. **Liveness Probe（存活探针）** -- 检查应用是否在运行。失败时 Kubernetes 会重启容器。用于检测死锁、内存泄漏等无法自愈的问题。设计原则：应该尽量简单和轻量，不要检查外部依赖（数据库、Redis 等），因为外部服务不可用不应该导致应用不断重启。

2. **Readiness Probe（就绪探针）** -- 检查应用是否准备好接收流量。失败时 Kubernetes 会将 Pod 从 Service 的 Endpoints 中移除，新请求不会被路由到该 Pod，但 Pod 不会被重启。适用于数据库连接暂时断开、依赖的外部服务暂时不可用等场景。

3. **Startup Probe（启动探针）** -- 检查应用是否已完成启动。在启动探针成功前，不会执行 liveness 和 readiness 探针。适用于启动时间较长的应用。

本项目使用 `@nestjs/terminus` 库实现健康检查，它提供了内存使用检查、磁盘空间检查、数据库连接检查等内置指标。健康检查控制器（`src/health/health.controller.ts`）实现了三个端点：

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  // 综合健康检查：内存 + 磁盘 + 数据库
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () => this.disk.checkStorage('disk_storage', {
        thresholdPercent: 0.9,
        path: '/',
      }),
      () => this.mockDatabaseCheck(),
    ]);
  }

  // 就绪探针：检查依赖服务是否就绪
  @Get('ready')
  @HealthCheck()
  async isReady(): Promise<HealthCheckResult> { ... }

  // 存活探针：只检查应用自身是否存活
  @Get('live')
  @HealthCheck()
  async isLive(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({ live: { status: 'up' as const } }),
    ]);
  }
}
```

注意存活探针只检查应用自身是否能正常响应，不检查外部依赖。这是因为外部依赖不可用不应该导致应用重启 -- 重启不仅无法解决外部服务的问题，还会中断正在处理的请求。综合健康检查则包含了内存堆使用（300MB 阈值）、常驻集内存 RSS（500MB 阈值）、磁盘使用率（90% 阈值）和数据库连接检查。

在 Kubernetes 中的配置示例：

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

**English:**
Health checks are critical in containerized and Kubernetes environments. Kubernetes defines three probe types: Liveness Probe (restarts the container on failure), Readiness Probe (removes the Pod from service endpoints on failure without restarting), and Startup Probe (delays other probes until the application has started).

This project uses `@nestjs/terminus` to implement three health endpoints in `src/health/health.controller.ts`:

- `GET /health` -- Comprehensive check covering heap memory (300MB threshold), RSS memory (500MB threshold), disk usage (90% threshold), and database connectivity.
- `GET /health/live` -- Liveness probe that only checks if the application itself is responsive. Deliberately does not check external dependencies to avoid unnecessary restarts.
- `GET /health/ready` -- Readiness probe that checks if dependent services are available.

---

#### 监控与可观测性 / Monitoring & Observability

**中文：**
可观测性（Observability）是理解系统运行状态的能力，它建立在三大支柱之上：

1. **Logs（日志）** -- 离散的事件记录，例如"用户 X 在时间 Y 创建了订单 Z"。
2. **Metrics（指标）** -- 可聚合的数值型时间序列，例如"过去 5 分钟的请求总数"、"当前内存使用量"。
3. **Traces（追踪）** -- 分布式请求链路，记录一个请求在多个服务之间的完整流转路径。

在生产环境中，三者缺一不可：日志用于事后排查具体事件；指标用于宏观监控和告警；追踪用于定位跨服务的性能瓶颈。

**English:**
Observability is the ability to understand a system's runtime state, built on three pillars: Logs (discrete event records), Metrics (aggregated numerical time series), and Traces (distributed request paths across services). In production, all three are essential: logs for post-incident investigation, metrics for macro-level monitoring and alerting, and traces for locating cross-service performance bottlenecks.

---

##### Prometheus 指标 / Prometheus Metrics

**中文：**
Prometheus 是最流行的云原生监控系统，使用 pull 模式（主动拉取）收集指标。它定义了四种指标类型：

- **Counter（计数器）** -- 只增不减的计数器，如请求总数。只能增加或重置为零。
- **Gauge（仪表盘）** -- 可增可减的数值，如当前内存使用量、活跃连接数。
- **Histogram（直方图）** -- 用于分布统计，如请求耗时分布（多少请求在 100ms 内完成、多少在 500ms 内完成）。
- **Summary（摘要）** -- 类似 Histogram，但由客户端计算分位数。

本项目的指标收集服务（`src/metrics/metrics.service.ts`）实现了以下自定义指标：

```typescript
@Injectable()
export class MetricsService {
  private metrics: RequestMetric[] = [];
  private readonly MAX_METRICS = 10000;

  recordRequest(metric: RequestMetric): void {
    this.metrics.push(metric);
    // 环形缓冲区：超过最大数量时移除最旧数据
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getPrometheusMetrics(): string {
    // 生成 Prometheus 格式的纯文本指标
    // http_requests_total (Counter) -- 按方法和路径分组的请求总数
    // http_request_duration_seconds (Gauge) -- 请求耗时统计（avg/max/min）
    // nodejs_heap_size_bytes (Gauge) -- Node.js 堆内存使用
    // nodejs_uptime_seconds (Gauge) -- 进程运行时间
  }
}
```

指标通过全局拦截器 `MetricsInterceptor` 自动采集。每次 HTTP 请求完成后，拦截器记录请求方法、路径、状态码和耗时，调用 `MetricsService.recordRequest()` 存储。通过访问 `/metrics` 端点可以获取 Prometheus 格式的指标文本，Prometheus 服务器会定期抓取这个端点。

在生产环境中，推荐使用 `prom-client` 库替代简化的内存实现，它提供了完整的 Counter、Histogram 等类型支持和 Prometheus 原生格式输出。

**English:**
Prometheus is the most popular cloud-native monitoring system, using a pull model to collect metrics. It defines four metric types: Counter (monotonically increasing), Gauge (arbitrary numerical value), Histogram (distribution statistics), and Summary (client-side quantile computation).

The project's `MetricsService` in `src/metrics/metrics.service.ts` implements custom metrics including `http_requests_total` (Counter, grouped by method and path), `http_request_duration_seconds` (Gauge, avg/max/min), `nodejs_heap_size_bytes` (Gauge, heap/RSS), and `nodejs_uptime_seconds` (Gauge). Metrics are automatically collected via a global `MetricsInterceptor` and exposed at the `/metrics` endpoint in Prometheus text format. A ring buffer limits memory usage to the most recent 10,000 entries.

---

##### 结构化日志 / Structured Logging

**中文：**
传统的文本日志（如 `[INFO] 2024-01-15 10:30:00 - GET /api/items 200 45ms`）难以被日志聚合系统解析。结构化日志使用 JSON 格式，使得日志系统（如 ELK Stack、Grafana Loki）可以自动解析字段并建立索引。

本项目的日志中间件（`src/common/middleware/logging.middleware.ts`）输出如下格式：

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "requestId": "abc-123-def-456",
  "method": "GET",
  "url": "/api/v1/items",
  "statusCode": 200,
  "duration": 45,
  "contentLength": 1024,
  "userAgent": "Mozilla/5.0..."
}
```

每个字段都有明确的用途：`requestId` 用于分布式追踪，可以在多个服务的日志中关联同一请求；`duration` 用于性能分析；`statusCode` 用于错误率监控。日志级别根据状态码自动调整：5xx 用 `error`，4xx 用 `warn`，其余用 `info`。

请求 ID 由 `RequestIdMiddleware`（`src/common/middleware/request-id.middleware.ts`）生成，它优先使用外部传入的 `X-Request-ID` 头（兼容 API Gateway / Load Balancer / Istio），在没有时生成新的 UUID。

在 Docker/Kubernetes 环境中，日志应输出到 stdout/stderr（Docker 自动收集），不应写入文件。Docker 的日志轮转配置（`max-size: "10m"`, `max-file: "3"`）防止磁盘被日志撑满。

**English:**
Structured logging uses JSON format so log aggregation systems (ELK Stack, Grafana Loki) can automatically parse and index fields. The `LoggingMiddleware` outputs JSON entries containing timestamp, level, requestId, method, url, statusCode, duration, contentLength, and userAgent. The `RequestIdMiddleware` assigns a UUID to each request (or uses an externally provided `X-Request-ID` header for compatibility with API Gateways and service meshes like Istio). In Docker/Kubernetes environments, logs should be written to stdout/stderr for automatic collection, never to files.

---

##### APM 应用性能监控 / APM (Application Performance Monitoring)

**中文：**
APM 工具提供了开箱即用的应用性能监控能力，无需手动埋点即可自动采集请求耗时、数据库查询、外部 HTTP 调用等指标。主流的 APM 工具包括：

- **Datadog**：功能最全面的商业 APM，支持日志、指标、追踪、告警的一体化方案。
- **New Relic**：另一个领先的商业 APM，以易用性和丰富的集成著称。
- **Grafana + Prometheus + Tempo**：开源方案组合，Grafana 负责可视化，Prometheus 负责指标，Tempo 负责追踪。
- **Jaeger / Zipkin**：专注于分布式追踪的开源项目。

在 NestJS 应用中集成 APM 通常需要：安装 APM Agent（如 `dd-trace` for Datadog）、在应用启动前初始化 Agent、配置采样率和服务名称。大部分 APM Agent 支持自动 instrumentation，可以零代码修改地采集 Express/Fastify、数据库驱动、HTTP 客户端等库的性能数据。

**English:**
APM tools provide out-of-the-box application performance monitoring without manual instrumentation, automatically capturing request latency, database queries, and external HTTP calls. Mainstream options include Datadog (comprehensive commercial APM), New Relic (user-friendly commercial APM), Grafana + Prometheus + Tempo (open-source stack), and Jaeger/Zipkin (focused on distributed tracing). Most APM agents support auto-instrumentation for Express/Fastify, database drivers, and HTTP clients with zero code changes.

---

#### 安全最佳实践 / Security Best Practices

**中文：**
将应用部署到生产环境之前，安全加固是不可忽视的环节。本项目在多个层面实施了安全措施：

**1. Helmet 安全 HTTP 头**

Helmet 通过设置各种 HTTP 响应头来防御常见的 Web 攻击：

```typescript
app.use(
  helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }),
);
```

它会自动设置：`X-Content-Type-Options: nosniff`（防止 MIME 类型嗅探）、`X-Frame-Options: DENY`（防止点击劫持）、`X-XSS-Protection: 1; mode=block`（XSS 过滤）、`Strict-Transport-Security`（强制 HTTPS）。开发环境禁用 Content Security Policy 以避免影响前端开发调试。

**2. CORS 跨域配置**

```typescript
app.enableCors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
});
```

生产环境应该将 `origin` 限制为具体的前端域名，而非允许所有来源（`*`）。如果使用 Nginx Ingress 或 API Gateway 处理 CORS，可以在应用层关闭以避免重复处理。

**3. 环境变量管理**

敏感信息（数据库密码、API 密钥、JWT 密钥等）绝对不应出现在源代码中。本项目使用 `@nestjs/config` 配合 Joi 验证：

```typescript
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000).min(1).max(65535),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  API_KEY: Joi.string().optional(),
});
```

应用启动时会验证所有环境变量，缺少必要配置或格式错误会阻止应用启动（Fail Fast 原则）。在不同环境中，配置通过以下方式注入：开发环境用 `.env` 文件；Docker 部署用 `docker-compose` 的 `environment` 字段；Kubernetes 用 ConfigMap 和 Secret；云平台用专用的密钥管理服务（AWS Parameter Store、GCP Secret Manager）。

**4. 非 root 容器**

如前所述，Dockerfile 中创建了专用的 `nestjs` 用户（UID 1001）并切换到该用户运行应用，防止容器被攻破后攻击者获得 root 权限。

**English:**
Security hardening before production deployment is essential. This project implements security at multiple levels:

1. **Helmet**: Sets protective HTTP headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security). CSP is disabled in development but enabled in production.
2. **CORS**: Restricts allowed origins to specific frontend domains in production. If using Nginx Ingress or API Gateway for CORS, it can be disabled at the application level.
3. **Environment Variable Management**: Uses `@nestjs/config` with Joi validation to fail fast on missing or malformed configuration. Secrets are injected via environment variables, Kubernetes Secrets, or cloud secret managers -- never hardcoded in source.
4. **Non-root Containers**: A dedicated `nestjs` user (UID 1001) runs the application to limit the blast radius of container compromises.

---

#### 优雅关闭 / Graceful Shutdown

**中文：**
优雅关闭是生产环境中经常被忽视但极其重要的实践。当 Docker 容器或 Kubernetes Pod 被关闭时，系统会先发送 SIGTERM 信号，等待一段时间（Docker 默认 10 秒，Kubernetes 默认 30 秒）后如果进程仍未退出，再发送 SIGKILL 强制终止。

如果不做优雅关闭，正在处理的请求会被突然中断，数据库事务可能不完整，缓存可能处于不一致状态，消息队列中的消息可能丢失确认。

NestJS 提供了内置的关闭钩子机制：

```typescript
// main.ts 中启用关闭钩子
app.enableShutdownHooks();
```

启用后，NestJS 会监听 SIGTERM 和 SIGINT 信号，并在收到信号时依次调用所有模块的 `onModuleDestroy()` 和 `beforeApplicationShutdown()` 生命周期钩子。这使得各模块有机会完成清理工作：关闭数据库连接池、完成正在执行的 Redis 事务、取消定时任务等。

本项目在 `main.ts` 中还添加了额外的信号监听：

```typescript
const gracefulShutdown = async (signal: string) => {
  logger.warn(`收到 ${signal} 信号，开始优雅关闭...`);
  await app.close();
  logger.log('应用已优雅关闭');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

在 Kubernetes 中，Pod 终止流程为：1) Pod 被标记为 Terminating；2) 从 Service Endpoints 中移除（不再接收新请求）；3) 发送 SIGTERM；4) 等待 `terminationGracePeriodSeconds`（默认 30 秒）；5) 如果仍在运行，发送 SIGKILL。因此，应用需要在这个时间窗口内完成所有清理工作。

**English:**
Graceful shutdown is an often-overlooked but critical production practice. When a container or Pod is terminated, the system sends SIGTERM first, then SIGKILL after a grace period if the process hasn't exited. Without graceful shutdown, in-flight requests are abruptly interrupted, database transactions may be incomplete, and message queue acknowledgments may be lost.

NestJS provides built-in shutdown hooks via `app.enableShutdownHooks()`, which causes NestJS to listen for SIGTERM/SIGINT and invoke `onModuleDestroy()` and `beforeApplicationShutdown()` lifecycle hooks on all modules. This gives each module the opportunity to clean up: close database connection pools, complete Redis transactions, cancel scheduled tasks, and drain in-flight requests.

---

#### Kubernetes 部署概述 / Kubernetes Deployment Overview

**中文：**
虽然本项目没有包含完整的 Kubernetes manifest 文件，但理解 Kubernetes 的核心概念对于生产部署至关重要。以下是在 Kubernetes 中部署 NestJS 应用的关键资源：

**Deployment** -- 定义应用的副本数、更新策略和资源限制：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: nestjs-app
          image: nestjs-app:latest
          resources:
            requests:
              cpu: "250m"
              memory: "128Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

`RollingUpdate` 策略确保在更新时始终保持至少指定数量的可用副本，`maxSurge: 1` 表示最多多出 1 个副本进行更新，`maxUnavailable: 0` 表示不允许有不可用的副本。这是零停机部署的基础。

**Service** -- 为 Pod 提供稳定的网络入口：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nestjs-app
spec:
  selector:
    app: nestjs-app
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

**Ingress** -- 配置外部访问和 TLS 终结：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nestjs-app
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nestjs-app
                port:
                  number: 80
```

**ConfigMap 和 Secret** -- 管理配置和敏感信息。ConfigMap 存放非敏感配置（如 LOG_LEVEL、NODE_ENV），Secret 存放密码和密钥（如 DATABASE_URL、JWT_SECRET）。Kubernetes Secret 使用 Base64 编码存储，实际安全性依赖于集群的 RBAC 和 etcd 加密配置。

**Horizontal Pod Autoscaler (HPA)** -- 根据 CPU 使用率或自定义指标自动调整副本数：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nestjs-app
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
```

当 CPU 平均使用率超过 70% 时自动扩容，低于阈值时自动缩容。这使得应用能够自动适应流量波动，在高峰期保持性能，在低谷期节约资源。

**云平台考量**：主流云平台都提供了托管的 Kubernetes 服务：AWS EKS（Elastic Kubernetes Service）、GCP GKE（Google Kubernetes Engine）、Azure AKS（Azure Kubernetes Service）。选择时需要考虑：集群管理费用（EKS 收取 $0.10/hr 管理费，GKE 和 AKS 管理费较低或免费）、与平台其他服务的集成便利性、可用区和地域覆盖、以及团队的技术栈熟悉程度。

**English:**
While this project doesn't include full Kubernetes manifests, understanding Kubernetes core concepts is vital for production deployment. Key resources include:

- **Deployment**: Defines replica count, rolling update strategy (maxSurge and maxUnavailable for zero-downtime deploys), resource requests/limits, and liveness/readiness probes.
- **Service**: Provides a stable network endpoint for Pods via ClusterIP.
- **Ingress**: Configures external access, host-based routing, and TLS termination via Nginx Ingress Controller or cloud-native alternatives.
- **ConfigMap and Secret**: Manages non-sensitive configuration and sensitive credentials separately. Security depends on cluster RBAC and etcd encryption.
- **Horizontal Pod Autoscaler (HPA)**: Automatically scales replicas based on CPU utilization or custom metrics, adapting to traffic fluctuations.

Cloud platforms offer managed Kubernetes: AWS EKS, GCP GKE, and Azure AKS. Considerations include management fees, integration with other platform services, region availability, and team expertise.

---

### 阶段总结 / Stage Summary

**中文：**
第五阶段涵盖了将 NestJS 应用从开发环境带到生产环境的全部关键技能：

| 主题 | 核心内容 |
|------|----------|
| Docker 容器化 | 多阶段构建、非 root 用户、HEALTHCHECK 指令、镜像层缓存优化 |
| Docker Compose | 生产 vs 开发环境编排、Volume 挂载、资源限制、日志轮转 |
| CI/CD 流水线 | GitHub Actions 三阶段流水线、自动化测试、Docker 镜像冒烟测试 |
| 健康检查 | Liveness/Readiness/Startup 探针、@nestjs/terminus、Kubernetes 集成 |
| 监控指标 | Prometheus 格式、Counter/Gauge/Histogram、自定义指标采集 |
| 结构化日志 | JSON 格式、Request ID、分布式追踪基础 |
| 安全加固 | Helmet、CORS、环境变量验证、非 root 容器、密钥管理 |
| 优雅关闭 | SIGTERM 处理、NestJS 关闭钩子、连接排空 |
| Kubernetes | Deployment、Service、Ingress、HPA、ConfigMap/Secret |

**English:**
Stage 5 covered all critical skills for bringing a NestJS application from development to production: Docker containerization with multi-stage builds, Docker Compose orchestration for production and development, CI/CD pipelines with GitHub Actions, health checks with three probe types, Prometheus metrics collection, structured logging with request IDs, security hardening, graceful shutdown handling, and Kubernetes deployment fundamentals.

---

### 教程完结 / Tutorial Complete

**中文：**
恭喜你完成了整个 NestJS 学习教程的全部五个阶段！让我们回顾一下这段学习旅程：

**第一阶段：基础入门（Week 1-2）** -- 从 TypeScript 装饰器开始，掌握了 NestJS 的 CRUD 操作、请求生命周期、依赖注入、模块化架构等核心概念。

**第二阶段：核心能力（Week 3-5）** -- 深入学习了数据库集成（Prisma ORM）、JWT 认证、RBAC 权限控制、异常处理、日志系统、中间件/拦截器/管道/守卫的完整请求管道。

**第三阶段：进阶实战（Week 6-7）** -- 掌握了 Swagger 文档自动生成、事务处理、数据一致性、缓存策略、Bull 消息队列等企业级功能。

**第四阶段：高级专题（Week 8-9）** -- 探索了完整的测试策略（单元测试、集成测试、E2E 测试）、微服务架构（TCP/Redis 传输层）、GraphQL API 设计、WebSocket 实时通信。

**第五阶段：工程化与部署（Week 10）** -- 完成了从代码到生产的全链路：Docker 容器化、CI/CD、健康检查、监控、安全加固、Kubernetes 编排。

**下一步建议：**

1. **实战项目** -- 选择一个真实的业务场景（如电商平台、内容管理系统、协作工具），从零搭建并部署到云平台。真实项目的复杂度会迫使你面对教程中未覆盖的挑战。

2. **开源贡献** -- 参与 NestJS 生态的开源项目。阅读他人的代码是提升技能最快的方式之一。可以从修复文档错误、添加测试用例开始，逐步参与功能开发。

3. **高级模式探索** -- 深入学习 CQRS（命令查询职责分离）、Event Sourcing（事件溯源）、Saga 模式、DDD 战术设计模式等高级架构模式。

4. **推荐学习资源：**
   - [NestJS 官方文档](https://docs.nestjs.com) -- 始终是最权威的参考
   - [NestJS 官方 GitHub](https://github.com/nestjs/nest) -- 关注版本更新和新特性
   - [Kubernetes 官方文档](https://kubernetes.io/docs/) -- 深入学习容器编排
   - [Twelve-Factor App](https://12factor.net/) -- 现代应用开发的方法论
   - [Google SRE Books](https://sre.google/books/) -- 站点可靠性工程的经典著作
   - [Prometheus 官方文档](https://prometheus.io/docs/) -- 监控系统深入学习

5. **社区参与** -- 加入 NestJS Discord 社区、关注 NestJS 核心团队成员的博客和 Twitter、参加 NestJS 相关的技术会议和 Meetup。

你已经掌握了构建生产级 NestJS 应用的完整技能栈。现在，是时候将这些知识应用到真实世界中，创造有价值的产品了。祝你在 NestJS 的旅程中一切顺利！

**English:**
Congratulations on completing all five stages of this NestJS tutorial! Let's recap this learning journey:

- **Stage 1 (Week 1-2)**: TypeScript decorators, CRUD operations, request lifecycle, dependency injection, and modular architecture.
- **Stage 2 (Week 3-5)**: Database integration with Prisma, JWT authentication, RBAC, exception handling, logging, and the full request pipeline (middleware, interceptors, pipes, guards).
- **Stage 3 (Week 6-7)**: Swagger documentation, transaction handling, caching strategies, and Bull message queues.
- **Stage 4 (Week 8-9)**: Testing strategies (unit, integration, E2E), microservice architecture, GraphQL API design, and WebSocket real-time communication.
- **Stage 5 (Week 10)**: Docker containerization, CI/CD, health checks, monitoring, security hardening, and Kubernetes orchestration.

**Recommended next steps:**

1. **Build real projects** -- Choose a genuine business scenario (e-commerce, CMS, collaboration tool), build from scratch, and deploy to a cloud platform. Real-world complexity will push you beyond tutorial coverage.
2. **Contribute to open source** -- Participate in NestJS ecosystem projects. Reading others' code is one of the fastest ways to improve.
3. **Explore advanced patterns** -- Dive into CQRS, Event Sourcing, Saga patterns, and DDD tactical design patterns.
4. **Recommended resources**: NestJS official docs, Kubernetes documentation, Twelve-Factor App methodology, Google SRE Books, and Prometheus documentation.
5. **Community engagement** -- Join the NestJS Discord, follow core team members, attend meetups and conferences.

You now possess the complete skill set for building production-grade NestJS applications. It's time to apply this knowledge to create real-world value. Best of luck on your NestJS journey!
