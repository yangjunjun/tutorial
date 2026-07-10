# 01 - HTTP 协议与 curl 基础

> 学习目标：理解 HTTP 协议工作原理，熟练使用 curl 进行各种网络请求

---

## 目录

1. [HTTP 协议概述](#1-http-协议概述)
2. [HTTP 请求与响应结构](#2-http-请求与响应结构)
3. [HTTP 方法](#3-http-方法)
4. [HTTP 状态码](#4-http-状态码)
5. [HTTP Headers](#5-http-headers)
6. [HTTPS 与 TLS](#6-https-与-tls)
7. [curl 基础用法](#7-curl-基础用法)
8. [curl 进阶用法](#8-curl-进阶用法)
9. [认证方式](#9-认证方式)
10. [实战练习](#10-实战练习)

---

## 1. HTTP 协议概述

HTTP（HyperText Transfer Protocol，超文本传输协议）是 Web 通信的基础协议。

### 核心特点

| 特点 | 说明 |
|------|------|
| 无状态 | 每次请求独立，服务器不保留客户端状态（Cookie/Session 弥补） |
| 请求-响应模型 | 客户端发请求，服务器返响应 |
| 基于文本 | HTTP/1.x 是纯文本协议，可读性强 |
| 基于 TCP | 底层使用 TCP 可靠传输 |

### HTTP 版本演进

```
HTTP/0.9  → 仅支持 GET，只返回 HTML
HTTP/1.0  → 增加 POST、HEAD、状态码、Headers
HTTP/1.1  → 持久连接（Keep-Alive）、管道化、Host 头、分块传输
HTTP/2    → 多路复用、头部压缩、服务端推送、二进制分帧
HTTP/3    → 基于 QUIC（UDP），解决队头阻塞
```

### 一次 HTTP 请求的完整流程

```
1. DNS 解析：域名 → IP 地址
2. TCP 三次握手：建立连接
3. TLS 握手（如果是 HTTPS）
4. 发送 HTTP 请求
5. 服务器处理并返回 HTTP 响应
6. TCP 四次挥手：断开连接（或保持 Keep-Alive）
```

---

## 2. HTTP 请求与响应结构

### HTTP 请求结构

```http
POST /api/users HTTP/1.1          ← 请求行：方法 路径 协议版本
Host: api.example.com             ← 请求头
Content-Type: application/json
Authorization: Bearer token123
Content-Length: 45
                                  ← 空行分隔
{"name": "Alice", "age": 30}      ← 请求体
```

### HTTP 响应结构

```http
HTTP/1.1 200 OK                   ← 状态行：协议版本 状态码 状态文本
Content-Type: application/json    ← 响应头
Content-Length: 52
                                  ← 空行分隔
{"id": 1, "name": "Alice", "age": 30}  ← 响应体
```

### 用 curl 查看完整交互

```bash
# -v 显示详细通信过程（> 是请求，< 是响应）
curl -v http://httpbin.org/get
```

输出解读：
```
> GET /get HTTP/1.1        ← curl 发出的请求行
> Host: httpbin.org        ← curl 发出的请求头
>
< HTTP/1.1 200 OK          ← 服务器返回的状态行
< Content-Type: ...        ← 服务器返回的响应头
<
{ ... }                    ← 响应体
```

---

## 3. HTTP 方法

| 方法 | 用途 | 幂等 | 安全 |
|------|------|------|------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 / 提交数据 | 否 | 否 |
| PUT | 完整替换资源 | 是 | 否 |
| PATCH | 部分修改资源 | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |
| HEAD | 只获取响应头 | 是 | 是 |
| OPTIONS | 查询支持的方法（预检请求） | 是 | 是 |

> **幂等**：多次执行结果相同 | **安全**：不修改服务器资源

### curl 指定方法

```bash
# GET（默认）
curl http://httpbin.org/get

# POST
curl -X POST http://httpbin.org/post

# PUT
curl -X PUT http://httpbin.org/put

# DELETE
curl -X DELETE http://httpbin.org/delete

# HEAD（只看头）
curl -I http://httpbin.org/get

# OPTIONS（预检）
curl -X OPTIONS http://httpbin.org/get
```

---

## 4. HTTP 状态码

| 分类 | 范围 | 含义 |
|------|------|------|
| 1xx | 100-199 | 信息性状态码 |
| 2xx | 200-299 | 成功 |
| 3xx | 300-399 | 重定向 |
| 4xx | 400-499 | 客户端错误 |
| 5xx | 500-599 | 服务器错误 |

### 常见状态码

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 成功但无返回内容 |
| 301 | Moved Permanently | 永久重定向 |
| 302 | Found | 临时重定向 |
| 304 | Not Modified | 资源未修改（用缓存） |
| 400 | Bad Request | 请求格式错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |
| 504 | Gateway Timeout | 网关超时 |

### curl 查看状态码

```bash
# 只输出状态码
curl -o /dev/null -s -w "%{http_code}\n" http://httpbin.org/get

# 输出状态码和 URL
curl -o /dev/null -s -w "%{http_code} %{url_effective}\n" http://httpbin.org/get

# 查看重定向过程
curl -L -v http://httpbin.org/redirect/3 2>&1 | grep "< HTTP"
```

---

## 5. HTTP Headers

### 常用请求头

| Header | 说明 | 示例 |
|--------|------|------|
| Host | 目标主机名 | `Host: api.example.com` |
| User-Agent | 客户端标识 | `User-Agent: Mozilla/5.0` |
| Accept | 期望的响应类型 | `Accept: application/json` |
| Content-Type | 请求体类型 | `Content-Type: application/json` |
| Authorization | 认证信息 | `Authorization: Bearer token` |
| Cookie | Cookie 信息 | `Cookie: session=abc123` |
| Referer | 来源页面 | `Referer: https://example.com` |
| Accept-Encoding | 可接受的编码 | `Accept-Encoding: gzip` |

### 常用响应头

| Header | 说明 | 示例 |
|--------|------|------|
| Content-Type | 响应体类型 | `Content-Type: text/html; charset=utf-8` |
| Content-Length | 响应体大小 | `Content-Length: 1024` |
| Set-Cookie | 设置 Cookie | `Set-Cookie: session=abc; Path=/` |
| Cache-Control | 缓存策略 | `Cache-Control: max-age=3600` |
| Location | 重定向地址 | `Location: https://example.com/new` |
| Access-Control-Allow-Origin | CORS 跨域 | `Access-Control-Allow-Origin: *` |

### Content-Type 常见值

```
application/json          ← JSON 数据
application/x-www-form-urlencoded  ← 表单数据
multipart/form-data       ← 文件上传
text/html                 ← HTML 页面
text/plain                ← 纯文本
application/octet-stream  ← 二进制流
```

### curl 操作 Headers

```bash
# 查看响应头
curl -I http://httpbin.org/get

# 添加请求头（-H）
curl -H "Accept: application/json" http://httpbin.org/get

# 添加多个请求头
curl \
  -H "Accept: application/json" \
  -H "Authorization: Bearer mytoken" \
  -H "X-Custom-Header: hello" \
  http://httpbin.org/headers

# 修改 User-Agent
curl -H "User-Agent: MyBot/1.0" http://httpbin.org/headers

# 伪造 Referer
curl -H "Referer: https://google.com" http://httpbin.org/headers
```

---

## 6. HTTPS 与 TLS

### HTTPS = HTTP + TLS/SSL

```
客户端                     服务器
  |                          |
  | --- ClientHello ------→ |   ① 客户端发送支持的 TLS 版本和加密套件
  | ←--- ServerHello ------ |   ② 服务器选择加密套件，返回证书
  |                          |
  | --- 验证证书 ------------→|   ③ 客户端验证证书（CA 签名、域名、有效期）
  |                          |
  | --- 生成对称密钥 -------→ |   ④ 协商出对称加密密钥
  |                          |
  | === 对称加密通信 ========= |   ⑤ 后续使用对称加密
```

### TLS 握手关键概念

| 概念 | 说明 |
|------|------|
| 对称加密 | 加密解密用同一密钥（如 AES），速度快 |
| 非对称加密 | 公钥加密、私钥解密（如 RSA），用于密钥交换 |
| 证书 | 服务器公钥 + CA 签名，证明身份 |
| CA | 证书颁发机构，受信任的第三方 |

### curl HTTPS 操作

```bash
# 正常 HTTPS 请求
curl https://httpbin.org/get

# 跳过证书验证（-k / --insecure，仅用于测试）
curl -k https://self-signed.example.com

# 查看证书信息
curl -v https://httpbin.org 2>&1 | grep -E "SSL|certificate|subject|issuer"

# 指定证书
curl --cert client.pem --key key.pem https://mtls.example.com

# 指定 CA 证书
curl --cacert ca-bundle.pem https://example.com

# 强制使用 TLS 1.2
curl --tlsv1.2 https://httpbin.org/get

# 查看握手详情
curl -v https://httpbin.org 2>&1 | grep -E "\* |SSL connection"
```

---

## 7. curl 基础用法

### 发送 GET 请求

```bash
# 基本请求
curl http://httpbin.org/get

# 带查询参数
curl "http://httpbin.org/get?name=Alice&age=30"

# 美化 JSON 输出（管道到 jq）
curl -s http://httpbin.org/get | jq .

# 保存响应到文件（-o）
curl -o response.json http://httpbin.org/get

# 下载文件并保留原始文件名（-O）
curl -O http://httpbin.org/image/png

# 显示下载进度
curl -# -o large_file.zip http://example.com/largefile.zip
```

### 发送 POST 请求

```bash
# 发送 JSON
curl -X POST http://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 30}'

# 发送表单数据（-d 默认 application/x-www-form-urlencoded）
curl -X POST http://httpbin.org/post \
  -d "name=Alice&age=30"

# 发送单个表单字段（--data-urlencode 自动编码）
curl -X POST http://httpbin.org/post \
  --data-urlencode "message=hello world & special chars"

# 从文件读取请求体
curl -X POST http://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d @data.json

# 上传文件（multipart/form-data）
curl -X POST http://httpbin.org/post \
  -F "file=@photo.jpg" \
  -F "name=Alice"
```

### 其他常用操作

```bash
# 跟随重定向（-L）
curl -L http://httpbin.org/redirect/3

# 限制最大重定向次数
curl -L --max-redirs 5 http://httpbin.org/redirect/10

# 设置超时（连接超时 / 总超时）
curl --connect-timeout 5 --max-time 30 http://httpbin.org/delay/10

# 只输出响应体
curl -s http://httpbin.org/get

# 输出详细信息到 stderr，响应到 stdout
curl -v http://httpbin.org/get 2>debug.log

# 发送带 Cookie 的请求
curl -b "session=abc123; theme=dark" http://httpbin.org/cookies

# 保存响应 Cookie 到文件
curl -c cookies.txt http://httpbin.org/cookies/set?name=Alice

# 使用保存的 Cookie
curl -b cookies.txt http://httpbin.org/cookies
```

---

## 8. curl 进阶用法

### 调试技巧

```bash
# 完整调试信息（-v）
curl -v http://httpbin.org/get

# 只输出特定信息（-w 格式化）
curl -s -w "\n\
DNS解析: %{time_namelookup}s\n\
TCP连接: %{time_connect}s\n\
TLS握手: %{time_appconnect}s\n\
首字节:  %{time_starttransfer}s\n\
总耗时:  %{time_total}s\n\
下载大小: %{size_download} bytes\n\
HTTP码:  %{http_code}\n" \
http://httpbin.org/get -o /dev/null
```

### REST API 调试模板

```bash
# 完整的 REST API 请求
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -d '{"key": "value"}' \
  --connect-timeout 5 \
  --max-time 30 \
  https://api.example.com/v1/resource
```

### 使用 curl 配置文件

```bash
# 创建配置文件
cat > ~/.curlrc << 'EOF'
--connect-timeout 10
--max-time 60
--compressed
--silent
--show-error
EOF

# 之后所有 curl 命令自动应用这些选项
curl https://httpbin.org/get
```

### 批量请求

```bash
# 使用循环测试多个 URL
for url in http://httpbin.org/status/200 http://httpbin.org/status/404 http://httpbin.org/status/500; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$url → $code"
done
```

---

## 9. 认证方式

### Basic Auth

```bash
# 方式1：-u 参数
curl -u user:password http://httpbin.org/basic-auth/user/password

# 方式2：手动编码
curl -H "Authorization: Basic $(echo -n 'user:password' | base64)" \
  http://httpbin.org/basic-auth/user/password
```

### Bearer Token

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://httpbin.org/bearer
```

### API Key

```bash
# 通过 Header
curl -H "X-API-Key: YOUR_KEY" http://api.example.com/data

# 通过查询参数
curl "http://api.example.com/data?api_key=YOUR_KEY"
```

### OAuth 2.0 流程

```bash
# 步骤1：获取 access token
TOKEN=$(curl -s -X POST https://auth.example.com/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_ID" \
  -d "client_secret=YOUR_SECRET" | jq -r .access_token)

# 步骤2：使用 token 调用 API
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/v1/data
```

---

## 10. 实战练习

### 练习 1：探索 httpbin.org

httpbin.org 是专门用于测试 HTTP 的服务，完成以下任务：

```bash
# ① 发送 GET 请求，查看返回内容
curl http://httpbin.org/get

# ② 发送带自定义 Header 的请求
curl -H "X-My-Header: hello" http://httpbin.org/headers

# ③ 发送 POST 请求带 JSON body
curl -X POST http://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d '{"task": "learn curl"}'

# ④ 测试重定向
curl -v -L http://httpbin.org/redirect/2

# ⑤ 测试不同状态码
curl -v http://httpbin.org/status/404
curl -v http://httpbin.org/status/500

# ⑥ 测试延迟
curl --max-time 10 http://httpbin.org/delay/5

# ⑦ 查看请求耗时分析
curl -s -o /dev/null -w "DNS: %{time_namelookup}s, Total: %{time_total}s\n" \
  http://httpbin.org/get
```

### 练习 2：模拟 API 调用

```bash
# ① 获取数据（GET）
curl -s http://jsonplaceholder.typicode.com/posts/1 | jq .

# ② 创建数据（POST）
curl -s -X POST http://jsonplaceholder.typicode.com/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "foo", "body": "bar", "userId": 1}' | jq .

# ③ 更新数据（PUT）
curl -s -X PUT http://jsonplaceholder.typicode.com/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "updated", "body": "new body", "userId": 1}' | jq .

# ④ 删除数据（DELETE）
curl -s -X DELETE http://jsonplaceholder.typicode.com/posts/1 -w "\nStatus: %{http_code}\n"

# ⑤ 过滤数据
curl -s "http://jsonplaceholder.typicode.com/posts?userId=1" | jq '.[0]'
```

### 练习 3：编写 API 测试脚本

```bash
#!/bin/bash
# api_test.sh - 简单的 API 测试脚本

BASE_URL="http://jsonplaceholder.typicode.com"
PASS=0
FAIL=0

test_endpoint() {
  local method=$1
  local path=$2
  local expected=$3

  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${path}")

  if [ "$code" = "$expected" ]; then
    echo "[PASS] $method $path → $code"
    PASS=$((PASS + 1))
  else
    echo "[FAIL] $method $path → $code (expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

test_endpoint "GET"    "/posts/1"   "200"
test_endpoint "GET"    "/posts/999" "404"
test_endpoint "POST"   "/posts"     "201"
test_endpoint "PUT"    "/posts/1"   "200"
test_endpoint "DELETE" "/posts/1"   "200"

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

保存为 `api_test.sh`，然后运行：

```bash
chmod +x api_test.sh
./api_test.sh
```

---

## 本节小结

学完本章你应该掌握：

- [x] HTTP 请求/响应的完整结构
- [x] HTTP 方法及其使用场景
- [x] HTTP 状态码的分类和含义
- [x] 常用 Headers 的作用
- [x] HTTPS/TLS 的基本原理
- [x] curl 的各种用法（GET/POST/Headers/Cookie/认证）
- [x] 使用 curl 调试 REST API

### 下一步

→ 继续学习 [02-TCP-IP基础与抓包分析.md](./02-TCP-IP基础与抓包分析.md)，深入 HTTP 之下的传输层。
