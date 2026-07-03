# VS Code 调试 Node.js 完全指南

## 目录

- [VS Code 调试面板介绍](#vs-code-调试面板介绍)
- [launch.json 结构与字段详解](#launchjson-结构与字段详解)
- [常用调试配置](#常用调试配置)
- [断点类型详解](#断点类型详解)
- [调试控制面板](#调试控制面板)
- [调试操作快捷键](#调试操作快捷键)
- [多配置切换与 Compound Configurations](#多配置切换与-compound-configurations)
- [调试 npm scripts](#调试-npm-scripts)
- [最佳实践](#最佳实践)

---

## VS Code 调试面板介绍

VS Code 内置了强大的调试器，无需安装额外插件即可调试 Node.js 应用。

### 打开调试面板

- 点击左侧活动栏的 **Run and Debug** 图标（播放按钮 + 虫子）
- 或使用快捷键 `Ctrl+Shift+D`（Windows/Linux）/ `Cmd+Shift+D`（Mac）

### 调试面板的组成部分

调试面板从上到下依次包含：

1. **配置下拉菜单** — 选择要使用的调试配置
2. **绿色播放按钮** — 启动调试会话
3. **Variables（变量）** — 查看当前作用域内的变量值
4. **Watch（监视）** — 添加自定义监视表达式
5. **Call Stack（调用栈）** — 查看当前执行路径
6. **Breakpoints（断点）** — 管理所有已设置的断点
7. **Loaded Scripts（已加载脚本）** — 查看调试器已加载的模块

### 调试工具栏

启动调试后，顶部会出现浮动工具栏：

| 按钮 | 快捷键 | 功能 |
|------|--------|------|
| Continue / Pause | F5 | 继续执行 / 暂停 |
| Step Over | F10 | 跳过当前行（不进入函数） |
| Step Into | F11 | 进入函数内部 |
| Step Out | Shift+F11 | 从当前函数跳出 |
| Restart | Ctrl+Shift+F5 | 重启调试会话 |
| Stop | Shift+F5 | 停止调试 |

---

## launch.json 结构与字段详解

`launch.json` 是 VS Code 调试的核心配置文件，存放在 `.vscode/` 目录下。

### 基本结构

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/app.js"
    }
  ]
}
```

### 核心字段详解

#### `type` — 调试器类型
- `"node"` — Node.js 调试器
- `"pwa-node"` — 新版 Node.js 调试器（VS Code 1.47+ 默认）
- 其他语言有各自的 type，如 `"python"`、`"java"`

#### `request` — 请求类型
- `"launch"` — VS Code 启动程序并附加调试器
- `"attach"` — 附加到已运行的进程

**什么时候用 launch？** 当你想从 VS Code 启动应用并调试。
**什么时候用 attach？** 当应用已经在运行（比如通过终端启动的），需要事后附加调试器。

#### `name` — 配置名称
在调试面板下拉菜单中显示的名称，取一个有意义的名字。

#### `program` — 入口文件
程序的主入口文件路径，支持 VS Code 变量：
- `${workspaceFolder}` — 当前工作区根目录
- `${file}` — 当前打开的文件
- `${fileDirname}` — 当前文件所在目录

#### `args` — 命令行参数
传递给程序的命令行参数数组：
```json
"args": ["add", "--name", "写周报", "--priority", "high"]
```

#### `env` — 环境变量
设置运行时环境变量：
```json
"env": {
  "NODE_ENV": "development",
  "DEBUG": "app:*",
  "PORT": "3000"
}
```

#### `cwd` — 工作目录
程序运行时的工作目录：
```json
"cwd": "${workspaceFolder}"
```

#### `console` — 输出控制台
- `"internalConsole"` — 输出到 VS Code 的 Debug Console
- `"integratedTerminal"` — 输出到 VS Code 内置终端（支持交互输入）
- `"externalTerminal"` — 输出到外部终端

#### `skipFiles` — 跳过文件
调试时跳过指定文件，避免步入 node_modules 等不关心的代码：
```json
"skipFiles": [
  "<node_internals>/**",
  "${workspaceFolder}/node_modules/**"
]
```

#### `preLaunchTask` — 预启动任务
在调试前自动执行一个 VS Code 任务（如编译 TypeScript）：
```json
"preLaunchTask": "tsc: build - tsconfig.json"
```

#### `sourceMaps` — 源码映射
启用源码映射，调试编译后的代码时定位到原始源码：
```json
"sourceMaps": true
```

#### `runtimeArgs` — 运行时参数
传递给 Node.js 运行时的参数（不是程序参数）：
```json
"runtimeArgs": ["--inspect", "--max-old-space-size=4096"]
```

---

## 常用调试配置

### 1. Launch Program（启动程序）

最常用的配置，适合调试本地 Node.js 应用：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch App",
  "program": "${workspaceFolder}/app.js",
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### 2. Attach to Process（附加到进程）

适合调试已经在运行的 Node.js 进程：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Running Process",
  "processId": "${command:PickProcess}",
  "skipFiles": ["<node_internals>/**"]
}
```

使用方式：
1. 先用 `node --inspect app.js` 启动应用
2. 然后在 VS Code 中选择此配置启动调试
3. VS Code 会弹出进程选择器，选择目标进程

### 3. Debug External Program（调试外部程序）

适合调试全局安装的命令行工具：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug npm CLI",
  "program": "${command:PickNodeJavaScriptFile}",
  "cwd": "${workspaceFolder}"
}
```

### 4. 调试当前打开的文件

非常实用的配置，调试你当前正在编辑的文件：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current File",
  "program": "${file}",
  "console": "integratedTerminal"
}
```

---

## 断点类型详解

VS Code 提供了多种断点类型，灵活运用可以大幅提升调试效率。

### 普通断点（Breakpoint）

在代码行号旁边点击，出现红色圆点即为普通断点。程序执行到该行时会暂停。

**快捷键：** `F9` 在当前行切换断点

### 条件断点（Conditional Breakpoint）

只在满足特定条件时才暂停。右键点击断点 → "Edit Breakpoint" → 输入条件表达式。

```javascript
// 条件示例：只在 taskId === 3 时暂停
taskId === 3

// 条件示例：只在数组长度大于 10 时暂停
tasks.length > 10

// 条件示例：只在变量包含特定值时暂停
task.title.includes('bug')
```

### 命中次数断点（Hit Count Breakpoint）

在断点被命中指定次数后才暂停。适合调试循环或频繁调用的函数。

```
// 命中第 5 次时暂停
5

// 命中次数大于 10 时暂停
> 10

// 命中次数是 3 的倍数时暂停
% 3
```

### 日志断点（Logpoint）

不暂停程序，而是在 Debug Console 中输出日志。适合在不中断执行的情况下追踪程序流程。

右键点击断点 → "Edit Breakpoint" → 选择 "Log Message"：

```javascript
// 基本日志
"Processing task: {task.title}"

// 带表达式的日志
"Task #{task.id} status changed to {task.status}, total tasks: {tasks.length}"

// 输出对象
"Task object: {JSON.stringify(task)}"
```

**Logpoint 的优势：**
- 不会中断程序执行
- 比 `console.log` 更灵活（不需要修改代码）
- 可以随时启用/禁用
- 调试结束后自动移除，不会污染代码

### 内联断点（Inline Breakpoint）

在一行代码的中间位置设置断点。适合在单行包含多个表达式时使用。

**操作方式：** 将光标定位到具体位置，按 `Shift+F9`

```javascript
// 在这一行的不同位置可以设置不同的断点
const result = calculate(tasks.filter(t => t.active)).map(format)
//         ^断点1                ^断点2           ^断点3
```

---

## 调试控制面板

### Variables（变量面板）

显示当前暂停位置的所有变量，分为三个层级：

- **Local** — 当前函数内的局部变量
- **Closure** — 闭包中捕获的变量
- **Global** — 全局变量

**使用技巧：**
- 展开对象查看所有属性
- 右键变量可以 "Add to Watch" 或 "Copy Value"
- 变量值过长时会显示 "..."，点击展开

### Watch（监视面板）

添加自定义表达式，每次暂停时自动计算并显示结果：

```javascript
// 监控数组长度变化
tasks.length

// 监控特定对象的属性
tasks[0]?.status

// 复杂表达式
tasks.filter(t => !t.completed).length

// 类型检查
typeof result

// 调用方法
JSON.stringify(tasks, null, 2)
```

### Call Stack（调用栈面板）

显示当前的函数调用链，从当前函数到最外层调用者：

```
processTask (app.js:45)    ← 当前位置
handleCommand (app.js:120) ← 调用者
main (app.js:200)          ← 入口
```

**使用技巧：**
- 点击调用栈中的不同帧，可以查看对应位置的变量
- 异步调用会显示 "async" 标记
- Node.js 内部调用通常被 `skipFiles` 隐藏

### Breakpoints（断点面板）

管理所有已设置的断点：

- 勾选/取消勾选来启用/禁用断点
- 右键可以删除或编辑断点条件
- 显示每个断点的文件名和行号
- 可以设置 "Deactivate Breakpoints" 全局禁用所有断点

### Debug Console（调试控制台）

在程序暂停时，可以执行任意 JavaScript 表达式：

```javascript
// 查看变量
tasks.length

// 修改变量（实验性）
tasks[0].completed = true

// 调用函数
formatTask(tasks[0])

// 执行复杂表达式
tasks.filter(t => t.priority === 'high').map(t => t.title)

// 查看对象结构
Object.keys(tasks[0])

// 检查原型链
Object.getPrototypeOf(tasks[0])
```

---

## 调试操作快捷键

### 速查表

| 操作 | Windows/Linux | Mac |
|------|---------------|-----|
| 启动调试 / 继续 | F5 | F5 |
| 暂停 | F6 | F6 |
| 单步跳过（Step Over） | F10 | F10 |
| 单步进入（Step Into） | F11 | F11 |
| 单步跳出（Step Out） | Shift+F11 | Shift+F11 |
| 重启调试 | Ctrl+Shift+F5 | Cmd+Shift+F5 |
| 停止调试 | Shift+F5 | Shift+F5 |
| 切换断点 | F9 | F9 |
| 内联断点 | Shift+F9 | Shift+F9 |
| 条件断点 | 右键行号 | 右键行号 |

### Step Over vs Step Into vs Step Out

```javascript
function main() {
  const data = processData(input);  // ← 断点在这里
  console.log(data);                //    按 F10：跳过 processData，直接到下一行
}                                   //    按 F11：进入 processData 函数内部

function processData(input) {
  const result = transform(input);  // ← Step Into 后到达这里
  return result;                    //    按 Shift+F11：跳出函数，回到 main 的下一行
}
```

### Step Into Targets（选择进入哪个函数）

当一行有多个函数调用时，按 `F11` 会弹出选择器让你选择进入哪个函数：

```javascript
// 光标在这一行按 F11，可以选择进入 validate 或 process
const result = process(validate(data));
```

---

## 多配置切换与 Compound Configurations

### 多配置管理

在 `configurations` 数组中定义多个配置，通过下拉菜单切换：

```json
{
  "configurations": [
    { "name": "Launch App", ... },
    { "name": "Launch Tests", ... },
    { "name": "Attach to Server", ... }
  ]
}
```

### Compound Configurations（复合配置）

同时启动多个调试配置，适合调试多进程应用（如同时调试客户端和服务端）：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Server",
      "program": "${workspaceFolder}/server.js"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Worker",
      "program": "${workspaceFolder}/worker.js"
    }
  ],
  "compounds": [
    {
      "name": "Server + Worker",
      "configurations": ["Server", "Worker"],
      "stopAll": true
    }
  ]
}
```

**`stopAll`** — 设为 `true` 时，停止其中一个配置会停止所有配置。

---

## 调试 npm scripts

### 方法一：直接调试 npm script

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug npm start",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start"],
  "cwd": "${workspaceFolder}",
  "console": "integratedTerminal"
}
```

### 方法二：调试特定的 npm script

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug npm test",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test", "--", "--inspect-brk"],
  "cwd": "${workspaceFolder}",
  "console": "integratedTerminal"
}
```

### 方法三：使用 VS Code 的 npm scripts 面板

1. 打开资源管理器侧边栏
2. 展开 "NPM SCRIPTS" 区域
3. 右键点击某个 script
4. 选择 "Debug Script"

---

## 最佳实践

### 1. 始终配置 skipFiles

避免调试器步入 Node.js 内部模块和 node_modules，提高调试效率：

```json
"skipFiles": [
  "<node_internals>/**",
  "${workspaceFolder}/node_modules/**"
]
```

### 2. 使用 integratedTerminal 作为默认控制台

这样可以支持交互式输入（如 readline、prompt 等）：

```json
"console": "integratedTerminal"
```

### 3. 为不同场景创建独立配置

为开发、测试、CLI 命令等不同场景创建独立的调试配置，并通过有意义的命名加以区分。

### 4. 善用 Logpoint 替代 console.log

避免在代码中添加大量 `console.log` 后又忘记删除。Logpoint 只在调试时生效，不污染源码。

### 5. 使用 `.vscode` 目录管理配置

将 `.vscode/launch.json` 提交到版本控制中，让团队成员共享调试配置。但可以通过 `.gitignore` 排除个人化的配置。

### 6. 利用 `smartStep` 跳过编译生成的代码

在使用 TypeScript 或 Babel 时，启用 `smartStep` 可以自动跳过编译生成的辅助代码：

```json
"smartStep": true
```

### 7. 配置 `justMyCode` 只调试自己的代码

```json
"justMyCode": true
```

---

## 本项目练习

请查看 [exercise.md](./exercise.md) 获取实践练习指南。

运行示例应用：

```bash
# 查看帮助
node app.js help

# 添加任务
node app.js add "学习 VS Code 调试"

# 列出所有任务
node app.js list

# 完成任务
node app.js complete 1

# 删除任务
node app.js delete 2
```
