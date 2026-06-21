# ============================================
# Node.js 应用 Dockerfile — 生产环境最佳实践
# ============================================

# 使用 node:18-alpine 基础镜像（体积小、安全）
FROM node:18-alpine

# 设置环境变量
ENV NODE_ENV=production

# 设置工作目录
WORKDIR /app

# 先复制 package.json 和 lock 文件，安装依赖
# 利用构建缓存：只要 package.json 不变，就会使用缓存，不会重复安装
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# 再复制源代码（源代码变动不会导致依赖重新安装）
COPY src/ ./src/

# 创建非 root 用户并设置文件权限
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# 切换到非 root 用户运行应用
USER appuser

# 声明应用监听的端口
EXPOSE 3000

# 启动应用
CMD ["node", "src/index.js"]
