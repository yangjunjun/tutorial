# Git 实战教程 — 从入门到精通

# Git Hands-on Tutorial — From Zero to Mastery

---

## 教程简介 / Introduction

本教程以一个 **Web 前端小项目（个人作品集网站 "MyPortfolio"）** 为贯穿线索，从零开始，逐步覆盖 Git 的全部核心概念与高级特性。每一章都包含：理论讲解、可动手操作的示例代码、练习题。

This tutorial uses a **web frontend project ("MyPortfolio" personal portfolio site)** as a running example, covering all core Git concepts from beginner to advanced. Each chapter includes: theory, hands-on code examples, and exercises.

---

## 大纲 / Outline

### 第一章 / Chapter 00 — Git 简介与安装配置 / Intro & Setup
- Git 是什么？为什么需要版本控制？ / What is Git? Why version control?
- 安装 Git / Installing Git
- 初始配置：用户名、邮箱、编辑器、别名 / Initial config: user, email, editor, aliases
- **示例项目**：了解 MyPortfolio 项目结构 / **Demo**: Explore the MyPortfolio project structure

### 第二章 / Chapter 01 — 第一个仓库与基本工作流 / First Repo & Basic Workflow
- `git init`、`git add`、`git commit` / init, add, commit
- 工作区 → 暂存区 → 仓库 / Working tree → Staging area → Repository
- `.gitignore` 文件 / .gitignore
- **动手**：创建 MyPortfolio 仓库并提交首页 / **Hands-on**: Create MyPortfolio repo and commit the homepage

### 第三章 / Chapter 02 — 分支创建与切换 / Branching
- 分支的本质（指针）/ What branches really are (pointers)
- `git branch`、`git checkout`、`git switch` / branch, checkout, switch
- 创建功能分支开发 "关于我" 页面 / Feature branch for "About Me" page
- 合并分支：fast-forward 与 three-way merge / Merging: fast-forward vs three-way merge

### 第四章 / Chapter 03 — 合并冲突与解决 / Conflict Resolution
- 冲突是怎么产生的 / How conflicts arise
- 冲突标记解读 / Reading conflict markers
- 手动解决冲突 / Resolving conflicts manually
- 使用工具辅助（VS Code、meld）/ Using tools (VS Code, meld)
- **实战演练**：模拟两人同时修改导航栏 / **Exercise**: Simulate two people editing the navbar

### 第五章 / Chapter 04 — 远程仓库与协作 / Remote Repositories
- `git remote`、`git push`、`git pull`、`git fetch` / remote, push, pull, fetch
- GitHub / GitLab 创建远程仓库 / Creating remote repos on GitHub/GitLab
- Fork & Pull Request 工作流 / Fork & Pull Request workflow
- Code Review 最佳实践 / Code Review best practices
- **动手**：将 MyPortfolio 推送到 GitHub / **Hands-on**: Push MyPortfolio to GitHub

### 第六章 / Chapter 05 — Rebase 变基 / Rebase
- Merge vs Rebase 对比 / Merge vs Rebase comparison
- `git rebase` 基本用法 / Basic rebase usage
- 交互式 rebase：`git rebase -i` / Interactive rebase
- 黄金法则：不要 rebase 公共分支 / Golden rule: don't rebase public branches
- **动手**：用 rebase 整理提交历史 / **Hands-on**: Clean up commit history with rebase

### 第七章 / Chapter 06 — Cherry-pick 与 Stash / Cherry-pick & Stash
- `git cherry-pick`：摘取特定提交 / Picking specific commits
- `git stash`：临时保存工作区 / Temporarily saving work
- `git stash pop`、`git stash list` / Managing stashes
- **实战场景**：紧急修 bug 时暂存未完成工作 / **Scenario**: Stashing work for a hotfix

### 第八章 / Chapter 07 — 标签与版本发布 / Tags & Releases
- 轻量标签 vs 附注标签 / Lightweight vs annotated tags
- `git tag`、`git push --tags` / Creating and pushing tags
- 语义化版本控制（SemVer）/ Semantic Versioning
- GitHub Releases 发布 / Creating GitHub Releases
- **动手**：为 MyPortfolio v1.0 打标签 / **Hands-on**: Tag MyPortfolio v1.0

### 第九章 / Chapter 08 — Git 钩子与自动化 / Git Hooks
- 钩子的生命周期 / Hook lifecycle
- pre-commit、commit-msg、pre-push 钩子 / Common hooks
- Husky + lint-staged 自动化 / Automating with Husky + lint-staged
- **动手**：为 MyPortfolio 添加代码格式化钩子 / **Hands-on**: Add formatting hooks to MyPortfolio

### 第十章 / Chapter 09 — 团队协作工作流 / Workflow Patterns
- Git Flow 工作流 / Git Flow
- GitHub Flow 工作流 / GitHub Flow
- Trunk-Based Development / Trunk-Based Development
- 如何选择适合团队的工作流 / Choosing the right workflow
- **讨论**：为 MyPortfolio 团队选择工作流 / **Discussion**: Pick a workflow for the MyPortfolio team

### 第十一章 / Chapter 10 — Git 调试利器 / Debugging Tools
- `git log` 高级用法 / Advanced git log
- `git blame`：追溯代码修改 / Tracing code changes
- `git bisect`：二分法定位 bug / Binary search for bugs
- `git reflog`：找回丢失的提交 / Recovering lost commits
- **实战**：用 bisect 找到引入 bug 的提交 / **Exercise**: Find the buggy commit with bisect

### 第十二章 / Chapter 11 — 高级特性与内部原理 / Advanced Features & Internals
- `git submodule`：子模块管理 / Managing submodules
- `git worktree`：多工作目录 / Multiple working trees
- Git 内部对象模型（blob、tree、commit）/ Git object model (blob, tree, commit)
- `git archive`：导出项目归档 / Exporting project archives
- **动手**：为 MyPortfolio 添加博客子模块 / **Hands-on**: Add a blog submodule to MyPortfolio

---

## 使用方式 / How to Use

```bash
# 克隆本教程 / Clone this tutorial
git clone <repo-url>

# 进入对应章节 / Navigate to a chapter
cd 01-first-repo

# 阅读 README.md 并按步骤操作 / Read README.md and follow the steps
```

每个章节文件夹都是独立的，可以单独学习。建议按顺序从 00 开始。

Each chapter folder is self-contained. Recommended to start from 00 and go in order.

---

## 项目结构 / Project Structure

```
git-tutorial/
├── README.md                          ← 你在这里 / You are here
├── 00-intro-and-setup/
│   └── README.md
├── 01-first-repo/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── style.css
├── 02-branching/
│   ├── README.md
│   └── src/
│       ├── index.html
│       ├── style.css
│       └── about.html
├── 03-conflict-resolution/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── style.css
├── 04-remote-repos/
│   ├── README.md
│   └── src/
│       ├── index.html
│       ├── style.css
│       ├── about.html
│       └── contact.html
├── 05-rebase/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── gallery.js
├── 06-cherry-pick-and-stash/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── app.js
├── 07-tags-and-releases/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── style.css
├── 08-git-hooks/
│   ├── README.md
│   └── scripts/
│       └── pre-commit.sh
├── 09-workflow-patterns/
│   └── README.md
├── 10-debugging/
│   ├── README.md
│   └── src/
│       ├── index.html
│       └── calculator.js
└── 11-advanced/
    ├── README.md
    └── src/
        ├── index.html
        └── blog-placeholder.html
```
