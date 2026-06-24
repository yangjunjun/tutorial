# ⚡ 章节三：多包脚本过滤与并行执行 (Scripting)

在 Monorepo 项目中，随着子包数量的增多，我们经常会遇到批量操作的需求。例如：
1. **一键构建**：在上线前，需要对所有的子包运行 `pnpm run build`。
2. **一键测试**：在 CI 流程中，需要对所有子包运行 `pnpm run test`。
3. **一键开发**：在本地开发时，需要同时启动多个子应用的 `pnpm run dev`。

如果我们要逐个去 `cd` 运行，那 Monorepo 的效率就荡然无存了。pnpm 提供了一套极强的**多包脚本执行与过滤引擎**，能让你事半功倍！

---

## 🔄 1. 递归执行 `-r` (或 `--recursive`)

当我们在工作区根目录下加入 `-r` 参数时，pnpm 会**自动寻找所有子包中声明了该脚本的 package**，并批量执行。

### 🌟 示例 1：一键测试
我们在 `@tutorial/app-a` 和 `@tutorial/app-b` 的 `package.json` 中都声明了 `"test"` 脚本。
我们可以在工作区根目录下，直接输入：
```bash
pnpm -r run test
```
pnpm 会瞬间扫出这两个子包，并挨个输出它们的测试结果：
```text
@tutorial/app-a test$ echo "App A: 测试通过"
│ App A: 测试通过
└─ Success in 24ms
@tutorial/app-b test$ echo "App B: 测试通过"
│ App B: 测试通过
└─ Success in 21ms
```

---

## 📈 2. 拓扑排序 (Topological Order) 机制

在进行批量构建（如 `pnpm -r run build`）时，不同的包之间可能存在依赖关系。
例如，`app-a` 依赖了 `shared` 工具库。如果在构建时先去 build `app-a`，由于 `shared` 还没完成打包，`app-a` 可能会因为找不到模块而崩掉。

pnpm 默认拥有**拓扑排序构建**的能力：
* 它会智能分析工作区内所有包的 `dependencies`。
* **自动按依赖链的先后顺序排队构建**（即先构建底层的 `shared` 库，再构建上层的 `app-a`）。
* 这极大降低了我们在构建复杂多包项目时的心智负担！

---

## 🚀 3. 纯并发执行 `--parallel`

有时候，我们并不需要遵守拓扑顺序。比如在**本地开发**时，我们希望一键**同时启动** `app-a` 和 `app-b` 的开发服务器（`dev` 脚本）。
如果我们使用默认的 `pnpm -r run dev`，如果第一个服务一直在后台挂起，第二个服务就永远无法启动。

此时，我们需要祭出 `--parallel`（纯并发）参数：
```bash
pnpm -r --parallel run dev
```
**特点：**
* 忽略任何拓扑依赖顺序。
* **瞬间且同时**启动所有子包的对应脚本。
* 将所有子包的输出（stdout）实时汇总，并在行首加上包名作为前缀（如 `[@tutorial/app-a]`），方便你观察。

---

## 🎛️ 4. 复合拳：过滤并执行

你不仅可以对“全部子包”递归，还可以**结合 `-F` (Filter) 过滤特定包来递归运行**：

* **仅构建指定目录下的所有包：**
  ```bash
  pnpm --filter "./packages/*" run build
  ```
* **构建除某个包之外的所有包：**
  ```bash
  pnpm --filter "!@tutorial/app-b" -r run build
  ```
  > `!` 符号表示排除。

---

## 🏃‍♂️ 动手实践

让我们通过刚才专门设计的带有延时的编译脚本，在终端亲自体会**默认构建**与**并发构建**的控制台输出差异！

### 1. 切换到当前目录
确保终端处于 `03-dependency-filtering-and-scripting` 目录下。

### 2. 体验默认的批量构建
在根目录下运行：
```bash
pnpm run build-all
```
> 这等同于运行：`pnpm -r run build`

**👀 观察控制台：**
你会发现控制台非常守纪律。它会先输出 App A 的 `🚧 开始构建...` 并静静等待 1.5 秒输出 `✅ 构建完毕！` 后，才慢吞吞地去启动 App B。
这是因为默认状态下，pnpm 会对任务进行排队和安全控制。

### 3. 体验极限并发构建！
现在，在根目录运行：
```bash
pnpm run build-parallel
```
> 这等同于运行：`pnpm -r --parallel run build`

**👀 观察控制台：**
你是不是发现 App A 和 App B 的 `🚧 开始构建...` **同时在控制台里弹了出来**？
并且，由于 App B 的构建延迟更短（1000ms），所以尽管 App B 可能是后面才启动，它却先输出了 `✅ [App B] 构建完毕！`。
这就是 `--parallel` 带来的非阻塞高并发体验，是本地多模块联调时的不二之选！

---

📖 **下一章**：当项目遇到由于依赖幽灵问题引起的诡异报错时该如何自救？如何清理我们的磁盘？
让我们前往第四章：
```bash
cd ../04-advanced-configs
```
去阅读并学习 [**Chapter 4: 高级配置与故障排查**](../04-advanced-configs/README.md) 吧！
