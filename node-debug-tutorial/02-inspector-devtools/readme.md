# Chrome DevTools Inspector 调试指南

> 掌握 Node.js Inspector 与 Chrome DevTools 的高级调试技巧。

---

## 目录

1. [node --inspect 与 node --inspect-brk](#1-node---inspect-与-node---inspect-brk)
2. [连接 Chrome DevTools](#2-连接-chrome-devtools)
3. [Sources 面板详解](#3-sources-面板详解)
4. [Watch 表达式、Scope 变量、Call Stack](#4-watch-表达式scope-变量call-stack)
5. [条件断点（Conditional Breakpoints）](#5-条件断点conditional-breakpoints)
6. [Logpoint（记录点）](#6-logpoint记录点)
7. [Blackbox Scripts（忽略库代码）](#7-blackbox-scripts忽略库代码)
8. [实战：调试 HTTP 服务器](#8-实战调试-http-服务器)
9. [运行方式](#运行方式)

---

## 1. node --inspect 与 node --inspect-brk

Node.js 内置了 V8 Inspector 调试协议，可以通过 Chrome DevTools 进行可视化调试。

### `--inspect`

```bash
node --inspect app.js
```

- 启动后程序**立即开始运行**
- 在终端输出类似：`Debugger listening on ws://127.0.0.1:9229/...`
- 需要手动设置断点或在代码中写 `debugger;` 才会暂停

### `--inspect-brk`

```bash
node --inspect-brk app.js
```

- 启动后程序在**第一行就暂停**，等待调试器连接
- 适合调试启动阶段的问题（如模块加载、初始化逻辑）
- 连接后需要手动按 "Resume" 继续执行

### 端口自定义

```bash
# 默认端口 9229，可以指定其他端口
node --inspect=9230 app.js
node --inspect-brk=9230 app.js
```

### 对比总结

| 特性 | `--inspect` | `--inspect-brk` |
|------|-------------|-----------------|
| 启动后行为 | 立即运行 | 第一行暂停 |
| 适用场景 | 运行时调试 | 启动阶段调试 |
| 需要 debugger; | 是（或手动断点） | 否（自动暂停） |

---

## 2. 连接 Chrome DevTools

### 方法一：通过 chrome://inspect（推荐）

1. 启动 `node --inspect app.js`
2. 打开 Chrome 浏览器，地址栏输入 `chrome://inspect`
3. 在 "Remote Target" 中找到你的 Node.js 进程
4. 点击 "inspect" 链接，打开 DevTools

### 方法二：直接复制 WebSocket URL

1. 启动后终端会输出完整的 WebSocket URL
2. 在 Chrome 中直接打开该 URL（不常用，但可用于远程调试）

### 方法三：使用 VS Code

1. 在 VS Code 中按 F5 或配置 `launch.json`
2. 使用 `"type": "node"` 和 `"request": "attach"` 连接到 inspector

---

## 3. Sources 面板详解

Sources 面板是调试的核心界面，包含以下区域：

### 文件树（左侧）
- 显示所有加载的脚本文件
- 按域名/路径分组（如 `localhost:9229`）
- 可以按 `Ctrl+P`（Mac: `Cmd+P`）快速打开文件

### 代码编辑器（中间）
- 显示源代码，语法高亮
- 点击行号设置断点（红色圆点）
- 当前执行行高亮显示（蓝色/绿色）

### 调试控制栏（顶部）
| 按钮 | 快捷键 | 功能 |
|------|--------|------|
| Resume/Pause | F8 | 继续执行 / 暂停 |
| Step Over | F10 | 执行下一行（跳过函数） |
| Step Into | F11 | 进入函数内部 |
| Step Out | Shift+F11 | 跳出当前函数 |
| Deactivate | - | 禁用所有断点 |
| Pause on Exceptions | - | 异常时自动暂停 |

### 右侧面板
- **Watch**: 监控自定义表达式
- **Call Stack**: 函数调用栈
- **Scope**: 变量作用域（Local, Closure, Global）
- **Breakpoints**: 所有断点列表

---

## 4. Watch 表达式、Scope 变量、Call Stack

### Watch 表达式

在 Watch 面板中添加表达式，每次暂停时自动计算：

- `req.url` — 监控当前请求路径
- `JSON.stringify(data)` — 监控数据变化
- `items.length` — 监控数组长度
- `typeof result` — 检查变量类型

### Scope 变量

显示当前暂停位置的所有可见变量：

- **Local**: 当前函数的局部变量
- **Closure**: 闭包捕获的外部变量
- **Global**: 全局变量（通常折叠，内容很多）

> **技巧**：在 Scope 面板中可以直接修改变量值，用于测试不同场景。

### Call Stack（调用栈）

显示当前暂停位置的完整函数调用链：

- 顶部是当前执行的函数
- 底部是入口点（如 `Module._compile`）
- 点击栈帧可以切换到对应的上下文，查看该层的局部变量

> **实战技巧**：当发现某个值不对时，沿着调用栈向上回溯，找到错误传入的源头。

---

## 5. 条件断点（Conditional Breakpoints）

条件断点只在满足特定条件时才暂停执行，避免在不相关的调用中反复中断。

### 设置方法

1. 在代码行号上**右键**
2. 选择 "Add conditional breakpoint"
3. 输入条件表达式

### 常用条件示例

```javascript
// 只在特定请求路径时中断
req.url === '/api/users'

// 只在变量达到某个值时中断
i === 100

// 只在数组长度异常时中断
items.length > 1000

// 只在特定用户请求时中断
req.headers['x-user-id'] === 'user-42'
```

### 应用场景

- 循环中只关心某次迭代
- HTTP 服务器中只关心特定请求
- 只在错误条件出现时暂停

---

## 6. Logpoint（记录点）

Logpoint 是**不中断执行**的断点，只在控制台输出信息。适合在不打断程序流程的情况下收集调试信息。

### 设置方法

1. 在代码行号上**右键**
2. 选择 "Add logpoint"
3. 输入要打印的消息（使用与 `console.log()` 相同的语法，多个参数用逗号分隔）

### 示例

```
// 在循环中记录每次迭代的值
"Processing item", i, ":", items[i].name

// 记录函数参数
"handleOrder called with orderId=", orderId, "userId=", userId

// 记录条件判断结果
"Condition check: price > 100 =", price > 100, "price =", price
```

每个 Logpoint 的输入会被当作 `console.log()` 的参数列表处理，因此：

- 字符串字面量需要用引号包裹
- 变量、表达式、对象直接写出即可
- 多个参数之间用逗号分隔
- 也可以用 `+` 拼接字符串，例如 `"price is " + price`

### 与 console.log 的区别

| 特性 | console.log | Logpoint |
|------|-------------|----------|
| 需要修改代码 | 是 | 否 |
| 部署后忘记删除 | 常见风险 | 无风险（不修改源码） |
| 调试后清理 | 需要手动删除 | 关闭 DevTools 即消失 |

---

## 7. Blackbox Scripts（忽略库代码）

Blackbox 功能让你在调试时**跳过第三方库代码**，只关注自己的业务逻辑。

### 设置方法

1. 在 Call Stack 中看到库代码的栈帧
2. 右键该文件，选择 "Blackbox script"
3. 之后 Step Into/Step Over 会自动跳过该文件中的代码

### 也可以通过设置批量 Blackbox

1. 打开 DevTools Settings（齿轮图标或 `?`）
2. 进入 "Blackboxing" 面板
3. 添加正则表达式模式，例如：
   - `node_modules/.*` — 忽略所有 node_modules
   - `internal/.*` — 忽略 Node.js 内部模块

### 适用场景

- 调试 Express/Koa 应用时跳过框架代码
- 调试时跳过 lodash、moment 等工具库
- 专注于自己的业务逻辑

---

## 8. 实战：调试 HTTP 服务器

本教程附带了一个完整的 HTTP 服务器示例：

### 文件结构

```
02-inspector-devtools/
├── app.js              # HTTP 服务器主文件
├── data-processor.js   # 数据处理模块
├── exercise.md         # 调试练习步骤
└── readme.md           # 本文档
```

### 服务器路由

| 路径 | 方法 | 功能 |
|------|------|------|
| `/` | GET | 首页，返回欢迎信息 |
| `/api/users` | GET | 获取用户列表 |
| `/api/users/sorted` | GET | 获取排序后的用户列表 |
| `/api/stats` | GET | 获取统计信息 |
| `/api/search` | GET | 搜索用户（带查询参数） |
| `/api/echo` | POST | 回显 POST 请求体 |

### 启动方式

```bash
# 普通运行
node app.js

# 调试模式（运行后连接 DevTools）
node --inspect app.js

# 调试模式（在第一行暂停）
node --inspect-brk app.js
```

### 测试请求

```bash
# 使用 curl 测试各个路由
curl http://localhost:3000/
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/sorted
curl http://localhost:3000/api/stats
curl "http://localhost:3000/api/search?name=张&minAge=25"
curl -X POST http://localhost:3000/api/echo -H "Content-Type: application/json" -d '{"hello":"world"}'
```

---

## 运行方式

```bash
# 1. 进入项目目录
cd 02-inspector-devtools

# 2. 启动服务器（调试模式）
node --inspect app.js

# 3. 打开 Chrome，访问 chrome://inspect
# 4. 点击 "inspect" 连接到 Node.js 进程
# 5. 在另一个终端或浏览器中发送请求测试

# 或者使用非调试模式运行
node app.js
# 然后在浏览器中访问 http://localhost:3000 查看效果
```

### 预期输出

启动服务器后，终端会显示：
```
🚀 服务器已启动: http://localhost:3000
📡 调试模式: 使用 chrome://inspect 连接
```

访问各个路由会返回 JSON 格式的响应。部分路由包含故意的 bug，详见 `exercise.md` 中的练习步骤。
