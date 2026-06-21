# Docker 网络模型与自定义网络

Docker 网络是容器化架构中最核心的组件之一。理解 Docker 的网络模型，掌握自定义网络的创建与管理，是构建安全、可靠的容器化应用的基础。

---

## 目录

1. [Docker 网络驱动类型](#1-docker-网络驱动类型)
2. [默认网络 vs 自定义网络](#2-默认网络-vs-自定义网络)
3. [常用网络命令](#3-常用网络命令)
4. [容器间通信与 DNS 解析](#4-容器间通信与-dns-解析)
5. [端口映射原理](#5-端口映射原理)
6. [自定义网络的优势](#6-自定义网络的优势)
7. [网络模式选择指南](#7-网络模式选择指南)
8. [实战：搭建前后端分离的网络架构](#8-实战搭建前后端分离的网络架构)

---

## 1. Docker 网络驱动类型

Docker 提供了多种网络驱动（Network Driver），每种驱动适用于不同的场景。

### 1.1 bridge（桥接网络，默认）

`bridge` 是 Docker 的默认网络驱动。当你启动容器时，如果不指定网络，容器会自动连接到默认的 `bridge` 网络。

**工作原理：**
- Docker 在宿主机上创建一个虚拟网桥（`docker0`）
- 每个容器分配一个独立的网络命名空间
- 容器通过虚拟以太网对（veth pair）连接到网桥
- 同一 bridge 网络中的容器可以通过 IP 地址互相通信

```bash
# 查看默认 bridge 网络
docker network inspect bridge

# 使用默认 bridge 启动容器
docker run -d --name web nginx

# 查看容器的 IP 地址
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web
```

**默认 bridge 网络的局限性：**
- 不支持容器名 DNS 解析（自定义 bridge 网络支持）
- 所有容器共享同一个网络，缺乏隔离
- 容器间只能通过 IP 地址通信，不能通过容器名通信

### 1.2 host（主机网络）

`host` 模式下，容器直接使用宿主机的网络栈，不进行任何网络隔离。

**特点：**
- 容器与宿主机共享相同的网络命名空间
- 不需要端口映射（-p 参数无效）
- 网络性能最佳，没有 NAT 开销
- 仅适用于 Linux（Windows 和 macOS 不支持）

```bash
# 使用 host 网络模式
docker run -d --network host --name web-host nginx

# 此时 nginx 直接监听宿主机的 80 端口
# 访问 http://localhost 即可看到 nginx 页面
```

**适用场景：**
- 对网络性能要求极高的应用
- 需要处理大量端口的服务（如 DNS 服务器）
- 网络监控和抓包工具

### 1.3 none（无网络）

`none` 模式下，容器没有任何网络连接，完全隔离。

```bash
# 使用 none 网络模式
docker run -it --network none alpine /bin/sh

# 在容器内查看网络接口，只有 lo（回环接口）
ip addr show
```

**适用场景：**
- 安全敏感的计算任务
- 不需要网络的批处理作业
- 需要完全自定义网络配置的场景

### 1.4 overlay（覆盖网络）

`overlay` 网络用于跨多台主机的容器通信，是 Docker Swarm 模式的核心网络组件。

**特点：**
- 支持跨主机的容器间通信
- 自动处理路由和网络隧道
- 内置加密支持
- 需要 Swarm 模式

```bash
# 初始化 Swarm
docker swarm init

# 创建 overlay 网络
docker network create -d overlay my-overlay-network

# 在 Swarm 服务中使用
docker service create --name web --network my-overlay-network nginx
```

**适用场景：**
- 多主机容器编排
- Docker Swarm 集群部署
- 跨数据中心的容器通信

### 网络驱动对比表

| 驱动 | 隔离性 | 性能 | 跨主机 | 适用场景 |
|------|--------|------|--------|----------|
| bridge | 中等 | 良好（有 NAT） | 否 | 单机多容器通信 |
| host | 无 | 最佳 | 否 | 高性能网络需求 |
| none | 完全 | 无网络 | 否 | 安全隔离场景 |
| overlay | 中等 | 一般（有封装） | 是 | 多主机集群 |

---

## 2. 默认网络 vs 自定义网络

Docker 安装后会自动创建三个默认网络：

```bash
$ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
f6e5d4c3b2a1   host      host      local
1a2b3c4d5e6f   none      null      local
```

### 2.1 默认 bridge 网络的局限

```bash
# 在默认 bridge 网络中启动两个容器
docker run -d --name container-a alpine sleep 3600
docker run -d --name container-b alpine sleep 3600

# 进入 container-a 尝试 ping container-b
docker exec -it container-a ping container-b
# 结果：ping: bad address 'container-b'  ← 无法通过容器名解析！

# 只能通过 IP 地址通信
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container-b
# 假设输出：172.17.0.3
docker exec -it container-a ping 172.17.0.3  # 可以成功
```

### 2.2 自定义 bridge 网络的优势

```bash
# 创建自定义网络
docker network create my-network

# 在自定义网络中启动两个容器
docker run -d --name container-c --network my-network alpine sleep 3600
docker run -d --name container-d --network my-network alpine sleep 3600

# 进入 container-c 尝试 ping container-d
docker exec -it container-c ping container-d
# 结果：PING container-d (172.18.0.3): 56 data bytes  ← 成功解析容器名！
```

### 2.3 关键区别对照表

| 特性 | 默认 bridge 网络 | 自定义 bridge 网络 |
|------|------------------|--------------------|
| DNS 解析 | 不支持容器名解析 | 支持容器名自动 DNS 解析 |
| 容器隔离 | 所有容器共享 | 可以创建多个隔离网络 |
| 自动连接 | 所有容器自动连接 | 需显式指定才连接 |
| 容器间通信 | 仅 IP 地址 | IP + 容器名 |
| 安全性 | 较低 | 较高（网络级隔离） |
| 配置灵活性 | 固定配置 | 可自定义子网、网关等 |
| 推荐程度 | 不推荐生产使用 | 推荐生产使用 |

> **最佳实践：** 始终使用自定义网络，避免在生产环境中使用默认 bridge 网络。

---

## 3. 常用网络命令

### 3.1 docker network ls — 列出所有网络

```bash
# 列出所有网络
docker network ls

# 使用过滤器筛选
docker network ls --filter driver=bridge
docker network ls --filter type=custom

# 安静模式（仅显示 ID）
docker network ls -q
```

### 3.2 docker network create — 创建网络

```bash
# 创建简单的自定义 bridge 网络
docker network create my-app-network

# 指定子网和网关
docker network create \
  --driver bridge \
  --subnet 192.168.100.0/24 \
  --gateway 192.168.100.1 \
  my-custom-network

# 指定 IP 地址范围
docker network create \
  --driver bridge \
  --subnet 10.0.0.0/16 \
  --ip-range 10.0.1.0/24 \
  --gateway 10.0.0.1 \
  my-ranged-network

# 创建内部网络（不能访问外网）
docker network create --internal my-internal-network

# 添加 DNS 标签
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.name=br-custom \
  my-labeled-network
```

### 3.3 docker network inspect — 查看网络详情

```bash
# 查看网络详细信息
docker network inspect my-app-network

# 使用 Go 模板提取特定信息
docker network inspect -f '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' my-app-network

# 查看子网配置
docker network inspect -f '{{json .IPAM.Config}}' my-app-network
```

### 3.4 docker network connect / disconnect — 连接和断开容器

```bash
# 将运行中的容器连接到网络
docker network connect my-app-network my-container

# 指定 IP 地址连接
docker network connect --ip 192.168.100.10 my-app-network my-container

# 将容器从网络中断开
docker network disconnect my-app-network my-container

# 强制断开
docker network disconnect -f my-app-network my-container
```

**实用示例：让容器同时属于多个网络**

```bash
# 创建两个网络
docker network create frontend-net
docker network create backend-net

# 启动容器并连接到前端网络
docker run -d --name api-server --network frontend-net nginx

# 将同一容器也连接到后端网络
docker network connect backend-net api-server

# 查看容器的网络配置
docker inspect api-server -f '{{json .NetworkSettings.Networks}}'
```

### 3.5 docker network rm — 删除网络

```bash
# 删除单个网络
docker network rm my-app-network

# 删除多个网络
docker network rm network1 network2 network3
```

> **注意：** 删除网络前需要先断开所有连接到该网络的容器，否则会报错。

### 3.6 docker network prune — 清理未使用的网络

```bash
# 清理所有未使用的网络（会提示确认）
docker network prune

# 不提示直接清理
docker network prune -f

# 配合其他 prune 命令一起清理
docker system prune --volumes -f
```

---

## 4. 容器间通信与 DNS 解析

### 4.1 Docker 内置 DNS 服务

Docker 在自定义网络中提供了内置的 DNS 服务器，容器可以使用容器名或服务名作为主机名进行通信。

```bash
# 创建自定义网络
docker network create app-net

# 启动数据库容器
docker run -d --name mysql-db \
  --network app-net \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# 启动应用容器
docker run -d --name my-app \
  --network app-net \
  my-application:latest

# 在 my-app 容器中，可以直接通过容器名访问数据库
# 连接字符串：mysql://root:secret@mysql-db:3306/mydb
```

### 4.2 DNS 解析流程

```
容器内应用请求 "mysql-db"
        ↓
Docker 内置 DNS 服务器 (127.0.0.11)
        ↓
查询同网络内的容器名
        ↓
返回 mysql-db 容器的 IP (172.18.0.2)
        ↓
应用使用 IP 地址建立连接
```

### 4.3 网络别名（Network Alias）

可以为容器设置网络别名，提供额外的 DNS 名称：

```bash
# 启动容器并设置网络别名
docker run -d --name mysql-primary \
  --network app-net \
  --network-alias db \
  --network-alias database \
  mysql:8.0

# 现在 app-net 网络中的其他容器可以通过以下名称访问：
# - mysql-primary（容器名）
# - db（别名 1）
# - database（别名 2）
```

### 4.4 跨网络通信限制

**不同自定义网络中的容器默认不能互相通信。** 这是 Docker 网络隔离的核心安全特性。

```bash
# 创建两个隔离的网络
docker network create net-a
docker network create net-b

# 分别在两个网络中启动容器
docker run -d --name app-a --network net-a alpine sleep 3600
docker run -d --name app-b --network net-b alpine sleep 3600

# app-a 无法 ping 通 app-b（网络隔离）
docker exec app-a ping app-b
# 结果：ping: bad address 'app-b'
```

如果需要跨网络通信，可以将容器连接到多个网络：

```bash
# 将 app-a 也连接到 net-b
docker network connect net-b app-a

# 现在 app-a 和 app-b 可以互相通信
docker exec app-a ping app-b  # 成功
```

---

## 5. 端口映射原理

### 5.1 端口映射的工作机制

端口映射（Port Mapping）是将宿主机的端口转发到容器内部端口的机制，使外部网络可以访问容器内的服务。

```
外部请求 → 宿主机端口 → iptables NAT 规则 → 容器端口
```

```bash
# 将宿主机 8080 端口映射到容器的 80 端口
docker run -d -p 8080:80 --name web nginx

# 访问 http://localhost:8080 → 转发到容器的 80 端口
```

### 5.2 端口映射方式

```bash
# 指定宿主机和容器端口
docker run -d -p 8080:80 nginx

# 随机分配宿主机端口
docker run -d -p 80 nginx
docker port <container_name>  # 查看分配的端口

# 绑定到特定 IP 地址（仅本机可访问）
docker run -d -p 127.0.0.1:8080:80 nginx

# 映射多个端口
docker run -d -p 8080:80 -p 8443:443 nginx

# 映射端口范围
docker run -d -p 8000-8010:8000-8010 my-app
```

### 5.3 端口映射底层原理（Linux）

Docker 端口映射通过 `iptables` 的 NAT 规则实现：

```bash
# 查看 Docker 创建的 iptables 规则
sudo iptables -t nat -L -n

# 输出示例：
# Chain DOCKER (2 references)
# target     prot opt source     destination
# DNAT       tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:8080 to:172.17.0.2:80
```

**关键组件：**
1. **docker-proxy 进程**：监听宿主机端口，处理端口转发
2. **iptables DNAT 规则**：将流量从宿主机端口重定向到容器 IP 和端口
3. **docker0 网桥**：在宿主机和容器之间转发数据包

### 5.4 端口映射注意事项

| 注意事项 | 说明 |
|----------|------|
| 端口冲突 | 宿主机端口被占用时会报错 |
| 安全风险 | 映射到 `0.0.0.0` 会暴露给所有网络接口 |
| 性能开销 | NAT 转换会带来微小的性能损耗 |
| host 模式 | 使用 host 网络时不需要端口映射 |
| 内部通信 | 同一网络内的容器直接通过容器端口通信，不需要映射 |

> **安全建议：** 对于仅内部通信的服务（如数据库），不要映射端口到宿主机。仅在自定义网络内部通信即可。

---

## 6. 自定义网络的优势

### 6.1 自动 DNS 解析

自定义网络提供开箱即用的 DNS 服务：

```bash
# 创建自定义网络
docker network create app-network

# 启动服务
docker run -d --name redis --network app-network redis:7
docker run -d --name webapp --network app-network my-webapp:latest

# webapp 中可以直接使用 "redis" 作为主机名连接 Redis
# 无需硬编码 IP 地址，容器重启后 IP 变化也不影响连接
```

### 6.2 容器隔离

通过多个自定义网络实现精细的网络隔离：

```
┌─────────────────────────────────────────────────────┐
│                    宿主机                             │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐                │
│  │ frontend-net │    │ backend-net  │                │
│  │              │    │              │                │
│  │  ┌────────┐  │    │  ┌────────┐  │                │
│  │  │ Nginx  │──┼────┼──│  Web   │  │                │
│  │  └────────┘  │    │  │  App   │  │                │
│  │              │    │  └────────┘  │                │
│  │  ┌────────┐  │    │              │                │
│  │  │ React  │  │    │  ┌────────┐  │                │
│  │  │  App   │  │    │  │ MySQL  │  │                │
│  │  └────────┘  │    │  └────────┘  │                │
│  └──────────────┘    └──────────────┘                │
│                                                      │
│  React App 无法直接访问 MySQL（安全隔离）              │
│  Nginx 可以同时访问 React App 和 Web App              │
└─────────────────────────────────────────────────────┘
```

### 6.3 安全性提升

```bash
# 创建内部网络（完全隔离外网）
docker network create --internal secure-network

# 数据库只在内部网络中，外部无法直接访问
docker run -d --name postgres \
  --network secure-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:16

# 应用同时连接内外网络
docker run -d --name api \
  --network frontend-net \
  api-server:latest

docker network connect secure-network api

# api 可以访问 postgres（通过 secure-network）
# 外部用户无法直接访问 postgres（没有端口映射，且在内部网络中）
```

### 6.4 自定义网络的优势总结

| 优势 | 说明 |
|------|------|
| **DNS 自动解析** | 容器名自动注册为 DNS 记录，无需硬编码 IP |
| **网络隔离** | 不同网络的容器默认无法互相访问 |
| **多网络支持** | 一个容器可以连接多个网络 |
| **配置灵活** | 可自定义子网、网关、IP 范围 |
| **服务发现** | 支持网络别名，方便服务迁移 |
| **连接安全** | 可创建内部网络，隔离外部访问 |
| **容器重启兼容** | DNS 解析自动更新，IP 变化无影响 |

---

## 7. 网络模式选择指南

### 7.1 决策流程图

```
开始
  │
  ├─ 是否需要跨主机通信？
  │   ├─ 是 → 使用 overlay 网络
  │   └─ 否 → 继续
  │
  ├─ 是否需要最高网络性能？
  │   ├─ 是 → 使用 host 网络
  │   └─ 否 → 继续
  │
  ├─ 是否需要完全网络隔离？
  │   ├─ 是 → 使用 none 网络
  │   └─ 否 → 继续
  │
  └─ 默认选择：自定义 bridge 网络
      （大多数场景的最佳选择）
```

### 7.2 场景推荐

#### 场景一：Web 应用 + 数据库（最常见）

```bash
# 推荐：自定义 bridge 网络
docker network create app-net

docker run -d --name db --network app-net postgres:16
docker run -d --name web --network app-net -p 8080:80 my-webapp
```

**理由：** DNS 解析 + 网络隔离 + 数据库不暴露端口

#### 场景二：高性能网络应用（如实时音视频）

```bash
# 推荐：host 网络
docker run -d --network host my-media-server
```

**理由：** 无 NAT 开销，直接使用宿主机网络栈

#### 场景三：CI/CD 构建任务

```bash
# 推荐：none 网络（安全隔离）
docker run --network none my-builder make build
```

**理由：** 构建过程不需要网络，防止恶意代码外泄数据

#### 场景四：微服务集群（多主机）

```bash
# 推荐：overlay 网络
docker network create -d overlay swarm-net

docker service create --name api --network swarm-net my-api
docker service create --name worker --network swarm-net my-worker
```

**理由：** 跨主机通信 + 服务发现 + 负载均衡

#### 场景五：开发环境快速测试

```bash
# 可以使用默认 bridge（但不推荐生产）
docker run -d -p 8080:80 nginx
docker run -d -p 3306:3306 mysql
```

**理由：** 快速简单，但不适合生产环境

### 7.3 网络模式速查表

| 场景 | 推荐网络 | 是否需要端口映射 |
|------|----------|------------------|
| Web 应用 + DB | 自定义 bridge | 仅 Web 服务需要 |
| 高性能应用 | host | 不需要 |
| 安全计算任务 | none | 不适用 |
| 微服务集群 | overlay | 仅入口服务需要 |
| 前后端分离 | 多个自定义 bridge | 仅前端网关需要 |
| 开发测试 | 默认 bridge | 需要 |

---

## 8. 实战：搭建前后端分离的网络架构

### 8.1 架构目标

搭建一个三层网络架构：

```
                    互联网
                       │
                       ▼
              ┌─────────────────┐
              │   frontend-net  │  ← Nginx（反向代理 + 静态文件）
              │   (172.20.0.0/16)│
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   backend-net   │  ← Web API 应用
              │   (172.21.0.0/16)│
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   data-net      │  ← PostgreSQL + Redis
              │   (172.22.0.0/16)│  ← 完全内部隔离
              └─────────────────┘
```

### 8.2 手动搭建步骤

**步骤一：创建网络**

```bash
# 创建三个自定义网络
docker network create --subnet 172.20.0.0/16 frontend-net
docker network create --subnet 172.21.0.0/16 backend-net
docker network create --subnet 172.22.0.0/16 --internal data-net
```

**步骤二：启动数据层服务**

```bash
# 启动 PostgreSQL（仅在 data-net 中）
docker run -d \
  --name postgres \
  --network data-net \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret123 \
  postgres:16

# 启动 Redis（仅在 data-net 中）
docker run -d \
  --name redis \
  --network data-net \
  redis:7-alpine
```

**步骤三：启动应用层服务**

```bash
# 启动 Web API（同时在 backend-net 和 data-net 中）
docker run -d \
  --name api-server \
  --network backend-net \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  my-api-server:latest

# 将 api-server 连接到 data-net，使其可以访问数据库
docker network connect data-net api-server
```

**步骤四：启动前端网关**

```bash
# 启动 Nginx（同时在 frontend-net 和 backend-net 中）
docker run -d \
  --name nginx-gateway \
  --network frontend-net \
  -p 80:80 \
  -p 443:443 \
  nginx:alpine

# 将 nginx 连接到 backend-net
docker network connect backend-net nginx-gateway
```

**步骤五：验证网络隔离**

```bash
# 验证 Nginx 可以访问 API
docker exec nginx-gateway ping api-server  # 成功（同在 backend-net）

# 验证 Nginx 不能直接访问数据库
docker exec nginx-gateway ping postgres  # 失败（不在 data-net）

# 验证 API 可以访问数据库
docker exec api-server ping postgres  # 成功（同在 data-net）
docker exec api-server ping redis     # 成功（同在 data-net）

# 查看各容器的网络连接
docker inspect nginx-gateway -f '{{json .NetworkSettings.Networks}}' | jq
docker inspect api-server -f '{{json .NetworkSettings.Networks}}' | jq
docker inspect postgres -f '{{json .NetworkSettings.Networks}}' | jq
```

### 8.3 使用 Docker Compose 简化

手动管理网络和容器连接比较繁琐，推荐使用 Docker Compose。

完整示例请参考同目录下的 `example/docker-compose.yml` 文件。

**快速启动：**

```bash
cd example/

# 启动所有服务
docker compose up -d

# 查看网络
docker network ls | grep example

# 查看服务状态
docker compose ps

# 验证网络隔离
docker compose exec nginx ping webapp      # 成功
docker compose exec nginx ping db          # 失败（nginx 不在 backend-network）
docker compose exec webapp ping db         # 成功
docker compose exec webapp ping redis      # 成功

# 停止并清理
docker compose down -v
docker network prune -f
```

### 8.4 生产环境建议

1. **始终使用自定义网络**，避免默认 bridge
2. **最小化端口映射**，仅暴露必要的服务端口
3. **使用内部网络** 保护数据库等敏感服务
4. **使用网络别名** 便于服务迁移和扩展
5. **结合 Docker Secrets** 管理密码等敏感信息
6. **定期清理** 未使用的网络（`docker network prune`）
7. **记录网络架构**，使用文档或图表说明网络拓扑

---

## 常见问题（FAQ）

### Q1: 容器重启后 IP 地址变了怎么办？

使用自定义网络，通过容器名进行 DNS 解析，不依赖固定 IP 地址。Docker 内置 DNS 会自动更新解析记录。

### Q2: 如何让容器使用固定 IP？

```bash
docker run -d --name my-container \
  --network my-network \
  --ip 192.168.100.50 \
  my-image
```

> 注意：需要先创建指定子网的自定义网络。

### Q3: 容器无法访问外网怎么办？

检查以下几点：
1. 是否使用了 `--internal` 创建的内部网络
2. 宿主机的防火墙规则是否阻止了流量
3. Docker daemon 的 DNS 配置是否正确

### Q4: 两个不同主机上的容器如何通信？

使用 `overlay` 网络 + Docker Swarm 模式，或者使用第三方网络方案（如 Calico、Flannel）。

---

## 下一章预告

下一章我们将学习 **Docker 数据持久化与 Volume 管理**，了解如何在容器生命周期之外管理数据。
