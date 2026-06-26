# Chapter 02: 分支创建与切换 / Branching

---

## 目录 / Table of Contents

1. [分支是什么？ / What Are Branches?](#分支是什么--what-are-branches)
2. [分支操作命令 / Branch Commands](#分支操作命令--branch-commands)
3. [切换分支 / Switching Branches](#切换分支--switching-branches)
4. [创建功能分支 / Creating a Feature Branch](#创建功能分支--creating-a-feature-branch)
5. [合并策略 / Merge Strategies](#合并策略--merge-strategies)
6. [合并分支 / Merging Branches](#合并分支--merging-branches)
7. [删除已合并的分支 / Deleting Merged Branches](#删除已合并的分支--deleting-merged-branches)
8. [实战演练 / Step-by-Step Walkthrough](#实战演练--step-by-step-walkthrough)
9. [练习 / Exercises](#练习--exercises)

---

## 分支是什么？ / What Are Branches?

### 中文

在 Git 中，**分支**（branch）本质上是一个**轻量级的、可移动的指针**，指向某个特定的提交（commit）。

理解这一点非常重要：Git 的分支**不是**文件的副本，**不是**独立的目录，它只是一个 40 字符的 SHA-1 哈希值的引用。这意味着：

- 创建分支几乎是瞬间完成的
- 切换分支几乎不占磁盘空间
- 你可以拥有任意数量的分支

**分支指针模型图：**

```
         提交链 / Commit Chain
         =====================

         a1b2c3d ─── e4f5g6h ─── i7j8k9l
         (C1)         (C2)         (C3)
                                    ▲
                                    │
                              main (HEAD)


    创建 feature/about-page 分支后 / After creating feature/about-page:

         a1b2c3d ─── e4f5g6h ─── i7j8k9l
         (C1)         (C2)         (C3)
                                    ▲
                                    │
                              main (HEAD)
                              feature/about-page


    在 feature 分支上提交后 / After committing on feature branch:

         a1b2c3d ─── e4f5g6h ─── i7j8k9l ─── m1n2o3p
         (C1)         (C2)         (C3)         (C4)
                                    ▲             ▲
                                    │             │
                                  main    feature/about-page
                                           (HEAD)
```

**HEAD** 是一个特殊指针，指向你当前所在的分支。当你切换分支时，HEAD 会移动到新分支，同时工作区的文件也会相应更新。

### English

In Git, a **branch** is essentially a **lightweight, movable pointer** to a specific commit.

This is crucial to understand: Git branches are **not** copies of files, **not** separate directories — they're just references to a 40-character SHA-1 hash. This means:

- Creating a branch is nearly instantaneous
- Switching branches uses almost no disk space
- You can have any number of branches

**Branch pointer model diagram:**

```
         Commit Chain
         =============

         a1b2c3d ─── e4f5g6h ─── i7j8k9l
         (C1)         (C2)         (C3)
                                    ▲
                                    │
                              main (HEAD)


    After creating feature/about-page:

         a1b2c3d ─── e4f5g6h ─── i7j8k9l
         (C1)         (C2)         (C3)
                                    ▲
                                    │
                              main (HEAD)
                              feature/about-page


    After committing on feature branch:

         a1b2c3d ─── e4f5g6h ─── i7j8k9l ─── m1n2o3p
         (C1)         (C2)         (C3)         (C4)
                                    ▲             ▲
                                    │             │
                                  main    feature/about-page
                                           (HEAD)
```

**HEAD** is a special pointer that indicates which branch you're currently on. When you switch branches, HEAD moves to the new branch, and the working tree files update accordingly.

---

## 分支操作命令 / Branch Commands

### 中文

```bash
# 查看所有本地分支（当前分支前有 * 标记）
git branch
# 输出示例：
# * main

# 查看所有分支（包括远程分支）
git branch -a

# 查看分支及其最新提交
git branch -v

# 查看已合并到当前分支的分支
git branch --merged

# 查看未合并到当前分支的分支
git branch --no-merged

# 创建新分支（但不切换过去）
git branch feature/about-page

# 创建并切换到新分支（常用）
git checkout -b feature/about-page
# 或使用新语法（Git 2.23+）
git switch -c feature/about-page

# 重命名分支
git branch -m old-name new-name

# 删除已合并的分支
git branch -d feature/about-page

# 强制删除未合并的分支（谨慎使用！）
git branch -D feature/experiment
```

**分支命名规范（推荐）：**

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/about-page` |
| `bugfix/` | 修复 bug | `bugfix/nav-alignment` |
| `hotfix/` | 紧急修复 | `hotfix/security-patch` |
| `release/` | 发布准备 | `release/v1.0.0` |
| `docs/` | 文档更新 | `docs/api-guide` |

### English

```bash
# List all local branches (current branch marked with *)
git branch
# Example output:
# * main

# List all branches (including remote)
git branch -a

# List branches with their latest commit
git branch -v

# List branches merged into current branch
git branch --merged

# List branches NOT merged into current branch
git branch --no-merged

# Create a new branch (without switching to it)
git branch feature/about-page

# Create AND switch to a new branch (commonly used)
git checkout -b feature/about-page
# Or use the newer syntax (Git 2.23+)
git switch -c feature/about-page

# Rename a branch
git branch -m old-name new-name

# Delete a merged branch
git branch -d feature/about-page

# Force-delete an unmerged branch (use with caution!)
git branch -D feature/experiment
```

**Branch naming conventions (recommended):**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/about-page` |
| `bugfix/` | Bug fixes | `bugfix/nav-alignment` |
| `hotfix/` | Urgent fixes | `hotfix/security-patch` |
| `release/` | Release prep | `release/v1.0.0` |
| `docs/` | Documentation updates | `docs/api-guide` |

---

## 切换分支 / Switching Branches

### 中文

**git checkout（传统方式）：**

```bash
# 切换到已有分支
git checkout feature/about-page

# 切换到 main 分支
git checkout main
```

`git checkout` 是一个"万能"命令，既用于切换分支，也用于恢复文件。这容易造成混淆。

**git switch（推荐，Git 2.23+）：**

```bash
# 切换到已有分支
git switch feature/about-page

# 切换到 main 分支
git switch main

# 创建并切换到新分支
git switch -c feature/contact-page

# 切换回上一个分支（类似 cd -）
git switch -
```

**git switch vs git checkout 对比：**

| 操作 | git checkout | git switch |
|------|-------------|------------|
| 切换分支 | `checkout <branch>` | `switch <branch>` |
| 创建并切换 | `checkout -b <branch>` | `switch -c <branch>` |
| 切换回上一个分支 | 不支持 | `switch -` |
| 恢复文件 | `checkout -- <file>` | 不支持（用 `git restore`） |

> **推荐**：使用 `git switch` 来切换分支，使用 `git restore` 来恢复文件。职责更清晰。

**切换分支时需要注意：**

```bash
# 如果工作区有未提交的更改，切换分支可能会失败
git status    # 先检查状态

# 方式一：提交更改后再切换
git add .
git commit -m "wip: save progress"
git switch feature/about-page

# 方式二：暂存更改（stash），切换后再恢复
git stash
git switch feature/about-page
# ... 在 feature 分支工作 ...
git switch main
git stash pop    # 恢复暂存的更改
```

### English

**git checkout (traditional approach):**

```bash
# Switch to an existing branch
git checkout feature/about-page

# Switch to main branch
git checkout main
```

`git checkout` is a "do-everything" command used for both switching branches and restoring files. This can be confusing.

**git switch (recommended, Git 2.23+):**

```bash
# Switch to an existing branch
git switch feature/about-page

# Switch to main branch
git switch main

# Create and switch to a new branch
git switch -c feature/contact-page

# Switch back to the previous branch (like cd -)
git switch -
```

**git switch vs git checkout comparison:**

| Operation | git checkout | git switch |
|-----------|-------------|------------|
| Switch branch | `checkout <branch>` | `switch <branch>` |
| Create & switch | `checkout -b <branch>` | `switch -c <branch>` |
| Switch to previous | Not supported | `switch -` |
| Restore files | `checkout -- <file>` | Not supported (use `git restore`) |

> **Recommendation**: Use `git switch` for branch switching and `git restore` for file restoration. Clearer separation of concerns.

**Important when switching branches:**

```bash
# If you have uncommitted changes, switching may fail
git status    # Check status first

# Option 1: Commit changes before switching
git add .
git commit -m "wip: save progress"
git switch feature/about-page

# Option 2: Stash changes, switch, then restore
git stash
git switch feature/about-page
# ... work on feature branch ...
git switch main
git stash pop    # Restore stashed changes
```

---

## 创建功能分支 / Creating a Feature Branch

### 中文

现在让我们在 MyPortfolio 项目中创建一个功能分支来开发"关于我"页面。

```bash
# 确保在 main 分支上，并且工作区是干净的
git switch main
git status    # 应该是 "nothing to commit, working tree clean"

# 创建并切换到新功能分支
git switch -c feature/about-page

# 验证
git branch
# 输出：
# * feature/about-page
#   main
```

在功能分支上工作不会影响 main 分支。你可以自由地实验和迭代，直到满意后再合并回去。

**分支工作流程示意：**

```
main:           a1b2c3d ─── e4f5g6h ─── i7j8k9l
                                       ▲
                                 (起点 / start point)

feature/about-page:
                a1b2c3d ─── e4f5g6h ─── i7j8k9l ─── p1q2r3s ─── t4u5v6w
                                       ▲             (添加 about.html)  (添加样式)
                                       │
                                 (分支起点 / branch point)
```

### English

Now let's create a feature branch in MyPortfolio to develop the "About Me" page.

```bash
# Make sure you're on main and the working tree is clean
git switch main
git status    # Should say "nothing to commit, working tree clean"

# Create and switch to a new feature branch
git switch -c feature/about-page

# Verify
git branch
# Output:
# * feature/about-page
#   main
```

Working on a feature branch doesn't affect main. You can freely experiment and iterate until you're satisfied, then merge back.

**Branch workflow diagram:**

```
main:           a1b2c3d ─── e4f5g6h ─── i7j8k9l
                                       ▲
                                 (start point)

feature/about-page:
                a1b2c3d ─── e4f5g6h ─── i7j8k9l ─── p1q2r3s ─── t4u5v6w
                                       ▲             (add about.html)  (add styles)
                                       │
                                 (branch point)
```

---

## 合并策略 / Merge Strategies

### 中文

Git 有两种主要的合并方式：**快进合并**（Fast-forward）和**三方合并**（Three-way merge）。

#### 快进合并（Fast-forward Merge）

当目标分支（main）从分支点以来没有新的提交时，Git 只需将 main 指针向前移动到功能分支的最新提交。

```
    合并前 / Before merge:

    main:              a1b2c3d ─── e4f5g6h
                                            ▲
                                      feature/about-page:
                                            e4f5g6h ─── p1q2r3s ─── t4u5v6w
                                                          ▲
                                                    (HEAD: feature)


    合并后 / After fast-forward merge:

    main:              a1b2c3d ─── e4f5g6h ─── p1q2r3s ─── t4u5v6w
                                                          ▲
                                                    main (HEAD)
                                                    feature/about-page
```

特点：
- 历史是线性的，没有合并提交
- 简洁干净
- 适用于小型功能

#### 三方合并（Three-way Merge）

当 main 分支在分支点之后也有新的提交时，Git 需要找到两个分支的**共同祖先**，然后执行三方合并。

```
    合并前 / Before merge:

                      ┌─── p1q2r3s ─── t4u5v6w   (feature/about-page)
                      │
    a1b2c3d ─── e4f5g6h
                      │
                      └─── w7x8y9z               (main)


    合并后 / After three-way merge:

                      ┌─── p1q2r3s ─── t4u5v6w ──┐
                      │                            │
    a1b2c3d ─── e4f5g6h                            ├─── M1 (merge commit)
                      │                            │    ▲
                      └─── w7x8y9z ───────────────┘    main (HEAD)
```

特点：
- 会创建一个新的**合并提交**（merge commit）
- 保留了分支开发的历史
- 适用于大型功能或多人协作

### English

Git has two main merge strategies: **Fast-forward** and **Three-way merge**.

#### Fast-forward Merge

When the target branch (main) has no new commits since the branch point, Git simply moves the main pointer forward to the feature branch's latest commit.

```
    Before merge:

    main:              a1b2c3d ─── e4f5g6h
                                            ▲
                                      feature/about-page:
                                            e4f5g6h ─── p1q2r3s ─── t4u5v6w
                                                          ▲
                                                    (HEAD: feature)


    After fast-forward merge:

    main:              a1b2c3d ─── e4f5g6h ─── p1q2r3s ─── t4u5v6w
                                                          ▲
                                                    main (HEAD)
                                                    feature/about-page
```

Characteristics:
- History is linear, no merge commit
- Clean and simple
- Best for small features

#### Three-way Merge

When main has new commits after the branch point, Git needs to find the **common ancestor** of both branches and perform a three-way merge.

```
    Before merge:

                      ┌─── p1q2r3s ─── t4u5v6w   (feature/about-page)
                      │
    a1b2c3d ─── e4f5g6h
                      │
                      └─── w7x8y9z               (main)


    After three-way merge:

                      ┌─── p1q2r3s ─── t4u5v6w ──┐
                      │                            │
    a1b2c3d ─── e4f5g6h                            ├─── M1 (merge commit)
                      │                            │    ▲
                      └─── w7x8y9z ───────────────┘    main (HEAD)
```

Characteristics:
- Creates a new **merge commit**
- Preserves branch development history
- Best for large features or team collaboration

---

## 合并分支 / Merging Branches

### 中文

**基本合并步骤：**

```bash
# 第一步：切换到目标分支（main）
git switch main

# 第二步：确保 main 是最新的
git pull origin main    # 如果有远程仓库

# 第三步：合并功能分支
git merge feature/about-page

# 第四步：确认合并结果
git log --oneline --graph --decorate --all
```

**合并选项：**

```bash
# 强制执行三方合并（即使可以快进）
git merge --no-ff feature/about-page
# 这会创建一个合并提交，保留分支历史

# 压缩合并（将功能分支的所有提交合并为一个）
git merge --squash feature/about-page
# 合并后需要手动提交

# 中止合并（如果遇到冲突）
git merge --abort
```

**处理合并冲突（Merge Conflicts）：**

当两个分支修改了同一文件的同一部分时，Git 无法自动合并，会产生冲突。

```bash
# 如果发生冲突，Git 会提示
# Auto-merging index.html
# CONFLICT (content): Merge conflict in index.html
# Automatic merge failed; fix conflicts and then commit the result.

# 查看冲突文件
git status

# 手动编辑冲突文件，解决冲突标记：
# <<<<<<< HEAD (当前分支的内容)
# 当前分支的代码
# =======
# 功能分支的代码
# >>>>>>> feature/about-page

# 解决冲突后：
git add index.html
git commit    # Git 会自动生成合并提交信息
```

### English

**Basic merge steps:**

```bash
# Step 1: Switch to the target branch (main)
git switch main

# Step 2: Make sure main is up to date
git pull origin main    # If you have a remote repo

# Step 3: Merge the feature branch
git merge feature/about-page

# Step 4: Verify the merge result
git log --oneline --graph --decorate --all
```

**Merge options:**

```bash
# Force a three-way merge (even if fast-forward is possible)
git merge --no-ff feature/about-page
# This creates a merge commit, preserving branch history

# Squash merge (combine all feature commits into one)
git merge --squash feature/about-page
# Requires manual commit after merging

# Abort merge (if you encounter conflicts)
git merge --abort
```

**Handling merge conflicts:**

When two branches modify the same part of the same file, Git cannot auto-merge and produces a conflict.

```bash
# If a conflict occurs, Git will report:
# Auto-merging index.html
# CONFLICT (content): Merge conflict in index.html
# Automatic merge failed; fix conflicts and then commit the result.

# View conflicting files
git status

# Manually edit conflicting files, resolving conflict markers:
# <<<<<<< HEAD (current branch content)
# current branch code
# =======
# feature branch code
# >>>>>>> feature/about-page

# After resolving conflicts:
git add index.html
git commit    # Git auto-generates the merge commit message
```

---

## 删除已合并的分支 / Deleting Merged Branches

### 中文

合并完成后，功能分支就不再需要了，可以安全删除。

```bash
# 确认分支已合并
git branch --merged
# 输出中应该包含 feature/about-page

# 删除已合并的分支（安全操作）
git branch -d feature/about-page
# 输出：Deleted branch feature/about-page (was t4u5v6w).

# 如果分支未合并，-d 会拒绝删除
git branch -d feature/experiment
# 错误：The branch 'feature/experiment' is not fully merged.

# 强制删除未合并的分支（会丢失更改！）
git branch -D feature/experiment
```

**清理分支的最佳实践：**

```bash
# 查看所有已合并的分支并批量删除
git branch --merged | grep -v "main" | xargs -n 1 git branch -d
```

### English

After merging, the feature branch is no longer needed and can be safely deleted.

```bash
# Confirm the branch is merged
git branch --merged
# Output should include feature/about-page

# Delete the merged branch (safe operation)
git branch -d feature/about-page
# Output: Deleted branch feature/about-page (was t4u5v6w).

# If the branch is not merged, -d will refuse to delete
git branch -d feature/experiment
# Error: The branch 'feature/experiment' is not fully merged.

# Force-delete an unmerged branch (changes will be lost!)
git branch -D feature/experiment
```

**Branch cleanup best practice:**

```bash
# List all merged branches and delete them in batch
git branch --merged | grep -v "main" | xargs -n 1 git branch -d
```

---

## 实战演练 / Step-by-Step Walkthrough

### 中文

现在让我们在 MyPortfolio 项目中完整地走一遍分支工作流。

**步骤 1：确认当前状态**

```bash
# 我们在 main 分支上，已经有了首页和样式
git switch main
git log --oneline
# a1b2c3d (HEAD -> main) feat: add initial homepage and styles
# e4f5g6h chore: add .gitignore
```

**步骤 2：创建功能分支**

```bash
git switch -c feature/about-page
# Switched to a new branch 'feature/about-page'

git branch
# * feature/about-page
#   main
```

**步骤 3：添加 about.html**

创建 `about.html` 文件（完整代码见 `src/about.html`），包含：
- 导航栏（与其他页面一致）
- 个人简介（中英双语）
- 技能标签展示

**步骤 4：提交 about.html**

```bash
git add about.html
git commit -m "feat: add About Me page with bilingual content and skills section"
```

**步骤 5：更新样式**

在 `style.css` 中添加 about 页面的样式（project-card 样式和 about-section 样式），然后提交：

```bash
git add style.css
git commit -m "style: add CSS for About page sections and skill tags"
```

**步骤 6：更新 index.html**

在首页的项目展示区添加一个项目卡片：

```bash
git add index.html
git commit -m "feat: add Weather App project card to homepage"
```

**步骤 7：查看功能分支的历史**

```bash
git log --oneline --graph --all
# * t4u5v6w (HEAD -> feature/about-page) feat: add Weather App project card
# * p1q2r3s style: add CSS for About page sections and skill tags
# * o9p8q7r feat: add About Me page with bilingual content
# * a1b2c3d (main) feat: add initial homepage and styles
# * e4f5g6h chore: add .gitignore
```

**步骤 8：切换回 main 并合并**

```bash
# 切换回 main
git switch main

# 执行快进合并（因为 main 没有新的提交）
git merge feature/about-page
# Updating a1b2c3d..t4u5v6w
# Fast-forward
#  about.html  | 35 ++++++++++++++++++++
#  index.html  |  5 +++
#  style.css   | 25 ++++++++++++
#  3 files changed, 65 insertions(+)

# 查看合并后的历史
git log --oneline --graph --all
# * t4u5v6w (HEAD -> main, feature/about-page) feat: add Weather App project card
# * p1q2r3s style: add CSS for About page sections and skill tags
# * o9p8q7r feat: add About Me page with bilingual content
# * a1b2c3d feat: add initial homepage and styles
# * e4f5g6h chore: add .gitignore
```

**步骤 9：清理——删除功能分支**

```bash
# 确认分支已合并
git branch --merged
# * main
#   feature/about-page

# 安全删除
git branch -d feature/about-page
# Deleted branch feature/about-page (was t4u5v6w).

# 验证
git branch
# * main
```

**完整流程示意图：**

```
main:           a1b2c3d ─────────────────────────────────── t4u5v6w (HEAD -> main)
                (initial)          ◀── fast-forward ──▶    (merged)

feature/about-page:                o9p8q7r ─── p1q2r3s ─── t4u5v6w (已删除/deleted)
                                   (about.html) (styles)    (project card)
```

### English

Now let's walk through the complete branching workflow in the MyPortfolio project.

**Step 1: Confirm current state**

```bash
# We're on main with the homepage and styles already committed
git switch main
git log --oneline
# a1b2c3d (HEAD -> main) feat: add initial homepage and styles
# e4f5g6h chore: add .gitignore
```

**Step 2: Create the feature branch**

```bash
git switch -c feature/about-page
# Switched to a new branch 'feature/about-page'

git branch
# * feature/about-page
#   main
```

**Step 3: Add about.html**

Create the `about.html` file (full code in `src/about.html`), containing:
- Navigation bar (consistent with other pages)
- Personal introduction (bilingual Chinese/English)
- Skills tag display

**Step 4: Commit about.html**

```bash
git add about.html
git commit -m "feat: add About Me page with bilingual content and skills section"
```

**Step 5: Update styles**

Add about page styles to `style.css` (project-card styles and about-section styles), then commit:

```bash
git add style.css
git commit -m "style: add CSS for About page sections and skill tags"
```

**Step 6: Update index.html**

Add a project card to the homepage project grid:

```bash
git add index.html
git commit -m "feat: add Weather App project card to homepage"
```

**Step 7: View the feature branch history**

```bash
git log --oneline --graph --all
# * t4u5v6w (HEAD -> feature/about-page) feat: add Weather App project card
# * p1q2r3s style: add CSS for About page sections and skill tags
# * o9p8q7r feat: add About Me page with bilingual content
# * a1b2c3d (main) feat: add initial homepage and styles
# * e4f5g6h chore: add .gitignore
```

**Step 8: Switch back to main and merge**

```bash
# Switch back to main
git switch main

# Perform fast-forward merge (since main has no new commits)
git merge feature/about-page
# Updating a1b2c3d..t4u5v6w
# Fast-forward
#  about.html  | 35 ++++++++++++++++++++
#  index.html  |  5 +++
#  style.css   | 25 ++++++++++++
#  3 files changed, 65 insertions(+)

# View the merged history
git log --oneline --graph --all
# * t4u5v6w (HEAD -> main, feature/about-page) feat: add Weather App project card
# * p1q2r3s style: add CSS for About page sections and skill tags
# * o9p8q7r feat: add About Me page with bilingual content
# * a1b2c3d feat: add initial homepage and styles
# * e4f5g6h chore: add .gitignore
```

**Step 9: Cleanup — delete the feature branch**

```bash
# Confirm branch is merged
git branch --merged
# * main
#   feature/about-page

# Safely delete
git branch -d feature/about-page
# Deleted branch feature/about-page (was t4u5v6w).

# Verify
git branch
# * main
```

**Complete workflow diagram:**

```
main:           a1b2c3d ─────────────────────────────────── t4u5v6w (HEAD -> main)
                (initial)          ◀── fast-forward ──▶    (merged)

feature/about-page:                o9p8q7r ─── p1q2r3s ─── t4u5v6w (deleted)
                                   (about.html) (styles)    (project card)
```

---

## 练习 / Exercises

### 中文

1. **基础分支操作**：
   - 从 main 创建一个 `feature/contact-page` 分支
   - 在分支上创建一个简单的 `contact.html` 文件
   - 提交更改
   - 切换回 main 并合并

2. **观察快进 vs 三方合并**：
   - 创建 `feature/blog` 分支
   - 在 `feature/blog` 上添加一些文件并提交
   - 切换回 main，也做一些修改并提交
   - 合并 `feature/blog`，观察这次是否是三方合并
   - 用 `git log --oneline --graph --all` 查看结果

3. **练习 --no-ff 合并**：
   - 创建另一个功能分支
   - 添加一些提交
   - 使用 `git merge --no-ff <branch>` 合并
   - 对比与普通快进合并的区别

4. **冲突解决**：
   - 在两个分支上修改同一个文件的同一行
   - 尝试合并，观察冲突
   - 手动解决冲突并完成合并

5. **分支清理**：
   - 创建多个分支（可以不做任何修改）
   - 使用 `git branch --merged` 查看哪些可以安全删除
   - 批量删除已合并的分支

6. **挑战**：用本章学到的分支工作流，为 MyPortfolio 添加一个"联系我"页面，包含联系表单的 HTML 结构。

### English

1. **Basic branching**:
   - Create a `feature/contact-page` branch from main
   - Create a simple `contact.html` file on the branch
   - Commit the changes
   - Switch back to main and merge

2. **Observe fast-forward vs three-way merge**:
   - Create a `feature/blog` branch
   - Add some files and commit on `feature/blog`
   - Switch back to main and make some changes too, then commit
   - Merge `feature/blog` and observe whether it's a three-way merge
   - View the result with `git log --oneline --graph --all`

3. **Practice --no-ff merge**:
   - Create another feature branch
   - Add some commits
   - Merge using `git merge --no-ff <branch>`
   - Compare the difference with a regular fast-forward merge

4. **Conflict resolution**:
   - Modify the same line in the same file on two branches
   - Try to merge and observe the conflict
   - Manually resolve the conflict and complete the merge

5. **Branch cleanup**:
   - Create multiple branches (you don't need to make any changes)
   - Use `git branch --merged` to see which can be safely deleted
   - Batch-delete the merged branches

6. **Challenge**: Using the branching workflow from this chapter, add a "Contact Me" page to MyPortfolio with an HTML contact form structure.

---

**上一章 / Previous Chapter**: [Chapter 01: 第一个仓库与基本工作流 / First Repo & Basic Workflow](../01-first-repo/README.md)
