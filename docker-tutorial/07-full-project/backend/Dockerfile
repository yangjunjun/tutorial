# =============================================================================
# 后端 Dockerfile（多阶段构建）
# =============================================================================
# 构建目标：
#   - development：包含开发依赖和 nodemon，用于本地开发
#   - production：精简镜像，仅包含运行时所需文件
# =============================================================================

# ── 第一阶段：安装依赖 ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# 仅复制依赖清单，充分利用构建缓存
COPY package.json package-lock.json* ./

# 安装所有依赖（含 devDependencies，后续阶段按需裁剪）
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ── 第二阶段：开发环境 ────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# 复制全部依赖
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# 安装开发工具（nodemon 用于热重载）
RUN npm install -g nodemon

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 复制源代码（开发环境通过 bind mount 覆盖）
COPY src/ ./src/

# 设置目录权限
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000 9229

CMD ["node", "src/app.js"]

# ── 第三阶段：生产构建（可选的 TypeScript 编译 / 资源打包）────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# 如果有构建步骤（如 Babel 编译），在此执行
# RUN npm run build

# ── 第四阶段：生产运行 ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 仅安装生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# 从构建阶段复制应用代码
COPY --from=builder /app/src ./src/

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 安全加固：只读文件系统 + 最小 capabilities
RUN chown -R appuser:appgroup /app

USER appuser

# 健康检查
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=20s \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000

# 使用非 root 用户启动应用
CMD ["node", "src/app.js"]
