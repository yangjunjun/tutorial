# 04 - Nginx 反向代理与 CDN

> 学习目标：掌握 Nginx 配置、反向代理、负载均衡、HTTPS 配置，理解 CDN 原理

> 前置知识：已完成 [03-DNS-路由与网络分层.md](./03-DNS-路由与网络分层.md)

---

## 目录

1. [正向代理 vs 反向代理](#1-正向代理-vs-反向代理)
2. [Nginx 简介与安装](#2-nginx-简介与安装)
3. [Nginx 配置文件结构](#3-nginx-配置文件结构)
4. [静态文件服务](#4-静态文件服务)
5. [反向代理配置](#5-反向代理配置)
6. [负载均衡](#6-负载均衡)
7. [HTTPS 配置](#7-https-配置)
8. [Nginx 性能优化](#8-nginx-性能优化)
9. [CDN 原理与使用](#9-cdn-原理与使用)
10. [实战练习](#10-实战练习)

---

## 1. 正向代理 vs 反向代理

### 正向代理（Forward Proxy）

```
客户端知道要访问真实服务器，代理替客户端去访问

  [客户端] → [正向代理] → [目标服务器]
                  ↑
            客户端配置代理
            服务器看到的请求来自代理

  特点：代理的是客户端
  场景：VPN、爬虫代理池、公司上网代理
```

```bash
# 正向代理示例：curl 通过代理访问
curl --proxy http://proxy-server:3128 http://target-site.com

# SOCKS5 代理
curl --socks5 127.0.0.1:1080 http://target-site.com
```

### 反向代理（Reverse Proxy）

```
客户端不知道真实服务器，以为代理就是目标

  [客户端] → [反向代理] → [后端服务器1]
                    ├────→ [后端服务器2]
                    └────→ [后端服务器3]
              ↑
        客户端直接访问代理
        不知道后端服务器存在

  特点：代理的是服务端
  场景：Nginx、负载均衡器、API 网关
```

### 对比总结

| 特性 | 正向代理 | 反向代理 |
|------|---------|---------|
| 代理谁 | 客户端 | 服务端 |
| 客户端是否知道真实目标 | 知道 | 不知道 |
| 服务器是否知道真实客户端 | 不知道 | 不知道 |
| 配置方 | 客户端 | 服务端 |
| 典型用途 | 翻墙、爬虫 | 负载均衡、SSL 终端、缓存 |

---

## 2. Nginx 简介与安装

### Nginx 核心特点

| 特点 | 说明 |
|------|------|
| 高性能 | 事件驱动（epoll），单机可处理数万并发 |
| 低内存 | 每个连接消耗极少内存 |
| 反向代理 | 负载均衡、SSL 终端、缓存 |
| 静态服务 | 高效处理静态文件 |
| 模块化 | 按需加载模块 |
| 热部署 | 支持不停机更新配置和升级 |

### Nginx vs Apache

```
Apache：每个连接一个线程/进程（同步阻塞）
  连接多时 → 线程/进程开销大 → 性能下降

Nginx：一个 Worker 进程处理大量连接（异步非阻塞 epoll）
  连接多时 → 内存开销几乎不增加 → 高并发性能好
```

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx

# macOS（本地练习用）
brew install nginx

# 验证安装
nginx -v
nginx -t          # 测试配置是否正确
```

### Nginx 命令

```bash
# 启动
sudo nginx
# 或
sudo systemctl start nginx

# 停止
sudo nginx -s stop
# 或
sudo systemctl stop nginx

# 重载配置（不停服务）
sudo nginx -s reload
# 或
sudo systemctl reload nginx

# 测试配置语法
nginx -t

# 查看版本和编译参数
nginx -V

# 查看状态
sudo systemctl status nginx
```

---

## 3. Nginx 配置文件结构

### 配置文件位置

```
/etc/nginx/
├── nginx.conf          ← 主配置文件
├── sites-available/    ← 可用站点配置（Debian/Ubuntu）
│   └── default
├── sites-enabled/      ← 已启用站点（软链接到 sites-available）
│   └── default → ../sites-available/default
├── conf.d/             ← 额外配置（所有 .conf 自动加载）
│   └── *.conf
└── mime.types          ← MIME 类型映射
```

### 配置文件结构

```nginx
# /etc/nginx/nginx.conf

# 全局块（影响 Nginx 整体）
user www-data;                    # 运行用户
worker_processes auto;            # Worker 进程数（通常 = CPU 核心数）
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# events 块（影响网络连接）
events {
    worker_connections 768;       # 每个 Worker 的最大连接数
    use epoll;                    # 事件模型（Linux 推荐 epoll）
}

# http 块（Web 服务器配置）
http {
    # HTTP 全局配置
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;                  # 零拷贝，提升静态文件传输
    tcp_nopush on;
    keepalive_timeout 65;         # Keep-Alive 超时
    gzip on;                      # 开启 gzip 压缩

    # 加载站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;

    # upstream 块（定义后端服务器组）
    upstream backend {
        server 127.0.0.1:3000;
        server 127.0.0.1:3001;
    }

    # server 块（虚拟主机）
    server {
        listen 80;                           # 监听端口
        server_name example.com www.example.com;  # 域名

        # location 块（URL 匹配规则）
        location / {
            proxy_pass http://backend;        # 反向代理
            proxy_set_header Host $host;
        }

        location /static/ {
            root /var/www/html;               # 静态文件
        }
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
        }
    }
}
```

### location 匹配规则

```nginx
# 优先级从高到低：

location = /exact { }          # 精确匹配（最高优先级）
location ^~ /static/ { }       # 前缀匹配，不再进行正则匹配
location ~ \.php$ { }          # 区分大小写的正则匹配
location ~* \.(jpg|png|css)$ { # 不区分大小写的正则匹配
    # 匹配图片、CSS 等静态文件
}
location /api/ { }             # 普通前缀匹配
location / { }                 # 默认匹配（最低优先级，兜底）
```

匹配示例：

```
请求 URL              匹配的 location
─────────────────     ──────────────
/exact                location = /exact
/static/img.png       location ^~ /static/
/page.php             location ~ \.php$
/photo.JPG            location ~* \.(jpg|png|css)$
/api/users            location /api/
/anything-else        location /
```

---

## 4. 静态文件服务

### 基本静态服务配置

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/html;          # 文件根目录
    index index.html;            # 默认首页

    location / {
        try_files $uri $uri/ =404;  # 找不到文件返回 404
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 30d;                          # 浏览器缓存 30 天
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

### 操作步骤

```bash
# ① 创建网站目录
sudo mkdir -p /var/www/html

# ② 创建测试页面
echo '<h1>Hello Nginx</h1>' | sudo tee /var/www/html/index.html

# ③ 创建 Nginx 配置
sudo tee /etc/nginx/conf.d/static.conf << 'EOF'
server {
    listen 8080;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# ④ 测试并重载
sudo nginx -t && sudo nginx -s reload

# ⑤ 测试
curl http://localhost:8080
```

### root vs alias

```nginx
# root：完整的本地路径 = root + URI
# 请求 /static/img.png → 实际路径 /var/www/static/img.png
location /static/ {
    root /var/www;
}

# alias：URI 被替换为 alias 路径
# 请求 /static/img.png → 实际路径 /var/www/images/img.png
location /static/ {
    alias /var/www/images/;
}
```

---

## 5. 反向代理配置

### 基本反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;    # 转发到后端服务

        # 传递真实客户端信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 代理相关 Header 说明

| Header | 说明 |
|--------|------|
| Host | 原始请求的域名 |
| X-Real-IP | 客户端真实 IP |
| X-Forwarded-For | 代理链（客户端IP, 代理1IP, 代理2IP...） |
| X-Forwarded-Proto | 原始协议（http / https） |

后端服务需要读取这些 Header 来获取真实客户端信息。

### 反向代理进阶配置

```nginx
server {
    listen 80;
    server_name app.example.com;

    # API 请求代理到后端 API 服务
    location /api/ {
        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 5s;       # 连接后端超时
        proxy_send_timeout 30s;         # 发送请求超时
        proxy_read_timeout 30s;         # 读取响应超时

        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;       # WebSocket 长连接超时
    }

    # 静态文件直接由 Nginx 处理
    location /static/ {
        root /var/www/app;
        expires 30d;
    }

    # 健康检查端点
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

### 操作步骤：搭建反向代理

```bash
# ① 启动后端服务（用 Python 简易服务器模拟）
cd /tmp && python3 -m http.server 3000 &

# ② 配置 Nginx 反向代理
sudo tee /etc/nginx/conf.d/proxy.conf << 'EOF'
server {
    listen 8080;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# ③ 测试并重载
sudo nginx -t && sudo nginx -s reload

# ④ 验证
curl http://localhost:8080

# ⑤ 查看 Nginx 日志
tail -f /var/log/nginx/access.log
```

---

## 6. 负载均衡

### 负载均衡算法

| 算法 | 说明 | 配置 |
|------|------|------|
| 轮询（默认） | 依次分配请求 | 无需额外配置 |
| 加权轮询 | 按权重分配 | `weight=3` |
| IP 哈希 | 同一 IP 固定到同一后端 | `ip_hash` |
| 最少连接 | 分配给连接数最少的后端 | `least_conn` |
| 一致性哈希 | 使用第三方模块 | `hash $request_uri` |

### 负载均衡配置

```nginx
# 定义后端服务器组
upstream myapp {
    # 加权轮询
    server 127.0.0.1:3000 weight=3;    # 30% 流量
    server 127.0.0.1:3001 weight=2;    # 20% 流量
    server 127.0.0.1:3002 weight=5;    # 50% 流量
}

# IP 哈希（会话保持）
upstream myapp_iphash {
    ip_hash;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

# 最少连接
upstream myapp_least {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://myapp;    # 引用 upstream
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 健康检查与故障转移

```nginx
upstream myapp {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    # max_fails=3: 失败 3 次后标记为不可用
    # fail_timeout=30s: 30 秒后重试

    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;

    # 备用服务器（主服务器全部不可用时启用）
    server 127.0.0.1:3002 backup;

    # 降级服务器（非主动参与，手动切换）
    server 127.0.0.1:3003 down;
}

server {
    listen 80;

    location / {
        proxy_pass http://myapp;

        # 代理下次重试（故障转移）
        proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;          # 最多重试 3 个后端
        proxy_next_upstream_timeout 10s;       # 重试总超时
    }
}
```

### 操作步骤：负载均衡实验

```bash
# ① 启动 3 个后端服务（不同端口）
cd /tmp
echo "Backend 1" > index1.html && python3 -m http.server 3000 &
echo "Backend 2" > index2.html && python3 -m http.server 3001 &
echo "Backend 3" > index3.html && python3 -m http.server 3002 &

# ② 配置负载均衡
sudo tee /etc/nginx/conf.d/lb.conf << 'EOF'
upstream backend_pool {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 8080;
    location / {
        proxy_pass http://backend_pool;
    }
}
EOF

# ③ 重载配置
sudo nginx -t && sudo nginx -s reload

# ④ 多次请求，观察轮询效果
for i in $(seq 1 9); do curl -s http://localhost:8080; done
# 预期：Backend 1, Backend 2, Backend 3, Backend 1, Backend 2, ...

# ⑤ 停掉一个后端，观察故障转移
kill %1   # 停掉 3000 端口的服务
for i in $(seq 1 6); do curl -s http://localhost:8080; done
# 预期：只在 Backend 2 和 Backend 3 之间轮询
```

---

## 7. HTTPS 配置

### 使用 Let's Encrypt 免费证书

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 HTTPS（Nginx 必须已在运行且域名已解析到本机）
sudo certbot --nginx -d example.com -d www.example.com

# certbot 会自动：
# 1. 获取 SSL 证书
# 2. 修改 Nginx 配置
# 3. 设置 HTTP → HTTPS 重定向
# 4. 配置自动续期
```

### 手动配置 HTTPS

```nginx
server {
    # HTTP → HTTPS 重定向
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;              # 启用 HTTP/2
    server_name example.com www.example.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;     # 只允许 TLS 1.2+
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS（强制浏览器使用 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 自签证书（本地测试）

```bash
# 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# 配置 Nginx 使用自签证书
sudo tee /etc/nginx/conf.d/ssl-local.conf << 'EOF'
server {
    listen 8443 ssl;
    server_name localhost;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        return 200 "Hello HTTPS\n";
        add_header Content-Type text/plain;
    }
}
EOF

sudo nginx -t && sudo nginx -s reload

# 测试（-k 跳过证书验证）
curl -k https://localhost:8443
```

---

## 8. Nginx 性能优化

### 全局优化

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;           # = CPU 核心数
worker_rlimit_nofile 65535;      # 最大文件描述符

events {
    worker_connections 10240;    # 每个 Worker 最大连接数
    use epoll;                   # Linux 最佳事件模型
    multi_accept on;             # 一次接受多个连接
}

http {
    sendfile on;                 # 零拷贝发送文件
    tcp_nopush on;               # 等数据包满了再发（配合 sendfile）
    tcp_nodelay on;              # 禁用 Nagle 算法（小数据立即发送）

    keepalive_timeout 65;        # Keep-Alive 超时
    keepalive_requests 1000;     # 单个连接最大请求数

    # Gzip 压缩
    gzip on;
    gzip_min_length 1024;        # 小于 1KB 不压缩
    gzip_comp_level 6;           # 压缩级别（1-9）
    gzip_types text/plain text/css application/json application/javascript;
    gzip_vary on;

    # 客户端限制
    client_max_body_size 10m;    # 请求体最大大小
    client_body_timeout 12s;     # 请求体读取超时
    client_header_timeout 12s;   # 请求头读取超时
    send_timeout 10s;            # 响应发送超时

    # 缓冲优化
    client_body_buffer_size 16k;
    client_header_buffer_size 4k;
}
```

### 静态文件缓存策略

```nginx
server {
    # 强缓存（浏览器直接用缓存，不发请求）
    location ~* \.(jpg|jpeg|png|gif|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 协商缓存（浏览器带 ETag/Last-Modified 验证）
    location ~* \.(css|js)$ {
        etag on;
        add_header Cache-Control "no-cache";  # 每次验证
        expires 1h;
    }

    # 不缓存（API 响应等动态内容）
    location /api/ {
        add_header Cache-Control "no-store, must-revalidate";
        proxy_pass http://backend;
    }
}
```

### Nginx 作为缓存代理

```nginx
# 定义缓存区域
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m
                 max_size=1g inactive=60m use_temp_path=off;

server {
    location /api/ {
        proxy_pass http://backend;

        proxy_cache api_cache;                    # 启用缓存
        proxy_cache_valid 200 10m;                # 200 响应缓存 10 分钟
        proxy_cache_valid 404 1m;                 # 404 缓存 1 分钟
        proxy_cache_key "$scheme$request_method$host$request_uri";

        # 添加响应头标识缓存命中
        add_header X-Cache-Status $upstream_cache_status;
        # HIT: 缓存命中, MISS: 未命中, EXPIRED: 过期, BYPASS: 跳过
    }
}
```

---

## 9. CDN 原理与使用

### CDN 工作原理

```
没有 CDN：
  用户（北京）→ 源站（美国）  ← 延迟 200ms

有 CDN：
  用户（北京）→ CDN 边缘节点（北京）  ← 延迟 5ms
                    ↑ 缓存未命中时回源
                  源站（美国）

CDN = Content Delivery Network（内容分发网络）

核心思想：把内容缓存到离用户最近的节点
```

### CDN 工作流程

```
① 用户请求 cdn.example.com/image.png
② DNS 解析返回离用户最近的 CDN 节点 IP
③ 用户请求 CDN 节点
④ CDN 节点检查缓存：
   - 缓存命中 → 直接返回（Cache HIT）
   - 缓存未命中 → 回源获取，缓存后返回（Cache MISS）
⑤ 后续请求直接从 CDN 缓存返回
```

### CDN 加速的内容类型

| 类型 | CDN 缓存策略 | 说明 |
|------|-------------|------|
| 静态文件（图片、CSS、JS） | 长期缓存 | 最适合 CDN |
| 视频/音频流 | 边缘缓存 | 大文件分发 |
| API 响应 | 短期缓存/不缓存 | 视业务而定 |
| 动态内容 | 不缓存 | 回源处理 |

### 常见 CDN 服务商

| 服务商 | 特点 |
|--------|------|
| Cloudflare | 免费 plan，全球节点，DNS+CDN+WAF 一体 |
| AWS CloudFront | 与 AWS 生态集成 |
| 阿里云 CDN | 国内节点多 |
| 腾讯云 CDN | 国内节点多 |
| Vercel/Netlify | 前端部署+CDN 一体 |

### Cloudflare CDN 配置示例

```
1. 注册 Cloudflare 账号
2. 添加你的域名
3. 在域名注册商处修改 NS 为 Cloudflare 的 NS
4. 等待 DNS 生效（可能需要几小时）
5. 在 Cloudflare 面板中开启 CDN（橙色云朵图标）
6. 配置缓存规则和 Page Rules
```

### Nginx 模拟 CDN 缓存

```nginx
# 在边缘节点配置缓存
proxy_cache_path /var/cache/cdn levels=1:2
                 keys_zone=cdn_cache:100m
                 max_size=10g inactive=24h;

server {
    listen 80;
    server_name cdn.example.com;

    location / {
        proxy_pass http://origin-server.example.com;
        proxy_cache cdn_cache;
        proxy_cache_valid 200 7d;                # 成功响应缓存 7 天
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating;  # 回源失败时用旧缓存
        proxy_cache_revalidate on;               # 使用条件请求验证
        proxy_cache_lock on;                     # 防止缓存击穿
        proxy_cache_lock_timeout 10s;

        add_header X-Cache-Status $upstream_cache_status;
        add_header X-Cache-Edge "node-1";
    }
}
```

### 缓存优化策略

```
缓存命中率 = 缓存命中次数 / 总请求次数

提升命中率的策略：
  1. 对静态资源设置长缓存（expires 1y）
  2. 文件名包含哈希值（app.a1b2c3.js）→ 更新时文件名变化 → 无需刷新缓存
  3. 区分动态和静态内容，分别设置缓存策略
  4. 使用 stale-while-revalidate（后台刷新旧缓存）
  5. 避免在 URL 中使用随机参数 / 时间戳
```

---

## 10. 实战练习

### 练习1：搭建完整的反向代理

```bash
# ① 启动后端服务
mkdir -p /tmp/backend && cd /tmp/backend
echo '{"status":"ok","server":"backend-1"}' > index.json
python3 -m http.server 3000 &

# ② 配置 Nginx
sudo tee /etc/nginx/conf.d/practice1.conf << 'EOF'
server {
    listen 8090;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        return 200 '{"status":"healthy"}';
        add_header Content-Type application/json;
    }
}
EOF

# ③ 重载
sudo nginx -t && sudo nginx -s reload

# ④ 验证
curl http://localhost:8090/index.json
curl http://localhost:8090/health

# ⑤ 查看后端收到的 Header
# 安装一个可以看到请求头的后端
pip install httpie
# 或用 httpbin
curl http://localhost:8090/  # 查看 Python 服务器日志
```

### 练习2：负载均衡实验

```bash
# ① 启动 3 个不同的后端
for i in 1 2 3; do
  mkdir -p /tmp/bk$i && echo "Backend-$i" > /tmp/bk$i/index.html
  (cd /tmp/bk$i && python3 -m http.server 300$i)
done &

# ② 配置负载均衡
sudo tee /etc/nginx/conf.d/practice2.conf << 'EOF'
upstream practice_backend {
    server 127.0.0.1:3000 weight=1;
    server 127.0.0.1:3001 weight=1;
    server 127.0.0.1:3002 weight=1;
}

server {
    listen 8091;

    location / {
        proxy_pass http://practice_backend;
    }
}
EOF

sudo nginx -t && sudo nginx -s reload

# ③ 测试轮询
for i in $(seq 1 9); do curl -s http://localhost:8091; done

# ④ 修改权重，观察变化
# 将 weight 改为 1, 1, 3，重载后重新测试
```

### 练习3：HTTPS 配置

```bash
# ① 生成自签证书
openssl req -x509 -newkey rsa:2048 \
  -keyout /tmp/server.key -out /tmp/server.crt \
  -days 365 -nodes \
  -subj "/CN=localhost"

# ② 配置 Nginx HTTPS
sudo tee /etc/nginx/conf.d/practice3.conf << 'EOF'
server {
    listen 8092 ssl;
    server_name localhost;

    ssl_certificate /tmp/server.crt;
    ssl_certificate_key /tmp/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        return 200 "Hello over HTTPS!\n";
        add_header Content-Type text/plain;
    }
}
EOF

sudo nginx -t && sudo nginx -s reload

# ③ 测试
curl -k https://localhost:8092

# ④ 查看证书信息
curl -kv https://localhost:8092 2>&1 | grep -E "subject|issuer|SSL"
```

### 练习4：缓存配置实验

```bash
# ① 配置带缓存的反向代理
sudo mkdir -p /var/cache/nginx

sudo tee /etc/nginx/conf.d/practice4.conf << 'EOF'
proxy_cache_path /var/cache/nginx/practice levels=1:2
                 keys_zone=practice_cache:10m max_size=100m inactive=5m;

server {
    listen 8093;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache practice_cache;
        proxy_cache_valid 200 2m;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
EOF

sudo nginx -t && sudo nginx -s reload

# ② 第一次请求（Cache MISS）
curl -I http://localhost:8093/index.json
# X-Cache-Status: MISS

# ③ 第二次请求（Cache HIT）
curl -I http://localhost:8093/index.json
# X-Cache-Status: HIT

# ④ 查看 Nginx 日志
tail /var/log/nginx/access.log
```

### 练习5：综合实战

```bash
# 搭建一个完整的生产级 Nginx 配置：
# - HTTP → HTTPS 重定向
# - 静态文件服务
# - API 反向代理
# - 负载均衡
# - 健康检查
# - Gzip 压缩
# - 安全 Header

sudo tee /etc/nginx/conf.d/full-example.conf << 'EOF'
upstream api_servers {
    server 127.0.0.1:3000 weight=2 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 backup;
}

server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /tmp/server.crt;
    ssl_certificate_key /tmp/server.key;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # 安全 Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理 + 负载均衡
    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_connect_timeout 3s;
        proxy_read_timeout 30s;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
EOF

sudo nginx -t && sudo nginx -s reload
```

---

## 本节小结

学完本章你应该掌握：

- [x] 正向代理与反向代理的区别
- [x] Nginx 安装和基本操作
- [x] Nginx 配置文件结构（http → server → location）
- [x] location 匹配规则和优先级
- [x] 静态文件服务配置
- [x] 反向代理配置和 Header 传递
- [x] 负载均衡算法和配置
- [x] HTTPS 证书配置
- [x] Nginx 性能优化（gzip、缓存、keepalive）
- [x] CDN 原理和缓存策略

### 下一步

→ 继续学习 [05-网络安全与性能优化.md](./05-网络安全与性能优化.md)，进入安全和性能的进阶领域。
