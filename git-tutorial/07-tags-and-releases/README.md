# Chapter 07: 标签与版本发布 / Tags & Releases

> **前置要求 / Prerequisites:** 完成 Chapter 06（Cherry-pick 与 Stash）/ Complete Chapter 06 (Cherry-pick & Stash)
>
> **预计时间 / Estimated Time:** 40 分钟 / 40 minutes

---

## 目录 / Table of Contents

1. [什么是标签？/ What Are Tags?](#什么是标签--what-are-tags)
2. [轻量标签 vs 附注标签 / Lightweight vs Annotated Tags](#轻量标签-vs-附注标签--lightweight-vs-annotated-tags)
3. [查看与检出标签 / Viewing & Checking Out Tags](#查看与检出标签--viewing--checking-out-tags)
4. [推送与删除标签 / Pushing & Deleting Tags](#推送与删除标签--pushing--deleting-tags)
5. [语义化版本控制 / Semantic Versioning (SemVer)](#语义化版本控制--semantic-versioning-semver)
6. [GitHub Releases / GitHub Releases](#github-releases--github-releases)
7. [CHANGELOG 最佳实践 / CHANGELOG Best Practices](#changelog-最佳实践--changelog-bestpractices)
8. [实战：为 MyPortfolio 发布 v1.0.0 / Step-by-Step: Tag MyPortfolio v1.0.0](#实战为-myportfolio-发布-v100--step-by-step-tag-myportfolio-v100)
9. [练习 / Exercises](#练习--exercises)

---

## 什么是标签？/ What Are Tags?

标签（Tag）是 Git 中用来**标记特定提交**的引用，通常用于标记版本发布点（如 v1.0、v2.0）。与分支不同，标签是**不可变的**——一旦创建，就不会随新提交而移动。

A tag is a Git reference used to **mark a specific commit**, typically to denote a release point (e.g., v1.0, v2.0). Unlike branches, tags are **immutable** — once created, they don't move with new commits.

```
  标签概念 / Tag concept:

  main:   ●──●──●──●──●──●──●──●──●
                ^           ^
              v0.1        v1.0
           (标签/tag)    (标签/tag)

  v0.1 永远指向那个特定的提交
  v0.1 always points to that specific commit
```

### 为什么使用标签？/ Why Use Tags?

- **标记发布版本 / Mark releases:** 清楚地标记每次发布的代码状态
- **方便回溯 / Easy rollback:** 随时可以回到某个发布版本检查代码
- **构建与部署 / Build & deploy:** CI/CD 管道通常基于标签触发自动部署
- **版本记录 / Version history:** 提供项目的版本演进时间线

---

## 轻量标签 vs 附注标签 / Lightweight vs Annotated Tags

Git 有两种标签：

Git has two types of tags:

### 轻量标签 / Lightweight Tags

轻量标签只是一个指向提交的简单引用，类似于一个不会改变的分支指针。

A lightweight tag is just a simple reference to a commit, similar to a branch pointer that never moves.

```bash
# 创建轻量标签 / Create a lightweight tag
git tag v1.0

# 轻量标签不包含作者信息和消息
# Lightweight tags don't contain author info or message
git show v1.0
# 只显示提交信息 / Only shows the commit info
```

### 附注标签 / Annotated Tags

附注标签是 Git 数据库中的完整对象，包含作者信息、日期、标签消息，并且可以被 GPG 签名。**发布版本时推荐使用附注标签。**

Annotated tags are full objects in the Git database, containing author info, date, tag message, and can be GPG-signed. **Annotated tags are recommended for releases.**

```bash
# 创建附注标签 / Create an annotated tag
git tag -a v1.0 -m "Release v1.0 - MyPortfolio 首个正式发布"

# 查看标签详情 / View tag details
git show v1.0
# tag v1.0
# Tagger: Your Name <your@email.com>
# Date:   Wed Jun 25 10:00:00 2026 +0800
#
# Release v1.0 - MyPortfolio 首个正式发布
#
# commit abc1234...
```

### 对比 / Comparison

| 特性 / Feature | 轻量标签 / Lightweight | 附注标签 / Annotated |
|---|---|---|
| 存储方式 / Storage | 简单引用 / Simple ref | 完整对象 / Full object |
| 作者信息 / Author info | 无 / No | 有 / Yes |
| 标签消息 / Tag message | 无 / No | 有 / Yes |
| GPG 签名 / GPG signing | 不支持 / Not supported | 支持 / Supported |
| 推荐场景 / Recommended for | 临时标记 / Temporary marks | 版本发布 / Releases |

---

## 查看与检出标签 / Viewing & Checking Out Tags

### 查看标签 / Viewing Tags

```bash
# 列出所有标签 / List all tags
git tag -l
# v0.1.0
# v0.2.0
# v1.0.0

# 使用通配符过滤 / Filter with wildcards
git tag -l "v1.*"
# v1.0.0
# v1.1.0

# 查看标签详情 / View tag details
git show v1.0.0

# 查看标签指向的提交 / View the commit a tag points to
git rev-parse v1.0.0
```

### 检出标签 / Checking Out Tags

```bash
# 检出标签（进入 detached HEAD 状态）
# Check out a tag (enters detached HEAD state)
git checkout v1.0.0
# Note: checking out 'v1.0.0'.
# You are in 'detached HEAD' state...

# 如果要基于标签做修改，创建新分支
# To make changes based on a tag, create a new branch
git checkout -b hotfix/v1.0-patch v1.0.0
```

> **注意 / Note:** 检出标签后会进入 "detached HEAD" 状态，此时你的改动不会属于任何分支。如果需要修改，务必创建新分支。
>
> **Note:** Checking out a tag puts you in "detached HEAD" state. Your changes won't belong to any branch. Always create a new branch if you need to make modifications.

---

## 推送与删除标签 / Pushing & Deleting Tags

### 推送标签 / Pushing Tags

标签默认不会随 `git push` 推送到远程，需要手动推送：

Tags are NOT pushed to remote by default with `git push`. You must push them explicitly:

```bash
# 推送单个标签 / Push a single tag
git push origin v1.0.0

# 推送所有标签 / Push all tags
git push --tags

# 推送所有标签（推荐）/ Push all tags (recommended)
git push origin --tags
```

### 删除标签 / Deleting Tags

```bash
# 删除本地标签 / Delete a local tag
git tag -d v1.0.0

# 删除远程标签 / Delete a remote tag
git push origin --delete v1.0.0

# 或者使用旧语法 / Or using the older syntax
git push origin :refs/tags/v1.0.0
```

---

## 语义化版本控制 / Semantic Versioning (SemVer)

语义化版本控制（SemVer）是一种广泛使用的版本号规范，格式为：

Semantic Versioning (SemVer) is a widely adopted version numbering scheme with the format:

```
MAJOR.MINOR.PATCH
```

| 部分 / Part | 含义 / Meaning | 何时递增 / When to Increment |
|---|---|---|
| **MAJOR** | 主版本号 | 不兼容的 API 变更 / Breaking changes |
| **MINOR** | 次版本号 | 向下兼容的新功能 / Backward-compatible new features |
| **PATCH** | 修订号 | 向下兼容的 bug 修复 / Backward-compatible bug fixes |

### MyPortfolio 版本里程碑示例 / MyPortfolio Version Milestones

```
v0.1.0  — 初始项目骨架 / Initial project scaffold
v0.2.0  — 添加首页和导航 / Add homepage and navigation
v0.3.0  — 添加关于页面 / Add about page
v0.4.0  — 添加联系表单 / Add contact form
v0.5.0  — 项目展示功能 / Project showcase feature
v0.9.0  — 响应式适配完成 / Responsive design complete
v1.0.0  — 首个正式发布版本！/ First official release!

后续发布 / Subsequent releases:
v1.0.1  — 修复联系表单提交 bug / Fix contact form submission bug
v1.1.0  — 添加暗色主题 / Add dark theme
v1.2.0  — 添加博客功能 / Add blog feature
v2.0.0  — 完全重构为 React / Full rewrite to React (breaking change)
```

### 预发布版本 / Pre-release Versions

```bash
# Alpha 版本 / Alpha release
git tag -a v1.0.0-alpha.1 -m "Alpha preview"

# Beta 版本 / Beta release
git tag -a v1.0.0-beta.1 -m "Beta testing"

# Release Candidate / 发布候选
git tag -a v1.0.0-rc.1 -m "Release candidate 1"
```

---

## GitHub Releases / GitHub Releases

GitHub Releases 是基于 Git 标签构建的发布管理功能，提供：

GitHub Releases are built on top of Git tags and provide:

- 可下载的源代码压缩包 / Downloadable source code archives
- 发布说明（Release Notes）/ Release notes
- 附加二进制文件（如构建产物）/ Attached binaries (e.g., build artifacts)
- 预发布标记 / Pre-release marking

### 创建 GitHub Release / Creating a GitHub Release

```bash
# 方式一：通过 GitHub 网页界面
# Method 1: Via GitHub web UI
# 1. 前往仓库的 Releases 页面
# 1. Go to your repo's Releases page
# https://github.com/username/MyPortfolio/releases
# 2. 点击 "Create a new release"
# 2. Click "Create a new release"
# 3. 选择已有标签或创建新标签
# 3. Choose an existing tag or create a new one
# 4. 填写发布说明 / Fill in release notes
# 5. 点击 "Publish release"
# 5. Click "Publish release"

# 方式二：使用 GitHub CLI
# Method 2: Using GitHub CLI
gh release create v1.0.0 \
  --title "MyPortfolio v1.0.0" \
  --notes "首个正式发布版本 / First official release"
```

---

## CHANGELOG 最佳实践 / CHANGELOG Best Practices

CHANGELOG 文件记录了项目所有版本的重要变更，是用户和贡献者了解项目演进的重要文档。

A CHANGELOG file records all significant changes across project versions. It's an important document for users and contributors to understand project evolution.

### 推荐格式 / Recommended Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - 2026-06-25

### Added / 新增
- 首页展示 / Homepage display
- 关于页面 / About page
- 联系表单 / Contact form
- 项目展示画廊 / Project showcase gallery
- 响应式设计 / Responsive design

### Fixed / 修复
- 导航栏移动端适配 / Navbar mobile adaptation

## [v0.5.0] - 2026-06-10

### Added / 新增
- 项目展示功能 / Project showcase feature
- CSS 动画效果 / CSS animation effects
```

### 分类标准 / Categories

| 分类 / Category | 用途 / Purpose |
|---|---|
| **Added** | 新增功能 / New features |
| **Changed** | 功能变更 / Changes to existing features |
| **Deprecated** | 即将移除的功能 / Soon-to-be-removed features |
| **Removed** | 已移除的功能 / Removed features |
| **Fixed** | Bug 修复 / Bug fixes |
| **Security** | 安全相关修复 / Security-related fixes |

---

## 实战：为 MyPortfolio 发布 v1.0.0 / Step-by-Step: Tag MyPortfolio v1.0.0

以下是为 MyPortfolio 项目创建 v1.0.0 标签并发布 GitHub Release 的完整流程：

Here is the complete workflow to tag MyPortfolio v1.0.0 and create a GitHub Release:

```bash
# 1. 确保所有改动已提交 / Ensure all changes are committed
git status
# working tree clean

# 2. 确保在 main 分支且代码是最新的 / Make sure you're on main and up to date
git checkout main
git pull origin main

# 3. 运行测试（如果有）/ Run tests (if available)
npm test

# 4. 更新 CHANGELOG.md / Update CHANGELOG.md
# 编辑 CHANGELOG.md，添加 v1.0.0 的变更记录
# Edit CHANGELOG.md, add v1.0.0 change entries
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.0.0 release"

# 5. 创建附注标签 / Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0 - MyPortfolio 首个正式发布版本"

# 6. 验证标签 / Verify the tag
git tag -l
# v0.1.0
# v0.5.0
# v1.0.0    ← 新创建的 / newly created

git show v1.0.0
# 确认标签信息正确 / Confirm tag info is correct

# 7. 推送代码和标签 / Push code and tag
git push origin main
git push origin v1.0.0

# 8. 创建 GitHub Release / Create GitHub Release
gh release create v1.0.0 \
  --title "MyPortfolio v1.0.0 - 首个正式发布 / First Official Release" \
  --notes "## 新增功能 / Features
- 首页展示 / Homepage
- 关于页面 / About page
- 联系表单 / Contact form
- 项目展示 / Project showcase
- 响应式设计 / Responsive design"
```

---

## 练习 / Exercises

### 练习 1：创建版本标签 / Exercise 1: Create Version Tags

```bash
# 1. 查看项目的提交历史 / View commit history
git log --oneline

# 2. 为某个历史提交创建附注标签 / Create annotated tag for a past commit
git tag -a v0.1.0 <some-old-commit-hash> -m "Initial prototype / 初始原型"

# 3. 为最新提交创建 v1.0.0 标签 / Tag the latest commit as v1.0.0
git tag -a v1.0.0 -m "First stable release / 首个稳定版本"

# 4. 比较两个标签之间的差异 / Compare differences between two tags
git diff v0.1.0..v1.0.0 --stat
git log v0.1.0..v1.0.0 --oneline
```

### 练习 2：基于标签创建热修复分支 / Exercise 2: Create Hotfix Branch from Tag

```bash
# 1. 假设 v1.0.0 发布后发现了一个 bug
# Assume a bug was found after v1.0.0 release

# 2. 从标签创建热修复分支 / Create hotfix branch from tag
git checkout -b hotfix/v1.0.1 v1.0.0

# 3. 修复 bug 并提交 / Fix bug and commit
# 编辑相关文件 / Edit relevant files
git add .
git commit -m "fix: resolve post-launch bug / 修复上线后发现的 bug"

# 4. 创建补丁版本标签 / Create patch version tag
git tag -a v1.0.1 -m "Hotfix: post-launch bug fix / 热修复"

# 5. 推送修复和标签 / Push fix and tag
git push origin hotfix/v1.0.1
git push origin v1.0.1

# 6. 将修复合并回 main / Merge fix back to main
git checkout main
git merge hotfix/v1.0.1
git push origin main
```

### 练习 3：创建 CHANGELOG 和 GitHub Release / Exercise 3: Create CHANGELOG and GitHub Release

```bash
# 1. 在项目根目录创建 CHANGELOG.md
# Create CHANGELOG.md in project root
# 记录 v0.1.0 到 v1.0.0 的所有重要变更
# Document all important changes from v0.1.0 to v1.0.0

# 2. 提交 CHANGELOG / Commit CHANGELOG
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md with full release history"

# 3. 查看两个标签间的提交来生成发布说明
# View commits between tags to generate release notes
git log v0.5.0..v1.0.0 --pretty=format:"- %s" --reverse

# 4. 使用 GitHub CLI 创建 Release
# Create a Release using GitHub CLI
gh release create v1.0.0 --generate-notes
```

---

## 常用命令速查 / Command Quick Reference

| 命令 / Command | 说明 / Description |
|---|---|
| `git tag -l` | 列出所有标签 / List all tags |
| `git tag v1.0` | 创建轻量标签 / Create lightweight tag |
| `git tag -a v1.0 -m "msg"` | 创建附注标签 / Create annotated tag |
| `git show v1.0` | 查看标签详情 / View tag details |
| `git push origin v1.0` | 推送单个标签 / Push a single tag |
| `git push --tags` | 推送所有标签 / Push all tags |
| `git tag -d v1.0` | 删除本地标签 / Delete local tag |
| `git push origin --delete v1.0` | 删除远程标签 / Delete remote tag |
| `git checkout v1.0` | 检出标签 / Check out a tag |
| `git diff v1.0..v2.0` | 比较两个标签 / Compare two tags |

---

## 导航 / Navigation

- **上一章 / Previous Chapter:** [Chapter 06: Cherry-pick 与 Stash / Cherry-pick & Stash](../06-cherry-pick-and-stash/README.md)
- **下一章 / Next Chapter:** [Chapter 08: Git 钩子与自动化 / Git Hooks & Automation](../08-git-hooks/README.md)
- **返回目录 / Back to Index:** [首页 / Home](../README.md)
