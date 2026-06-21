# ============================================
# Python 应用 Dockerfile — 生产环境最佳实践
# ============================================

# 使用 python:3.11-slim 基础镜像（体积小，兼容性好）
FROM python:3.11-slim

# 设置环境变量：不生成 .pyc 文件，输出不被缓冲
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 先复制 requirements.txt 安装依赖
# 利用构建缓存：只要 requirements.txt 不变，就会使用缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 再复制源代码（源代码变动不会导致依赖重新安装）
COPY . .

# 创建非 root 用户并设置权限
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser && \
    chown -R appuser:appgroup /app

# 切换到非 root 用户运行应用
USER appuser

# 声明应用监听的端口
EXPOSE 8000

# 使用 uvicorn 启动 FastAPI 应用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
