# 第三章：多阶段构建（Multi-stage Build）—— 减小镜像体积

在 Docker 的使用过程中，镜像体积是一个经常被困扰开发者的问题。一个包含了完整编译环境和运行时依赖的镜像，往往会达到数百 MB 甚至 GB 级别的大小。这不仅影响部署速度，还会增加安全风险。多阶段构建（Multi-stage Build）正是为了解决这个问题而诞生的。

## 目录

- [什么是多阶段构建](#什么是多阶段构建)
- [为什么需要多阶段构建](#为什么需要多阶段构建)
- [基本语法](#基本语法)
- [阶段命名](#阶段命名)
- [从指定阶段复制](#从指定阶段复制)
- [示例一：Go 应用](#示例一go-应用)
- [示例二：React 前端应用](#示例二react-前端应用)
- [单阶段 vs 多阶段镜像大小对比](#单阶段-vs-多阶段镜像大小对比)
- [最佳实践](#最佳实践)

---

## 什么是多阶段构建

多阶段构建是 Docker 17.05 版本引入的特性。它允许你在一个 Dockerfile 中使用**多个 `FROM` 指令**，每个 `FROM` 指令都会开始一个新的构建阶段。

在传统的单阶段构建中，最终镜像会包含构建过程中产生的所有中间产物（如源代码、编译工具、临时文件等）。而多阶段构建允许我们将"构建阶段"和"运行阶段"分离开来，最终只将运行所需的产物复制到最终的镜像中。

简单来说：

- **构建阶段**：使用包含完整编译工具链的大镜像（如 `golang`、`node`），完成代码编译
- **运行阶段**：使用精简的基础镜像（如 `alpine`、`scratch`），只包含运行所需的最小依赖

## 为什么需要多阶段构建

### 传统方式的痛点

在没有多阶段构建之前，开发者通常有两种选择：

**方式一：在同一个镜像中完成构建和运行**

```dockerfile
FROM golang:1.21
WORKDIR /app
COPY . .
RUN go build -o server .
CMD ["./server"]
```

问题：最终镜像包含了完整的 Go 编译器和所有源代码，体积可达 **800MB+**。

**方式二：使用两个独立的 Dockerfile**

先用一个 Dockerfile 构建产物，再手动将产物复制到另一个 Dockerfile 中继续构建。

问题：流程复杂，需要手动管理中间产物的传递。

### 多阶段构建的优势

| 优势 | 说明 |
|------|------|
| **镜像体积小** | 最终镜像只包含运行时依赖，可从数百 MB 缩减到十几 MB |
| **安全性高** | 构建工具链和源代码不会出现在最终镜像中，减少攻击面 |
| **流程简单** | 一个 Dockerfile 完成所有工作，无需手动传递中间产物 |
| **可维护性强** | 构建逻辑集中在一个文件中，便于团队协作和 CI/CD 集成 |

## 基本语法

多阶段构建的核心就是在 Dockerfile 中使用多个 `FROM` 指令：

```dockerfile
# 第一个构建阶段
FROM <基础镜像> 
RUN <构建步骤>

# 第二个构建阶段（也是最终阶段）
FROM <精简基础镜像>
COPY --from=<第一阶段> <构建产物路径> <目标路径>
CMD <运行命令>
```

**关键规则：**

- 每个 `FROM` 指令开始一个新的构建阶段
- 后续阶段可以访问前面阶段产生的文件和产物
- 最终镜像只包含**最后一个阶段**的内容
- 中间阶段在构建完成后会被丢弃

## 阶段命名

为了让 Dockerfile 更加清晰和可读，可以为每个构建阶段指定一个名称：

```dockerfile
# 使用 AS 关键字为阶段命名
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server .

FROM alpine:3.18 AS runner
WORKDIR /app
COPY --from=builder /app/server .
CMD ["./server"]
```

**命名规范建议：**

- 阶段名称应使用小写字母和连字符
- 常见的阶段命名：`builder`、`runner`、`compiler`、`deps`、`production` 等
- 阶段名称便于在 `COPY --from` 指令中引用，避免使用数字索引

> 如果不指定名称，可以使用数字索引（从 0 开始）引用阶段，例如 `COPY --from=0`。但这种做法可读性较差，不推荐使用。

## 从指定阶段复制

`COPY --from` 是多阶段构建中最关键的指令，它用于从指定的构建阶段复制文件：

```dockerfile
# 从名为 builder 的阶段复制文件
COPY --from=builder /src/app/dist /usr/share/nginx/html

# 从数字索引为 0 的阶段复制文件
COPY --from=0 /src/app/dist /usr/share/nginx/html
```

**支持的复制模式：**

```dockerfile
# 复制单个文件
COPY --from=builder /app/server /app/server

# 复制整个目录
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# 配合通配符使用
COPY --from=builder /app/dist/*.js /usr/share/nginx/html/
```

## 示例一：Go 应用

Go 语言的静态编译特性使其非常适合多阶段构建。下面我们以一个 Go HTTP 服务器为例，演示完整的多阶段构建流程。

### 项目结构

```
go-app/
├── main.go          # Go 源代码
├── go.mod           # Go 模块文件
└── Dockerfile       # 多阶段构建 Dockerfile
```

### Go 源代码（main.go）

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, Docker Multi-stage Build!")
    })

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, "OK")
    })

    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Dockerfile

```dockerfile
# ============================
# 阶段一：构建阶段（Builder）
# ============================
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 先复制 go.mod 和 go.sum，利用 Docker 缓存层
COPY go.mod go.sum* ./
RUN go mod download

# 复制源代码并编译
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o server .

# ============================
# 阶段二：运行阶段（Runner）
# ============================
FROM alpine:3.18 AS runner

# 安装必要的 CA 证书（支持 HTTPS 请求）
RUN apk --no-cache add ca-certificates

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 从构建阶段复制编译好的二进制文件
COPY --from=builder /app/server .

# 切换到非 root 用户
USER appuser

EXPOSE 8080

CMD ["./server"]
```

### 构建与运行

```bash
# 构建镜像
docker build -t go-app:multistage ./go-app

# 运行容器
docker run -d -p 8080:8080 --name my-go-app go-app:multistage

# 测试
curl http://localhost:8080          # 输出: Hello, Docker Multi-stage Build!
curl http://localhost:8080/health   # 输出: OK
```

### 镜像大小对比

| 构建方式 | 基础镜像 | 镜像大小 |
|---------|---------|---------|
| 单阶段（golang:1.21） | golang:1.21 | ~800MB |
| 单阶段（golang:1.21-alpine） | golang:1.21-alpine | ~350MB |
| **多阶段（alpine:3.18）** | alpine:3.18 | **~12MB** |
| 多阶段（scratch） | scratch | **~6MB** |

## 示例二：React 前端应用

前端应用的构建过程需要 Node.js 和大量 npm 依赖，但最终产物只是静态文件。多阶段构建可以极大地精简最终镜像。

### 项目结构

```
react-app/
├── public/
│   └── index.html      # HTML 模板
├── src/
│   ├── App.js          # React 组件
│   └── index.js        # 入口文件
├── package.json        # 项目依赖
├── Dockerfile          # 多阶段构建 Dockerfile
├── nginx.conf          # Nginx 配置
└── .dockerignore       # Docker 忽略文件
```

### Dockerfile

```dockerfile
# ============================
# 阶段一：构建阶段（Builder）
# ============================
FROM node:18-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 复制源代码并构建
COPY . .
RUN npm run build

# ============================
# 阶段二：运行阶段（Runner）
# ============================
FROM nginx:alpine AS runner

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 构建与运行

```bash
# 构建镜像
docker build -t react-app:multistage ./react-app

# 运行容器
docker run -d -p 80:80 --name my-react-app react-app:multistage

# 在浏览器中访问
open http://localhost   # macOS
xdg-open http://localhost  # Linux
start http://localhost  # Windows
```

### 镜像大小对比

| 构建方式 | 基础镜像 | 镜像大小 |
|---------|---------|---------|
| 单阶段（node:18） | node:18 | ~1.2GB |
| 单阶段（node:18-alpine） | node:18-alpine | ~500MB |
| **多阶段（nginx:alpine）** | nginx:alpine | **~25MB** |

## 单阶段 vs 多阶段镜像大小对比

下表汇总了两种示例应用的镜像大小对比：

```
Go 应用镜像大小对比
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 单阶段 (golang:1.21)         ████████████████████████████████████  ~800MB
 单阶段 (golang:1.21-alpine)  ████████████████                     ~350MB
 多阶段 (alpine:3.18)         █                                    ~12MB   ★
 多阶段 (scratch)             ▌                                    ~6MB    ★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

React 应用镜像大小对比
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 单阶段 (node:18)             ████████████████████████████████████  ~1.2GB
 单阶段 (node:18-alpine)      ████████████████                     ~500MB
 多阶段 (nginx:alpine)        █                                    ~25MB   ★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**结论：多阶段构建可以将镜像体积缩减 95% 以上。**

## 最佳实践

### 1. 合理利用构建缓存

将不经常变化的层放在前面，频繁变化的层放在后面：

```dockerfile
# 先复制依赖文件（不常变化）
COPY go.mod go.sum ./
RUN go mod download

# 再复制源代码（经常变化）
COPY . .
RUN go build -o server .
```

这样当只有源代码变化时，`go mod download` 层会被缓存，加快构建速度。

### 2. 使用轻量级基础镜像

- **Go 应用**：优先使用 `alpine`，极致场景可使用 `scratch`
- **Node.js 应用**：运行阶段使用 `nginx:alpine` 或 `node:alpine`
- **Python 应用**：运行阶段使用 `python:slim` 或 `python:alpine`

### 3. 创建非 root 用户

始终在最终镜像中以非 root 用户身份运行应用：

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### 4. 优化编译参数

Go 应用编译时使用以下参数减小二进制体积：

```dockerfile
# CGO_ENABLED=0  禁用 CGO，生成静态二进制
# -ldflags="-w -s" 去除调试信息和符号表，减小体积
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o server .
```

### 5. 使用 .dockerignore 文件

排除不必要的文件，减少构建上下文大小：

```
node_modules
.git
.gitignore
*.md
.env
.env.local
Dockerfile
docker-compose*.yml
.dockerignore
```

### 6. 避免在最终镜像中保留敏感信息

构建阶段中的密钥、证书等敏感信息不应复制到最终镜像中：

```dockerfile
# 使用 BuildKit 的 secret 挂载（推荐）
RUN --mount=type=secret,id=mysecret \
    MY_SECRET=$(cat /run/secrets/mysecret) \
    go build -o server .
```

### 7. 考虑使用 scratch 作为最终基础镜像

对于 Go 等能生成完全静态二进制的语言，可以使用 `scratch`（空白镜像）作为最终阶段：

```dockerfile
FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
CMD ["/server"]
```

这样最终镜像将只包含你的二进制文件，体积可控制在 **5-8MB**。

### 8. 多阶段构建中的调试技巧

如果需要调试某个中间阶段，可以直接构建到特定阶段：

```bash
# 只构建到 builder 阶段
docker build --target builder -t go-app:builder ./go-app

# 进入 builder 容器检查编译产物
docker run -it go-app:builder sh
```

---

## 本章小结

| 知识点 | 要点 |
|--------|------|
| 多阶段构建 | 一个 Dockerfile 中使用多个 `FROM` 指令 |
| 阶段命名 | `FROM ... AS name`，提高可读性和可维护性 |
| 阶段复制 | `COPY --from=name`，从指定阶段复制构建产物 |
| 镜像瘦身 | 构建用大镜像，运行用小镜像，体积可缩减 95%+ |
| 安全性 | 不暴露源代码和构建工具，使用非 root 用户 |
| 缓存优化 | 依赖文件前置，源代码后置，充分利用 Docker 缓存层 |

多阶段构建是现代 Docker 实践的基础技能。无论你是在构建 Go 微服务、React 前端还是其他类型的应用，都应该采用多阶段构建来获得更小、更安全、更高效的容器镜像。
