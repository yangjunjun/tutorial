# 补充 - HTTP/1.1 分块传输（Chunked Transfer Encoding）

> 针对 `01-HTTP协议与curl基础.md` 中「HTTP/1.1 → 分块传输」一条的深入说明。

---

## 1. 解决什么问题

HTTP 响应通常靠 `Content-Length` 头部告诉客户端消息体有多大，客户端读到指定字节数即认为响应完成。

但在很多场景下，**服务器在开始发送时并不知道消息体的总大小**：

- 动态生成的页面（如 PHP/Node.js 流式渲染）
- 实时数据推送（如日志流、SSE）
- 大文件边读边传，不想全部加载到内存

没有 `Content-Length`，客户端就不知道响应何时结束——**分块传输**就是为了解决这个问题。

---

## 2. 工作原理

服务器用 `Transfer-Encoding: chunked` 替代 `Content-Length`，将消息体拆分为一系列**分块（chunk）**，每个分块前附带**该分块的十六进制长度**，最后以一个**长度为 0 的分块**标记结束。

### 报文格式

```
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Content-Type: text/plain

4\r\n        ← 第1块长度（十六进制，4字节）
Wiki\r\n     ← 第1块数据
5\r\n        ← 第2块长度（5字节）
pedia\r\n    ← 第2块数据
0\r\n        ← 结束标记（长度为0）
\r\n         ← 尾部CRLF
```

### 分块结构

```
chunk          = chunk-size [ chunk-ext ] CRLF chunk-data CRLF
chunk-size     = 1*HEXDIG              ← 十六进制数字
chunk-ext      = *( ";" chunk-ext-name [ "=" chunk-ext-val ] )
chunk-data     = chunk-size(OCTET)     ← 实际数据，长度由 chunk-size 决定
trailer        = *( header-field CRLF ) ← 可选的 trailer 头部
```

每个分块独立，接收方按顺序拼接 `chunk-data` 即可还原完整消息体。

---

## 3. 示例：用 curl 观察

```
curl -v http://example.com/stream 2>&1 | head -20
```

响应头中会看到：

```
< HTTP/1.1 200 OK
< Transfer-Encoding: chunked
```

没有 `Content-Length`，curl 边读边输出，直到收到 `0\r\n` 结束标记。

---

## 4. 分块扩展（Chunk Extensions）

每个分块的长度后可附加扩展字段，用 `;` 分隔，语义由应用自定义：

```
4;name=value\r\n
Wiki\r\n
```

扩展字段不改变数据内容，主要用于中间代理的调试或路由信息，实践中很少使用。

---

## 5. Trailer 头部

分块传输允许在最后一个 `0\r\n` 之后追加**尾部头部（trailer）**，用于在数据流结束后补充元信息：

```
0\r\n
X-Checksum: abc123\r\n    ← trailer
\r\n
```

需要提前用 `Trailer` 头部声明：

```
Trailer: X-Checksum
Transfer-Encoding: chunked
```

常见用途：在流式传输完成后发送校验和、签名等。

---

## 6. 与 Content-Length 的关系

| | Content-Length | Transfer-Encoding: chunked |
|---|---------------|---------------------------|
| 适用场景 | 已知消息体总大小 | 未知总大小，边生成边发送 |
| 可否共存 | **不可**（RFC 7230 禁止同时出现） | 不可 |
| 客户端判断结束 | 读到指定字节数 | 读到 `0\r\n` 结束标记 |
| 缓冲 | 需全部生成后才能发送 | 可流式发送，降低首字节延迟 |

> 如果两者同时出现，RFC 7230 规定 `Transfer-Encoding: chunked` 优先，忽略 `Content-Length`。

---

## 7. 实际应用场景

| 场景 | 说明 |
|------|------|
| 动态页面渲染 | 服务端边渲染边输出，用户更早看到内容（首字节时间短） |
| Server-Sent Events (SSE) | `text/event-stream`，分块持续推送事件 |
| 大文件流式传输 | 边读文件边发送，避免一次性加载到内存 |
| 日志/数据流 | 持续输出日志、监控数据等无终止边界的数据 |
| 反向代理缓冲控制 | Nginx 可配置 `proxy_buffering off` 透传分块，实现上游流式响应 |

---

## 8. 注意事项

- **请求也可以分块**：客户端上传时如果不知道总大小，同样可以使用 `Transfer-Encoding: chunked`（如流式上传）
- **HTTP/2 不需要分块**：HTTP/2 在二进制帧层有自己的长度字段（DATA frame + END_STREAM），分块传输编码被移除
- **不兼容 Content-Encoding 的某些场景**：如果同时用了 `Content-Encoding: gzip`，分块是对压缩后的字节流分块，不是对原始数据分块
