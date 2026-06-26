# Chapter 04: 远程仓库与协作 / Remote Repositories & Collaboration

> **前置要求 / Prerequisites:** 完成 Chapter 03（冲突解决）/ Complete Chapter 03 (Conflict Resolution)
>
> **预计时间 / Estimated Time:** 60 分钟 / 60 minutes

---

## 目录 / Table of Contents

1. [什么是远程仓库？/ What is a Remote Repository?](#什么是远程仓库--what-is-a-remote-repository)
2. [git remote — 管理远程仓库 / Managing Remotes](#git-remote--管理远程仓库--managing-remotes)
3. [git push — 推送本地提交 / Pushing Local Commits](#git-push--推送本地提交--pushing-local-commits)
4. [git fetch vs git pull — 获取与拉取 / Fetch vs Pull](#git-fetch-vs-git-pull--获取与拉取--fetch-vs-pull)
5. [git clone — 克隆远程仓库 / Cloning a Remote Repository](#git-clone--克隆远程仓库--cloning-a-remote-repository)
6. [在 GitHub 上创建仓库 / Setting Up a GitHub Repository](#在-github-上创建仓库--setting-up-a-github-repository)
7. [Fork 与 Pull Request 工作流 / Fork & Pull Request Workflow](#fork-与-pull-request-工作流--fork--pull-request-workflow)
8. [代码审查最佳实践 / Code Review Best Practices](#代码审查最佳实践--code-review-best-practices)
9. [分支保护规则 / Branch Protection Rules](#分支保护规则--branch-protection-rules)
10. [Upstream vs Origin](#upstream-vs-origin)
11. [实战：推送 MyPortfolio 到 GitHub / Step-by-Step: Push MyPortfolio to GitHub](#实战推送-myportfolio-到-github--step-by-step-push-myportfolio-to-github)
12. [练习 / Exercises](#练习--exercises)

---

## 什么是远程仓库？/ What is a Remote Repository?

远程仓库是托管在服务器上的 Git 仓库副本，团队成员可以通过网络访问它来共享代码。

A remote repository is a copy of a Git repository hosted on a server that team members can access over the network to share code.

```
    开发者 A 的电脑           远程服务器              开发者 B 的电脑
    Developer A's PC         Remote Server          Developer B's PC
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │  本地仓库     │      │  远程仓库     │      │  本地仓库     │
   │  Local Repo  │◄────►│  Remote Repo │◄────►│  Local Repo  │
   │              │ push │              │ push │              │
   │              │ pull │  (GitHub /   │ pull │              │
   │              │      │   GitLab)    │      │              │
   └──────────────┘      └──────────────┘      └──────────────┘
```

### 远程仓库的作用 / Purpose of Remote Repositories

| 功能 / Feature | 说明 / Description |
|---|---|
| **代码共享 / Code Sharing** | 团队成员可以获取最新代码 / Team members can get the latest code |
| **备份 / Backup** | 代码安全地存储在服务器上 / Code is safely stored on a server |
| **协作 / Collaboration** | 多人可以同时在不同分支上工作 / Multiple people can work on different branches simultaneously |
| **代码审查 / Code Review** | 通过 Pull Request 进行代码审查 / Review code through Pull Requests |
| **CI/CD 集成 / CI/CD Integration** | 自动测试和部署 / Automated testing and deployment |

### 主流 Git 托管平台 / Popular Git Hosting Platforms

| 平台 / Platform | 特点 / Features |
|---|---|
| **GitHub** | 最大的开源社区，Actions CI/CD / Largest open-source community, Actions CI/CD |
| **GitLab** | 内置完整 DevOps 工具链 / Built-in complete DevOps toolchain |
| **Bitbucket** | 与 Atlassian 生态集成 / Integrates with Atlassian ecosystem |
| **Gitee** | 国内访问速度快 / Fast access within China |

---

## git remote — 管理远程仓库 / Managing Remotes

`git remote` 命令用于管理远程仓库的连接。

The `git remote` command manages connections to remote repositories.

### 查看远程仓库 / View Remotes

```bash
# 列出所有远程仓库
# List all remotes
git remote

# 显示详细信息（包含 URL）
# Show detailed info (including URLs)
git remote -v
```

输出示例 / Example output:

```
origin  https://github.com/xiaoming/MyPortfolio.git (fetch)
origin  https://github.com/xiaoming/MyPortfolio.git (push)
```

### 添加远程仓库 / Add a Remote

```bash
# 添加远程仓库，命名为 origin
# Add a remote, named origin
git remote add origin https://github.com/xiaoming/MyPortfolio.git

# 添加第二个远程仓库
# Add a second remote
git remote add upstream https://github.com/original-owner/MyPortfolio.git
```

### 重命名远程仓库 / Rename a Remote

```bash
# 将 origin 重命名为 old-origin
# Rename origin to old-origin
git remote rename origin old-origin
```

### 删除远程仓库 / Remove a Remote

```bash
# 删除名为 old-origin 的远程仓库
# Remove the remote named old-origin
git remote remove old-origin
```

### 查看远程仓库详情 / View Remote Details

```bash
# 查看 origin 的详细信息
# View details of origin
git remote show origin
```

输出示例 / Example output:

```
* remote origin
  Fetch URL: https://github.com/xiaoming/MyPortfolio.git
  Push  URL: https://github.com/xiaoming/MyPortfolio.git
  HEAD branch: main
  Remote branches:
    main    tracked
    develop tracked
  Local branch configured for 'git pull':
    main merges with remote main
```

---

## git push — 推送本地提交 / Pushing Local Commits

`git push` 将本地提交上传到远程仓库。

`git push` uploads local commits to the remote repository.

### 基本推送 / Basic Push

```bash
# 推送当前分支到 origin
# Push current branch to origin
git push

# 推送指定分支
# Push a specific branch
git push origin feature/contact

# 推送所有分支
# Push all branches
git push --all origin
```

### 设置上游分支 / Set Upstream Branch

```bash
# 首次推送时设置上游追踪关系
# Set upstream tracking on first push
git push -u origin feature/contact

# 等同于
# Equivalent to
git push --set-upstream origin feature/contact
```

> **提示 / Tip:** 设置 `-u` 后，以后在该分支上只需输入 `git push` 即可，无需再指定远程和分支名。
>
> After setting `-u`, you only need to type `git push` on that branch — no need to specify the remote and branch name again.

### 强制推送 / Force Push

```bash
# 强制推送（谨慎使用！）
# Force push (use with caution!)
git push --force

# 更安全的强制推送（不会覆盖他人的新提交）
# Safer force push (won't overwrite others' new commits)
git push --force-with-lease
```

> **警告 / Warning:** 永远不要对公共分支（如 main）使用 `--force`！这会覆盖他人的提交。
>
> Never use `--force` on shared branches (like main)! It will overwrite others' commits.

### 推送标签 / Push Tags

```bash
# 推送单个标签
# Push a single tag
git push origin v1.0.0

# 推送所有标签
# Push all tags
git push --tags
```

---

## git fetch vs git pull — 获取与拉取 / Fetch vs Pull

这两个命令都用于从远程仓库获取更新，但行为不同。

Both commands retrieve updates from the remote repository, but they behave differently.

### 对比图 / Comparison Diagram

```
              git fetch                          git pull
         ┌──────────────┐                 ┌──────────────┐
         │              │                 │              │
Remote   │  ●──●──●     │          Remote │  ●──●──●     │
         │        \     │                 │        \     │
         │         \    │                 │         \    │
Local    │  ●──●   ●   │          Local  │  ●──●   ●   │
         │             │                 │              │
         └──────────────┘                 └──────────────┘

    fetch: 只下载，不合并                 pull: 下载 + 自动合并
    fetch: download only,                 pull: download +
           no merge                              auto-merge

    fetch 后你需要手动                    pull 自动将远程更改
    执行 git merge                        合并到当前分支

    After fetch, you need                 pull automatically
    to manually run                       merges remote changes
    git merge                             into current branch
```

### git fetch — 安全地获取更新 / Safely Fetch Updates

```bash
# 从 origin 获取所有更新（不合并）
# Fetch all updates from origin (no merge)
git fetch origin

# 获取指定分支
# Fetch a specific branch
git fetch origin main

# 获取所有远程仓库的更新
# Fetch updates from all remotes
git fetch --all

# fetch 后查看差异
# View differences after fetch
git log HEAD..origin/main --oneline
git diff HEAD origin/main
```

### git pull — 获取并合并 / Fetch and Merge

```bash
# 拉取并合并 origin/main 的更新
# Pull and merge updates from origin/main
git pull

# 等同于 fetch + merge
# Equivalent to fetch + merge
git fetch origin
git merge origin/main

# 使用 rebase 代替 merge
# Use rebase instead of merge
git pull --rebase
```

### 何时使用哪个？/ When to Use Which?

| 场景 / Scenario | 推荐命令 / Recommended Command | 原因 / Reason |
|---|---|---|
| 想先审查再合并 / Review before merge | `git fetch` | 给你控制权 / Gives you control |
| 确定要直接合并 / Sure about merging | `git pull` | 一步完成 / One-step process |
| 保持线性历史 / Keep linear history | `git pull --rebase` | 避免合并提交 / Avoids merge commits |
| 多人协作的分支 / Collaborative branch | `git fetch` | 更安全 / Safer |

---

## git clone — 克隆远程仓库 / Cloning a Remote Repository

`git clone` 是获取远程仓库完整副本的方式。

`git clone` is how you get a complete copy of a remote repository.

### 基本克隆 / Basic Clone

```bash
# 克隆远程仓库
# Clone a remote repository
git clone https://github.com/xiaoming/MyPortfolio.git

# 克隆到指定目录
# Clone into a specific directory
git clone https://github.com/xiaoming/MyPortfolio.git my-project

# 使用 SSH 协议克隆
# Clone using SSH protocol
git clone git@github.com:xiaoming/MyPortfolio.git
```

### 克隆选项 / Clone Options

```bash
# 浅克隆（只获取最近 1 次提交，节省空间）
# Shallow clone (only last commit, saves space)
git clone --depth 1 https://github.com/xiaoming/MyPortfolio.git

# 克隆指定分支
# Clone a specific branch
git clone -b develop https://github.com/xiaoming/MyPortfolio.git

# 克隆后自动设置远程名称
# Auto-set remote name after clone
git clone -o myfork https://github.com/xiaoming/MyPortfolio.git
```

### 克隆后自动设置的内容 / What Clone Sets Up Automatically

```bash
# 克隆后查看远程仓库
# Check remotes after cloning
git remote -v
# origin  https://github.com/xiaoming/MyPortfolio.git (fetch)
# origin  https://github.com/xiaoming/MyPortfolio.git (push)

# 克隆后查看分支
# Check branches after cloning
git branch -a
# * main
#   remotes/origin/main
#   remotes/origin/develop
```

---

## 在 GitHub 上创建仓库 / Setting Up a GitHub Repository

### 步骤 1：在 GitHub 上创建仓库 / Step 1: Create Repository on GitHub

1. 登录 [github.com](https://github.com)
2. 点击右上角 "+" → "New repository"
3. 填写仓库名称：`MyPortfolio`
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize with README"（因为本地已有项目）
6. 点击 "Create repository"

1. Log in to [github.com](https://github.com)
2. Click "+" → "New repository" in the top right
3. Enter repository name: `MyPortfolio`
4. Choose Public or Private
5. **Do NOT** check "Initialize with README" (since we already have a local project)
6. Click "Create repository"

### 步骤 2：关联本地仓库 / Step 2: Link Local Repository

```bash
# 进入本地项目目录
# Navigate to your local project directory
cd MyPortfolio

# 添加远程仓库
# Add the remote repository
git remote add origin https://github.com/xiaoming/MyPortfolio.git

# 验证远程仓库
# Verify the remote
git remote -v
```

### 步骤 3：推送代码 / Step 3: Push Code

```bash
# 确保在 main 分支
# Make sure you're on the main branch
git checkout main

# 推送到远程仓库
# Push to the remote repository
git push -u origin main
```

### 步骤 4：推送功能分支 / Step 4: Push Feature Branches

```bash
# 推送功能分支
# Push feature branches
git checkout feature/contact
git push -u origin feature/contact
```

---

## Fork 与 Pull Request 工作流 / Fork & Pull Request Workflow

Fork & Pull Request 是开源项目最常用的协作方式。

Fork & Pull Request is the most common collaboration workflow for open-source projects.

### 工作流程图 / Workflow Diagram

```
  原始仓库 (upstream)              你的 Fork (origin)           你的本地仓库
  Original Repo                    Your Fork                    Your Local
  ┌────────────────┐            ┌────────────────┐          ┌────────────────┐
  │                │   Fork     │                │  Clone   │                │
  │  main: ●──●   │───────────►│  main: ●──●   │─────────►│  main: ●──●   │
  │                │            │                │          │                │
  │                │            │                │          │ feature: ●    │
  │                │◄───────────│                │◄─────────│    (修改/edit) │
  │                │   PR       │                │   push   │                │
  └────────────────┘            └────────────────┘          └────────────────┘

  1. Fork 原仓库          2. Clone 你的 Fork         3. 创建分支，修改代码
  Fork the repo           Clone your fork            Create branch, make changes

  4. Push 到你的 Fork     5. 创建 Pull Request       6. 代码审查，合并
  Push to your fork       Create a Pull Request      Code review, merge
```

### 详细步骤 / Detailed Steps

```bash
# 1. Fork 仓库（在 GitHub 网页上点击 Fork 按钮）
#    Fork the repo (click Fork button on GitHub)

# 2. 克隆你的 Fork
#    Clone your fork
git clone https://github.com/YOUR-USERNAME/MyPortfolio.git
cd MyPortfolio

# 3. 添加上游仓库
#    Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/MyPortfolio.git

# 4. 创建功能分支
#    Create a feature branch
git checkout -b feature/new-page

# 5. 修改代码并提交
#    Make changes and commit
git add .
git commit -m "feat: 添加新页面 / Add new page"

# 6. 推送到你的 Fork
#    Push to your fork
git push -u origin feature/new-page

# 7. 在 GitHub 上创建 Pull Request
#    Create a Pull Request on GitHub

# 8. 保持 Fork 与原仓库同步
#    Keep your fork synced with upstream
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## 代码审查最佳实践 / Code Review Best Practices

代码审查是保证代码质量的重要环节。

Code review is a critical step for ensuring code quality.

### 提交者（PR 作者）的建议 / Tips for PR Authors

#### 1. 保持 PR 小巧 / Keep PRs Small

```
❌ 一个 PR 包含 50 个文件修改           ✅ 一个 PR 只做一个功能
   One PR with 50 file changes             One PR per feature

   PR: "重构整个项目 + 添加新功能         PR: "feat: 添加联系表单"
       + 修复10个bug + 更新文档"               (3-5 个文件)
```

**理想的 PR 大小 / Ideal PR size:**
- 不超过 400 行代码 / No more than 400 lines of code
- 不超过 10 个文件 / No more than 10 files
- 只做一个逻辑变更 / One logical change only

#### 2. 写有意义的 PR 描述 / Write Meaningful PR Descriptions

```markdown
## 描述 / Description
添加联系表单页面，包含姓名、邮箱和留言字段。
Add a contact form page with name, email, and message fields.

## 变更内容 / Changes
- 新增 contact.html 页面 / Added contact.html page
- 添加表单验证 / Added form validation
- 更新导航栏链接 / Updated navbar links

## 测试方式 / How to Test
1. 打开 contact.html / Open contact.html
2. 提交空表单，验证错误提示 / Submit empty form, verify error messages
3. 填写完整表单，验证提交成功 / Fill complete form, verify successful submission

## 截图 / Screenshots
（附上修改前后的截图 / Attach before/after screenshots）
```

#### 3. 自我审查 / Self-review First

在请求他人审查前，先自己审查一遍：
- 检查是否有遗漏的文件
- 确保没有调试代码或 `console.log`
- 确保测试通过

Before requesting review, review your own code first:
- Check for missed files
- Remove debug code or `console.log`
- Ensure tests pass

### 审查者的建议 / Tips for Reviewers

#### 1. 及时响应 / Be Responsive

- 尽量在 24 小时内完成审查 / Try to review within 24 hours
- 如果无法及时审查，告知提交者预计时间 / If delayed, let the author know your timeline

#### 2. 建设性反馈 / Constructive Feedback

```
❌ "这段代码很糟糕"
   "This code is terrible"

✅ "这个函数可以考虑拆分成两个更小的函数，提高可读性。
    例如，把数据获取和数据处理分开。"
   "Consider splitting this function into two smaller ones
    for better readability. E.g., separate data fetching
    from data processing."
```

#### 3. 区分必须修改和建议修改 / Distinguish Must-fix vs Nice-to-have

```
🔴 必须修改 / Must fix: "这里有个 bug，空指针会导致页面崩溃"
                       "There's a bug, null pointer will crash the page"

🟡 建议修改 / Suggestion: "可以考虑用 CSS Grid 代替 Flexbox，布局会更清晰"
                          "Consider CSS Grid over Flexbox for clearer layout"

🟢 可选 / Optional: "变量名 userInput 可以改为 contactFormData，更语义化"
                    "Variable userInput could be contactFormData for clarity"
```

---

## 分支保护规则 / Branch Protection Rules

分支保护规则防止意外修改重要分支。

Branch protection rules prevent accidental changes to important branches.

### 推荐的 main 分支保护规则 / Recommended Protection Rules for main

在 GitHub 仓库设置中配置：

Configure in GitHub repository settings:

```
Settings → Branches → Add rule

Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1 (至少 1 人批准 / At least 1 approval)
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  ☑ Status checks: CI/build, lint, test

☑ Require conversation resolution before merging

☑ Do not allow force pushes
☑ Do not allow deletions
```

### 保护规则的作用 / What Protection Rules Do

| 规则 / Rule | 作用 / Effect |
|---|---|
| **Require PR** | 不能直接 push 到 main / Cannot push directly to main |
| **Require approvals** | 至少需要 1 人审查通过 / At least 1 reviewer must approve |
| **Require status checks** | CI 测试必须通过 / CI tests must pass |
| **Require up-to-date** | 分支必须是最新的 / Branch must be up to date |
| **No force push** | 禁止强制推送 / Forbid force pushes |
| **No deletion** | 禁止删除分支 / Forbid branch deletion |

---

## Upstream vs Origin

在 Fork 工作流中，理解 upstream 和 origin 的区别很重要。

In the Fork workflow, understanding the difference between upstream and origin is important.

```
                    upstream (原始仓库)
                    Original repository
                    ┌─────────────────────────┐
                    │ github.com/org/project   │
                    │                         │
                    │  这是项目的"官方"仓库    │
                    │  This is the "official"  │
                    │  repository              │
                    └──────────┬──────────────┘
                               │
              Fork (创建副本)   │   Fork (create a copy)
                               │
                    ┌──────────▼──────────────┐
                    │  origin (你的 Fork)      │
                    │  Your Fork               │
                    │  github.com/you/project  │
                    │                         │
                    │  你有完整的写入权限       │
                    │  You have full write     │
                    │  access                  │
                    └──────────┬──────────────┘
                               │
              Clone (克隆到本地)│   Clone to local
                               │
                    ┌──────────▼──────────────┐
                    │  本地仓库 / Local Repo   │
                    │                         │
                    │  日常开发在这里进行       │
                    │  Daily development       │
                    │  happens here            │
                    └─────────────────────────┘
```

### 常用操作 / Common Operations

```bash
# 查看远程仓库
# View remotes
git remote -v
# origin    https://github.com/you/project.git (fetch)
# origin    https://github.com/you/project.git (push)
# upstream  https://github.com/org/project.git (fetch)
# upstream  https://github.com/org/project.git (push)

# 从 upstream 获取最新代码
# Fetch latest from upstream
git fetch upstream

# 将 upstream/main 合并到本地 main
# Merge upstream/main into local main
git checkout main
git merge upstream/main

# 推送到你的 origin
# Push to your origin
git push origin main
```

---

## 实战：推送 MyPortfolio 到 GitHub / Step-by-Step: Push MyPortfolio to GitHub

让我们将 MyPortfolio 项目推送到 GitHub。

Let's push the MyPortfolio project to GitHub.

### 步骤 1：确保本地仓库状态良好 / Step 1: Ensure Clean Local State

```bash
# 检查状态
# Check status
git status

# 确保所有修改已提交
# Make sure all changes are committed
git add .
git commit -m "chore: 准备推送到远程仓库 / Prepare for remote push"
```

### 步骤 2：创建 GitHub 仓库 / Step 2: Create GitHub Repository

在 GitHub 上创建名为 `MyPortfolio` 的空仓库（不勾选 README）。

Create an empty repository named `MyPortfolio` on GitHub (no README checkbox).

### 步骤 3：添加远程并推送 / Step 3: Add Remote and Push

```bash
# 添加远程仓库
# Add remote repository
git remote add origin https://github.com/xiaoming/MyPortfolio.git

# 推送 main 分支
# Push main branch
git push -u origin main

# 推送所有分支
# Push all branches
git push --all origin
```

### 步骤 4：验证推送结果 / Step 4: Verify Push

```bash
# 查看远程仓库信息
# View remote info
git remote show origin

# 查看推送历史
# View push history
git log --oneline --all
```

### 步骤 5：创建功能分支 PR / Step 5: Create Feature Branch PR

```bash
# 创建并推送功能分支
# Create and push a feature branch
git checkout -b feature/contact-page
# ... 修改代码 / make changes ...
git add .
git commit -m "feat: 添加联系页面 / Add contact page"
git push -u origin feature/contact-page

# 然后在 GitHub 上创建 Pull Request
# Then create a Pull Request on GitHub
```

### 完整的 Git 协作流程图 / Complete Git Collaboration Workflow

```
  1. Clone              2. Branch             3. Code
  ┌────────┐           ┌────────┐            ┌────────┐
  │ git    │           │ git    │            │ 编辑   │
  │ clone  │──────────►│checkout│───────────►│ 文件   │
  │        │           │ -b     │            │        │
  └────────┘           └────────┘            └───┬────┘
                                                 │
  6. PR               5. Push              4. Commit
  ┌────────┐           ┌────────┐            ┌────▼───┐
  │ GitHub │           │ git    │            │ git    │
  │ PR     │◄──────────│ push   │◄───────────│ add    │
  │ Review │           │        │            │ commit │
  └────────┘           └────────┘            └────────┘
```

---

## 练习 / Exercises

### 练习 1：推送本地仓库到 GitHub / Exercise 1: Push Local Repo to GitHub

1. 在 GitHub 上创建一个空仓库 `MyPortfolio`
2. 将本地的 MyPortfolio 仓库关联到 GitHub
3. 推送 main 分支
4. 在浏览器中验证代码已上传

1. Create an empty `MyPortfolio` repository on GitHub
2. Link your local MyPortfolio repo to GitHub
3. Push the main branch
4. Verify the code is uploaded in your browser

### 练习 2：模拟 fetch 和 pull 的区别 / Exercise 2: Compare fetch vs pull

```bash
# 1. 在 GitHub 网页上直接编辑 README.md
#    Edit README.md directly on GitHub website

# 2. 在本地执行 fetch
#    Run fetch locally
git fetch origin

# 3. 查看差异（不会自动合并）
#    View differences (no auto-merge)
git diff HEAD origin/main

# 4. 手动合并
#    Merge manually
git merge origin/main

# 5. 再次在 GitHub 上编辑
#    Edit on GitHub again

# 6. 这次使用 pull（自动合并）
#    This time use pull (auto-merge)
git pull origin main
```

### 练习 3：Fork 和 Pull Request / Exercise 3: Fork and Pull Request

1. Fork 一个同学的 MyPortfolio 仓库
2. Clone 你的 Fork 到本地
3. 创建功能分支，添加一个新页面
4. Push 到你的 Fork
5. 创建 Pull Request 给原仓库

1. Fork a classmate's MyPortfolio repository
2. Clone your fork locally
3. Create a feature branch, add a new page
4. Push to your fork
5. Create a Pull Request to the original repo

### 练习 4：配置分支保护规则 / Exercise 4: Configure Branch Protection

1. 在 GitHub 上为你的仓库配置 main 分支保护规则
2. 尝试直接 push 到 main（应该被拒绝）
3. 通过 PR 方式提交修改

1. Configure branch protection rules for main on GitHub
2. Try to push directly to main (should be rejected)
3. Submit changes via a Pull Request

### 练习 5：模拟多人协作 / Exercise 5: Simulate Team Collaboration

与一位伙伴合作：
1. 互相添加为 collaborator
2. 各自创建不同的功能分支
3. 分别创建 PR
4. 互相审查对方的 PR
5. 审查通过后合并

Work with a partner:
1. Add each other as collaborators
2. Each create different feature branches
3. Each create a PR
4. Review each other's PRs
5. Merge after approval

---

## 本章小结 / Chapter Summary

| 命令 / Command | 用途 / Purpose |
|---|---|
| `git remote` | 管理远程仓库连接 / Manage remote connections |
| `git remote add <name> <url>` | 添加远程仓库 / Add a remote |
| `git clone <url>` | 克隆远程仓库 / Clone a remote repository |
| `git push` | 推送本地提交到远程 / Push local commits to remote |
| `git push -u origin <branch>` | 推送并设置上游追踪 / Push and set upstream tracking |
| `git fetch` | 从远程获取更新（不合并）/ Fetch updates (no merge) |
| `git pull` | 获取并合并远程更新 / Fetch and merge remote updates |
| `git pull --rebase` | 获取并 rebase（保持线性历史）/ Fetch and rebase (linear history) |

---

## 导航 / Navigation

| 上一章 / Previous Chapter | 下一章 / Next Chapter |
|---|---|
| [Chapter 03: 合并冲突与解决 / Conflict Resolution](../03-conflict-resolution/README.md) | [Chapter 05: Rebase 变基 / Rebase](../05-rebase/README.md) |

[返回总目录 / Back to Table of Contents](../README.md)
