# 补充 - TCP 三次握手详解

> 针对 `02-TCP-IP基础与抓包分析.md` 中「TCP 三次握手（建立连接）」的深入说明。

---

## 1. 为什么需要握手

TCP 是**面向连接**的可靠传输协议。在传输数据之前，双方必须先**建立连接**——这里的"连接"并非物理链路，而是双方各自维护的一组**状态数据**：

- 序列号（seq）：保证数据按序到达、可确认、可重传
- 接收窗口（rwnd）：实现流量控制
- MSS（最大报文段）：协商每个报文段的最大数据长度
- 拥塞窗口（cwnd）：发送方拥塞控制（非握手直接协商，但握手后开始探测）

**握手的核心目的**：双方互相确认对方的收发能力，并同步初始序列号（ISN）。

---

## 2. 三次握手详细过程

```
客户端 (Client)                                    服务器 (Server)
状态: CLOSED                                       状态: LISTEN
    │                                                  │
    │  ① SYN  seq=x, (可选)MSS,WS,SACK_PERM            │
    │ ─────────────────────────────────────────────→   │
    │  状态 → SYN_SENT                                 │  状态 → SYN_RCVD
    │                                                  │
    │  ② SYN+ACK  seq=y, ack=x+1, (可选)MSS,WS,SACK    │
    │ ←─────────────────────────────────────────────   │
    │                                                  │
    │  ③ ACK  seq=x+1, ack=y+1                         │
    │ ─────────────────────────────────────────────→   │
    │  状态 → ESTABLISHED                               │  状态 → ESTABLISHED
    │                                                  │
    │  ════════════ 双向数据传输 ════════════           │
```

### 逐包详解

#### 第一次握手：客户端 → 服务器 SYN

| 字段 | 值 | 说明 |
|------|-----|------|
| 标志位 | `SYN=1` | 表示请求建立连接 |
| seq（序列号） | `x` | 客户端的初始序列号（ISN），随机生成，非 0 |
| ack | 无效 | SYN 报文不携带确认号 |
| 数据 | 无 | SYN 报文不携带应用数据（可携带 TCP 选项） |

**客户端状态变化**：`CLOSED → SYN_SENT`

> ISN 为什么不从 0 开始？防止旧连接的延迟报文被误认为新连接的数据。ISN 随机算法见 RFC 6528，基于时钟 + 哈希，增加可预测难度以防 TCP 序列号攻击。

#### 第二次握手：服务器 → 客户端 SYN+ACK

| 字段 | 值 | 说明 |
|------|-----|------|
| 标志位 | `SYN=1, ACK=1` | 既确认客户端的 SYN，又发起自己的 SYN |
| seq（序列号） | `y` | 服务器的初始序列号（ISN），同样随机生成 |
| ack（确认号） | `x+1` | 告诉客户端："你发的 seq=x 的 SYN 我收到了，期望你下一次发 seq=x+1" |
| 数据 | 无 | 不携带应用数据（可携带 TCP 选项） |

**服务器状态变化**：`LISTEN → SYN_RCVD`

#### 第三次握手：客户端 → 服务器 ACK

| 字段 | 值 | 说明 |
|------|-----|------|
| 标志位 | `ACK=1` | 确认服务器的 SYN |
| seq | `x+1` | 因为 SYN 消耗了一个序列号，所以这里是 x+1 |
| ack | `y+1` | 确认服务器的 SYN："你的 seq=y 的 SYN 收到了，期望下一次发 seq=y+1" |
| 数据 | **可携带** | 第三次握手的 ACK 报文**可以携带应用数据** |

**双方状态变化**：
- 客户端：`SYN_SENT → ESTABLISHED`
- 服务器：`SYN_RCVD → ESTABLISHED`

> **SYN 消耗序列号**：SYN 和 FIN 各消耗一个序列号，虽然它们不携带数据。所以 `ack = 对方seq + 1`。而纯 ACK 不消耗序列号。

---

## 3. 为什么是三次，不是两次或四次

### 核心原因：确认双方的收发能力

| 握手次数 | 客户端知道的 | 服务器知道的 |
|---------|------------|------------|
| 第1次后 | — | 客户端能**发送** |
| 第2次后 | 服务器能**发送+接收** | 客户端能**发送** |
| 第3次后 | 服务器能**发送+接收** | 客户端能**接收** ← 关键！ |

**两次不够**：如果只有两次，服务器发出 SYN+ACK 后就进入 ESTABLISHED，但它不知道客户端是否收到了——如果客户端的 SYN 是旧的重传报文（网络延迟到达），服务器会错误地建立一个无用连接，**浪费资源**。

### 经典场景：两次握手的致命问题

```
场景：客户端发出旧 SYN（延迟到达），然后取消连接

1. 旧SYN → 服务器            （服务器以为客户端要连）
2. 服务器 → SYN+ACK → 客户端  （服务器进入 ESTABLISHED，分配资源）
3. 客户端收到后发现不对，发 RST 拒绝

如果有第三次握手：
   服务器收到 RST → 关闭连接，释放资源
   
如果只有两次握手（服务器发完 SYN+ACK 就 ESTABLISHED）：
   服务器一直等数据 → 资源泄漏
```

### 四次多余

理论上可以四步（SYN → ACK → SYN → ACK），但服务器可以把 ACK 和自己的 SYN 合并为一个 `SYN+ACK`，所以三次足够。

---

## 4. TCP 选项协商（握手时附带）

三次握手不只是同步序列号，还在 SYN 报文中协商关键 TCP 选项：

| 选项 | 方向 | 说明 |
|------|------|------|
| **MSS（Maximum Segment Size）** | 双向 | 协商每个报文段最大数据长度，常见值 1460（以太网 MTU 1500 - IP头20 - TCP头20） |
| **Window Scale（WS）** | 双向 | 窗口缩放因子，突破 16 位窗口最大 64KB 的限制，可扩展到 1GB |
| **SACK Permitted** | 双向 | 允许选择性确认（Selective ACK），提高丢包恢复效率 |
| **Timestamps** | 双向 | 发送时间戳 + 接收回显，用于 RTT 测量和 PAWS（防回绕序列号） |

```
# 用 tcpdump 观察握手时的选项协商
tcpdump -i any -n 'tcp[tcpflags] & tcp-syn != 0' -S

# 输出示例：
# IP 10.0.0.1.54321 > 10.0.0.2.80: Flags [S], seq 1234567890,
#   win 64240, options [mss 1460,nop,wscale 7,sackOK,TS val 123 ecr 0], length 0
#                                                          ↑ 选项
```

---

## 5. 握手过程中的资源分配

```
                客户端                        服务器
                  │                             │
  SYN ──────────→ │ ← 分配发送缓冲区              │ LISTEN
                  │                             │
                  │ ←── SYN+ACK ─────────────── │ ← 分配 TCB（传输控制块）
                  │                             │    放入半连接队列（SYN Queue）
  ACK ──────────→ │                             │ ← 移入全连接队列（Accept Queue）
                  │                             │    等待 accept() 取走
```

### 两个队列

| 队列 | 别名 | 存放时机 | 容量 |
|------|------|---------|------|
| **半连接队列** | SYN Queue | 收到 SYN，回 SYN+ACK 后 | `net.ipv4.tcp_max_syn_backlog` |
| **全连接队列** | Accept Queue | 收到第三次 ACK 后，等待 `accept()` | `somaxconn`（系统级）+ `backlog`（listen 参数）取较小值 |

```bash
# 查看队列溢出统计
netstat -s | grep -i "overflowed\|dropped"

# 调整队列大小
sysctl -w net.ipv4.tcp_max_syn_backlog=8192   # 半连接队列
sysctl -w net.core.somaxconn=4096              # 全连接队列
```

> 如果全连接队列满了，第三次握手的 ACK 会被丢弃，服务器重传 SYN+ACK（由 `tcp_synack_retries` 控制，默认 5 次）。

---

## 6. 状态机详解

### 客户端状态流转

```
CLOSED ──send SYN──→ SYN_SENT ──recv SYN+ACK, send ACK──→ ESTABLISHED
```

### 服务器状态流转

```
LISTEN ──recv SYN, send SYN+ACK──→ SYN_RCVD ──recv ACK──→ ESTABLISHED
```

### 异常状态

| 状态 | 说明 |
|------|------|
| `SYN_SENT` | 发出 SYN 未收到响应，超时重传（`tcp_syn_retries`，默认 6 次），指数退避：1→2→4→8... 秒 |
| `SYN_RCVD` | 发出 SYN+ACK 未收到 ACK，超时重传 SYN+ACK（`tcp_synack_retries`，默认 5 次） |

---

## 7. 用 tcpdump / Wireshark 观察三次握手

### tcpdump

```bash
# 抓取指定端口的握手包
tcpdump -i any -n -S 'tcp port 80 and (tcp[tcpflags] & tcp-syn != 0)'

# 输出示例：
# 10.0.0.1.54321 > 10.0.0.2.80: Flags [S], seq 1234567890, win 64240, length 0
# 10.0.0.2.80 > 10.0.0.1.54321: Flags [S.], seq 9876543210, ack 1234567891, win 64240, length 0
# 10.0.0.1.54321 > 10.0.0.2.80: Flags [.], seq 1234567891, ack 9876543211, win 502, length 0

# [S]  = SYN          （第一次握手）
# [S.] = SYN+ACK      （第二次握手）
# [.]  = ACK          （第三次握手，可能携带数据）
```

### Wireshark 过滤

```
# 只看三次握手
tcp.flags.syn == 1 || (tcp.flags.ack == 1 && tcp.len == 0 && tcp.seq == 1)
```

---

## 8. 常见问题

### Q1：第三次握手可以携带数据吗？

**可以。** RFC 793 允许第三次握手的 ACK 报文携带应用数据。但实践中多数实现不携带，而是握手后单独发数据。如果携带数据，该报文的 seq 仍是 `x+1`，后续报文 seq 为 `x+1+数据长度`。

### Q2：ISN 为什么要随机？

- **防止旧连接延迟报文干扰**：如果 ISN 可预测，攻击者可以构造序列号注入数据（TCP 注入攻击）
- RFC 6528 建议基于 4 微秒时钟 + 密码学哈希（如 MD5）生成，每 4 微秒加 1

### Q3：握手失败会怎样？

- **SYN 无响应**：客户端重传 SYN，指数退避（1s→2s→4s→8s→16s→32s），`tcp_syn_retries`（默认 6 次）后放弃，返回 `ETIMEDOUT`（共约 63 秒）
- **SYN+ACK 无响应**：服务器重传 SYN+ACK，`tcp_synack_retries`（默认 5 次）后放弃，删除半连接
- **被拒绝**：服务器端口未监听 → 回复 `RST`；防火墙 DROP → 表现为超时；REJECT → 回复 `RST`/ICMP

### Q4：SYN Flood 攻击与防御

攻击者大量发 SYN 但不回第三次 ACK → 半连接队列填满 → 正常连接无法建立。

```bash
# 防御措施
sysctl -w net.ipv4.tcp_syncookies=1       # SYN Cookie：不分配资源，ISN 编码连接信息
sysctl -w net.ipv4.tcp_max_syn_backlog=8192  # 增大队列
sysctl -w net.ipv4.tcp_synack_retries=2    # 减少重传次数，加速丢弃
```

---

## 9. 一图总结

```
        客户端                                         服务器
    CLOSED                                          LISTEN
        │                                              │
        │  ① SYN seq=x, MSS,WS,SACK,TS                 │
        │ ─────────────────────────────────────────→   │
    SYN_SENT                                       SYN_RCVD
        │  (半连接队列 +1)                              │
        │                                              │
        │  ② SYN+ACK seq=y ack=x+1, MSS,WS,SACK,TS     │
        │ ←─────────────────────────────────────────   │
        │                                              │
        │  ③ ACK seq=x+1 ack=y+1 (可携带数据)          │
        │ ─────────────────────────────────────────→   │
    ESTABLISHED  ←                              →  ESTABLISHED
        │  (全连接队列 +1)                              │
        │                                              │
        │  ══════════ 数据传输 ══════════                │
        │  seq=x+1+datalen, ack=y+1                     │
        │ ←────────────────────────────────────────→    │
```
