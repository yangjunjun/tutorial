# 📂 章节二：pnpm Monorepo 工作区管理

在现代大型工程中，我们常常需要把一个大系统拆分成多个相关的“包”（Package）。例如：
* `@tutorial/shared`：包含公共的工具函数、类型定义或底层配置。
* `@tutorial/web`：面向用户的 Web 应用，需要引用公共的 `shared`。
* `@tutorial/admin`：后台管理系统，也需要引用公共的 `shared`。

如果每一个包都建一个独立的 Git 仓库，修改公共代码时就需要不断地发布、拉取、升级，开发体验极其痛苦。
**Monorepo（单仓多包）** 就是解决这个痛点的银弹——将所有关联包放在同一个 Git 仓库中。
而 **pnpm Workspace**，是目前业界公认最快、最优雅的 Monorepo 管理方案！

---

## 🏗️ 1. 工作区声明：`pnpm-workspace.yaml`

要把这一组文件夹识别为一个“工作区”，我们必须在项目的**根目录**下创建一个 `pnpm-workspace.yaml` 文件。你可以看一眼同级目录下的配置文件：

```yaml
packages:
  # 包含 packages 目录下的所有直接子目录作为工作区成员
  - 'packages/*'
```
这行配置告诉 pnpm：所有子包都放在 `packages/` 目录下。

---

## 🎯 2. 工作区杀手锏：过滤命令 `-F` (或 `--filter`)

在 Monorepo 中，由于有多个子包，如果我们在根目录下直接运行普通的命令，会产生混乱。
pnpm 提供了 **`-F` (Filter，过滤器)** 参数。通过它，你可以在项目的根目录下，精准控制要对哪个包执行操作。

### 🌟 场景一：只在指定包中安装外部依赖
假设我们想给 `@tutorial/web` 安装网络请求库 `axios`。我们不需要费劲地用 `cd packages/web` 切换目录，直接在 **工作区根目录** 下执行：
```bash
pnpm --filter @tutorial/web add axios
```
> **💡 提示：** `@tutorial/web` 是在 `packages/web/package.json` 里定义的 `name`。

### 🌟 场景二：引用本地的另一个包 (超核心操作 🚀)
在以前，要想让 `web` 引用 `shared`，你需要将 `shared` 发布到 npm 官方，或者利用 `npm link` 本地映射（极易产生缓存和死链）。
在 pnpm 工作区中，你只需要在 **工作区根目录** 运行：
```bash
pnpm --filter @tutorial/web add @tutorial/shared@workspace:*
```
**这行命令的意思是：** 
给 `@tutorial/web` 注入本地工作区中最新的 `@tutorial/shared` 包。
打开 `packages/web/package.json`，你会发现多了一行：
```json
"dependencies": {
  "@tutorial/shared": "workspace:*"
}
```
`workspace:*` 是 pnpm 专属的本地协议。它表示：
1. **开发时**：`web` 会直接建立对本地 `packages/shared` 的**符号链接（Symlink）**。你修改了 `shared` 里的代码，`web` **实时生效**，无需任何打包发布，实现真正的零成本联调！
2. **打包发布时**：当你把 `web` 部署或推送到 npm 时，pnpm 会自动把 `workspace:*` 替换成实际的版本号（如 `1.0.0`），保证外部环境的正常拉取。

---

## 🏃‍♂️ 动手实践

现在，让我们通过几条指令，感受 Monorepo 本地无缝联调的魅力！

### 1. 切换到工作区根目录
请确保你的终端在 `02-monorepo-workspace` 这个根目录下。

### 2. 在根目录执行安装
在根目录下输入：
```bash
pnpm install
```
这行命令会在全局自动检测并安装所有子包（`packages/shared` 和 `packages/web`）的依赖。
不仅如此，它会自动在 `packages/web/node_modules` 中，生成对本地 `packages/shared` 的符号链接！

### 3. 运行 Web 模拟应用
在根目录运行你在 `package.json` 中配置的脚本：
```bash
pnpm start-web
```
> 或者直接运行 `node packages/web/index.js`

你会看到终端中：
1. 成功运行了本地 `packages/shared/index.js` 里的 `add` 和 `formatDate` 函数。
2. 成功运行了通过 `axios` 异步拉取到的虚拟 API 数据。

### 4. 验证“实时热联调”
* 尝试打开 `packages/shared/index.js`，修改 `add` 函数的返回值：
  ```javascript
  function add(a, b) {
    return a + b + " (来自 shared 包的魔改)";
  }
  ```
* 不要重新安装任何东西，直接再次在根目录运行 `pnpm start-web`（或 `node packages/web/index.js`）。
* 观察终端输出。是不是变了？这种本地子包修改、其他包瞬间生效的能力，就是 Monorepo 开发体验能飞上天的关键所在！

---

📖 **下一章**：在大型工作区中，如果有 10 个子包，我们该如何一键运行它们所有的打包（build）或测试（test）脚本呢？又该如何处理它们之间的依赖顺序呢？

让我们前往第三章：
```bash
cd ../03-dependency-filtering-and-scripting
```
去阅读并实操 [**Chapter 3: 多包过滤与并行脚本执行**](../03-dependency-filtering-and-scripting/README.md) 吧！
