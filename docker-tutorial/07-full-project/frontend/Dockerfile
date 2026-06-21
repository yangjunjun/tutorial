# =============================================================================
# 前端 Dockerfile（多阶段构建：Node 构建 -> Nginx 运行）
# =============================================================================
# 构建目标：
#   - development：React 开发服务器（热重载）
#   - production：Nginx 托管静态资源（优化体积和性能）
# =============================================================================

# ── 第一阶段：安装依赖 ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && \
    npm cache clean --force

# ── 第二阶段：开发环境 ────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY public/ ./public/
COPY src/ ./src/

# 开发环境环境变量
ENV REACT_APP_API_URL=/api
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

EXPOSE 3000

CMD ["npm", "start"]

# ── 第三阶段：生产构建 ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY public/ ./public/
COPY src/ ./src/

# 构建参数（通过 docker-compose 传入）
ARG REACT_APP_API_URL=/api
ARG REACT_APP_VERSION=latest

# 设置环境变量供构建时使用
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false

# 执行生产构建
RUN npm run build

# ── 第四阶段：生产运行（Nginx 托管静态文件）────────────────────────────────────
FROM nginx:1.25-alpine AS production

# 删除 Nginx 默认页面
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 复制自定义 Nginx 配置（前端容器内部使用）
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:3000; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 创建非 root 用户运行 Nginx（可选安全加固）
# 注意：Alpine Nginx 镜像默认以 nginx 用户运行 worker 进程

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -fsS http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
