# 补充 - HTTP/1.x 的文本编码详解

> 针对 `01-HTTP协议与curl基础.md` 中「基于文本 | HTTP/1.x 是纯文本协议，可读性强」一条的深入说明。

---

## 1. 协议语法层：ASCII（7-bit）

HTTP/1.x 的协议框架（请求行、状态行、头部字段）基于 **ASCII（US-ASCII，7-bit）**，而非 UTF-8。

### 各协议元素允许的字符集

| 部分 | 允许的字符集 |
|------|-------------|
| Method | `A-Z`（大写字母）token |
| URI | ASCII 可见字符，非 ASCII 需百分号编码（`%XX`） |
| Header field name | token：`!#$%&'*+-.^_` + 数字 + 字母 |
| Header field value | **可见 ASCII 字符（VCHAR, 0x20-0x7E）** + 空格(SP) + 水平制表符(HT) |
| 分隔符 | CRLF（`\r\n`）、SP（0x20）|

> RFC 7230 明确定义：
> ```
> field-value    = *( field-content / obs-fold )
> field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
> field-vchar    = VCHAR / obs-text
> ```
>
> 其中 `obs-text`（0x80-0xFF）虽被 RFC 标注为"过时文本"，解析器通常容忍，但语义未定义——这是各种乱码/兼容性问题的根源。

---

## 2. 消息体（Message Body）：任意字节流

消息体是**任意字节流**，编码由头部声明，不受 ASCII 限制：

```
Content-Type: text/html; charset=utf-8
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip
```

可以承载 UTF-8、UTF-16、二进制图片、压缩数据等任何内容。

---

## 3. 非 ASCII 文本如何出现在头部

由于头部本身只允许 ASCII，非 ASCII 值需编码：

- **RFC 5987 / 8187**：`Content-Disposition: attachment; filename*=UTF-8''%E2%82%AC%20rates`
- **RFC 2047（MIME）**：`=?UTF-8?B?...?=`（HTTP 中不推荐，但部分实现使用）

---

## 4. 总结

| 层次 | 编码/字符集 | 说明 |
|------|------------|------|
| 协议语法层 | ASCII（7-bit） | 请求行、状态行、头部字段名/值，CRLF 分隔 |
| 头部值 | 可见 ASCII + SP/HT | `obs-text`（0x80-0xFF）实际可传但语义不保证 |
| 消息体 | 任意字节 | 编码由 Content-Type / Content-Encoding 描述 |

所以 HTTP/1.x 所谓"纯文本、可读性强"指的是其**协议帧用 ASCII 文本表达**，使得可以用 `telnet`/`curl -v` 直接阅读和构造——但传输的**载荷本身是二进制安全**的，能承载任何编码的内容。
