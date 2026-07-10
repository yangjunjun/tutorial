# 02 - TCP/IP 基础与抓包分析

> 学习目标：理解 TCP/IP 协议栈工作原理，掌握 Wireshark / tcpdump 抓包分析能力

> 前置知识：已完成 [01-HTTP协议与curl基础.md](./01-HTTP协议与curl基础.md)

---

## 目录

1. [网络分层模型](#1-网络分层模型)
2. [TCP 协议详解](#2-tcp-协议详解)
3. [UDP 协议](#3-udp-协议)
4. [TCP vs UDP](#4-tcp-vs-udp)
5. [端口与套接字](#5-端口与套接字)
6. [tcpdump 抓包入门](#6-tcpdump-抓包入门)
7. [Wireshark 抓包分析](#7-wireshark-抓包分析)
8. [实战：分析一次 HTTP 请求](#8-实战分析一次-http-请求)
9. [常见网络问题排查](#9-常见网络问题排查)
10. [实战练习](#10-实战练习)

---

## 1. 网络分层模型

### OSI 七层模型 vs TCP/IP 四层模型

```
OSI 七层模型                    TCP/IP 四层模型          示例协议

7. 应用层    ─────────────┐
6. 表示层    ─────────────┼→  4. 应用层              HTTP, DNS, SMTP, FTP
5. 会话层    ─────────────┘

4. 传输层    ────────────────→  3. 传输层              TCP, UDP
                                  (Port)

3. 网络层    ────────────────→  2. 网络层              IP, ICMP
                                  (IP Address)

2. 数据链路层 ────────────────→  1. 网络接口层          Ethernet, Wi-Fi
                                  (MAC Address)

1. 物理层    ────────────────→                          网线, 光纤, 电波
```

### 数据封装与解封装

```
发送端（封装）：

  应用层数据:    [ Data ]
  传输层:        [ TCP Header | Data ]         ← 添加端口号
  网络层:        [ IP Header | TCP | Data ]    ← 添加 IP 地址
  链路层:        [ Ethernet | IP | TCP | Data | FCS ]  ← 添加 MAC 地址

接收端（解封装）：逐层剥离头部

  链路层 → 剥离 Ethernet 头
  网络层 → 剥离 IP 头
  传输层 → 剥离 TCP 头
  应用层 → 拿到 Data
```

### 每层的关键地址

| 层级 | 地址类型 | 说明 |
|------|---------|------|
| 链路层 | MAC 地址 | 网卡物理地址，如 `aa:bb:cc:dd:ee:ff` |
| 网络层 | IP 地址 | 逻辑地址，如 `192.168.1.100` |
| 传输层 | 端口号 | 进程标识，如 `80`、`443`、`8080` |

### 查看 IP 和 MAC 地址

```bash
# 查看 IP 和 MAC 地址
ip addr show
# 或简写
ip a

# 查看路由表
ip route

# 查看 ARP 表（IP → MAC 映射）
ip neigh
# 或
arp -a
```

---

## 2. TCP 协议详解

### TCP 三次握手（建立连接）

```
客户端 (Client)                      服务器 (Server)
    |                                    |
    |  ---- SYN (seq=x) --------------→  |   ① 客户端发送 SYN，进入 SYN_SENT
    |                                    |      服务器进入 SYN_RCVD
    |  ←--- SYN+ACK (seq=y, ack=x+1) --- |   ② 服务器回复 SYN+ACK
    |                                    |
    |  ---- ACK (ack=y+1) -------------→ |   ③ 客户端发送 ACK，双方 ESTABLISHED
    |                                    |
    |  ========= 双向数据传输 ========== |
```

**为什么是三次？** 确认双方都能发送和接收：
- 第一次：服务器确认客户端能发送
- 第二次：客户端确认服务器能发送和接收
- 第三次：服务器确认客户端能接收

### TCP 四次挥手（断开连接）

```
客户端                                服务器
    |                                    |
    |  ---- FIN (seq=x) --------------→  |   ① 客户端发起关闭
    |                                    |      客户端 → FIN_WAIT_1
    |  ←--- ACK (ack=x+1) -------------  |   ② 服务器确认
    |                                    |      客户端 → FIN_WAIT_2
    |                                    |      服务器 → CLOSE_WAIT
    |  ←--- FIN (seq=y) ---------------  |   ③ 服务器发起关闭
    |                                    |      服务器 → LAST_ACK
    |  ---- ACK (ack=y+1) -------------→ |   ④ 客户端确认
    |                                    |      客户端 → TIME_WAIT (2MSL)
    |                                    |      服务器 → CLOSED
    |                                    |
```

**为什么有 TIME_WAIT？**
- 确保最后一个 ACK 能到达服务器（如果丢失，服务器会重发 FIN）
- 等待 2MSL（Maximum Segment Lifetime）后进入 CLOSED
- 防止旧连接的延迟报文影响新连接

### TCP 状态机

```
关键状态：

  CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT_1 → FIN_WAIT_2 → TIME_WAIT → CLOSED

  CLOSED → LISTEN → SYN_RCVD → ESTABLISHED → CLOSE_WAIT → LAST_ACK → CLOSED
```

### TCP 可靠传输机制

| 机制 | 说明 |
|------|------|
| 序列号 | 每个字节有序列号，保证有序 |
| 确认应答 | 收到数据后返回 ACK 确认 |
| 超时重传 | 发送后定时等待 ACK，超时重发 |
| 滑动窗口 | 流量控制，接收方告知发送方可发送量 |
| 拥塞控制 | 慢启动、拥塞避免、快重传、快恢复 |

### 拥塞控制算法演进

```
慢启动 (Slow Start)     → 拥塞窗口从 1 指数增长
拥塞避免 (AIMD)         → 达到阈值后线性增长
快重传 (Fast Retransmit)→ 收到 3 个重复 ACK 立即重传
快恢复 (Fast Recovery)  → 不回到慢启动，直接减半

现代算法：
  Reno → NewReno → CUBIC（Linux 默认）→ BBR（Google 提出）
```

### 查看 TCP 连接状态

```bash
# 查看所有 TCP 连接
ss -tn

# 查看监听端口
ss -tln

# 查看特定状态的连接
ss -tn state established
ss -tn state time-wait
ss -tn state close-wait

# 统计各状态连接数
ss -tn | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn

# 查看某个端口的连接
ss -tn '( dport = :80 or sport = :80 )'
```

### TCP 通信实验：用 nc 观察

```bash
# 终端1：启动服务端监听 8080
nc -l 8080

# 终端2：连接服务端
nc 127.0.0.1 8080

# 终端3：观察连接状态
ss -tn | grep 8080

# 现在可以在两个终端之间互发消息
# 输入文字按回车发送

# 终端3：观察 TCP 状态变化
watch -n 1 'ss -tn | grep 8080'
```

---

## 3. UDP 协议

### UDP 特点

```
UDP 报文格式：
  [ 源端口 (2B) | 目的端口 (2B) | 长度 (2B) | 校验和 (2B) | 数据 ]

特点：
  - 无连接：不需要握手，直接发
  - 不可靠：不保证送达、不保证顺序
  - 无流量控制 / 拥塞控制
  - 头部仅 8 字节（TCP 头部 20 字节）
  - 适合实时通信（视频、游戏、DNS 查询）
```

### UDP 应用场景

| 场景 | 协议 | 为什么用 UDP |
|------|------|-------------|
| 域名解析 | DNS | 请求小，快速响应 |
| 视频直播 | RTP/WebRTC | 实时性 > 可靠性 |
| 在线游戏 | 自定义 | 低延迟，丢包可容忍 |
| 文件传输 | TFTP | 简单轻量 |
| 心跳检测 | 自定义 | 小包快速发送 |

### UDP 实验

```bash
# 终端1：UDP 服务端
nc -lu 9090

# 终端2：UDP 客户端
nc -u 127.0.0.1 9090

# 终端3：查看 UDP 连接
ss -un | grep 9090
```

---

## 4. TCP vs UDP

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接 | 面向连接（三次握手） | 无连接 |
| 可靠性 | 可靠（重传、确认） | 不可靠 |
| 有序性 | 保证有序 | 不保证 |
| 速度 | 较慢 | 快 |
| 头部大小 | 20 字节 | 8 字节 |
| 流量控制 | 有（滑动窗口） | 无 |
| 拥塞控制 | 有 | 无 |
| 传输方式 | 字节流 | 数据报 |
| 适用场景 | Web、邮件、文件传输 | 视频、游戏、DNS |

### 选择依据

```
需要可靠传输？  → TCP（大部分应用）
需要低延迟？    → UDP（实时通信）
需要广播/多播？ → UDP（TCP 只能点对点）
小请求快速响应？→ UDP（DNS 查询就是经典案例）
```

---

## 5. 端口与套接字

### 端口分类

| 范围 | 类型 | 说明 |
|------|------|------|
| 0-1023 | 知名端口 | 系统服务（HTTP 80, HTTPS 443, SSH 22, DNS 53） |
| 1024-49151 | 注册端口 | 应用程序使用（MySQL 3306, Redis 6379） |
| 49152-65535 | 动态端口 | 临时分配给客户端 |

### 常见端口

| 端口 | 协议 | 说明 |
|------|------|------|
| 20/21 | FTP | 文件传输 |
| 22 | SSH | 安全 Shell |
| 25 | SMTP | 邮件发送 |
| 53 | DNS | 域名解析 |
| 80 | HTTP | Web 服务 |
| 443 | HTTPS | 加密 Web |
| 3306 | MySQL | 数据库 |
| 6379 | Redis | 缓存 |
| 8080 | HTTP Alt | 代理/备选 Web |

### 端口操作

```bash
# 查看端口占用
ss -tlnp | grep 8080

# 查看哪个进程占用端口
sudo lsof -i :8080

# 检查远程端口是否开放
nc -zv example.com 80
# 或
nc -zv example.com 80 443 8080

# 扫描端口范围
nmap -p 1-1000 example.com
```

---

## 6. tcpdump 抓包入门

### 安装

```bash
# Ubuntu/Debian
sudo apt install tcpdump

# CentOS/RHEL
sudo yum install tcpdump

# macOS（预装或通过 brew）
brew install tcpdump
```

### 基本语法

```bash
tcpdump [选项] [过滤表达式]

常用选项：
  -i <interface>  指定网卡
  -n              不解析 IP → 域名（更快）
  -nn             不解析 IP 和端口
  -v / -vv / -vvv 详细程度递增
  -c <count>      抓取指定数量的包后停止
  -w <file>       保存到文件（可用 Wireshark 打开）
  -r <file>       读取抓包文件
  -A              以 ASCII 显示内容
  -X              同时显示十六进制和 ASCII
```

### 过滤表达式（BPF 语法）

```
类型：     host, src, dst, port, portrange
协议：     tcp, udp, icmp, arp, ip, ip6
方向：     src, dst
逻辑：     and, or, not
组合：     (src host 10.0.0.1 and dst port 80)
```

### 常用抓包命令

```bash
# 抓取所有流量（指定网卡）
sudo tcpdump -i eth0

# 抓取指定网卡的流量，不解析域名
sudo tcpdump -i eth0 -nn

# 抓取特定主机的流量
sudo tcpdump -i eth0 host 93.184.216.34

# 抓取特定端口的流量
sudo tcpdump -i eth0 port 80

# 抓取 HTTP 流量
sudo tcpdump -i eth0 tcp port 80 -A

# 抓取 DNS 查询
sudo tcpdump -i eth0 port 53

# 抓取 ICMP（ping）流量
sudo tcpdump -i eth0 icmp

# 组合过滤
sudo tcpdump -i eth0 'src 192.168.1.100 and dst port 443'

# 只抓 10 个包
sudo tcpdump -i eth0 -c 10 -nn

# 保存到文件
sudo tcpdump -i eth0 -w capture.pcap port 80

# 读取抓包文件
tcpdump -r capture.pcap -A
```

### 查看 TCP 握手和挥手

```bash
# 终端1：抓取 80 端口的 TCP 包
sudo tcpdump -i any -nn 'tcp port 80' -c 20

# 终端2：发起 HTTP 请求
curl http://example.com

# 观察 tcpdump 输出中的 [S]（SYN）、[S.]（SYN+ACK）、[.]（ACK）、[F]（FIN）标志
```

tcpdump 输出解读：
```
12:00:01.123456 IP 10.0.0.5.54321 > 93.184.216.34.80: Flags [S], seq 123456, win 65535
  ↑时间              ↑源IP.端口       ↑目标IP.端口      ↑SYN标志    ↑序列号  ↑窗口大小

12:00:01.124567 IP 93.184.216.34.80 > 10.0.0.5.54321: Flags [S.], seq 789012, ack 123457
  ↑ SYN+ACK

12:00:01.125678 IP 10.0.0.5.54321 > 93.184.216.34.80: Flags [.], ack 789013
  ↑ ACK

标志含义：
  [S]  = SYN
  [S.] = SYN+ACK
  [.]  = ACK
  [P.] = PSH+ACK（有数据）
  [F.] = FIN+ACK
  [R.] = RST+ACK（异常重置）
```

---

## 7. Wireshark 抓包分析

### 安装

```bash
# Ubuntu/Debian
sudo apt install wireshark

# CentOS/RHEL
sudo yum install wireshark

# macOS
brew install --cask wireshark
```

### Wireshark 基本操作

```
1. 选择网卡：启动后选择要监听的网络接口（如 eth0, en0, Wi-Fi）
2. 开始抓包：点击左上角鲨鱼鳍图标
3. 设置过滤器：在显示过滤器栏输入表达式
4. 停止抓包：点击红色方块
5. 分析数据包：点击单个包查看详细信息
```

### Wireshark 显示过滤器语法

```
# 按 IP 过滤
ip.addr == 93.184.216.34
ip.src == 192.168.1.100
ip.dst == 8.8.8.8

# 按端口过滤
tcp.port == 80
tcp.dstport == 443

# 按协议过滤
http
https / tls
dns
tcp.flags.syn == 1          # SYN 包
tcp.flags.reset == 1         # RST 包

# 组合
http and ip.addr == 10.0.0.1
tcp.port == 80 or tcp.port == 443
not arp and not icmp
http.response.code == 404
```

### Wireshark 窗口结构

```
┌─────────────────────────────────────────┐
│  显示过滤器栏                            │
├─────────────────────────────────────────┤
│  包列表（Packet List）                   │  ← 每行一个包
│  No. | Time | Source | Dest | Protocol | Info │
├─────────────────────────────────────────┤
│  包详情（Packet Details）                │  ← 协议分层展开
│  ▶ Frame                   # 物理层信息  │
│  ▶ Ethernet                # 数据链路层   │
│  ▶ Internet Protocol v4    # 网络层      │
│  ▶ Transmission Control    # 传输层      │
│  ▶ Hypertext Transfer      # 应用层      │
├─────────────────────────────────────────┤
│  包字节（Packet Bytes）                  │  ← 原始十六进制
└─────────────────────────────────────────┘
```

### 实用技巧

```
右键操作：
  - 右键包 → Follow → TCP Stream    # 查看 TCP 完整会话
  - 右键包 → Follow → HTTP Stream   # 查看 HTTP 完整请求/响应
  - 右键字段 → Apply as Column      # 将某字段添加为列

统计功能：
  - Statistics → Flow Graph          # 查看时序图（握手挥手一目了然）
  - Statistics → HTTP                # HTTP 请求统计
  - Statistics → TCP Stream Graph    # TCP 性能图表
```

---

## 8. 实战：分析一次 HTTP 请求

### 步骤1：启动抓包

```bash
# 终端1：保存抓包文件
sudo tcpdump -i any -w http_capture.pcap 'tcp port 80' -c 50
```

### 步骤2：发起请求

```bash
# 终端2：发起 HTTP 请求
curl -v http://example.com
```

### 步骤3：分析抓包

```bash
# 读取抓包
tcpdump -r http_capture.pcap -nn -A

# 或用 Wireshark 打开
wireshark http_capture.pcap
```

### 预期看到的包序列

```
序号  内容                              对应阶段
────  ────────────────────────────────  ──────────
1     DNS 查询（如果域名未缓存）          DNS 解析
2     TCP SYN（客户端 → 服务器）         三次握手 ①
3     TCP SYN+ACK（服务器 → 客户端）     三次握手 ②
4     TCP ACK（客户端 → 服务器）         三次握手 ③
5     HTTP GET 请求（客户端 → 服务器）    发送请求
6     TCP ACK（服务器 → 客户端）         确认收到请求
7     HTTP 200 OK 响应（服务器 → 客户端） 返回响应
8     TCP ACK（客户端 → 服务器）         确认收到响应
9     TCP FIN+ACK（客户端 → 服务器）     四次挥手 ①
10    TCP ACK（服务器 → 客户端）         四次挥手 ②
11    TCP FIN+ACK（服务器 → 客户端）     四次挥手 ③
12    TCP ACK（客户端 → 服务器）         四次挥手 ④
```

### 步骤4：在 Wireshark 中使用 Flow Graph

```
Statistics → Flow Graph
```

可以看到清晰的时间线图，包含：
- DNS 查询/响应
- TCP 三次握手
- HTTP 请求/响应
- TCP 四次挥手

---

## 9. 常见网络问题排查

### 问题1：连接超时

```bash
# 检查连通性
ping example.com

# 检查端口是否开放
nc -zv example.com 80
# Connection refused → 端口未开放 / 防火墙拒绝
# Connection timed out → 防火墙丢弃 / 网络不通

# 追踪路由路径
traceroute example.com    # Linux
mtr example.com           # 更好用的工具（持续追踪）

# 检查 DNS 解析
dig example.com
nslookup example.com
```

### 问题2：TCP 连接过多

```bash
# 查看连接数统计
ss -tn | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn

# 查看 TIME_WAIT 数量
ss -tn state time-wait | wc -l

# 查看某个 IP 的连接数
ss -tn | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head
```

### 问题3：抓包定位问题

```bash
# 只看 RST 包（异常断开）
sudo tcpdump -i any 'tcp[tcpflags] & tcp-rst != 0' -nn

# 只看 SYN 但没有 SYN-ACK（服务器没响应）
sudo tcpdump -i any 'tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack == 0' -nn

# 查看重传包
sudo tcpdump -i any 'tcp[tcpflags] & tcp-ack != 0 and tcp.analysis.retransmission' -nn
```

### 问题4：网络延迟分析

```bash
# 使用 curl 分析各阶段耗时
curl -s -o /dev/null -w "\n\
DNS解析:  %{time_namelookup}s\n\
TCP连接:  %{time_connect}s\n\
TLS握手:  %{time_appconnect}s\n\
首字节:   %{time_starttransfer}s\n\
总耗时:   %{time_total}s\n" https://example.com

# 输出示例：
# DNS解析:  0.012345s
# TCP连接:  0.045678s    ← TCP 连接耗时 = connect - namelookup
# TLS握手:  0.123456s    ← TLS 耗时 = appconnect - connect
# 首字节:   0.234567s    ← 服务器处理 = starttransfer - appconnect
# 总耗时:   0.345678s    ← 内容传输 = total - starttransfer
```

---

## 10. 实战练习

### 练习1：观察三次握手

```bash
# 终端1：抓包
sudo tcpdump -i any -nn 'tcp port 80' -c 15

# 终端2：发起请求
curl -s http://example.com -o /dev/null

# 任务：在 tcpdump 输出中找出
# 1. SYN 包（Flags [S]）
# 2. SYN+ACK 包（Flags [S.]）
# 3. ACK 包（Flags [.]）
# 4. 记录它们的序列号和确认号
```

### 练习2：观察四次挥手

```bash
# 终端1：抓包
sudo tcpdump -i any -nn 'tcp port 80' -c 20

# 终端2：发起请求后立即断开
curl -s http://example.com -o /dev/null

# 任务：在输出中找出
# 1. FIN 包（Flags [F.]）
# 2. 确认 FIN 的 ACK
# 3. 对端发送的 FIN
# 4. 最后的 ACK
# 5. 注意 TIME_WAIT 出现在哪一端
```

### 练习3：抓取并分析 DNS 查询

```bash
# 终端1：抓 DNS 流量
sudo tcpdump -i any -nn 'port 53' -c 10

# 终端2：发起 DNS 查询
dig example.com
# 或
nslookup example.com

# 任务：
# 1. DNS 使用的是 TCP 还是 UDP？
# 2. 查询包和响应包分别长什么样？
# 3. 为什么 DNS 默认用 UDP？
```

### 练习4：使用 Wireshark 分析 HTTPS 握手

```bash
# 步骤1：启动 Wireshark，选择网络接口开始抓包
# 步骤2：在浏览器中访问一个 HTTPS 网站
# 步骤3：在 Wireshark 中设置过滤器 tls.handshake
# 步骤4：找到以下 TLS 握手消息：
#   - Client Hello（客户端发送支持的加密套件）
#   - Server Hello（服务器选择加密套件）
#   - Certificate（服务器证书）
#   - Client Key Exchange（密钥交换）
#   - Change Cipher Spec（切换到加密通信）
#   - Application Data（加密后的应用数据）
```

### 练习5：网络故障模拟

```bash
# 模拟丢包（需要 root 权限）
sudo tc qdisc add dev lo netem loss 10%

# 测试影响
curl -v http://localhost:8080

# 观察 TCP 重传
sudo tcpdump -i lo -nn 'tcp port 8080'

# 恢复
sudo tc qdisc del dev lo netem

# 模拟延迟
sudo tc qdisc add dev lo netem delay 200ms
curl -s -o /dev/null -w "总耗时: %{time_total}s\n" http://localhost:8080
sudo tc qdisc del dev lo netem
```

---

## 本节小结

学完本章你应该掌握：

- [x] OSI 七层模型和 TCP/IP 四层模型
- [x] TCP 三次握手和四次挥手过程
- [x] TCP 可靠传输机制（序列号、确认、重传、滑动窗口）
- [x] TCP 与 UDP 的区别和选型
- [x] 端口号的作用和常见端口
- [x] tcpdump 抓包和 BPF 过滤语法
- [x] Wireshark 抓包分析基本操作
- [x] 网络故障排查思路

### 下一步

→ 继续学习 [03-DNS-路由与网络分层.md](./03-DNS-路由与网络分层.md)，理解互联网的寻址和路由机制。
