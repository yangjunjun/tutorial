# 🚀 pnpm 极简实用教程：从入门到 Monorepo 实战

欢迎来到 **pnpm 极简实用教程**！

pnpm（Performant npm）是一个**快速、节省磁盘空间、安全**的包管理器。在如今的前端开发中，尤其是面对大型项目、组件库、多包管理（Monorepo）时，pnpm 已经成为了行业主流的标配工具。

本教程完全采用 **“示例与实操驱动”** 的设计。你不仅是在阅读文字，更能直接进入当前目录下的各个子文件夹，通过真实的项目代码与命令行交互，亲身体会 pnpm 的强大与便利。

---

## 📂 教程大纲与导航

整个教程已经为你初始化在当前文件夹中，请按照以下顺序逐步探索和实操：

| 章节目录 | 核心教学重点 | 建议实操步骤 |
| :--- | :--- | :--- |
| [**`01-basic-commands/` (基础命令)**](./01-basic-commands/README.md) | 常用增删改查命令、**硬链接 (Hard Link)** 原理、**幽灵依赖 (Ghost Dependency)** 的产生与防范。 | 进入目录，运行 `pnpm install` 并观察 `node_modules` 独特的网状结构。 |
| [**`02-monorepo-workspace/` (多包管理)**](./02-monorepo-workspace/README.md) | 如何配置 `pnpm-workspace.yaml`、使用 **`-F / --filter`** 过滤命令、声明及本地引用 `workspace:*`。 | 在根目录执行过滤命令，实现子包之间无需发布 npm 的零成本本地联调。 |
| [**`03-dependency-filtering-and-scripting/` (脚本与并发执行)**](./03-dependency-filtering-and-scripting/README.md) | 批量递归运行脚本 (`-r`)、按依赖拓扑顺序构建 vs 纯并发模式 (`--parallel`)。 | 运行测试脚本，体会 pnpm 如何在极短时间内并行完成多包的构建。 |
| [**`04-advanced-configs/` (高级配置与运维)**](./04-advanced-configs/README.md) | `.npmrc` 中幽灵依赖的紧急放开方案（`shamefully-hoist`）、全局共享存储（`Store`）的日常维护、迁移方法。 | 了解 pnpm 全局 Store 的清理指令，帮你的电脑磁盘腾出大量空间。 |

---

## ⚡ pnpm 核心优势：为什么现在都用它？

在正式开始之前，我们需要了解为什么整个前端生态（包括 Vue、Vite、NestJS 等知名开源项目）都全面转向了 pnpm：

1. **快得不可思议 🚀**
   - pnpm 的安装速度通常是 npm/yarn 的 **2~3 倍**。因为它采用了基于全局 Content-addressable Store（内容寻址存储）的安装机制，能最大限度复用已下载的包。
2. **极度节省磁盘空间 💾**
   - 如果你有 100 个项目依赖了同一个版本的 React，在 npm 里你需要下载 100 次，在磁盘里占用 100 倍的空间。
   - 在 pnpm 中，React 只会被物理下载到你电脑的**全局存储（Store）**中一次。各个项目里的引用只是指向这个 Store 的**硬链接（Hard Link）**，几乎不占用额外的磁盘空间。
3. **安全且严谨（拒绝幽灵依赖） 🔒**
   - npm/yarn 会默认将依赖平铺（Flat）在 `node_modules` 根目录下，这导致我们在代码中能直接 `import` 一些我们并没有显式声明在 `package.json` 里的“间接依赖”。一旦这些间接依赖升级或被移除，我们的项目就会莫名其妙崩溃。
   - pnpm 默认建立的是一层“严密”的嵌套嵌套和符号链接结构。**你只能引用在 `package.json` 里写明的包**，这被称为“严谨的依赖拓扑”。

---

## 🛠️ 准备工作：安装 pnpm

如果你的电脑上还没有安装 pnpm，可以通过以下最简便的命令进行安装：

### 1. 使用 Node.js 的 Corepack（推荐，免下载）
现代版本的 Node.js 自带了 corepack，你只需在终端运行：
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. 使用 npm 安装
如果你喜欢用 npm 直接全局安装：
```bash
npm install -g pnpm
```

### 3. 验证安装
```bash
pnpm -v
```

---

## 👨‍💻 开始你的学习之旅吧！

现在，请打开你的终端，输入：
```bash
cd 01-basic-commands
```
然后阅读该目录下的 [**`README.md`**](./01-basic-commands/README.md)，开始你的第一章实操！

祝你学习愉快！任何时候如果遇到问题，都可以参考教程中的原理分析或向我提问。💬
