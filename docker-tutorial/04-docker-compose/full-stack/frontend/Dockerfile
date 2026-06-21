# ============================================================
# React 前端 - Dockerfile（多阶段构建）
# 阶段1：Node.js 构建生产版本
# 阶段2：Nginx 提供静态文件服务
# ============================================================

# ---------- 阶段 1：构建阶段 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖描述文件（利用 Docker 层缓存）
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# 安装依赖（根据实际使用的包管理器选择）
RUN if [ -f pnpm-lock.yaml ]; then \
        corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile; \
    else \
        npm ci; \
    fi

# 复制源代码
COPY . .

# 构建生产版本
RUN if [ -f pnpm-lock.yaml ]; then \
        corepack enable pnpm && pnpm run build; \
    elif [ -f yarn.lock ]; then \
        yarn build; \
    else \
        npm run build; \
    fi

# ---------- 阶段 2：运行阶段（Nginx 提供静态文件服务）----------
FROM nginx:1.25-alpine AS production

# 删除默认 Nginx 配置
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 Nginx 默认目录
COPY --from=builder /app/build /usr/share/nginx/html

# 复制自定义 Nginx 配置（支持 React Router 的 SPA fallback）
RUN printf 'server {\n\
    listen 3000;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /static {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
