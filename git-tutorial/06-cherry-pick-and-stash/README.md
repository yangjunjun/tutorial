# Chapter 06: Cherry-pick 与 Stash / Cherry-pick & Stash

> **前置要求 / Prerequisites:** 完成 Chapter 05（Rebase 变基）/ Complete Chapter 05 (Rebase)
>
> **预计时间 / Estimated Time:** 45 分钟 / 45 minutes

---

## 目录 / Table of Contents

1. [git cherry-pick 基本用法 / Basic Usage](#git-cherry-pick-基本用法--basic-usage)
2. [Cherry-pick 多个提交 / Cherry-picking Multiple Commits](#cherry-pick-多个提交--cherry-picking-multiple-commits)
3. [审查后再提交 / Review Before Committing](#审查后再提交--review-before-committing)
4. [实战：将热修复应用到发布分支 / Scenario: Hotfix to Release Branch](#实战将热修复应用到发布分支--scenario-hotfix-to-release-branch)
5. [git stash 基本用法 / Basic Usage](#git-stash-基本用法--basic-usage)
6. [管理 stash 栈 / Managing the Stash Stack](#管理-stash-栈--managing-the-stash-stack)
7. [高级 stash 用法 / Advanced Stash Usage](#高级-stash-用法--advanced-stash-usage)
8. [实战：紧急切换分支修 bug / Scenario: Urgent Branch Switch](#实战紧急切换分支修-bug--scenario-urgent-branch-switch)
9. [练习 / Exercises](#练习--exercises)

---

## git cherry-pick 基本用法 / Basic Usage

### 什么是 cherry-pick？/ What is Cherry-pick?

Cherry-pick 允许你从另一个分支中**挑选特定的一个或多个提交**，并将它们应用到你当前的分支上。与 merge 或 rebase 不同，cherry-pick 不会整合整个分支——它只选取你想要的那部分。

Cherry-pick lets you **pick specific commit(s)** from another branch and apply them to your current branch. Unlike merge or rebase, cherry-pick doesn't integrate the entire branch — it only takes exactly what you want.

### 何时使用 / When to Use

- 某个分支上修复了一个 bug，你需要将该修复也应用到其他分支
- 只想要某个分支上部分提交的改动，而非全部
- A bug fix was made on one branch and you need it on another
- You want only specific commits from a branch, not all changes

### 基本命令 / Basic Command

```bash
# 挑选单个提交 / Pick a single commit
git cherry-pick <commit-hash>

# 示例 / Example
git log --oneline main
# a1b2c3d fix: 修复导航栏在移动端的溢出问题 / Fix navbar overflow on mobile

# 当前在 release 分支，需要这个修复
# Currently on release branch, need this fix
git cherry-pick a1b2c3d
```

执行后，Git 会在当前分支创建一个新的提交，内容与原提交完全相同（但 commit hash 不同）。

After execution, Git creates a new commit on the current branch with the same changes (but a different commit hash).

### Cherry-pick 概念图 / Cherry-pick Concept Diagram

```
  操作前 / Before:

  main:       ●──●──●──A──●       (A = bug fix commit)
                      \
  release:             ●──●──●    (需要这个修复 / needs the fix)

  在 release 分支上执行 / On release branch:
  git cherry-pick A

  操作后 / After:

  main:       ●──●──●──A──●
                      \
  release:             ●──●──●──A'   (A' = A 的副本 / copy of A)

  注意：A' 是一个新提交，内容与 A 相同，但 hash 不同
  Note: A' is a new commit with the same changes as A, but a different hash
```

---

## Cherry-pick 多个提交 / Cherry-picking Multiple Commits

你可以一次挑选多个提交：

You can pick multiple commits at once:

```bash
# 挑选多个不连续的提交 / Pick multiple non-contiguous commits
git cherry-pick <hash1> <hash2> <hash3>

# 挑选一个范围内的提交（不包含 start，包含 end）
# Pick a range of commits (excludes start, includes end)
git cherry-pick <start-hash>..<end-hash>

# 示例 / Example
git cherry-pick a1b2c3d e4f5g6h

# 示例：挑选连续三个提交（b, c, d）
# Example: Pick three consecutive commits (b, c, d)
git cherry-pick b1b1b1b..d4d4d4d
```

---

## 审查后再提交 / Review Before Committing

使用 `--no-commit`（或 `-n`）选项可以将改动放到暂存区而不自动提交，这样你可以在提交前审查改动：

Use the `--no-commit` (or `-n`) flag to stage changes without auto-committing, so you can review before committing:

```bash
# 只暂存，不提交 / Stage only, don't commit
git cherry-pick --no-commit <commit-hash>

# 审查改动 / Review changes
git diff --cached

# 确认没问题后提交 / Commit when satisfied
git commit -m "chore: cherry-pick CSS fix from main"
```

> **提示 / Tip:** 当你需要修改提交消息，或者想合并多个 cherry-pick 的改动为一个提交时，`--no-commit` 非常有用。
>
> **Tip:** `--no-commit` is useful when you want to modify the commit message or combine multiple cherry-picked changes into a single commit.

---

## 实战：将热修复应用到发布分支 / Scenario: Hotfix to Release Branch

### 场景描述 / Scenario

你在 MyPortfolio 项目的 `main` 分支上修复了一个 CSS 紧急 bug（导航栏在小屏幕上溢出）。现在需要将该修复也应用到正在准备发布的 `release/v1.0` 分支。

You fixed an urgent CSS bug on the `main` branch of MyPortfolio (navbar overflows on small screens). Now you need to apply that fix to the `release/v1.0` branch too.

```bash
# 1. 在 main 分支上修复 bug / Fix the bug on main
git checkout main
# 编辑 CSS 修复导航栏溢出 / Edit CSS to fix navbar overflow
git add src/style.css
git commit -m "fix(navbar): resolve overflow issue on mobile screens"
# 提交 hash: abc1234

# 2. 切换到 release 分支 / Switch to release branch
git checkout release/v1.0

# 3. Cherry-pick 该修复 / Cherry-pick the fix
git cherry-pick abc1234

# 4. 验证修复已生效 / Verify the fix is applied
git log --oneline -3
# 你应该能看到 cherry-pick 过来的提交
# You should see the cherry-picked commit

# 5. 推送到远程 / Push to remote
git push origin release/v1.0
```

---

## git stash 基本用法 / Basic Usage

### 什么是 stash？/ What is Stash?

Stash（储藏）是 Git 提供的一种机制，用于**临时保存**你当前工作目录中未完成的改动（已暂存和未暂存的），让你的工作区恢复干净状态，以便切换分支或执行其他操作。之后你可以随时恢复这些改动。

Stash is a Git mechanism to **temporarily save** uncommitted changes (both staged and unstaged) in your working directory. It restores your working area to a clean state so you can switch branches or perform other operations. You can restore these changes at any time.

### 基本命令 / Basic Commands

```bash
# 保存当前所有改动（已跟踪的文件）
# Save all current changes (tracked files)
git stash

# 保存时添加描述信息 / Save with a descriptive message
git stash save "正在开发画廊功能 / working on gallery feature"

# 查看 stash 列表 / View stash stack
git stash list
# stash@{0}: WIP on feature/gallery: a1b2c3d add project cards
# stash@{1}: On main: 修复导航 / fixing navbar

# 恢复最新的 stash 并从栈中移除
# Apply the latest stash and remove it from the stack
git stash pop

# 恢复指定的 stash / Apply a specific stash
git stash pop stash@{1}

# 恢复但不移除 / Apply without removing
git stash apply

# 恢复指定的 stash 但不移除 / Apply specific stash without removing
git stash apply stash@{0}

# 删除一个 stash / Drop a stash
git stash drop stash@{1}

# 清空所有 stash / Clear all stashes
git stash clear
```

### Stash 概念图 / Stash Concept Diagram

```
  正在开发功能 / Working on a feature:

  working dir:  [index.html*] [app.js*] [new-feature.js?]
                 已修改         已修改      新文件(未跟踪)
                 modified       modified    new(untracked)

  git stash
  ─────────────────────────────────────────> stash@{0}
                                             ┌─────────────┐
  working dir:  [index.html] [app.js]        │ index.html*  │
                 干净状态      干净状态        │ app.js*      │
                 clean        clean          └─────────────┘

  git stash pop
  <─────────────────────────────────────────  stash@{0} 被删除
                                              stash@{0} removed
  working dir:  [index.html*] [app.js*]
                 恢复改动      恢复改动
                 restored      restored
```

---

## 管理 stash 栈 / Managing the Stash Stack

Stash 以栈（stack）的方式管理，最新的 stash 在最上面（索引为 0）：

Stashes are managed as a stack — the newest stash is on top (index 0):

```bash
# 查看所有 stash / View all stashes
git stash list
# stash@{0}: WIP on feature/gallery: abc1234 add images
# stash@{1}: WIP on feature/contact: def5678 form validation
# stash@{2}: On main: 紧急修复 / hotfix

# 查看某个 stash 的详细改动 / View detailed changes in a stash
git stash show stash@{0}

# 查看某个 stash 的完整 diff / View full diff of a stash
git stash show -p stash@{0}
```

---

## 高级 stash 用法 / Advanced Stash Usage

### 包含未跟踪文件 / Include Untracked Files

默认情况下 `git stash` 只保存已跟踪文件的改动。使用 `-u` 可以一并保存新创建的未跟踪文件：

By default, `git stash` only saves changes to tracked files. Use `-u` to also include newly created untracked files:

```bash
# 包含未跟踪文件 / Include untracked files
git stash -u

# 示例 / Example
# 你新建了一个文件 new-component.js 但还没有 git add
# You created new-component.js but haven't git add yet
git stash -u
# 现在 new-component.js 也被保存了
# Now new-component.js is also saved
```

### 从 stash 创建新分支 / Create Branch from Stash

当你 stash 了改动后，发现这些改动应该在一个新分支上继续开发：

When you stashed changes and realize they should continue on a new branch:

```bash
# 基于 stash 创建新分支 / Create a new branch from a stash
git stash branch feature/new-gallery stash@{0}

# 这会：
# 1. 从创建 stash 时所在的提交创建新分支
# 2. 将 stash 中的改动应用到新分支
# 3. 自动删除该 stash
# This will:
# 1. Create a new branch from the commit where the stash was made
# 2. Apply the stashed changes to the new branch
# 3. Automatically drop the stash
```

---

## 实战：紧急切换分支修 bug / Scenario: Urgent Branch Switch

### 场景描述 / Scenario

你正在 MyPortfolio 的 `feature/gallery` 分支上开发画廊功能，代码改了一半，文件处于混乱状态。突然收到一个紧急 bug 报告：`main` 分支的联系表单无法提交。你需要：

You're working on the gallery feature on `feature/gallery` branch of MyPortfolio. Your files are in a messy, half-done state. Suddenly, an urgent bug report arrives: the contact form on `main` can't submit. You need to:

1. Stash 当前工作 / Stash current work
2. 切换到 main 修 bug / Switch to main and fix the bug
3. 切回功能分支继续开发 / Switch back and resume work

```bash
# 1. 保存当前未完成的工作 / Save current unfinished work
git stash -m "画廊功能开发到一半 / gallery feature WIP"

# 确认工作区干净 / Confirm working area is clean
git status
# nothing to commit, working tree clean

# 2. 切换到 main 分支修 bug / Switch to main to fix the bug
git checkout main
git pull origin main

# 创建热修复分支 / Create hotfix branch
git checkout -b hotfix/contact-form

# 修复并提交 / Fix and commit
# 编辑 contact.html 中的表单提交逻辑
# Edit form submission logic in contact.html
git add src/contact.html
git commit -m "fix(contact): resolve form submission failure"

# 合并到 main 并推送 / Merge to main and push
git checkout main
git merge hotfix/contact-form
git push origin main

# 3. 切回功能分支，恢复工作 / Switch back and resume
git checkout feature/gallery

# 恢复 stash / Restore stash
git stash pop
# 你的半成品改动又回来了！
# Your half-done changes are back!

# 继续开发 / Continue working
git status
# 可以看到之前 stash 的改动已恢复
# You can see the previously stashed changes are restored
```

---

## 练习 / Exercises

### 练习 1：Cherry-pick CSS 修复 / Exercise 1: Cherry-pick a CSS Fix

**目标 / Goal:** 在一个分支上修复 CSS 问题，然后将该修复 cherry-pick 到另一个分支。

Fix a CSS issue on one branch, then cherry-pick that fix to another branch.

```bash
# 1. 创建两个分支 / Create two branches
git checkout -b fix/css-polish
git checkout -b release/v1.0 main

# 2. 在 fix/css-polish 分支上修复 CSS / Fix CSS on fix/css-polish
git checkout fix/css-polish
# 编辑 src/style.css，修复某个样式问题
# Edit src/style.css to fix a style issue
git add src/style.css
git commit -m "fix(css): correct card hover animation"
# 记下 commit hash / Note the commit hash

# 3. 切换到 release 分支并 cherry-pick / Switch to release and cherry-pick
git checkout release/v1.0
git cherry-pick --no-commit <commit-hash>

# 4. 审查改动 / Review changes
git diff --cached

# 5. 提交 / Commit
git commit -m "chore: cherry-pick CSS fix from fix/css-polish"
```

### 练习 2：Stash 紧急切换 / Exercise 2: Stash and Switch for Hotfix

**目标 / Goal:** 模拟在开发中途紧急切换分支修 bug 的完整流程。

Simulate the full workflow of switching branches mid-development for an urgent fix.

```bash
# 1. 在功能分支上开始开发 / Start working on a feature branch
git checkout -b feature/animations
# 编辑 src/app.js，添加动画相关代码（写到一半就停）
# Edit src/app.js, add animation-related code (leave it half-done)

# 2. 收到紧急通知！/ Urgent notification received!
# 先 stash 你的工作 / First, stash your work
git stash -u -m "动画功能开发中 / animations WIP"

# 3. 切换分支修 bug / Switch branches to fix bug
git checkout main
git checkout -b hotfix/typo
# 修复 src/index.html 中的拼写错误
# Fix a typo in src/index.html
git add src/index.html
git commit -m "fix: correct typo in hero section"

# 4. 合并修复 / Merge the fix
git checkout main
git merge hotfix/typo

# 5. 回到功能分支继续 / Go back to feature branch and resume
git checkout feature/animations
git stash list
# stash@{0}: On feature/animations: 动画功能开发中 / animations WIP

git stash pop
# 继续你的动画开发！/ Continue your animation work!
```

---

## 常用命令速查 / Command Quick Reference

| 命令 / Command | 说明 / Description |
|---|---|
| `git cherry-pick <hash>` | 挑选单个提交 / Pick a single commit |
| `git cherry-pick <h1> <h2>` | 挑选多个提交 / Pick multiple commits |
| `git cherry-pick <start>..<end>` | 挑选范围提交 / Pick a range of commits |
| `git cherry-pick --no-commit` | 只暂存不提交 / Stage without committing |
| `git stash` | 保存当前改动 / Save current changes |
| `git stash -u` | 包含未跟踪文件 / Include untracked files |
| `git stash list` | 查看 stash 列表 / View stash stack |
| `git stash pop` | 恢复并删除 / Apply and remove |
| `git stash apply` | 恢复但不删除 / Apply without removing |
| `git stash drop` | 删除一个 stash / Drop a stash |
| `git stash branch <name>` | 从 stash 创建分支 / Create branch from stash |

---

## 导航 / Navigation

- **上一章 / Previous Chapter:** [Chapter 05: Rebase 变基 / Rebase](../05-rebase/README.md)
- **下一章 / Next Chapter:** [Chapter 07: 标签与版本发布 / Tags & Releases](../07-tags-and-releases/README.md)
- **返回目录 / Back to Index:** [首页 / Home](../README.md)
