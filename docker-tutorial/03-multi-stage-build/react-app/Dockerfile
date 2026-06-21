# ============================================
# 多阶段构建 Dockerfile - React 前端应用
# ============================================
# 构建阶段使用 Node.js 镜像编译前端代码
# 运行阶段使用 Nginx 提供静态文件服务
# 最终镜像大小约 25MB
# ============================================

# ============================
# 阶段一：构建阶段（Builder）
# ============================
FROM node:18-alpine AS builder

WORKDIR /app

# 先复制依赖管理文件，利用 Docker 缓存层
# 当 package.json 未变化时，跳过 npm install
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
# CI=true 确保构建过程中 warning 不会导致失败
# GENERATE_SOURCEMAP=false 不生成 source map，减小体积
RUN CI=true GENERATE_SOURCEMAP=false npm run build

# ============================
# 阶段二：运行阶段（Runner）
# ============================
FROM nginx:alpine AS runner

# 复制自定义 Nginx 配置（支持 SPA 路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制编译产物
# 源代码、node_modules、构建工具等均不会出现在最终镜像中
COPY --from=builder /app/build /usr/share/nginx/html

# 暴露 HTTP 端口
EXPOSE 80

# 启动 Nginx（前台运行）
CMD ["nginx", "-g", "daemon off;"]
