# ============================================
# 多阶段构建 Dockerfile - Go HTTP 服务器
# ============================================
# 构建阶段使用完整的 Go 编译镜像
# 运行阶段只保留编译好的静态二进制文件
# 最终镜像大小约 10-15MB
# ============================================

# ============================
# 阶段一：构建阶段（Builder）
# ============================
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装必要的构建工具（如果需要 git 依赖）
RUN apk add --no-cache git

# 先复制依赖管理文件，利用 Docker 缓存层
# 当 go.mod / go.sum 未变化时，跳过 go mod download
COPY go.mod go.sum* ./
RUN go mod download

# 复制全部源代码
COPY . .

# 编译静态二进制文件
# CGO_ENABLED=0       禁用 CGO，确保生成纯静态链接的二进制
# GOOS=linux          目标操作系统为 Linux
# -a                  强制重新编译所有包
# -installsuffix cgo  安装目录后缀
# -ldflags="-w -s"    去除 DWARF 调试信息和符号表，显著减小体积
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o server .

# ============================
# 阶段二：运行阶段（Runner）
# ============================
FROM alpine:3.18 AS runner

# 安装 CA 证书，使应用能够发起 HTTPS 请求
RUN apk --no-cache add ca-certificates \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

WORKDIR /app

# 仅从构建阶段复制编译好的二进制文件
# 源代码、Go 编译器等均不会出现在最终镜像中
COPY --from=builder /app/server .

# 切换为非 root 用户运行，提高安全性
USER appuser

# 暴露服务端口
EXPOSE 8080

# 启动应用
CMD ["./server"]
