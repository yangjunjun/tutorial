# 📘 章节一：pnpm 基础命令与核心原理

在本章中，我们将通过当前这个极简的示例项目，掌握 `pnpm` 最常用的命令行操作，并深入剖析 pnpm 的底层设计——**硬链接**与**如何防范幽灵依赖**。

---

## 🛠️ 第一步：常用依赖管理命令实操

请打开终端，切换到当前 `01-basic-commands` 目录。我们一起来亲手输入以下命令。

### 1. 初始化项目
如果你在一个全新的空目录下建项目，可以使用：
```bash
pnpm init
```
它会快速在当前目录下生成一个基础的 `package.json` 文件。

### 2. 安装 `package.json` 中声明的所有依赖
由于我们在这个文件夹下已经为你提供了一个声明了 `lodash` 的 `package.json`，请在当前终端中执行：
```bash
pnpm install
```
> **💡 提示：** 你也可以简写为 `pnpm i`。你会发现它的安装速度非常惊人。

安装完成后，你可以通过以下命令运行示例代码：
```bash
node index.js
```
你会看到终端中输出了 lodash 执行后的结果，说明依赖已成功导入并可运行。

### 3. 添加新的依赖 (Add)
如果我们想在项目里引入网络请求库 `axios`：
```bash
pnpm add axios
```
这会默认将 `axios` 写入 `dependencies`。

* **添加开发依赖（如 TypeScript、ESLint）**：
  ```bash
  pnpm add typescript -D
  ```
  或者使用 `--save-dev` 标志。它会写入 `devDependencies` 中。

* **全局安装包**：
  ```bash
  pnpm add -g nodemon
  ```
  这会将 `nodemon` 全局安装在你的电脑中。

### 4. 移除依赖 (Remove)
如果某天我们不需要 `axios` 了，可以通过以下命令移除它：
```bash
pnpm rm axios
```
> **💡 提示：** 也可以使用 `pnpm remove axios` 或 `pnpm uninstall axios`。这会同时在 `package.json` 和 `node_modules` 中删掉它。

### 5. 升级依赖 (Update)
想要升级项目中的依赖包：
* 升级指定包：
  ```bash
  pnpm update lodash
  ```
* 交互式升级（非常推荐！可以弹出一个列表，勾选升级哪些包）：
  ```bash
  pnpm update --interactive
  ```
  （简写为 `pnpm up -i`）

---

## 🔬 深度剖析 1：pnpm 的底层机制——硬链接与符号链接

运行完 `pnpm install` 后，请你打开当前目录下的 `node_modules` 文件夹。你会发现它的结构和 `npm` 有着天壤之别！

### 💻 传统 npm 的痛点：铺平结构
传统的 npm（v3 之后）为了解决依赖版本冲突和路径过长的问题，会把所有子依赖都**平铺（Flatten）**在 `node_modules` 的根目录下。
* **缺点 1**：极占磁盘。同一个包在十个项目里装了十次，磁盘就被占用了十份空间。
* **缺点 2**：产生了“幽灵依赖”（见下文）。

### 🛡️ pnpm 的妙解：基于 Content-addressable Store 的链接

当你用 pnpm 安装依赖时，它会进行以下三步：
1. **全局存储**：将包真正地下载到你电脑的全局共享缓存目录（称为 `Store`）。
2. **硬链接（Hard Link）**：在你的项目 `node_modules/.pnpm/` 中创建这些文件的**硬链接**。
   > **知识科普（硬链接 vs 软链接）**：
   > * **硬链接**：是指向磁盘上同一物理数据的不同入口。它不是“快捷方式”，而是“别名”。两个硬链接指向同一个 inode。所以它**不重复占用磁盘空间**。如果你在项目 A 和项目 B 都用了同一个版本的 React，它们的物理存储只有一份，但都通过硬链接直接读写，零空间浪费！
   > * **软链接（又称符号链接，Symlink）**：类似 Windows 的快捷方式。它是一个独立的文件，里面写着它指向的物理路径。
3. **符号链接（Symlink）**：在你的项目 `node_modules/` 根目录下，建立一个指向 `.pnpm/` 目录下对应硬链接包的**符号链接**。

这就构成了一个极其精妙的“网状”结构：
```text
node_modules
├── lodash  (--> 符号链接指向 .pnpm/lodash@4.17.21/node_modules/lodash)
└── .pnpm
    └── lodash@4.17.21
        └── node_modules
            └── lodash (真正的物理文件，它是全局 Store 的硬链接)
```

这种机制完美地实现了：**安装极快**、**极省空间**、同时**目录结构极其干净**。

---

## 👻 深度剖析 2：什么是幽灵依赖 (Ghost Dependency)？

幽灵依赖是前端项目里一个非常隐蔽的“定时炸弹”。

### 1. 幽灵依赖是如何产生的？
假设你安装了包 `A`。而包 `A` 的内部依赖了包 `B`。
* **在 npm/yarn 环境下**：因为铺平（Flat）机制，`B` 也会被直接放到 `node_modules/` 根目录下。
* **后果**：你在你的业务代码里，可以直接写 `const B = require('B')`。因为 Node.js 的模块查找机制在 `node_modules` 根目录下能直接找到 `B`。
* **隐患**：你在 `package.json` 里根本没有声明过对 `B` 的依赖！如果有一天，包 `A` 升级了，决定不再使用 `B`，或者把 `B` 升级到了一个完全不兼容的新版本。你的代码在运行时会立刻报错：`Cannot find module 'B'`。

### 2. pnpm 是如何解决的？
在 pnpm 中，你的 `node_modules/` 根目录下**只会有你在 `package.json` 里显式声明的依赖包**（如上面的 `lodash`）。
至于 `lodash` 自己的依赖，都会被严密地锁在 `.pnpm/` 文件夹深处。你的代码**根本无法**直接 `import` 那些不属于你的间接依赖。

这种严格的拓扑安全性，彻底杜绝了“幽灵依赖”的隐患，让你的前端工程变得无比健壮！

---

## 🏃‍♂️ 动动手实践

1. 尝试在终端运行 `pnpm install`。
2. 试着在 `index.js` 中加上 `const axios = require('axios')`。
3. 运行 `node index.js`。此时会报错 `Cannot find module 'axios'`（即使你发现 `.pnpm` 下存在某些间接依赖）。
4. 运行 `pnpm add axios`，再次运行 `node index.js`。成功！这就是 pnpm 严谨且安全的魅力。

---

📖 **下一章**：当你面临大型前端工程，需要管理多个子包并让它们互相本地引用时，pnpm 的优势将发挥到极致。我们现在出发：
```bash
cd ../02-monorepo-workspace
```
去阅读并实操 [**Chapter 2: Monorepo 工作区管理**](../02-monorepo-workspace/README.md) 吧！
