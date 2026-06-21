# =============================================================================
# 多阶段 Docker 构建（Multi-stage Build）
# =============================================================================
#
# 【为什么使用多阶段构建？】
# 1. 减小最终镜像体积 - 生产镜像只包含运行时依赖和编译产物
# 2. 提高安全性 - 不包含源代码、开发工具和测试文件
# 3. 构建缓存优化 - 依赖安装层和编译层分离，充分利用 Docker 层缓存
# 4. 职责分离 - 安装依赖、编译代码、运行服务各自独立
#
# 【构建流程概览】
# Stage 1 (deps)   → 安装所有依赖（含 devDependencies）
# Stage 2 (build)  → 编译 TypeScript 为 JavaScript
# Stage 3 (production) → 仅安装生产依赖 + 编译产物
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: 依赖安装阶段
# -----------------------------------------------------------------------------
# 使用 Alpine Linux 作为基础镜像（体积小，约 5MB）
# Node.js 20 是当前 LTS 版本，适合生产环境
FROM node:20-alpine AS deps

# 设置工作目录
WORKDIR /app

# 先复制依赖描述文件
# 【Docker 层缓存技巧】：将 package.json 和 lock 文件单独 COPY
# 这样只要依赖不变，就不会触发后续的 npm install 重新执行
COPY package.json pnpm-lock.yaml ./

# 启用 corepack（Node.js 16.9+ 内置的包管理器管理工具）
# 然后使用 pnpm 安装依赖
# --frozen-lockfile: 确保安装结果与 lock 文件一致（类似 npm ci）
# --prod=false: 安装所有依赖，包含 devDependencies（编译需要）
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

# -----------------------------------------------------------------------------
# Stage 2: 编译构建阶段
# -----------------------------------------------------------------------------
# 使用相同的基础镜像，复用依赖层缓存
FROM node:20-alpine AS build

WORKDIR /app

# 从 deps 阶段复制已安装的 node_modules
# 这比重新安装更快，且保证版本一致
COPY --from=deps /app/node_modules ./node_modules

# 复制所有源代码（.dockerignore 会排除不需要的文件）
COPY . .

# 编译 TypeScript 为 JavaScript
# 输出到 dist/ 目录
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: 生产运行阶段
# -----------------------------------------------------------------------------
# 最终的生产镜像，只包含运行所需的文件
FROM node:20-alpine AS production

WORKDIR /app

# 设置生产环境变量
# NODE_ENV=production 会让很多库启用优化模式
# 例如 Express 会缓存视图和编译的正则表达式
ENV NODE_ENV=production

# 复制依赖描述文件（用于安装生产依赖）
COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖
# --prod: 跳过 devDependencies，减小镜像体积
# 生产环境不需要 TypeScript 编译器、测试框架等开发工具
RUN corepack enable && pnpm install --frozen-lockfile --prod

# 从 build 阶段复制编译产物
# 只需要 dist/ 目录（已编译的 JavaScript）
COPY --from=build /app/dist ./dist

# =============================================================================
# 安全加固：使用非 root 用户运行
# =============================================================================
# 【为什么不能用 root 运行？】
# 1. 如果容器被攻破，攻击者将获得 root 权限
# 2. 某些安全漏洞（如容器逃逸）在 root 下危害更大
# 3. Kubernetes Pod Security Standards 要求非 root 运行
#
# 创建专用的 nestjs 用户和用户组
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001

# 切换到非 root 用户
USER nestjs

# 暴露应用端口（仅声明，实际映射由 docker run -p 指定）
EXPOSE 3000

# =============================================================================
# 健康检查配置
# =============================================================================
# 【Docker HEALTHCHECK 说明】
# Docker 内置的健康检查机制，定期检查容器是否正常运行
#
# --interval=30s  : 每 30 秒检查一次
# --timeout=3s    : 每次检查超时 3 秒
# --start-period  : 容器启动后的宽限期（等待应用启动）
# --retries=3     : 连续失败 3 次标记为 unhealthy
#
# 使用 wget 而不是 curl，因为 Alpine 镜像自带 wget
# 检查 liveness 端点（/health/live）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health/live || exit 1

# =============================================================================
# 启动命令
# =============================================================================
# 直接运行编译后的 JavaScript，不经过 ts-node
# 使用 node 直接运行比 nest start 更高效
CMD ["node", "dist/main.js"]
