# VS Code 调试实践练习

本练习将引导你逐步掌握 VS Code 调试 Node.js 应用的核心技能。所有练习基于 `app.js` 任务管理 CLI 应用。

---

## 练习 1：配置 launch.json 并启动调试

### 目标
熟悉 launch.json 的配置流程，学会启动调试会话。

### 步骤

1. **打开项目**
   - 在 VS Code 中打开 `03-vscode-launch` 文件夹
   - 确认 `.vscode/launch.json` 文件已存在

2. **查看调试面板**
   - 按 `Ctrl+Shift+D` 打开调试面板
   - 查看顶部配置下拉菜单，应该能看到多个配置选项

3. **启动基本调试**
   - 选择 "Launch App" 配置
   - 按 `F5` 启动调试
   - 观察：程序会直接运行并退出（因为没有断点，也没有参数）

4. **修改配置以传递参数**
   - 切换到 "Launch with Arguments" 配置
   - 查看配置中的 `args` 字段
   - 按 `F5` 启动，观察终端输出
   - 你应该看到类似：`已添加任务 #6: "完成调试教程" [优先级: medium]`

5. **添加第一个断点**
   - 打开 `app.js`
   - 在 `main()` 函数内的 `const command = args[0];` 这一行按 `F9` 设置断点
   - 再次按 `F5` 启动调试
   - 观察：程序暂停在断点处，左侧 Variables 面板显示 `args` 和 `command` 的值

6. **逐步执行**
   - 按 `F10`（Step Over）逐行执行
   - 观察 Call Stack 面板中的调用栈变化
   - 当执行到 `switch` 语句时，按 `F11`（Step Into）进入具体的命令处理函数

### 思考题
- 如果修改 `launch.json` 中的 `args` 为 `["list"]`，程序会进入哪个函数？
- `console` 设为 `integratedTerminal` 和 `internalConsole` 有什么区别？

---

## 练习 2：设置条件断点

### 目标
学会使用条件断点，只在满足特定条件时暂停程序。

### 场景
当处理特定 ID 的任务时暂停，方便检查该任务的详细数据。

### 步骤

1. **找到关键位置**
   - 打开 `app.js`，找到 `completeTask` 函数
   - 在 `const taskIndex = tasks.findIndex(t => t.id === id);` 这一行设置断点

2. **转换为条件断点**
   - 右键点击断点红点 → 选择 "Edit Breakpoint..."
   - 输入条件表达式：`id === 3`
   - 按回车确认

3. **测试条件断点**
   - 配置 "Launch with Arguments"，将 args 改为 `["complete", "1"]`
   - 按 F5 启动 → 断点**不会**触发（因为 id 是 1，不是 3）
   - 将 args 改为 `["complete", "3"]`
   - 再次启动 → 断点**会**触发

4. **在 for 循环中使用条件断点**
   - 在 `listTasks` 函数的 `for` 循环内设置断点
   - 条件设为：`i === 2`（只在遍历第 3 个任务时暂停）
   - 用 `["list"]` 参数启动调试
   - 观察暂停时 `filteredTasks[i]` 的值

5. **Hit Count 断点**
   - 在 `for` 循环的断点上右键 → "Edit Breakpoint..."
   - 改为 Hit Count 模式，输入 `3`
   - 启动调试，观察断点在第 3 次循环时才触发

### 思考题
- 条件断点中的表达式可以使用哪些变量？能调用函数吗？
- 如果条件表达式有语法错误会怎样？

---

## 练习 3：使用 Logpoint 记录执行流程

### 目标
学会使用 Logpoint（日志断点）在不中断程序的情况下追踪代码执行。

### 步骤

1. **在函数入口添加 Logpoint**
   - 在 `addTask` 函数的第一行右键行号
   - 选择 "Add Logpoint..."
   - 输入日志消息：`"addTask 被调用，标题: {title}，优先级: {priority}"`
   - 注意：`{title}` 和 `{priority}` 会被替换为实际变量值

2. **在循环中添加 Logpoint**
   - 在 `listTasks` 的 `for` 循环内添加 Logpoint
   - 消息：`"遍历第 {i} 个任务: {filteredTasks[i].title}，状态: {filteredTasks[i].completed}"`

3. **在保存函数中添加 Logpoint**
   - 在 `saveTasks` 函数内添加 Logpoint
   - 消息：`"保存 {tasks.length} 个任务到文件"`

4. **运行并观察**
   - 用 `["add", "测试Logpoint功能"]` 参数启动调试（按 F5）
   - 程序不会暂停，但 Debug Console 中会显示所有 Logpoint 的日志
   - 观察日志顺序，理解程序执行流程

5. **对比 Logpoint 和 console.log**
   - 注意 Logpoint 不会修改源代码
   - 关闭调试后，Logpoint 仍然存在但不会影响正常运行
   - 可以通过 Breakpoints 面板统一管理

### 思考题
- Logpoint 适合在哪些场景下使用？
- 如何临时禁用某个 Logpoint 而不删除它？

---

## 练习 4：使用 Watch 监控变量变化

### 目标
学会使用 Watch 面板监控特定变量和表达式。

### 步骤

1. **设置断点**
   - 在 `listTasks` 函数的 `for` 循环的第一行设置断点

2. **添加 Watch 表达式**
   - 在调试面板的 Watch 区域，点击 `+` 号
   - 添加以下监视表达式：
     - `tasks.length` — 监控任务总数
     - `filteredTasks.length` — 监控过滤后的任务数
     - `i` — 监控循环索引
     - `filteredTasks[i].title` — 监控当前任务标题
     - `tasks.filter(t => !t.completed).length` — 监控未完成任务数

3. **逐步执行并观察**
   - 用 `["list"]` 参数启动调试
   - 每次按 `F10` 后，观察 Watch 面板中各个表达式的值变化
   - 注意：值为 `undefined` 的表达式说明当前作用域没有对应变量

4. **监控函数返回值**
   - 在 `showStats` 函数中设置断点
   - 逐步执行到 `const completed = ...` 之后
   - 添加 Watch 表达式：
     - `completed / total` — 计算完成率
     - `highPriority + mediumPriority + lowPriority` — 验证统计是否正确

### 思考题
- Watch 表达式中可以调用函数吗？有什么限制？
- Watch 和 Debug Console 中的表达式有什么区别？

---

## 练习 5：使用 Debug Console 在运行时执行表达式

### 目标
学会在 Debug Console 中实时执行代码，探索和修改程序状态。

### 步骤

1. **暂停在合适的位置**
   - 在 `showStats` 函数的 `const tasks = loadTasks();` 之后设置断点
   - 用 `["stats"]` 参数启动调试

2. **探索变量**
   - 在 Debug Console（调试控制台）中依次输入：
     ```javascript
     tasks
     ```
     查看完整的任务数组
     ```javascript
     tasks.length
     ```
     查看任务数量
     ```javascript
     tasks.map(t => t.title)
     ```
     提取所有任务标题
     ```javascript
     tasks.filter(t => t.priority === 'high')
     ```
     筛选高优先级任务

3. **修改变量（实验）**
   - 在 Debug Console 中输入：
     ```javascript
     tasks[0].completed = true
     ```
   - 继续执行（F5），观察统计结果是否变化
   - 注意：修改只影响内存中的值，不会写入文件

4. **执行复杂表达式**
   - 试试以下表达式：
     ```javascript
     // 计算所有未完成任务的数量
     tasks.reduce((count, t) => t.completed ? count : count + 1, 0)

     // 按优先级分组
     tasks.reduce((groups, t) => { (groups[t.priority] = groups[t.priority] || []).push(t); return groups; }, {})

     // 检查数据结构
     Object.keys(tasks[0])
     ```

5. **调用函数**
   - 在暂停状态下，可以在 Debug Console 中直接调用函数：
     ```javascript
     formatPriority('high')
     ```
     观察返回值

### 思考题
- Debug Console 中可以执行异步代码（如 Promise）吗？
- 修改变量后继续执行，哪些变化会持久化，哪些不会？

---

## 练习 6：调试带参数的 CLI 命令

### 目标
综合运用以上技能，调试一个完整的 CLI 命令执行流程。

### 步骤

1. **配置调试参数**
   - 打开 `launch.json`
   - 修改 "Launch with Arguments" 配置的 `args` 字段
   - 设为 `["search", "调试"]`

2. **设置多处断点**
   - 在 `main()` 函数的 `switch` 语句处
   - 在 `searchTasks()` 函数的 `filter` 回调处
   - 在 `results.forEach` 回调处

3. **完整调试流程**
   - 按 F5 启动调试
   - 在 `main()` 处暂停 → 查看 `command` 变量
   - 按 F11 进入 `searchTasks` 函数
   - 观察 `keyword` 参数
   - 继续执行到 `filter` 回调 → 观察每个任务的 `title` 是否包含关键字
   - 在 `forEach` 处查看搜索结果

4. **使用 Restart 功能**
   - 按 `Ctrl+Shift+F5` 重启调试
   - 无需手动停止和重新启动

5. **调试 delete 命令中的 Bug**
   - 设置 args 为 `["delete", "999"]`（一个不存在的 ID）
   - 在 `deleteTask` 函数的 `findIndex` 之后设置断点
   - 启动调试，观察 `taskIndex` 的值（应该是 -1）
   - 继续执行，观察 `splice(-1, 1)` 的行为
   - **发现 Bug**：删除不存在的任务时，会误删最后一个任务！
   - 在 Debug Console 中验证：`[-1, 1]` 和 `tasks.splice(-1, 1)` 的效果

### 挑战任务
- 找到 `app.js` 中的所有 Bug，并用调试器验证它们
- 尝试在 Debug Console 中执行修复后的逻辑
- 将修复方案记录下来

---

## 额外练习

### 7. 调试 npm script
在 `package.json` 中添加以下 script，然后配置 launch.json 调试它：

```json
{
  "scripts": {
    "start": "node app.js list",
    "add": "node app.js add",
    "stats": "node app.js stats"
  }
}
```

### 8. 创建自己的调试配置
为以下场景创建新的调试配置：
- 调试 `search` 命令，搜索 "VS Code"
- 调试 `stats` 命令，查看统计信息
- 调试当前打开的文件（使用 `${file}` 变量）

### 9. 条件断点 + Watch 组合使用
- 在 `listTasks` 的循环中设置条件断点 `task.completed === true`
- 添加 Watch 表达式 `task.completedAt` 观察完成时间
- 这样只在遇到已完成任务时暂停，效率更高
