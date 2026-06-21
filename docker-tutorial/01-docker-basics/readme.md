# Docker 基础概念与常用命令

## Docker 是什么

Docker 是一个开源的容器化平台，它能把应用程序及其所有依赖（代码、运行时、系统工具、库）打包到一个轻量级、可移植的容器中运行。你可以把它理解为"更轻量的虚拟机"——容器共享宿主机内核，启动速度快、资源占用少，且在任何安装了 Docker 的环境中都能一致地运行。

---

## 核心概念速览

| 概念 | 说明 |
|------|------|
| **镜像 (Image)** | 只读的应用模板，包含运行应用所需的一切。类似于安装光盘。 |
| **容器 (Container)** | 镜像的运行实例，拥有自己的文件系统、网络和进程空间。 |
| **仓库 (Registry)** | 存放和分发镜像的服务，默认使用 Docker Hub。 |
| **Dockerfile** | 构建镜像的配方文件，定义了镜像的每一层内容。 |

---

## 镜像相关命令

### docker pull — 拉取镜像

从 Docker Hub（或其他仓库）下载镜像到本地。

```bash
docker pull nginx
```

预期输出：

```
Using default tag: latest
latest: Pulling from library/nginx
a2abf6c4d29d: Pull complete
a9edb18cadd1: Pull complete
589b7251471a: Pull complete
186b1aaa4aa6: Pull complete
b4df32aa5a72: Pull complete
a0bcbecc962e: Pull complete
Digest: sha256:0d17b565c37bcbd895e9d923150591837d63b12a1c5a3d3c5c6a1f3b2d8e
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

也可以指定版本标签：

```bash
docker pull nginx:1.25-alpine
```

### docker images — 列出本地镜像

```bash
docker images
```

预期输出：

```
REPOSITORY   TAG              IMAGE ID       CREATED       SIZE
nginx        latest           605c77e624dd   2 weeks ago   141MB
nginx        1.25-alpine      a8758716bb6a   3 weeks ago   42.6MB
ubuntu       22.04            a878028c4b25   4 weeks ago   77.8MB
```

常用参数：

```bash
# 只显示镜像 ID
docker images -q

# 按名称过滤
docker images --filter "reference=nginx"

# 显示所有镜像（包括中间层）
docker images -a
```

### docker rmi — 删除镜像

```bash
docker rmi nginx:1.25-alpine
```

预期输出：

```
Untagged: nginx:1.25-alpine
Untagged: nginx@sha256:a8758716bb6a...
Deleted: sha256:a8758716bb6a...
```

通过镜像 ID 批量删除：

```bash
docker rmi 605c77e624dd a8758716bb6a
```

> **提示：** 如果有容器正在使用该镜像，需要先停止并删除容器，或者加 `-f` 强制删除。

### docker image prune — 清理悬空镜像

悬空镜像（dangling images）是指没有标签且没有被任何容器引用的镜像，通常是旧版本构建的残留。

```bash
docker image prune
```

预期输出：

```
WARNING! This will remove all dangling images.
Are you sure you want to continue? [y/N]: y
Deleted Images:
deleted: sha256:abc123...
deleted: sha256:def456...

Total reclaimed space: 256.3MB
```

加 `-a` 清理所有未被使用的镜像（不仅仅是悬空的）：

```bash
docker image prune -a
```

### docker tag — 给镜像打标签

为本地镜像创建一个新的标签（别名），常用于推送镜像到私有仓库前的重命名。

```bash
docker tag nginx:latest my-registry.com/my-nginx:v1.0
```

```bash
docker images my-registry.com/my-nginx
```

预期输出：

```
REPOSITORY                    TAG    IMAGE ID       CREATED       SIZE
my-registry.com/my-nginx      v1.0   605c77e624dd   2 weeks ago   141MB
```

> **注意：** `docker tag` 不会复制镜像，只是创建了一个指向同一个镜像 ID 的新引用。

---

## 容器生命周期命令

### docker run — 创建并启动容器（重点）

这是 Docker 中使用频率最高的命令，它将镜像启动为一个运行中的容器。

#### 基本语法

```bash
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

#### 常用参数详解

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台（守护进程）模式运行 | `-d` |
| `-p` | 端口映射，`宿主机端口:容器端口` | `-p 8080:80` |
| `--name` | 给容器指定一个名称 | `--name my-web` |
| `-v` | 挂载卷，`宿主机路径:容器路径` | `-v ./html:/usr/share/nginx/html` |
| `-e` | 设置环境变量 | `-e MYSQL_ROOT_PASSWORD=secret` |
| `--rm` | 容器退出后自动删除 | `--rm` |
| `-it` | 分配伪终端并进入交互模式 | `-it`（常用于 bash） |

#### 示例 1：后台运行 Nginx 并映射端口

```bash
docker run -d -p 8080:80 --name my-web nginx
```

预期输出：

```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

> 输出一串容器 ID，表示启动成功。访问 `http://localhost:8080` 即可看到 Nginx 欢迎页。

#### 示例 2：挂载本地目录，覆盖默认网页

```bash
docker run -d -p 8080:80 --name my-web \
  -v $(pwd)/html:/usr/share/nginx/html:ro \
  nginx
```

这会把你当前目录下的 `html` 文件夹挂载到容器内，作为 Nginx 的网站根目录。

#### 示例 3：启动 MySQL 并设置环境变量

```bash
docker run -d --name my-db \
  -e MYSQL_ROOT_PASSWORD=supersecret \
  -e MYSQL_DATABASE=myapp \
  -p 3306:3306 \
  mysql:8.0
```

预期输出：

```
b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3
```

#### 示例 4：交互模式进入容器（临时调试用）

```bash
docker run -it --rm ubuntu:22.04 /bin/bash
```

预期输出：

```
root@f3a1b2c3d4e5:/#
```

> 你已经进入了容器内部的 bash 终端。输入 `exit` 即可退出，由于加了 `--rm`，容器退出后会自动被删除。

#### 示例 5：同时使用多个参数

```bash
docker run -d \
  --name full-demo \
  -p 8080:80 \
  -v ./nginx.conf:/etc/nginx/nginx.conf:ro \
  -e TZ=Asia/Shanghai \
  --rm \
  nginx:latest
```

### docker ps — 查看运行中的容器

```bash
docker ps
```

预期输出：

```
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS                  NAMES
a1b2c3d4e5f6   nginx     "/docker-entrypoint.…"   2 minutes ago    Up 2 minutes    0.0.0.0:8080->80/tcp   my-web
```

常用参数：

```bash
# 显示所有容器（包括已停止的）
docker ps -a

# 只显示容器 ID
docker ps -q

# 显示最近创建的 5 个容器
docker ps -n 5

# 按状态过滤
docker ps --filter "status=exited"
```

### docker stop — 停止容器

向容器内的主进程发送 SIGTERM 信号，给进程 10 秒（默认）的优雅关闭时间，之后发送 SIGKILL。

```bash
docker stop my-web
```

预期输出：

```
my-web
```

可以同时停止多个容器：

```bash
docker stop my-web my-db another-container
```

> **提示：** 如果需要立即终止，可以使用 `docker kill my-web`（直接发送 SIGKILL）。

### docker start — 启动已停止的容器

```bash
docker start my-web
```

预期输出：

```
my-web
```

以交互模式启动一个之前停止的容器：

```bash
docker start -i my-container
```

### docker restart — 重启容器

等同于先 stop 再 start，常用于使配置生效。

```bash
docker restart my-web
```

预期输出：

```
my-web
```

可以指定等待时间（秒）：

```bash
docker restart -t 5 my-web
```

### docker rm — 删除容器

只能删除已停止的容器。

```bash
docker rm my-web
```

预期输出：

```
my-web
```

批量删除所有已停止的容器：

```bash
docker rm $(docker ps -aq -f "status=exited")
```

强制删除正在运行的容器（慎用）：

```bash
docker rm -f my-web
```

---

## 容器调试命令

### docker logs — 查看容器日志

查看容器的标准输出（stdout）和标准错误（stderr）。

```bash
docker logs my-web
```

预期输出：

```
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
...
172.17.0.1 - - [15/Jun/2025:10:23:45 +0000] "GET / HTTP/1.1" 200 615 "-" "Mozilla/5.0"
172.17.0.1 - - [15/Jun/2025:10:23:46 +0000] "GET /favicon.ico HTTP/1.1" 404 555 "-" "Mozilla/5.0"
```

常用参数：

```bash
# 实时跟踪日志（类似 tail -f）
docker logs -f my-web

# 只显示最后 20 行
docker logs --tail 20 my-web

# 显示时间戳
docker logs -t my-web

# 显示某个时间点之后的日志
docker logs --since 2h my-web

# 组合使用
docker logs -f --tail 50 -t my-web
```

### docker exec — 在运行中的容器内执行命令

这是调试容器最常用的命令之一。

```bash
# 进入容器的 bash 终端
docker exec -it my-web /bin/bash
```

预期输出：

```
root@a1b2c3d4e5f6:/#
```

在容器内执行单条命令（不进入交互模式）：

```bash
# 查看容器内的 Nginx 配置
docker exec my-web cat /etc/nginx/nginx.conf

# 查看容器内的进程
docker exec my-web ps aux

# 测试 Nginx 配置是否合法
docker exec my-web nginx -t
```

预期输出：

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### docker inspect — 查看容器/镜像的详细信息

以 JSON 格式输出容器或镜像的所有元数据。

```bash
docker inspect my-web
```

预期输出（截取部分）：

```json
[
    {
        "Id": "a1b2c3d4e5f6a7b8c9d0e1f2...",
        "Created": "2025-06-15T10:00:00.000000000Z",
        "State": {
            "Status": "running",
            "Running": true,
            "Pid": 12345,
            ...
        },
        "Image": "sha256:605c77e624dd...",
        "NetworkSettings": {
            "IPAddress": "172.17.0.2",
            "Ports": {
                "80/tcp": [
                    {
                        "HostIp": "0.0.0.0",
                        "HostPort": "8080"
                    }
                ]
            }
        },
        "Mounts": [...]
    }
]
```

使用 `--format` 提取特定字段：

```bash
# 获取容器的 IP 地址
docker inspect --format='{{.NetworkSettings.IPAddress}}' my-web
```

预期输出：

```
172.17.0.2
```

```bash
# 获取容器绑定的端口
docker inspect --format='{{json .NetworkSettings.Ports}}' my-web
```

### docker top — 查看容器内的进程

```bash
docker top my-web
```

预期输出：

```
UID       PID     PPID    C    STIME   TTY   TIME      CMD
root      12345   12330   0    10:00   ?     00:00:00  nginx: master process nginx -g daemon off;
nginx     12400   12345   0    10:00   ?     00:00:00  nginx: worker process
```

### docker stats — 查看容器资源使用情况

```bash
docker stats
```

预期输出：

```
CONTAINER ID   NAME      CPU %    MEM USAGE / LIMIT     MEM %    NET I/O          BLOCK I/O       PIDS
a1b2c3d4e5f6   my-web    0.05%    12.5MiB / 7.775GiB    0.16%    1.2kB / 650B     0B / 0B         3
b2c3d4e5f6a7   my-db     0.80%    350.2MiB / 7.775GiB   4.40%    15.6MB / 12.3MB  4.1MB / 45MB    38
```

查看特定容器的统计快照（非持续刷新）：

```bash
docker stats --no-stream my-web
```

---

## 系统清理命令

### docker system df — 查看 Docker 磁盘占用

```bash
docker system df
```

预期输出：

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          8         3         1.234GB   567.8MB (45%)
Containers      5         2         12.5MB    8.3MB (66%)
Local Volumes   4         1         256.3MB   200MB (78%)
Build Cache     12        0         890.1MB   890.1MB (100%)
```

查看更详细的占用信息：

```bash
docker system df -v
```

### docker system prune — 一键清理

清理所有已停止的容器、未被使用的网络、悬空镜像和构建缓存。

```bash
docker system prune
```

预期输出：

```
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all dangling images
  - all dangling build cache

Are you sure you want to continue? [y/N]: y
Deleted Containers:
a1b2c3d4e5f6...
b2c3d4e5f6a7...

Deleted Images:
deleted: sha256:abc123...

Total reclaimed space: 456.7MB
```

彻底清理（包括所有未使用的镜像和卷，慎用）：

```bash
# 清理所有未使用的镜像（不仅是悬空的）
docker system prune -a

# 连同卷一起清理（会删除未使用的数据卷，数据不可恢复！）
docker system prune -a --volumes

# 跳过确认提示
docker system prune -a -f
```

---

## 动手练习：Nginx 全流程操作

下面是一个完整的实战练习，覆盖镜像拉取、容器启动、配置修改、日志查看、停止与清理的全流程。

### 第一步：拉取 Nginx 镜像

```bash
docker pull nginx:latest
```

```
Using default tag: latest
latest: Pulling from library/nginx
...
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

确认镜像已下载：

```bash
docker images nginx
```

```
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    605c77e624dd   2 weeks ago   141MB
```

### 第二步：启动 Nginx 容器

```bash
docker run -d \
  --name nginx-lab \
  -p 8080:80 \
  -v $(pwd)/nginx-lab/html:/usr/share/nginx/html:ro \
  nginx:latest
```

创建一个自定义首页：

```bash
mkdir -p nginx-lab/html
cat > nginx-lab/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Docker Lab</title></head>
<body>
  <h1>Hello from Docker!</h1>
  <p>This page is served from a mounted volume.</p>
</body>
</html>
EOF
```

验证页面是否正常：

```bash
curl http://localhost:8080
```

```
<!DOCTYPE html>
<html>
<head><title>Docker Lab</title></head>
<body>
  <h1>Hello from Docker!</h1>
  <p>This page is served from a mounted volume.</p>
</body>
</html>
```

### 第三步：修改 Nginx 配置

把容器内的 Nginx 配置拷贝出来：

```bash
docker cp nginx-lab:/etc/nginx/nginx.conf ./nginx-lab/nginx.conf
```

编辑 `nginx.conf`，例如修改 worker 连接数：

```bash
# 在 events 块中修改 worker_connections
sed -i 's/worker_connections.*/worker_connections  2048;/' nginx-lab/nginx.conf
```

停止当前容器，用新配置重新启动：

```bash
docker stop nginx-lab && docker rm nginx-lab

docker run -d \
  --name nginx-lab \
  -p 8080:80 \
  -v $(pwd)/nginx-lab/html:/usr/share/nginx/html:ro \
  -v $(pwd)/nginx-lab/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:latest
```

验证配置已生效：

```bash
docker exec nginx-lab nginx -T | grep worker_connections
```

```
worker_connections  2048;
```

### 第四步：查看容器日志

```bash
docker logs --tail 10 nginx-lab
```

```
172.17.0.1 - - [15/Jun/2025:12:00:01 +0000] "GET / HTTP/1.1" 200 162 "-" "curl/7.81.0"
172.17.0.1 - - [15/Jun/2025:12:00:02 +0000] "GET /favicon.ico HTTP/1.1" 404 555 "-" "curl/7.81.0"
```

实时跟踪日志，同时在另一个终端访问 `http://localhost:8080`：

```bash
docker logs -f nginx-lab
```

### 第五步：查看容器状态与资源占用

```bash
docker ps --filter "name=nginx-lab"
```

```
CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS          PORTS                  NAMES
f1e2d3c4b5a6   nginx:latest   "/docker-entrypoint.…"   5 minutes ago    Up 5 minutes    0.0.0.0:8080->80/tcp   nginx-lab
```

```bash
docker stats --no-stream nginx-lab
```

```
CONTAINER ID   NAME        CPU %    MEM USAGE / LIMIT     MEM %    NET I/O        BLOCK I/O    PIDS
f1e2d3c4b5a6   nginx-lab   0.02%    8.45MiB / 7.775GiB    0.11%    4.5kB / 2.1kB  0B / 0B      3
```

### 第六步：停止并清理

```bash
# 停止容器
docker stop nginx-lab
```

```
nginx-lab
```

```bash
# 删除容器
docker rm nginx-lab
```

```
nginx-lab
```

```bash
# 删除镜像（可选）
docker rmi nginx:latest
```

```
Untagged: nginx:latest
Untagged: nginx@sha256:...
Deleted: sha256:605c77e624dd...
```

```bash
# 清理残留的构建缓存和悬空镜像
docker system prune -f
```

```
Deleted Images:
...

Total reclaimed space: 0B
```

---

## 命令速查表 (Cheatsheet)

### 镜像命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `docker pull` | 从仓库拉取镜像 | `docker pull nginx:1.25-alpine` |
| `docker images` | 列出本地镜像 | `docker images --filter "reference=nginx"` |
| `docker rmi` | 删除镜像 | `docker rmi nginx:latest` |
| `docker image prune` | 清理悬空镜像 | `docker image prune -a` |
| `docker tag` | 给镜像打标签 | `docker tag nginx:latest my-nginx:v1` |

### 容器生命周期命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `docker run` | 创建并启动容器 | `docker run -d -p 8080:80 --name web nginx` |
| `docker run -d` | 后台运行 | `docker run -d nginx` |
| `docker run -p` | 端口映射 | `docker run -p 8080:80 nginx` |
| `docker run --name` | 指定容器名称 | `docker run --name my-web nginx` |
| `docker run -v` | 挂载卷 | `docker run -v ./data:/data nginx` |
| `docker run -e` | 设置环境变量 | `docker run -e KEY=value nginx` |
| `docker run --rm` | 退出后自动删除 | `docker run --rm -it ubuntu bash` |
| `docker run -it` | 交互模式 | `docker run -it ubuntu /bin/bash` |
| `docker ps` | 查看运行中的容器 | `docker ps -a` |
| `docker stop` | 停止容器 | `docker stop my-web` |
| `docker start` | 启动已停止的容器 | `docker start my-web` |
| `docker restart` | 重启容器 | `docker restart my-web` |
| `docker rm` | 删除容器 | `docker rm my-web` |

### 容器调试命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `docker logs` | 查看容器日志 | `docker logs -f --tail 50 my-web` |
| `docker exec` | 在容器内执行命令 | `docker exec -it my-web /bin/bash` |
| `docker inspect` | 查看详细信息 | `docker inspect --format='{{.State.Status}}' my-web` |
| `docker top` | 查看容器内进程 | `docker top my-web` |
| `docker stats` | 查看资源使用情况 | `docker stats --no-stream my-web` |

### 系统清理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `docker system df` | 查看磁盘占用 | `docker system df -v` |
| `docker system prune` | 一键清理 | `docker system prune -a -f` |
