# 03 - DNS、路由与网络分层

> 学习目标：理解 DNS 解析过程、IP 路由机制、子网划分，掌握网络分层全貌

> 前置知识：已完成 [02-TCP-IP基础与抓包分析.md](./02-TCP-IP基础与抓包分析.md)

---

## 目录

1. [DNS 域名解析](#1-dns-域名解析)
2. [DNS 记录类型](#2-dns-记录类型)
3. [DNS 工具实战](#3-dns-工具实战)
4. [IP 地址体系](#4-ip-地址体系)
5. [子网划分（CIDR）](#5-子网划分cidr)
6. [IP 路由原理](#6-ip-路由原理)
7. [NAT 网络地址转换](#7-nat-网络地址转换)
8. [ARP 协议](#8-arp-协议)
9. [ICMP 协议](#9-icmp-协议)
10. [VPN 与隧道](#10-vpn-与隧道)
11. [实战练习](#11-实战练习)

---

## 1. DNS 域名解析

### 为什么需要 DNS

```
人类记住域名：    www.example.com
网络需要 IP：     93.184.216.34
DNS 就是一本电话簿：域名 → IP 地址
```

### DNS 解析的完整流程

```
浏览器输入 www.example.com 后：

① 浏览器缓存
   └→ 没找到？

② 操作系统缓存
   └→ 没找到？

③ 本地 hosts 文件 (/etc/hosts)
   └→ 没找到？

④ 本地 DNS 服务器（递归解析器，通常由 ISP 提供）
   └→ 没找到？开始迭代查询：

   ⑤ 根域名服务器 (.)
      └→ 返回 .com TLD 服务器地址

   ⑥ .com 顶级域名服务器 (TLD)
      └→ 返回 example.com 权威服务器地址

   ⑦ example.com 权威域名服务器
      └→ 返回 www.example.com 的 IP 地址

⑧ 本地 DNS 服务器缓存结果，返回给客户端
⑨ 客户端缓存结果，发起 HTTP 请求
```

### DNS 层次结构

```
根域 (.)                         13 组根服务器（a.root-servers.net ~ m.root-servers.net）
├── 顶级域 (TLD)
│   ├── 通用顶级域：.com .org .net .edu .gov .io .dev
│   ├── 国家顶级域：.cn .us .jp .uk .de
│   └── 新通用顶级域：.app .blog .shop .dev
│
└── 二级域
    ├── example.com
    │   ├── www.example.com       ← 三级域（子域）
    │   ├── api.example.com
    │   └── mail.example.com
    │
    └── google.com
        ├── www.google.com
        ├── maps.google.com
        └── drive.google.com
```

### DNS 解析方式

| 类型 | 说明 | 示例 |
|------|------|------|
| 递归查询 | 客户端 → 本地 DNS 服务器，要求最终结果 | 浏览器 → ISP DNS |
| 迭代查询 | 本地 DNS 服务器逐级查询各权威服务器 | ISP DNS → 根 → TLD → 权威 |

---

## 2. DNS 记录类型

| 记录类型 | 全称 | 说明 | 示例 |
|---------|------|------|------|
| A | Address | 域名 → IPv4 地址 | `example.com → 93.184.216.34` |
| AAAA | IPv6 Address | 域名 → IPv6 地址 | `example.com → 2606:2800:220:1:...` |
| CNAME | Canonical Name | 域名 → 另一个域名（别名） | `www.example.com → example.com` |
| MX | Mail Exchange | 邮件服务器 | `example.com → mail.example.com (优先级10)` |
| NS | Name Server | 域名的权威 DNS 服务器 | `example.com NS → ns1.example.com` |
| TXT | Text | 任意文本（SPF、DKIM、域名验证） | `example.com TXT → "v=spf1 ..."` |
| SOA | Start of Authority | 区域权威信息 | 主 DNS、管理员邮箱、序列号等 |
| SRV | Service | 服务记录（端口+主机） | `_sip._tcp.example.com SRV → ...` |
| PTR | Pointer | IP → 域名（反向解析） | `34.216.184.93.in-addr.arpa → example.com` |

### DNS 记录查看示例

```
example.com 的 DNS 记录全景：

  A     example.com.        → 93.184.216.34
  A     www.example.com.    → 93.184.216.34
  MX    example.com.        → 10 mail.example.com.
  NS    example.com.        → ns1.example.com.
  NS    example.com.        → ns2.example.com.
  TXT   example.com.        → "v=spf1 include:_spf.example.com ~all"
  SOA   example.com.        → ns1.example.com. admin.example.com. ...
```

---

## 3. DNS 工具实战

### dig 命令（推荐）

```bash
# 基本 DNS 查询
dig example.com

# 只看简短结果
dig example.com +short

# 查询特定记录类型
dig example.com MX       # 邮件记录
dig example.com NS       # 权威服务器
dig example.com TXT      # 文本记录
dig example.com AAAA     # IPv6 地址
dig example.com CNAME    # 别名记录
dig example.com SOA      # 权威信息

# 指定 DNS 服务器查询
dig @8.8.8.8 example.com          # 用 Google DNS 查
dig @1.1.1.1 example.com          # 用 Cloudflare DNS 查
dig @8.8.8.8 example.com +short

# 反向查询（IP → 域名）
dig -x 93.184.216.34

# 查看完整解析过程（追踪）
dig example.com +trace

# 查询统计信息
dig example.com +stats
```

dig 输出解读：

```
;; QUESTION SECTION       ← 查询的问题
;; ANSWER SECTION         ← DNS 返回的答案
;; AUTHORITY SECTION      ← 权威服务器信息
;; ADDITIONAL SECTION     ← 额外信息

;; Query time: 23 msec    ← 查询耗时
;; SERVER: 8.8.8.8#53     ← 使用的 DNS 服务器
;; WHEN: Fri Jul 10 12:00:00 CST 2026  ← 查询时间
```

### nslookup 命令

```bash
# 基本查询
nslookup example.com

# 指定 DNS 服务器
nslookup example.com 8.8.8.8

# 查询特定类型
nslookup -type=MX example.com
nslookup -type=NS example.com
nslookup -type=TXT example.com

# 交互模式
nslookup
> server 8.8.8.8          # 切换 DNS 服务器
> set type=MX             # 设置查询类型
> example.com             # 查询
> exit
```

### host 命令（简洁）

```bash
# 基本查询
host example.com

# 查询 MX
host -t MX example.com

# 查询 NS
host -t NS example.com

# 反向查询
host 93.184.216.34
```

### 修改本地 DNS 配置

```bash
# 查看当前 DNS 服务器
cat /etc/resolv.conf

# 临时修改 DNS（重启后失效）
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf

# 永久修改（Ubuntu）
sudo nano /etc/netplan/01-netcfg.yaml
# 添加：
#   nameservers:
#     addresses: [8.8.8.8, 1.1.1.1]

# hosts 文件（优先级高于 DNS）
cat /etc/hosts
# 添加自定义解析：
# 127.0.0.1  myapp.local
# 192.168.1.100  myserver.internal
```

### 清除 DNS 缓存

```bash
# Linux（systemd-resolved）
sudo systemd-resolve --flush-caches
# 或
sudo resolvectl flush-caches

# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns
```

---

## 4. IP 地址体系

### IPv4 地址结构

```
IPv4 地址：32 位，4 个字节，点分十进制表示

  192.168.1.100

  二进制：11000000.10101000.00000001.01100100

  总共约 43 亿个地址（2^32 ≈ 4,294,967,296）
```

### IP 地址分类

```
类别  范围                           默认子网掩码     私有地址范围
──────────────────────────────────────────────────────────────────────
A类   1.0.0.0 ~ 126.255.255.255     255.0.0.0       10.0.0.0/8
B类   128.0.0.0 ~ 191.255.255.255   255.255.0.0     172.16.0.0/12
C类   192.0.0.0 ~ 223.255.255.255   255.255.255.0   192.168.0.0/16
D类   224.0.0.0 ~ 239.255.255.255   组播地址          -
E类   240.0.0.0 ~ 255.255.255.255   保留（实验）      -
```

### 特殊 IP 地址

| 地址 | 说明 |
|------|------|
| 0.0.0.0 | 本机所有 IP 地址 |
| 127.0.0.1 | 本地回环地址（localhost） |
| 169.254.x.x | 链路本地地址（DHCP 获取失败时自动分配） |
| 10.0.0.0/8 | A 类私有地址 |
| 172.16.0.0/12 | B 类私有地址 |
| 192.168.0.0/16 | C 类私有地址 |
| 255.255.255.255 | 广播地址（本网段所有主机） |

### 公有 IP vs 私有 IP

```
公网环境：

  [你的电脑: 192.168.1.100]  ← 私有 IP
       |
  [路由器/网关: 192.168.1.1]  ← 私有 IP（内网接口）
       |                    ← 公有 IP（外网接口）
  [互联网 ISP]
       |
  [服务器: 93.184.216.34]     ← 公有 IP
```

### IPv6 简介

```
IPv6 地址：128 位，8 组 4 位十六进制

  2001:0db8:85a3:0000:0000:8a2e:0370:7334

简写规则：
  - 前导零可省略：0db8 → db8
  - 连续的零组用 :: 表示（只能用一次）
  
  2001:db8:85a3::8a2e:370:7334

特殊地址：
  ::1        ← 本地回环（相当于 127.0.0.1）
  fe80::     ← 链路本地地址
  2001::     ← 全球单播地址
  ff00::     ← 组播地址

优势：
  - 地址空间巨大（2^128 ≈ 3.4×10^38）
  - 不需要 NAT
  - 简化头部，提高路由效率
  - 内置安全（IPSec）
```

---

## 5. 子网划分（CIDR）

### 子网掩码

```
子网掩码用于区分 IP 地址中的网络部分和主机部分

IP:      192.168.1.100
掩码:    255.255.255.0
二进制:  11111111.11111111.11111111.00000000
                      网络部分              主机部分

网络地址：192.168.1.0     ← 主机部分全 0
广播地址：192.168.1.255   ← 主机部分全 1
可用主机：192.168.1.1 ~ 192.168.1.254  ← 共 254 台
```

### CIDR 表示法

```
CIDR（无类域间路由）：IP/网络位数

  192.168.1.0/24    ← 前 24 位是网络部分

常见 CIDR：

  /8   255.0.0.0          可用主机: 16,777,214   (10.0.0.0/8)
  /16  255.255.0.0        可用主机: 65,534       (172.16.0.0/16)
  /24  255.255.255.0      可用主机: 254          (192.168.1.0/24)
  /25  255.255.255.128    可用主机: 126
  /26  255.255.255.192    可用主机: 62
  /27  255.255.255.224    可用主机: 30
  /28  255.255.255.240    可用主机: 14
  /30  255.255.255.252    可用主机: 2            (点对点链路)
  /32  255.255.255.255    可用主机: 1            (单机)
```

### 子网划分计算

```
公式：
  网络地址 = IP & 子网掩码
  广播地址 = 网络地址 | ~子网掩码
  可用主机数 = 2^(主机位数) - 2

示例：将 192.168.1.0/24 划分为 4 个子网

  需要 2 位借位（2^2 = 4 个子网）

  子网1: 192.168.1.0/26     范围: .0 ~ .63      可用: .1 ~ .62
  子网2: 192.168.1.64/26    范围: .64 ~ .127    可用: .65 ~ .126
  子网3: 192.168.1.128/26   范围: .128 ~ .191   可用: .129 ~ .190
  子网4: 192.168.1.192/26   范围: .192 ~ .255   可用: .193 ~ .254
```

### 子网计算工具

```bash
# 使用 ipcalc（Linux）
ipcalc 192.168.1.100/24

# 输出：
# Address:   192.168.1.100
# Netmask:   255.255.255.0 = 24
# Network:   192.168.1.0/24
# HostMin:   192.168.1.1
# HostMax:   192.168.1.254
# Broadcast: 192.168.1.255
# Hosts/Net: 254

# 划分子网
ipcalc 192.168.1.0/24 -s 4 4 4

# 在线工具：https://www.calculator.net/ip-subnet-calculator.html
```

---

## 6. IP 路由原理

### 路由的基本概念

```
路由 = 决定数据包从源到目的地的路径

每一跳：
  1. 主机检查目标 IP 是否在同一子网
  2. 同子网 → 直接通过 ARP 获取 MAC 地址发送
  3. 不同子网 → 发给默认网关（路由器）
  4. 路由器查路由表，决定下一跳
  5. 重复直到到达目标
```

### 路由表

```bash
# 查看路由表
ip route
# 或
route -n

# 输出示例：
# default via 192.168.1.1 dev eth0          ← 默认路由
# 192.168.1.0/24 dev eth0 proto kernel       ← 直连路由
# 10.0.0.0/8 via 192.168.1.254 dev eth0      ← 静态路由
# 172.16.0.0/16 via 192.168.1.253 dev eth0   ← 静态路由
```

路由表字段说明：

| 字段 | 说明 |
|------|------|
| 目标网络 | 目标 IP 段 |
| via | 下一跳网关地址 |
| dev | 出接口（网卡） |
| proto | 路由来源（kernel/static/ospf/bgp） |
| metric | 优先级（越小越优先） |

### 路由匹配规则（最长前缀匹配）

```
路由表中有：
  0.0.0.0/0         via 192.168.1.1     ← 默认路由（匹配所有）
  10.0.0.0/8        via 192.168.1.254   ← 匹配 10.x.x.x
  10.1.1.0/24       via 192.168.1.253   ← 匹配 10.1.1.x

目标 IP：10.1.1.5

匹配结果：10.1.1.0/24（最长前缀匹配，/24 > /8 > /0）
选择 via 192.168.1.253
```

### 路由类型

| 类型 | 说明 | 配置方式 |
|------|------|---------|
| 直连路由 | 直接连接的网络 | 自动生成 |
| 静态路由 | 手动配置的路由 | `ip route add` |
| 默认路由 | 匹配所有地址的兜底路由 | `ip route add default` |
| 动态路由 | 通过协议自动学习 | OSPF/BGP/RIP |

### 静态路由配置

```bash
# 添加静态路由（临时）
sudo ip route add 10.0.0.0/8 via 192.168.1.254

# 添加默认路由
sudo ip route add default via 192.168.1.1

# 删除路由
sudo ip route del 10.0.0.0/8

# 永久配置（Ubuntu Netplan）
# /etc/netplan/01-netcfg.yaml:
#   routes:
#     - to: 10.0.0.0/8
#       via: 192.168.1.254
#     - to: default
#       via: 192.168.1.1
```

### 动态路由协议

```
内部网关协议（IGP）：
  OSPF  - 开放最短路径优先，大型企业常用
  RIP   - 距离向量协议，适合小型网络
  EIGRP - Cisco 私有协议

外部网关协议（EGP）：
  BGP   - 边界网关协议，互联网骨干路由协议
           AS（自治系统）之间的路由
```

### 路由追踪

```bash
# traceroute：追踪数据包经过的每一跳
traceroute example.com

# 输出示例：
# 1  192.168.1.1     1.2ms   ← 本地网关
# 2  10.0.0.1        5.3ms   ← ISP 接入路由器
# 3  172.16.0.1     12.1ms   ← ISP 核心路由器
# ...
# 12 93.184.216.34  45.6ms   ← 目标服务器

# mtr：结合 traceroute + ping 的持续监控工具
mtr example.com
# 持续刷新，显示每一跳的丢包率和延迟

# 指定使用 TCP（绕过 ICMP 限制）
traceroute -T -p 80 example.com
mtr --tcp --port 80 example.com
```

---

## 7. NAT 网络地址转换

### NAT 原理

```
内网主机通过路由器的公有 IP 访问外网

  内网                          外网
  192.168.1.100:54321    →    NAT 转换    →    203.0.113.5:12345
                                                          |
                                                    目标服务器
                                                    93.184.216.34:80

  响应返回：
  93.184.216.34:80    →    203.0.113.5:12345    →    NAT 转换    →    192.168.1.100:54321
```

### NAT 类型

| 类型 | 说明 |
|------|------|
| SNAT（源 NAT） | 修改源 IP，内网访问外网时使用（最常见） |
| DNAT（目的 NAT） | 修改目的 IP，端口转发/负载均衡时使用 |
| PAT（端口地址转换） | 多个内网 IP 共用一个公网 IP，靠端口区分（家用路由器） |
| MASQUERADE | 动态 SNAT，接口 IP 变化时自动适应 |

### NAT 配置（Linux iptables）

```bash
# 查看 NAT 规则
sudo iptables -t nat -L -n -v

# 配置 SNAT（内网通过 eth0 出口上网）
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE

# 配置 DNAT（端口转发：外部访问 80 → 内网 8080）
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:8080

# 开启 IP 转发
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# 永久开启 IP 转发
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### NAT 的利与弊

```
优点：
  ✓ 缓解 IPv4 地址不足
  ✓ 隐藏内网结构（一定程度安全）
  ✓ 内网 IP 变化不影响外网

缺点：
  ✗ 破坏端到端连接模型
  ✗ 性能开销（地址转换）
  ✗ 某些协议不兼容（如 FTP 主动模式）
  ✗ 服务器难以被外网主动访问（需端口映射）
```

---

## 8. ARP 协议

### ARP 工作原理

```
ARP（Address Resolution Protocol）：IP 地址 → MAC 地址映射

场景：主机 A（192.168.1.100）要和主机 B（192.168.1.200）通信

① A 查 ARP 缓存 → 没有B的MAC
② A 发送 ARP 广播（目标 MAC: FF:FF:FF:FF:FF:FF）
   "谁是 192.168.1.200？请告诉 192.168.1.100"
③ B 收到广播，回复 ARP 单播应答
   "我是 192.168.1.200，我的 MAC 是 aa:bb:cc:dd:ee:ff"
④ A 缓存 ARP 条目，开始通信
```

### ARP 操作

```bash
# 查看 ARP 缓存
ip neigh
# 或
arp -n

# 手动添加 ARP 条目
sudo arp -s 192.168.1.200 aa:bb:cc:dd:ee:ff

# 删除 ARP 条目
sudo arp -d 192.168.1.200

# 抓取 ARP 包
sudo tcpdump -i any arp -nn -c 10
```

### ARP 欺戏原理（安全风险）

```
攻击者发送伪造 ARP 应答：
  "我是 192.168.1.1（网关），我的 MAC 是 攻击者MAC"

受害者缓存被污染 → 流量经过攻击者 → 中间人攻击

防御：
  - 静态 ARP 绑定
  - DAI（Dynamic ARP Inspection）
  - 网络隔离
```

---

## 9. ICMP 协议

### ICMP 简介

```
ICMP（Internet Control Message Protocol）用于网络诊断和错误报告

常见 ICMP 类型：
  Type 8  → Echo Request（ping 请求）
  Type 0  → Echo Reply（ping 响应）
  Type 3  → Destination Unreachable（目标不可达）
  Type 11 → Time Exceeded（超时，traceroute 利用此特性）
  Type 5  → Redirect（路由重定向）
``### ping 命令

```bash
# 基本 ping
ping example.com

# 指定 ping 次数
ping -c 4 example.com

# 指定包大小
ping -s 1000 example.com

# 指定间隔（ flood ping 需要 root）
sudo ping -f example.com

# 输出解读：
# 64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=12.3 ms
#      ↑包大小        ↑目标IP         ↑序号  ↑TTL  ↑往返延迟
```

### ICMP 与 traceroute

```
traceroute 原理：
  ① 发送 TTL=1 的包 → 第一跳路由器返回 ICMP Time Exceeded
  ② 发送 TTL=2 的包 → 第二跳路由器返回 ICMP Time Exceeded
  ③ 逐次增加 TTL → 直到到达目标

  通过这种方式，逐步发现路径上的每一跳路由器
```

---

## 10. VPN 与隧道

### VPN 基本概念

```
VPN（Virtual Private Network）在公网上建立加密隧道

  公司内网                       公共互联网                    远程员工
  10.0.0.0/24                                                192.168.1.100
       |                                                          |
  [VPN 服务器] ←======== 加密隧道（UDP/TCP 封装）========→ [VPN 客户端]
  203.0.113.1                                                   |
                                                          虚拟网卡: 10.0.0.50
                                                          （仿佛在公司内网）
``### 常见 VPN 技术

| 技术 | 说明 | 适用场景 |
|------|------|---------|
| WireGuard | 现代快速 VPN，代码量小 | 推荐，简洁高效 |
| OpenVPN | 成熟开源 VPN | 企业通用 |
| IPSec | 网络层加密协议 | 站点到站点 VPN |
| SSTP | 基于 SSL 的 VPN | Windows 环境 |
| SSH 隧道 | 简单端口转发 | 临时使用 |

### SSH 隧道（最简单的"VPN"）

```bash
# 本地端口转发：把远程服务映射到本地
# 访问 localhost:8080 = 访问远程服务器的 localhost:3000
ssh -L 8080:localhost:3000 user@remote-server

# 远程端口转发：把本地服务暴露到远程
ssh -R 9090:localhost:8080 user@remote-server

# 动态端口转发（SOCKS 代理）
ssh -D 1080 user@remote-server
# 然后浏览器配置 SOCKS5 代理 127.0.0.1:1080

# 使用 SOCKS 代理
curl --socks5 127.0.0.1:1080 http://internal-service:8080
```

---

## 11. 实战练习

### 练习1：DNS 全流程追踪

```bash
# ① 追踪 DNS 解析过程
dig example.com +trace

# 任务：
# 1. 找到根服务器返回的 .com TLD 服务器
# 2. 找到 TLD 返回的权威服务器
# 3. 找到权威服务器返回的 A 记录
# 4. 记录每一级查询的耗时

# ② 对比不同 DNS 服务器
dig @8.8.8.8 example.com +stats
dig @1.1.1.1 example.com +stats
dig @114.114.114.114 example.com +stats

# 任务：对比三个 DNS 服务器的响应时间

# ③ 查看常用网站的 DNS 配置
dig github.com A +short
dig github.com MX +short
dig github.com NS +short
dig github.com TXT +short

# 任务：分析 github.com 的 DNS 配置
```

### 练习2：子网划分

```bash
# 使用 ipcalc 练习
ipcalc 192.168.10.0/24
ipcalc 10.0.0.0/16
ipcalc 172.16.5.100/22

# 任务：
# 1. 计算 10.0.0.0/16 能容纳多少台主机？
# 2. 将 192.168.1.0/24 划分为 8 个子网，列出每个子网的网络地址、广播地址、可用范围
# 3. 172.16.5.100/22 的网络地址和广播地址是什么？
```

### 练习3：路由分析

```bash
# ① 查看本机路由表
ip route

# 任务：
# 1. 找出默认网关
# 2. 找出直连网络
# 3. 有没有静态路由？

# ② 追踪到目标的路由
traceroute example.com
mtr -c 10 example.com

# 任务：
# 1. 经过了多少跳？
# 2. 哪一跳延迟突然增大？
# 3. 有没有丢包？

# ③ 手动添加和删除路由（需要 sudo）
sudo ip route add 10.99.99.0/24 via 127.0.0.1 dev lo
ip route | grep 10.99
ping -c 2 10.99.99.1
sudo ip route del 10.99.99.0/24
```

### 练习4：ARP 抓包

```bash
# 终端1：抓取 ARP 包
sudo tcpdump -i any arp -nn -c 10

# 终端2：触发 ARP（ping 一个未缓存的 IP）
ping -c 1 192.168.1.1

# 任务：
# 1. 找到 ARP 请求包（广播）
# 2. 找到 ARP 响应包（单播）
# 3. 查看本机 ARP 缓存
ip neigh
```

### 练习5：SSH 隧道实战

```bash
# 假设有一台远程服务器 remote-server

# ① 本地端口转发
ssh -L 8888:localhost:80 user@remote-server
# 然后在本地访问 http://localhost:8888 = 访问远程的 80 端口

# ② 动态端口转发
ssh -D 1080 user@remote-server
# 配置浏览器 SOCKS5 代理 127.0.0.1:1080
# 所有流量通过远程服务器出去

# ③ 验证
curl --socks5 127.0.0.1:1080 http://ifconfig.me
# 应该显示远程服务器的公网 IP
```

---

## 本节小结

学完本章你应该掌握：

- [x] DNS 解析的完整流程（递归+迭代）
- [x] DNS 记录类型及其用途
- [x] 使用 dig/nslookup/host 进行 DNS 查询
- [x] IPv4 地址分类和私有地址范围
- [x] CIDR 子网划分和计算
- [x] IP 路由原理和路由表
- [x] NAT 的作用和类型
- [x] ARP 协议工作原理
- [x] ICMP 与 ping/traceroute
- [x] VPN/隧道的基本概念和 SSH 隧道

### 下一步

→ 继续学习 [04-Nginx反向代理与CDN.md](./04-Nginx反向代理与CDN.md)，进入 Web 服务器和反向代理的实践。
