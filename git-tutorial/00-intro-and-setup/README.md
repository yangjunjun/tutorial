# Chapter 00: Git 简介与安装配置 / Intro & Setup

---

## 目录 / Table of Contents

1. [什么是 Git？为什么要用版本控制？ / What is Git? Why Version Control?](#什么是-git为什么要用版本控制--what-is-git-why-version-control)
2. [安装 Git / Installing Git](#安装-git--installing-git)
3. [初始配置 / Initial Configuration](#初始配置--initial-configuration)
4. [常用别名设置 / Useful Aliases](#常用别名设置--useful-aliases)
5. [验证安装 / Verification](#验证安装--verification)
6. [MyPortfolio 项目介绍 / Introducing MyPortfolio](#myportfolio-项目介绍--introducing-myportfolio)
7. [练习 / Exercises](#练习--exercises)

---

## 什么是 Git？为什么要用版本控制？ / What is Git? Why Version Control?

### 中文

Git 是一个**分布式版本控制系统**（Distributed Version Control System），由 Linus Torvalds 在 2005 年创建，最初是为了管理 Linux 内核的源代码。

**版本控制**是一种记录文件内容变化的系统，它可以让你：

- **追踪每一次修改**：谁在什么时间修改了什么内容
- **随时回溯**：回到任何一个历史版本
- **多人协作**：多个开发者可以同时在一个项目上工作而互不干扰
- **分支开发**：在不影响主线的情况下尝试新功能
- **备份与恢复**：代码安全地存储在本地和远程仓库

**Git 与其他版本控制系统的区别：**

| 特性 | Git（分布式） | SVN（集中式） |
|------|--------------|--------------|
| 本地仓库 | 有完整的仓库副本 | 仅有工作副本 |
| 离线工作 | 可以 | 不可以 |
| 分支操作 | 轻量级，秒级完成 | 重量级，需要复制目录 |
| 速度 | 快（本地操作） | 较慢（依赖网络） |

### English

Git is a **Distributed Version Control System** created by Linus Torvalds in 2005, originally designed to manage the Linux kernel source code.

**Version control** is a system that records changes to files over time. It allows you to:

- **Track every change**: who changed what and when
- **Revert to any point**: go back to any historical version
- **Collaborate**: multiple developers can work on the same project without conflicts
- **Branch development**: experiment with new features without affecting the main line
- **Backup & recovery**: code is safely stored in local and remote repositories

**How Git differs from other VCS:**

| Feature | Git (Distributed) | SVN (Centralized) |
|---------|-------------------|-------------------|
| Local repo | Full copy | Working copy only |
| Offline work | Yes | No |
| Branching | Lightweight, instant | Heavyweight, copies dirs |
| Speed | Fast (local operations) | Slower (network dependent) |

---

## 安装 Git / Installing Git

### Windows

#### 中文

1. 访问 Git 官方网站：[https://git-scm.com/download/win](https://git-scm.com/download/win)
2. 下载 **64-bit Git for Windows Setup**
3. 运行安装程序，推荐选择以下选项：
   - 默认编辑器选择 **Vim** 或 **Visual Studio Code**
   - PATH 环境选择 **Git from the command line and also from 3rd-party software**
   - SSH 选择 **OpenSSH**
   - 行结束符转换选择 **Checkout as-is, commit as-is**（推荐跨平台团队）
4. 完成安装后，打开 **Git Bash** 或 **PowerShell** 验证：

```bash
git --version
# 输出示例：git version 2.43.0.windows.1
```

#### English

1. Visit the official Git website: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download **64-bit Git for Windows Setup**
3. Run the installer. Recommended options:
   - Default editor: **Vim** or **Visual Studio Code**
   - PATH environment: **Git from the command line and also from 3rd-party software**
   - SSH: **OpenSSH**
   - Line ending conversions: **Checkout as-is, commit as-is** (recommended for cross-platform teams)
4. After installation, open **Git Bash** or **PowerShell** to verify:

```bash
git --version
# Expected output: git version 2.43.0.windows.1
```

### macOS

#### 中文

macOS 通常预装了 Xcode Command Line Tools（包含 Git）。你可以通过以下方式检查和安装：

```bash
# 检查是否已安装
git --version

# 如果未安装，系统会提示安装 Xcode Command Line Tools
# 或者手动安装：
xcode-select --install

# 也可以使用 Homebrew 安装最新版：
brew install git
```

#### English

macOS usually comes with Xcode Command Line Tools (which includes Git). You can check and install as follows:

```bash
# Check if already installed
git --version

# If not installed, the system will prompt to install Xcode Command Line Tools
# Or install manually:
xcode-select --install

# You can also use Homebrew to install the latest version:
brew install git
```

### Linux (Ubuntu/Debian)

#### 中文

```bash
# 更新包管理器
sudo apt update

# 安装 Git
sudo apt install git

# 验证安装
git --version
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install git
git --version
```

### Linux (Arch)

```bash
sudo pacman -S git
git --version
```

---

## 初始配置 / Initial Configuration

### 中文

安装完 Git 后，第一步是配置你的身份信息。这些信息会附加到你的每一个提交上。

**设置用户名和邮箱（必须）：**

```bash
# 设置你的用户名（会显示在提交历史中）
git config --global user.name "Yang Xiaoming"

# 设置你的邮箱（必须与 GitHub/GitLab 账号关联的邮箱一致）
git config --global user.email "xiaoming@example.com"
```

**设置默认编辑器：**

```bash
# 使用 VS Code 作为默认编辑器
git config --global core.editor "code --wait"

# 或者使用 Vim（Git 的默认编辑器）
git config --global core.editor "vim"

# 或者使用 Nano（对初学者更友好）
git config --global core.editor "nano"
```

> **注意**：`--global` 参数表示这些配置对所有仓库生效。如果你只想对某个特定仓库使用不同的配置，可以省略 `--global`，或使用 `--local`。

**设置默认分支名称：**

```bash
# 将默认分支名称设置为 main（而非传统的 master）
git config --global init.defaultBranch main
```

**设置行结束符（跨平台协作推荐）：**

```bash
# Windows 用户
git config --global core.autocrlf true

# macOS/Linux 用户
git config --global core.autocrlf input
```

**配置 pull 的默认行为：**

```bash
# 推荐设置为 rebase（保持提交历史整洁）
git config --global pull.rebase true
```

### English

After installing Git, the first step is to configure your identity. This information is attached to every commit you make.

**Set your username and email (required):**

```bash
# Set your username (shown in commit history)
git config --global user.name "Yang Xiaoming"

# Set your email (must match your GitHub/GitLab account email)
git config --global user.email "xiaoming@example.com"
```

**Set default editor:**

```bash
# Use VS Code as the default editor
git config --global core.editor "code --wait"

# Or use Vim (Git's default editor)
git config --global core.editor "vim"

# Or use Nano (more beginner-friendly)
git config --global core.editor "nano"
```

> **Note**: The `--global` flag means these settings apply to all repositories. If you want different settings for a specific repo, omit `--global` or use `--local`.

**Set default branch name:**

```bash
# Set the default branch name to main (instead of the traditional master)
git config --global init.defaultBranch main
```

**Set line endings (recommended for cross-platform collaboration):**

```bash
# Windows users
git config --global core.autocrlf true

# macOS/Linux users
git config --global core.autocrlf input
```

**Configure default pull behavior:**

```bash
# Recommended: set to rebase (keeps commit history clean)
git config --global pull.rebase true
```

---

## 常用别名设置 / Useful Aliases

### 中文

Git 别名可以让你用更短的命令来执行常用操作，大幅提升工作效率。

```bash
# 缩短 status 为 st
git config --global alias.st status

# 缩短 commit 为 co
git config --global alias.co commit

# 缩短 checkout 为 ck
git config --global alias.ck checkout

# 缩短 branch 为 br
git config --global alias.br branch

# 创建一个漂亮的日志视图
git config --global alias.lg "log --oneline --graph --decorate --all"

# 查看最近的 5 条提交
git config --global alias.last "log -5 --oneline"

# 查看暂存区的差异
git config --global alias.diffc "diff --cached"

# 撤销暂存（unstage）
git config --global alias.unstage "reset HEAD --"

# 查看最近的提交及其改动文件
git config --global alias.lga "log --oneline --graph --decorate --all --stat"
```

配置完成后，你可以这样使用：

```bash
# 替代 git status
git st

# 替代 git commit -m "message"
git co -m "message"

# 替代 git log --oneline --graph --decorate --all
git lg
```

### English

Git aliases let you use shorter commands for common operations, greatly improving productivity.

```bash
# Shorten status to st
git config --global alias.st status

# Shorten commit to co
git config --global alias.co commit

# Shorten checkout to ck
git config --global alias.ck checkout

# Shorten branch to br
git config --global alias.br branch

# Create a pretty log view
git config --global alias.lg "log --oneline --graph --decorate --all"

# View the last 5 commits
git config --global alias.last "log -5 --oneline"

# View staged differences
git config --global alias.diffc "diff --cached"

# Unstage files
git config --global alias.unstage "reset HEAD --"

# View recent commits with file changes
git config --global alias.lga "log --oneline --graph --decorate --all --stat"
```

After configuration, you can use them like this:

```bash
# Instead of git status
git st

# Instead of git commit -m "message"
git co -m "message"

# Instead of git log --oneline --graph --decorate --all
git lg
```

---

## 验证安装 / Verification

### 中文

安装和配置完成后，运行以下命令确认一切正常：

```bash
# 检查 Git 版本
git --version

# 查看所有配置
git config --list

# 只查看全局配置（你设置的）
git config --global --list

# 检查用户名
git config user.name

# 检查邮箱
git config user.email
```

预期输出示例：

```
$ git --version
git version 2.43.0

$ git config --global --list
user.name=Yang Xiaoming
user.email=xiaoming@example.com
core.editor=code --wait
init.defaultbranch=main
alias.st=status
alias.co=commit
alias.lg=log --oneline --graph --decorate --all
```

### English

After installation and configuration, run the following commands to confirm everything is working:

```bash
# Check Git version
git --version

# View all configurations
git config --list

# View only global configurations (the ones you set)
git config --global --list

# Check username
git config user.name

# Check email
git config user.email
```

Expected output example:

```
$ git --version
git version 2.43.0

$ git config --global --list
user.name=Yang Xiaoming
user.email=xiaoming@example.com
core.editor=code --wait
init.defaultbranch=main
alias.st=status
alias.co=commit
alias.lg=log --oneline --graph --decorate --all
```

---

## MyPortfolio 项目介绍 / Introducing MyPortfolio

### 中文

在本教程中，我们将通过构建一个名为 **MyPortfolio** 的个人作品集网站来学习 Git。

**项目概述：**

MyPortfolio 是一个简单的前端项目，包含以下内容：

- `index.html` — 首页，展示个人简介和项目列表
- `about.html` — 关于页面，展示个人经历和技能
- `contact.html` — 联系页面，展示联系方式和社交链接
- `style.css` — 全站样式
- 未来可能添加的 JavaScript 文件和图片资源

**为什么选择这个项目？**

- **实用**：你可以把它作为自己作品集的起点
- **结构清晰**：文件组织简单，易于理解
- **渐进式开发**：从简单开始，逐步添加功能，完美匹配 Git 的工作流

**项目最终目录结构：**

```
MyPortfolio/
├── index.html          # 首页 / Homepage
├── about.html          # 关于页面 / About page
├── contact.html        # 联系页面 / Contact page
├── style.css           # 样式文件 / Styles
├── script.js           # JavaScript（后续添加）
├── images/             # 图片资源 / Image assets
│   └── profile.jpg
├── .gitignore          # Git 忽略文件 / Git ignore file
└── README.md           # 项目说明 / Project readme
```

在接下来的章节中，你将：
- **Chapter 01**：创建仓库，添加第一批文件，完成第一次提交
- **Chapter 02**：使用分支开发新页面，然后合并回主线
- 更多章节持续更新...

### English

Throughout this tutorial, we will learn Git by building a personal portfolio website called **MyPortfolio**.

**Project Overview:**

MyPortfolio is a simple front-end project that includes:

- `index.html` — Homepage with personal intro and project list
- `about.html` — About page with experience and skills
- `contact.html` — Contact page with contact info and social links
- `style.css` — Site-wide styles
- JavaScript files and image assets to be added later

**Why this project?**

- **Practical**: you can use it as a starting point for your own portfolio
- **Clear structure**: simple file organization, easy to understand
- **Incremental development**: starts simple, grows gradually, perfectly matching Git's workflow

**Final project directory structure:**

```
MyPortfolio/
├── index.html          # Homepage
├── about.html          # About page
├── contact.html        # Contact page
├── style.css           # Styles
├── script.js           # JavaScript (added later)
├── images/             # Image assets
│   └── profile.jpg
├── .gitignore          # Git ignore file
└── README.md           # Project readme
```

In the upcoming chapters, you will:
- **Chapter 01**: Create the repo, add the first files, make your first commit
- **Chapter 02**: Use branches to develop a new page, then merge back to main
- More chapters coming soon...

---

## 练习 / Exercises

### 中文

1. **安装验证**：在你的终端中运行 `git --version`，确认 Git 已正确安装。

2. **配置检查**：运行 `git config --global --list`，确认你的用户名和邮箱已正确设置。

3. **创建别名**：为本章介绍的每个别名执行配置命令，然后用 `git st` 测试是否能正常工作（即使不在仓库中，看看错误信息是什么）。

4. **探索帮助**：运行以下命令，熟悉 Git 的帮助系统：
   ```bash
   git help
   git help config
   git help -w status    # 在浏览器中打开帮助文档
   ```

5. **思考题**：为什么版本控制系统对团队协作很重要？想象一下没有 Git 的情况下，5 个人同时修改同一个文件会发生什么。

### English

1. **Installation check**: Run `git --version` in your terminal and confirm Git is properly installed.

2. **Configuration check**: Run `git config --global --list` and confirm your username and email are correctly set.

3. **Create aliases**: Configure each alias introduced in this chapter, then test with `git st` (even if you're not in a repo — observe the error message).

4. **Explore help**: Run the following commands to get familiar with Git's help system:
   ```bash
   git help
   git help config
   git help -w status    # Opens help docs in browser
   ```

5. **Thought exercise**: Why is version control important for team collaboration? Imagine what would happen if 5 people edited the same file simultaneously without Git.

---

**下一章 / Next Chapter**: [Chapter 01: 第一个仓库与基本工作流 / First Repo & Basic Workflow](../01-first-repo/README.md)
