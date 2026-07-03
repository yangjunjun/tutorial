# Chrome DevTools 调试练习

> 通过实际操作学习 Chrome DevTools 的高级调试功能。

---

## 前置准备

确保 Node.js 已安装，然后在项目目录下启动服务器：

```bash
cd 02-inspector-devtools
node --inspect app.js
```

打开 Chrome 浏览器，访问 `chrome://inspect`，点击 "inspect" 连接到 Node.js 进程。

---

## 练习 1：启动 Inspector 并连接到 Chrome DevTools

### 目标
成功连接 DevTools 并熟悉界面。

### 步骤

1. 在终端运行 `node --inspect app.js`
2. 记录终端输出的 WebSocket URL（类似 `ws://127.0.0.1:9229/xxxx-xxxx`）
3. 打开 Chrome，地址栏输入 `chrome://inspect`
4. 在 "Remote Target" 区域找到 `app.js`
5. 点击 "inspect" 链接
6. DevTools 窗口打开后，切换到 **Sources** 面板
7. 在左侧文件树中找到 `app.js` 和 `data-processor.js`

### 验证
- DevTools 的 Sources 面板中能看到项目文件
- Console 面板中能看到服务器启动日志

### 额外尝试

- 关闭 DevTools，改用 `node --inspect-brk app.js` 启动
- 观察：程序在第一行暂停，需要点击 "Resume" 才能继续
- 对比 `--inspect` 和 `--inspect-brk` 的行为差异

---

## 练习 2：在特定路由设置断点

### 目标
学会设置断点并在请求到来时暂停程序。

### 步骤

1. 在 Sources 面板打开 `app.js`
2. 找到 `routeRequest` 函数（大约在第 155 行附近）
3. 在 `console.log(...)` 这一行的行号上点击，设置断点（出现红色圆点）
4. 在浏览器中访问 `http://localhost:3000/api/users`
5. 程序应该在断点处暂停
6. 观察：
   - 当前行高亮显示
   - 右侧 Scope 面板中可以看到 `req`、`res`、`pathname` 等变量
   - 展开 `req` 对象查看请求详情

### 进阶

- 在 `handleGetUsers` 函数的 `sendJSON` 调用处设置断点
- 发送请求后，观察 `users` 数组的内容
- 尝试在 Scope 面板中修改 `users` 数组，看看响应会如何变化

---

## 练习 3：使用 Watch 表达式监控变量

### 目标
使用 Watch 面板实时监控关键变量的值。

### 步骤

1. 在 `app.js` 的 `routeRequest` 函数中设置断点
2. 在右侧 **Watch** 面板点击 "+" 添加以下表达式：
   - `pathname`
   - `method`
   - `req.url`
   - `req.headers['user-agent']`
3. 依次发送以下请求，观察 Watch 值的变化：

```bash
# 请求 1: 首页
curl http://localhost:3000/

# 请求 2: 用户列表
curl http://localhost:3000/api/users

# 请求 3: 带参数的搜索
curl "http://localhost:3000/api/search?name=张&minAge=25"
```

4. 每次请求后，在 Watch 面板中观察这些变量的值
5. 点击 "Resume" (F8) 让程序继续处理请求

### 进阶 Watch 表达式

尝试添加以下表达式：
- `JSON.stringify(req.headers)` — 查看所有请求头
- `Date.now()` — 请求时间戳
- `process.memoryUsage().heapUsed / 1024 / 1024` — 当前内存使用（MB）

---

## 练习 4：使用条件断点只在特定请求时中断

### 目标
学会设置条件断点，避免在不相关的请求上中断。

### 场景
服务器处理大量请求时，你只关心对 `/api/search` 路由的请求。

### 步骤

1. **删除**之前的普通断点
2. 在 `routeRequest` 函数的 `console.log(...)` 行上**右键**
3. 选择 **"Add conditional breakpoint"**
4. 输入条件：`pathname === '/api/search'`
5. 按 Enter 确认

现在发送多个请求：

```bash
# 这些请求不会触发断点
curl http://localhost:3000/
curl http://localhost:3000/api/users
curl http://localhost:3000/api/stats

# 这个请求会触发断点
curl "http://localhost:3000/api/search?department=技术部"
```

### 观察

- 前三个请求正常处理，不会中断
- 只有搜索请求才会使程序在断点处暂停
- 暂停后检查 `filters` 对象的内容

### 进阶条件断点

试试更复杂的条件：
- `pathname.includes('user')` — 所有包含 "user" 的路径
- `method === 'POST'` — 只在 POST 请求时中断
- `req.headers['user-agent'] && req.headers['user-agent'].includes('curl')` — 只在 curl 请求时中断

---

## 练习 5：使用 Call Stack 追踪 Bug 来源

### 目标
通过调用栈回溯，找到 bug 的源头函数。

### 场景
访问 `/api/users/sorted?sortBy=score&order=desc` 时，返回的排序结果不正确（不是降序）。

### 步骤

1. 在 `data-processor.js` 的 `sortUsers` 函数内部设置断点（在 `sorted.sort(...)` 的回调函数内）
2. 发送请求：
   ```bash
   curl "http://localhost:3000/api/users/sorted?sortBy=score&order=desc"
   ```
3. 程序暂停后，观察 **Call Stack** 面板：
   ```
   sortUsers            ← 当前暂停位置
   handleGetSortedUsers ← 调用 sortUsers 的路由处理函数
   routeRequest         ← 路由分发函数
   (anonymous)          ← http.createServer 的回调
   ```
4. 点击 Call Stack 中的 `handleGetSortedUsers` 帧
   - 查看该层的 Scope 变量
   - 确认 `sortBy` 和 `order` 参数是否正确传递
5. 点击 Call Stack 中的 `routeRequest` 帧
   - 查看 `parsedUrl.query` 对象
   - 确认查询参数解析是否正确

### 调试排序 Bug

在 `sortUsers` 函数的 sort 回调中：

1. 添加 Watch 表达式：`valA`、`valB`、`order`
2. 用 Step Over (F10) 逐步执行比较逻辑
3. 观察：当 `order === 'desc'` 时，返回值 `valA - valB` 是升序还是降序？
4. 在 Scope 面板中修改 `order` 的值为 `'asc'`，观察结果变化

### 追踪另一个 Bug

1. 发送请求到 `/api/stats`：
   ```bash
   curl http://localhost:3000/api/stats
   ```
2. 在 `handleGetStats` 函数中设置断点
3. 观察 `avgScore` 的值和类型
4. 添加 Watch：`avgScore == '85.0'` 和 `avgScore === '85.0'`
5. 对比两个表达式的结果，理解 `==` 和 `===` 的区别

---

## 练习 6（综合）：调试 POST 请求解析 Bug

### 目标
综合运用所有调试技巧，定位 JSON 解析失败时的 bug。

### 步骤

1. 在 `parseBody` 函数的 `catch` 块中设置断点
2. 发送一个格式错误的 JSON：
   ```bash
   curl -X POST http://localhost:3000/api/echo \
     -H "Content-Type: application/json" \
     -d '{invalid json}'
   ```
3. 程序在 catch 块暂停后：
   - 查看 `e.message`（解析错误信息）
   - 查看 `body`（原始请求体）
4. 用 Step Over 继续执行，观察 `resolve` 返回了什么
5. 追踪到 `handleEcho` 函数：
   - 检查 `data` 对象的 `_parseError` 属性
   - 思考：为什么错误的请求也被当作成功处理了？

### 修复建议

在 `handleEcho` 中添加错误检查：
```javascript
if (data._parseError) {
  sendError(res, 400, 'JSON 解析失败: ' + data.message);
  return;
}
```

---

## 练习 7（进阶）：使用 Logpoint 收集调试信息

### 目标
使用 Logpoint 在不中断执行的情况下收集日志。

### 步骤

1. 删除所有断点
2. 在 `routeRequest` 函数的 `console.log(...)` 行上**右键**
3. 选择 **"Add logpoint"**
4. 输入：`请求到达: {method} {pathname}`
5. 快速发送多个请求：
   ```bash
   curl http://localhost:3000/ &
   curl http://localhost:3000/api/users &
   curl http://localhost:3000/api/stats &
   ```
6. 在 Console 面板中查看 Logpoint 输出
7. 注意：程序没有暂停，所有请求都正常处理了

### Logpoint 高级用法

- 条件 Logpoint：右键 → "Add conditional breakpoint" → 勾选 "Log" 选项
- 在 `sortUsers` 的 sort 回调中添加 Logpoint：`比较: {valA} vs {valB}`
- 观察每次排序比较的过程，不中断执行

---

## 调试技巧速查表

| 场景 | 推荐工具 | 操作 |
|------|----------|------|
| 想看某个变量的值 | Scope 面板 | 暂停后直接查看 |
| 每次暂停都要看某个表达式 | Watch | 添加 Watch 表达式 |
| 只想在特定条件时暂停 | 条件断点 | 右键行号 → Add conditional breakpoint |
| 不想中断但想记录信息 | Logpoint | 右键行号 → Add logpoint |
| 不知道 bug 从哪来 | Call Stack | 沿栈帧向上回溯 |
| 不想看库代码 | Blackbox | 右键文件 → Blackbox script |
| 调试启动阶段 | `--inspect-brk` | 第一行暂停 |
| 调试运行时 | `--inspect` + `debugger;` | 代码中标记断点 |

---

## 答案提示

> 以下是各 Bug 的简要提示，建议先自己调试发现再查看。

<details>
<summary>Bug 1: JSON 解析错误未正确传播</summary>
`parseBody` 函数中，`catch` 块用了 `resolve` 而不是 `reject`，导致解析错误被当作成功数据处理。`handleEcho` 也没有检查 `_parseError` 标记。
</details>

<details>
<summary>Bug 2: == 与 === 的区别</summary>
`handleGetStats` 中 `avgScore == '85.0'` 使用了宽松相等，数字和字符串的比较可能产生意外结果。应使用 `===`。
</details>

<details>
<summary>Bug 3: 排序方向错误</summary>
`sortUsers` 中降序和升序使用了相同的比较逻辑 `valA - valB`，降序应为 `valB - valA`。
</details>

<details>
<summary>Bug 4: 年龄过滤边界条件</summary>
`filterUsers` 中 `minAge` 用了 `>` 而不是 `>=`，`maxAge` 用了 `<` 而不是 `<=`，导致边界值被排除。
</details>

<details>
<summary>Bug 5: 404 返回了 200</summary>
`routeRequest` 的最后 else 分支中，404 错误返回了 HTTP 200 状态码。
</details>

<details>
<summary>Bug 6: 分数最高/最低判断反了</summary>
`findTopAndBottom` 中找最低分的条件用了 `>` 而不是 `<`，导致 lowest 实际上也是最高分。
</details>

<details>
<summary>Bug 7: 浮点数精度</summary>
`calculateAverageScore` 返回未处理的浮点数，可能出现 85.49999999999999 这样的结果，应使用 `toFixed` 或 `Math.round`。
</details>
