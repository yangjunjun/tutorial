# ============================================================
# 博客系统 Dockerfile - 多阶段构建（Spring Boot 2.5.12 / JDK 8）
# ============================================================
#
# 构建方式：
#   docker build -t blog-app:latest .
#
# 运行方式：
#   docker run -d -p 8080:8080 \
#     -e SPRING_PROFILES_ACTIVE=prod \
#     -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/blog \
#     --name blog-app blog-app:latest
#
# 镜像大小对比：
#   单阶段构建（JDK）:  ~500MB
#   多阶段构建（JRE）:  ~230MB  ← 本文件
#
# JDK 版本说明：
#   本教程使用 JDK 8（Spring Boot 2.5.12 官方支持 8+），
#   基础镜像必须选择 8-jre / 8-jdk 系列标签。
#   eclipse-temurin 是 AdoptOpenJDK 的官方延续，提供 8-jre 镜像；
#   如果内网无法访问 hub.docker.com，也可使用 openjdk:8-jre-slim。
#
# 关于 Spring Boot 分层 JAR（layertools）：
#   Spring Boot 2.3+ 支持 java -Djarmode=layertools -jar app.jar extract
#   生成分层目录，本教程为保持 Dockerfile 简单易读，采用直接 COPY JAR 的方式。
#   如需优化镜像构建缓存，可在运行阶段改为：
#     java -Djarmode=layertools -jar app.jar extract --destination extracted
#   然后分四层 COPY（dependencies / spring-boot-loader / snapshot-dependencies / application）。
# ============================================================


# ============================================================
# 阶段一：构建阶段（Builder）
# ============================================================
# 使用包含 Maven + JDK 8 的镜像进行项目编译
# 这个阶段的产物是编译后的 JAR 文件
# ============================================================
FROM maven:3.8-openjdk-8 AS builder

# 设置构建目录
WORKDIR /build

# ---- 依赖缓存优化 ----
# 先复制 pom.xml，利用 Docker 层缓存机制
# 只有 pom.xml 发生变化时，才会重新下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B

# ---- 复制源代码 ----
COPY src ./src

# ---- 执行构建 ----
# -DskipTests: 跳过测试（测试应在 CI 阶段完成）
# -B: 批处理模式，减少不必要的日志输出
RUN mvn clean package -DskipTests -B


# ============================================================
# 阶段二：运行阶段（Runtime）
# ============================================================
# 使用仅包含 JRE 8 的精简镜像来运行应用
# eclipse-temurin:8-jre 基于 Ubuntu，约 230MB
# （JDK 8 没有 Alpine 官方镜像，如需更小体积可用
#   amazoncorretto:8-alpine-jre，需自行评估兼容性）
# ============================================================
FROM eclipse-temurin:8-jre AS runtime

# ---- 安装必要的系统工具 ----
# curl: 用于健康检查
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# ---- 创建非 root 用户（安全最佳实践）----
# 使用非 root 用户运行应用，降低容器逃逸风险
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

# ---- 设置工作目录 ----
WORKDIR /app

# ---- 从构建阶段复制 JAR 文件 ----
COPY --from=builder /build/target/*.jar app.jar

# ---- 创建必要的目录 ----
# /app/uploads: 用户上传文件目录
# /app/logs:    应用日志目录
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appuser /app

# ---- 切换到非 root 用户 ----
USER appuser

# ---- JVM 参数配置（可通过环境变量覆盖）----
# -Xms256m:  初始堆内存 256MB
# -Xmx512m:  最大堆内存 512MB
# -XX:+UseParallelGC: JDK 8 下服务器端常用的稳定收集器
#   （G1 在 JDK 8 中可用但不如 JDK 17 成熟，可按需切换 -XX:+UseG1GC）
# -XX:+ExitOnOutOfMemoryError: OOM 时退出进程（让 Docker 重启容器）
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseParallelGC -XX:+ExitOnOutOfMemoryError"

# ---- Spring Boot 配置 ----
# 默认使用 prod profile
ENV SPRING_PROFILES_ACTIVE=prod

# ---- 暴露应用端口 ----
EXPOSE 8080

# ---- 健康检查 ----
# 每 30 秒检查一次应用健康状态
# 连续 3 次失败后标记为 unhealthy
# 启动宽限期 60 秒（Spring Boot 首次启动较慢）
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# ---- 启动命令 ----
# 使用 exec 形式的 ENTRYPOINT，确保 Java 进程是 PID 1
# 通过 $JAVA_OPTS 支持运行时调整 JVM 参数
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
