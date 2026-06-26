# Chapter 05: Rebase 变基 / Rebase

> **前置要求 / Prerequisites:** 完成 Chapter 04（远程仓库）/ Complete Chapter 04 (Remote Repositories)
>
> **预计时间 / Estimated Time:** 50 分钟 / 50 minutes

---

## 目录 / Table of Contents

1. [Merge vs Rebase：可视化对比 / Visual Comparison](#merge-vs-rebase可视化对比--visual-comparison)
2. [git rebase 基本用法 / Basic Usage](#git-rebase-基本用法--basic-usage)
3. [何时使用 Rebase vs Merge / When to Use Rebase vs Merge](#何时使用-rebase-vs-merge--when-to-use-rebase-vs-merge)
4. [交互式 Rebase / Interactive Rebase](#交互式-rebase--interactive-rebase)
5. [黄金法则 / The Golden Rule](#黄金法则--the-golden-rule)
6. [git pull --rebase](#git-pull---rebase)
7. [实战：整理功能分支的提交历史 / Step-by-Step: Clean Up Feature Branch History](#实战整理功能分支的提交历史--step-by-step-clean-up-feature-branch-history)
8. [练习 / Exercises](#练习--exercises)

---

## Merge vs Rebase：可视化对比 / Visual Comparison

Merge 和 Rebase 都用于整合分支，但它们的工作方式截然不同。

Merge and Rebase both integrate branches, but they work very differently.

### Merge：创建合并提交，保留完整历史 / Merge: Creates a Merge Commit, Preserves History

```
  合并前 / Before merge:

  main:       ●──●──●──●
                      \
  feature:             ●──●──●

  执行 git merge feature 后 / After git merge feature:

  main:       ●──●──●──●────────●  (merge commit)
                      \        /
  feature:             ●──●──●

  特点：
  - 创建一个新的"合并提交"（merge commit）
  - 保留完整的分支历史
  - 历史图呈"钻石"形状
  - Creates a new "merge commit"
  - Preserves the full branch history
  - History graph forms a "diamond" shape
```

### Rebase：重放提交，创建线性历史 / Rebase: Replays Commits, Creates Linear History

```
  变基前 / Before rebase:

  main:       ●──●──●──●
                      \
  feature:             ●──●──●

  在 feature 上执行 git rebase main 后
  After git rebase main on feature:

  main:       ●──●──●──●
                          \
  feature:                 ●'──●'──●'

  注意：●' 表示"重放"后的新提交（commit hash 已改变）
  Note: ●' means "replayed" commits (commit hashes have changed)

  然后切回 main 执行 git merge feature：
  Then switch to main and git merge feature:

  main:       ●──●──●──●──●'──●'──●'  (fast-forward)

  特点：
  - 不创建合并提交
  - 历史是线性的，更干净
  - 提交的 hash 值会改变
  - No merge commit created
  - History is linear, cleaner
  - Commit hashes change
```

### 对比表 / Comparison Table

| 特性 / Feature | Merge | Rebase |
|---|---|---|
| **历史形状 / History shape** | 非线性，有分支 / Non-linear, branched | 线性 / Linear |
| **合并提交 / Merge commit** | 有 / Yes | 无 / No |
| **提交 hash / Commit hashes** | 不变 / Unchanged | 改变 / Changed |
| **安全性 / Safety** | 安全，不改写历史 / Safe, doesn't rewrite history | 改写历史 / Rewrites history |
| **适用场景 / Best for** | 公共分支 / Shared branches | 本地功能分支 / Local feature branches |
| **冲突处理 / Conflict resolution** | 一次解决所有冲突 / Resolve all conflicts at once | 逐个提交解决 / Resolve per commit |

---

## git rebase 基本用法 / Basic Usage

### 基本语法 / Basic Syntax

```bash
# 在功能分支上执行 rebase
# Rebase on the feature branch

git checkout feature/gallery
git rebase main
```

这会将 `feature/gallery` 的提交"摘下来"，然后将基底移到 `main` 的最新提交上，最后把提交"重新放上去"。

This "picks off" the commits from `feature/gallery`, moves the base to the latest commit on `main`, then "replays" the commits on top.

### 详细过程 / Detailed Process

```bash
# 1. 当前状态 / Current state
#    main:      A──B──C──D
#                      \
#    feature:           E──F──G

# 2. 执行 rebase / Run rebase
git checkout feature
git rebase main

# 3. Git 做了什么 / What Git does:
#    a. 找到共同祖先 B / Find common ancestor B
#    b. 暂存 E, F, G 的修改 / Stash changes from E, F, G
#    c. 将 feature 的基底移到 D / Move feature's base to D
#    d. 依次重放 E, F, G / Replay E, F, G one by one

# 4. 结果 / Result:
#    main:      A──B──C──D
#                          \
#    feature:               E'──F'──G'
```

### 处理 Rebase 冲突 / Handling Rebase Conflicts

Rebase 过程中如果遇到冲突：

If you encounter conflicts during rebase:

```bash
# 1. 解决冲突 / Resolve the conflict
#    编辑冲突文件，删除冲突标记
#    Edit the conflicted file, remove conflict markers

# 2. 标记为已解决 / Mark as resolved
git add <resolved-file>

# 3. 继续 rebase / Continue the rebase
git rebase --continue

# 或者跳过当前提交 / Or skip the current commit
git rebase --skip

# 或者放弃整个 rebase / Or abort the entire rebase
git rebase --abort
```

### 其他常用参数 / Other Common Options

```bash
# 将 rebase 应用到指定分支上
# Rebase onto a specific branch
git rebase --onto main feature/gallery

# 自动使用 rebase 方式 pull
# Auto-rebase on pull
git config --global pull.rebase true
```

---

## 何时使用 Rebase vs Merge / When to Use Rebase vs Merge

### 使用 Rebase 的场景 / When to Use Rebase

```
✅ 适合 Rebase / Good for Rebase:

1. 本地功能分支同步 main 的最新代码
   Syncing local feature branch with latest main

   git checkout feature/gallery
   git rebase main

2. 整理本地的提交历史（合并前）
   Cleaning up local commit history (before merge)

   git rebase -i HEAD~3

3. 个人的实验性分支
   Personal experimental branches
```

### 使用 Merge 的场景 / When to Use Merge

```
✅ 适合 Merge / Good for Merge:

1. 将功能分支合并回 main
   Merging feature branch back to main

   git checkout main
   git merge feature/gallery

2. 多人协作的公共分支
   Shared branches with multiple collaborators

3. 需要保留完整历史记录时
   When you need to preserve the full history
```

### 推荐的混合策略 / Recommended Hybrid Strategy

```
  开发阶段（使用 rebase）         合并阶段（使用 merge）
  Development (use rebase)       Merging (use merge)

  1. 在 feature 分支开发          4. 将 feature 合并到 main
  2. 定期 rebase main                git checkout main
     git rebase main                 git merge feature/gallery
  3. 交互式 rebase 整理提交       5. 推送 main
     git rebase -i                     git push origin main
```

---

## 交互式 Rebase / Interactive Rebase

交互式 Rebase 是 Git 最强大的功能之一，允许你修改提交历史。

Interactive Rebase is one of Git's most powerful features, allowing you to modify commit history.

### 启动交互式 Rebase / Start Interactive Rebase

```bash
# 修改最近 3 个提交
# Modify the last 3 commits
git rebase -i HEAD~3

# 从指定提交开始 rebase
# Rebase from a specific commit
git rebase -i abc1234
```

### Rebase 编辑器界面 / Rebase Editor Interface

执行命令后，编辑器会打开：

After running the command, an editor opens:

```
pick 7a3b2c1 feat: 添加 gallery 数据结构 / Add gallery data structure
pick 9d4e5f6 fix: 修复拼写错误 / Fix typo
pick 1g2h3i4 WIP: 临时调试代码 / Temporary debug code

# Rebase abc0000..1g2h3i4 onto abc0000 (3 commands)
#
# Commands:
# p, pick   = use commit (使用提交)
# r, reword = use commit, but edit the commit message (使用提交，但编辑消息)
# e, edit   = use commit, but stop for amending (使用提交，但暂停以修改)
# s, squash = use commit, but meld into previous commit (合并到上一个提交)
# f, fixup  = like squash, but discard this commit's message (类似 squash，但丢弃消息)
# d, drop   = remove commit (删除提交)
# x, exec   = run command using shell (执行 shell 命令)
# b, break  = stop here (暂停)
```

### 命令详解 / Commands Explained

#### pick（默认）— 保留提交 / Keep the Commit

```
pick 7a3b2c1 feat: 添加 gallery 数据结构
```

不做任何修改，保留这个提交。

No changes, keep this commit as-is.

#### reword — 修改提交信息 / Edit Commit Message

```
reword 7a3b2c1 feat: 添加 gallery 数据结构
```

保留提交内容，但修改提交信息。保存后会打开编辑器让你修改消息。

Keep the commit content, but change the message. An editor will open for you to edit the message.

#### squash — 合并到上一个提交 / Meld into Previous Commit

```
pick 7a3b2c1 feat: 添加 gallery 数据结构
squash 9d4e5f6 fix: 修复拼写错误
```

将 `9d4e5f6` 合并到 `7a3b2c1` 中，形成一个新的提交。保存后会打开编辑器让你编辑合并后的提交信息。

Merges `9d4e5f6` into `7a3b2c1`, forming a new commit. An editor opens to let you edit the combined message.

#### edit — 暂停以修改提交 / Pause to Amend

```
edit 7a3b2c1 feat: 添加 gallery 数据结构
```

Rebase 会在这个提交处暂停，让你修改代码。完成后：

Rebase pauses at this commit, letting you modify the code. After changes:

```bash
# 修改文件 / Modify files
git add .
git commit --amend
git rebase --continue
```

#### drop — 删除提交 / Remove Commit

```
drop 1g2h3i4 WIP: 临时调试代码
```

完全删除这个提交。

Completely removes this commit.

### 实例：整理 WIP 提交 / Example: Clean Up WIP Commits

假设你在 `feature/gallery` 分支上有以下杂乱的提交历史：

Suppose you have this messy commit history on `feature/gallery`:

```bash
git log --oneline -6
# a1b2c3d WIP: 又改了一点 / Tweaked some more
# e4f5g6h WIP: 修复了样式 / Fixed styles
# i7j8k9l WIP: 开始做画廊 / Started gallery
# m0n1o2p fix: 修复导航栏bug / Fixed navbar bug
# q3r4s5t feat: 添加 About 页面 / Added About page
# ...
```

使用交互式 Rebase 整理：

Clean up with interactive rebase:

```bash
git rebase -i HEAD~3
```

编辑器中的操作 / Operations in the editor:

```
# 修改前 / Before:
pick i7j8k9l WIP: 开始做画廊 / Started gallery
pick e4f5g6h WIP: 修复了样式 / Fixed styles
pick a1b2c3d WIP: 又改了一点 / Tweaked some more

# 修改后 / After:
pick i7j8k9l WIP: 开始做画廊 / Started gallery
squash e4f5g6h WIP: 修复了样式 / Fixed styles
squash a1b2c3d WIP: 又改了一点 / Tweaked some more
```

然后在弹出的编辑器中编写新的提交信息：

Then write a new commit message in the popup editor:

```
feat: 添加画廊组件 / Add gallery component

包含画廊数据结构、样式和基本渲染逻辑。
Includes gallery data structure, styles, and basic rendering logic.
```

整理后的提交历史 / Cleaned commit history:

```bash
git log --oneline -4
# x9y8z7w feat: 添加画廊组件 / Add gallery component
# m0n1o2p fix: 修复导航栏bug / Fixed navbar bug
# q3r4s5t feat: 添加 About 页面 / Added About page
# ...
```

---

## 黄金法则 / The Golden Rule

### 永远不要 Rebase 公共分支 / NEVER Rebase Public/Shared Branches

```
  ❌ 绝对不要这样做 / NEVER do this:

  git checkout main
  git rebase feature/gallery

  ❌ 也不要这样做 / NOR this:

  git checkout main
  git rebase -i HEAD~5
```

### 为什么？/ Why?

```
  场景：你和同事都基于 main 分支工作
  Scenario: You and a colleague both work based on main

  原始历史 / Original history:

  你的本地 / Your local:     ●──●──● (A, B, C)
  同事的本地 / Colleague:    ●──●──● (A, B, C)
  远程 main / Remote main:   ●──●──● (A, B, C)

  你 rebase 了 main / You rebase main:

  你的本地 / Your local:     ●──●──●' (A', B', C')  ← hash 已改变！
  同事的本地 / Colleague:    ●──●──● (A, B, C)       ← 还是旧的 hash
  远程 main / Remote main:   ●──●──● (A, B, C)       ← 还是旧的 hash

  当你 force push 后 / After you force push:
  - 同事的本地历史和远程不一致！
  - Colleague's local history diverges from remote!
  - git pull 会产生混乱的合并结果
  - git pull will produce chaotic merge results
```

### 安全规则 / Safe Rules

| 操作 / Action | 安全？/ Safe? | 原因 / Reason |
|---|---|---|
| Rebase 本地功能分支 / Rebase local feature branch | ✅ 安全 | 只有你在用 / Only you use it |
| Rebase 未推送的提交 / Rebase unpushed commits | ✅ 安全 | 不影响他人 / Doesn't affect others |
| Rebase 已推送的公共分支 / Rebase pushed shared branch | ❌ 危险 | 影响所有协作者 / Affects all collaborators |
| Rebase main/master | ❌ 危险 | 公共分支，多人在用 / Shared branch, multiple users |

### 如果不小心 Rebase 了公共分支 / If You Accidentally Rebase a Shared Branch

```bash
# 1. 使用 reflog 找到 rebase 前的状态
#    Use reflog to find pre-rebase state
git reflog

# 2. 重置到 rebase 前的状态
#    Reset to pre-rebase state
git reset --hard HEAD@{n}
# （n 是 rebase 前的 reflog 条目 / n is the reflog entry before rebase）
```

---

## git pull --rebase

`git pull --rebase` 是 `git pull`（默认使用 merge）的替代方案。

`git pull --rebase` is an alternative to regular `git pull` (which uses merge by default).

### 对比 / Comparison

```
  普通 git pull / Regular git pull:

  Remote:   ●──●──●──●──●
                   \
  Local:    ●──●──●──● (本地新提交 / local new commits)

  pull 后 / After pull:

  Local:    ●──●──●──●──●──●  (merge commit)
                   \      /
                    ●──●

  git pull --rebase:

  Remote:   ●──●──●──●──●
                   \
  Local:    ●──●──●──● (本地新提交 / local new commits)

  pull --rebase 后 / After pull --rebase:

  Local:    ●──●──●──●──●──●'──●'  (线性历史 / linear history)
```

### 使用方法 / Usage

```bash
# 单次使用 / One-time use
git pull --rebase origin main

# 全局配置（推荐）
# Global configuration (recommended)
git config --global pull.rebase true

# 之后 git pull 默认使用 rebase
# After this, git pull defaults to rebase
git pull
```

### 优势 / Advantages

- **更干净的历史 / Cleaner history:** 没有多余的 merge commit
- **线性提交 / Linear commits:** `git log` 更易读
- **减少噪音 / Less noise:** 没有 "Merge branch 'main' of..." 提交

---

## 实战：整理功能分支的提交历史 / Step-by-Step: Clean Up Feature Branch History

让我们用 MyPortfolio 的 `feature/gallery` 分支来实践 Rebase。

Let's practice Rebase with MyPortfolio's `feature/gallery` branch.

### 步骤 1：查看当前提交历史 / Step 1: View Current Commit History

```bash
git checkout feature/gallery
git log --oneline -8

# 假设看到以下历史 / Suppose you see:
# f8e9d0c WIP: 调整卡片间距 / Tweaked card spacing
# c7b8a9f WIP: 修改颜色 / Changed colors
# d6e5f4g fix: 修复图片加载错误 / Fixed image loading error
# a3b2c1d WIP: 添加渲染函数 / Added render function
# e0f1g2h feat: 定义 gallery 数据 / Defined gallery data
# h9i8j7k feat: 创建 gallery.js / Created gallery.js
# ...
```

### 步骤 2：启动交互式 Rebase / Step 2: Start Interactive Rebase

```bash
# 整理最近 6 个提交
# Clean up the last 6 commits
git rebase -i HEAD~6
```

### 步骤 3：在编辑器中规划操作 / Step 3: Plan Operations in the Editor

```
pick h9i8j7k feat: 创建 gallery.js / Created gallery.js
squash e0f1g2h feat: 定义 gallery 数据 / Defined gallery data
squash a3b2c1d WIP: 添加渲染函数 / Added render function
pick d6e5f4g fix: 修复图片加载错误 / Fixed image loading error
squash c7b8a9f WIP: 修改颜色 / Changed colors
squash f8e9d0c WIP: 调整卡片间距 / Tweaked card spacing
```

**策略说明 / Strategy:**
- 将创建、数据定义、渲染函数合并为一个 "feat" 提交 / Combine creation, data, and rendering into one "feat" commit
- 保留 bug fix 作为单独提交 / Keep the bug fix as a separate commit
- 将样式调整合并到 fix 提交中 / Merge style tweaks into the fix commit

### 步骤 4：编写新的提交信息 / Step 4: Write New Commit Messages

第一个 squash 的提交信息 / First squash commit message:

```
feat: 添加画廊组件 / Add gallery component

- 创建 gallery.js 文件 / Created gallery.js file
- 定义画廊数据结构 / Defined gallery data structure
- 实现 renderGallery 函数 / Implemented renderGallery function
```

第二个 squash 的提交信息 / Second squash commit message:

```
fix: 修复图片加载和样式问题 / Fix image loading and style issues

- 修复图片加载错误 / Fixed image loading error
- 调整卡片颜色和间距 / Adjusted card colors and spacing
```

### 步骤 5：验证结果 / Step 5: Verify Results

```bash
git log --oneline -4

# 整理后的干净历史 / Clean history after rebase:
# x2y3z4a fix: 修复图片加载和样式问题 / Fix image loading and style issues
# w1v0u9t feat: 添加画廊组件 / Add gallery component
# h9i8j7k (之前的提交 / previous commits)...
```

### 步骤 6：推送到远程 / Step 6: Push to Remote

```bash
# 如果分支还没推送过，正常 push
# If branch hasn't been pushed yet, normal push
git push -u origin feature/gallery

# 如果分支已经推送过，需要 force push
# If branch was already pushed, need force push
git push --force-with-lease origin feature/gallery
```

> **提示 / Tip:** 使用 `--force-with-lease` 而不是 `--force`，这样如果远程有你不知道的更新，push 会被拒绝。
>
> Use `--force-with-lease` instead of `--force` — this rejects the push if the remote has updates you don't know about.

---

## 练习 / Exercises

### 练习 1：基本 Rebase / Exercise 1: Basic Rebase

```bash
# 1. 在 main 上创建一个新提交
#    Create a new commit on main
git checkout main
# 修改 index.html 添加一行注释
# Add a comment line to index.html
git add . && git commit -m "docs: 添加项目说明 / Add project description"

# 2. 切到功能分支，执行 rebase
#    Switch to feature branch, run rebase
git checkout feature/gallery
git rebase main

# 3. 查看历史，验证线性结构
#    View history, verify linear structure
git log --oneline --graph
```

### 练习 2：交互式 Rebase 整理提交 / Exercise 2: Interactive Rebase to Clean Up

```bash
# 1. 在当前分支创建 3 个 "WIP" 提交
#    Create 3 "WIP" commits on current branch
echo "// TODO: 优化性能" >> src/gallery.js
git add . && git commit -m "WIP: 性能优化备注"

echo "// TODO: 添加动画" >> src/gallery.js
git add . && git commit -m "WIP: 动画备注"

echo "// DONE: 完成基础功能" >> src/gallery.js
git add . && git commit -m "WIP: 基础功能完成"

# 2. 使用交互式 rebase 将 3 个提交合并为 1 个
#    Use interactive rebase to squash 3 into 1
git rebase -i HEAD~3
# 将后两个改为 squash
# Change the last two to squash

# 3. 验证结果
#    Verify result
git log --oneline -3
```

### 练习 3：使用 reword 修改提交信息 / Exercise 3: Use Reword to Edit Messages

```bash
# 1. 交互式 rebase 最近 2 个提交
#    Interactive rebase the last 2 commits
git rebase -i HEAD~2

# 2. 将第一个 pick 改为 reword
#    Change first pick to reword

# 3. 修改提交信息，使其更符合规范
#    Edit the message to follow conventions
# 例如: "WIP stuff" → "feat: implement gallery rendering logic"
```

### 练习 4：Rebase 冲突解决 / Exercise 4: Resolve Rebase Conflicts

```bash
# 1. 在 main 上修改 gallery.js 的第一行
#    Modify the first line of gallery.js on main
git checkout main
# 编辑 gallery.js 第一行
# Edit first line of gallery.js
git add . && git commit -m "chore: update gallery.js header on main"

# 2. 在 feature 分支上也修改了 gallery.js 的第一行
#    Also modify the first line on feature branch
git checkout feature/gallery
# 编辑 gallery.js 第一行（不同内容）
# Edit first line (different content)
git add . && git commit -m "chore: update gallery.js header on feature"

# 3. 执行 rebase，解决冲突
#    Run rebase, resolve conflict
git rebase main
# 解决冲突后 / After resolving:
git add src/gallery.js
git rebase --continue
```

### 练习 5：配置全局 pull --rebase / Exercise 5: Configure Global pull --rebase

```bash
# 1. 配置全局 pull.rebase
#    Configure global pull.rebase
git config --global pull.rebase true

# 2. 验证配置
#    Verify configuration
git config --global --get pull.rebase
# 应输出: true / Should output: true

# 3. 在之后的 git pull 中，观察是否使用了 rebase
#    In future git pull operations, observe if rebase is used
```

---

## 本章小结 / Chapter Summary

| 命令 / Command | 用途 / Purpose |
|---|---|
| `git rebase <branch>` | 将当前分支变基到指定分支 / Rebase current branch onto target |
| `git rebase -i HEAD~n` | 交互式整理最近 n 个提交 / Interactively clean up last n commits |
| `git rebase --continue` | 冲突解决后继续 rebase / Continue rebase after conflict resolution |
| `git rebase --abort` | 取消 rebase / Abort the rebase |
| `git pull --rebase` | 拉取并使用 rebase 代替 merge / Pull using rebase instead of merge |
| `git push --force-with-lease` | 安全地强制推送（rebase 后）/ Safe force push (after rebase) |

### 交互式 Rebase 命令速查 / Interactive Rebase Commands Quick Reference

| 命令 / Command | 作用 / Effect |
|---|---|
| `pick` | 保留提交 / Keep commit |
| `reword` | 保留提交，修改信息 / Keep commit, edit message |
| `edit` | 暂停以修改提交 / Pause to amend commit |
| `squash` | 合并到上一个提交 / Meld into previous commit |
| `fixup` | 合并并丢弃提交信息 / Meld and discard message |
| `drop` | 删除提交 / Remove commit |

---

## 导航 / Navigation

| 上一章 / Previous Chapter | 下一章 / Next Chapter |
|---|---|
| [Chapter 04: 远程仓库与协作 / Remote Repositories](../04-remote-repos/README.md) | [Chapter 06: Cherry-pick 与 Stash / Cherry-pick & Stash](../06-cherry-pick-and-stash/README.md) |

[返回总目录 / Back to Table of Contents](../README.md)
