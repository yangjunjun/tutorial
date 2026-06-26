# Chapter 10: Git 调试利器 / Debugging Tools

> **导航 / Navigation**
> [上一章 / Previous: 团队协作工作流](../09-workflow-patterns/README.md) |
> [目录 / Home](../../README.md) |
> [下一章 / Next: 高级特性与内部原理](../11-advanced/README.md)

---

## 本章概述 / Overview

当代码出现问题时，Git 提供了强大的调试工具来帮助你：
- 追踪代码变更历史
- 找到引入 bug 的确切提交
- 恢复误删的代码

When code has problems, Git provides powerful debugging tools to help you:
- Track code change history
- Find the exact commit that introduced a bug
- Recover accidentally deleted code

---

## 1. `git log` 高级用法 / Advanced `git log` Usage

`git log` 是最常用的历史查看命令，但大多数开发者只用了它的皮毛。

`git log` is the most commonly used history-viewing command, but most developers only scratch the surface.

### 基础美化 / Basic Beautification

```bash
# 单行显示，更紧凑 / One-line display, more compact
git log --oneline

# 显示分支图形 / Show branch graph
git log --oneline --graph

# 显示分支和标签引用 / Show branch and tag references
git log --oneline --graph --decorate

# 三合一（推荐日常使用）/ All three combined (recommended for daily use)
git log --oneline --graph --decorate --all
```

输出示例 / Example output:

```
* a1b2c3d (HEAD -> main, origin/main) feat: add dark mode
* e4f5g6h feat: add calculator
* i7j8k9l (feature/contact) feat: add contact form
* m0n1o2p fix: update navbar styles
```

### 过滤提交 / Filtering Commits

```bash
# 按作者过滤 / Filter by author
git log --author="xiaoming"
git log --author="小明"

# 按时间范围 / By time range
git log --since="2026-01-01"
git log --until="2026-06-01"
git log --since="2 weeks ago"
git log --since="yesterday" --until="today"

# 按提交消息搜索 / Search commit messages
git log --grep="calculator"
git log --grep="fix" --oneline

# 按文件过滤 / Filter by file
git log -- src/calculator.js
git log --oneline -- "*.css"

# 组合使用 / Combine filters
git log --author="xiaoming" --since="2026-01-01" --oneline -- src/
```

### 显示差异内容 / Showing Diffs

```bash
# 显示每次提交修改了哪些文件 / Show which files each commit changed
git log --stat

# 显示每次提交的具体代码差异 / Show actual code diff for each commit
git log -p
git log --patch

# 限制显示数量 / Limit number of entries
git log -5 --stat          # 最近 5 次提交 / Last 5 commits
git log -1 -p              # 最近一次提交的代码差异 / Diff of last commit
```

`--stat` 输出示例 / `--stat` example output:

```
commit a1b2c3d
Author: xiaoming <xiaoming@example.com>
Date:   Mon Jun 1 10:00:00 2026

    feat: add calculator

 src/calculator.js | 45 ++++++++++++++++++++++++++++++++++++++++++
 src/index.html    | 12 ++++++++++++
 2 files changed, 57 insertions(+)
```

### 自定义格式 / Custom Formatting (Pretty Format Aliases)

```bash
# 自定义输出格式 / Custom output format
git log --pretty=format:"%h - %an, %ar : %s"

# 常用占位符 / Common placeholders:
# %h  = 短哈希 / Short hash
# %H  = 完整哈希 / Full hash
# %an = 作者名 / Author name
# %ae = 作者邮箱 / Author email
# %ad = 作者日期 / Author date
# %ar = 相对时间 / Relative time (e.g., "2 days ago")
# %s  = 提交消息 / Subject (commit message)
# %d  = 引用名 / Ref names (branches, tags)
```

示例输出 / Example output:

```
a1b2c3d - xiaoming, 2 hours ago : feat: add dark mode
e4f5g6h - xiaoming, 1 day ago : feat: add calculator
i7j8k9l - xiaohong, 3 days ago : feat: add contact form
```

**设置别名（推荐）/ Set up an alias (recommended):**

```bash
# 在 .gitconfig 中添加 / Add to .gitconfig:
git config --global alias.lg "log --oneline --graph --decorate --all"

# 之后只需 / Then just use:
git lg
```

---

## 2. `git blame`（代码追溯 / Code Annotation）

`git blame` 显示文件中每一行的最后修改者——谁在什么时候改了这行代码。

`git blame` shows who last modified each line of a file — who changed what and when.

### 基本用法 / Basic Usage

```bash
# 查看文件的逐行修改信息 / View line-by-line modification info
git blame src/calculator.js
```

输出示例 / Example output:

```
a1b2c3d4 (xiaoming 2026-06-01 10:00:00 +0800  1) // calculator.js
a1b2c3d4 (xiaoming 2026-06-01 10:00:00 +0800  2) let currentInput = "0";
e4f5g6h7 (xiaohong 2026-06-02 14:30:00 +0800  3) let operator = null;
i7j8k9l0 (xiaoming 2026-06-03 09:00:00 +0800  4) function add(a, b) {
m0n1o2p3 (xiaohong 2026-06-04 16:00:00 +0800  5)     return a + b;
```

### 常用选项 / Common Options

```bash
# 只显示特定行范围 / Show only a specific line range
git blame -L 10,20 src/calculator.js

# 显示完整 commit SHA / Show full commit SHA
git blame -l src/calculator.js

# 显示行号 / Show line numbers
git blame -n src/calculator.js

# 忽略空白变化 / Ignore whitespace changes
git blame -w src/calculator.js

# 追踪代码移动（更精确）/ Track code movement (more precise)
git blame -M src/calculator.js

# 查看某个函数 / View a specific function
git blame -L '/function add/,+5' src/calculator.js
```

### 实际调试场景 / Practical Debugging Scenario

```bash
# 场景：计算器的 add 函数行为异常 / Scenario: Calculator's add function behaves unexpectedly

# 第一步：查看谁最后修改了这个函数 / Step 1: See who last modified this function
git blame src/calculator.js | grep "function add"

# 第二步：查看那次提交的详细信息 / Step 2: View that commit's details
git show a1b2c3d4

# 第三步：查看那次提交的讨论（如果是 PR）/ Step 3: Check the PR discussion (if applicable)
# 在 GitHub 上查看 / View on GitHub
```

> **注意 / Note**：`git blame` 显示的是**最后修改**该行的人，不一定是引入问题的人。
> `git blame` shows who **last modified** a line, not necessarily who introduced the issue.

---

## 3. `git bisect`（二分法查找 bug / Binary Search for Bugs）

`git bisect` 是本章的明星工具。当你知道"之前是好的，现在是坏的"，但不知道哪个提交引入了问题时，它能通过**二分法**快速定位。

`git bisect` is the star tool of this chapter. When you know "it worked before, it's broken now" but don't know which commit introduced the problem, it uses **binary search** to locate it quickly.

### 工作原理 / How It Works

```
提交历史 / Commit history:

 v1.0          ?         ?         ?        HEAD (buggy)
  ●────●────●────●────●────●────●────●────●
  good                                    bad

bisect 的过程 / The bisect process:

第 1 轮 / Round 1: 测试中间点 / Test midpoint
  ●────●────●────●────●────●────●────●────●
  good              ↑                   bad
                    test → bad!

第 2 轮 / Round 2: 缩小范围 / Narrow range
  ●────●────●────●
  good        ↑   bad
              test → good!

第 3 轮 / Round 3: 找到罪魁祸首 / Found the culprit!
           ●────●
           ↑   bad
           test → bad! ← 就是这个！/ This is it!
```

### 手动 bisect 步骤 / Manual Bisect Steps

```bash
# ========================================
# 步骤 1: 启动 bisect / Step 1: Start bisect
# ========================================
git bisect start

# ========================================
# 步骤 2: 标记当前版本为"坏的" / Step 2: Mark current version as "bad"
# ========================================
git bisect bad
# 或者说某个特定提交是坏的 / Or mark a specific commit as bad:
# git bisect bad a1b2c3d

# ========================================
# 步骤 3: 标记一个已知"好的"版本 / Step 3: Mark a known "good" version
# ========================================
git bisect good v1.0
# 或者 / Or: git bisect good a1b2c3d

# ========================================
# 步骤 4: Git 自动切换到中间提交 / Step 4: Git checks out the midpoint
# ========================================
# Git 会告诉你类似 / Git will tell you something like:
# "Bisecting: 5 revisions left to test after this (roughly 3 steps)"

# 测试当前版本（运行你的程序）/ Test current version (run your program)
# 如果正常 / If working:
git bisect good
# 如果有 bug / If broken:
git bisect bad

# ========================================
# 步骤 5: 重复步骤 4，直到找到问题提交 / Step 5: Repeat step 4 until found
# ========================================
# Git 会不断缩小范围 / Git keeps narrowing down
# 最终输出 / Eventually outputs:
# "a1b2c3d is the first bad commit"
# "Author: xiaoming"
# "Date: Mon Jun 1 10:00:00 2026"
# "    refactor: optimize calculator operations"

# ========================================
# 步骤 6: 重置 bisect / Step 6: Reset bisect
# ========================================
git bisect reset
# 回到你原来的分支 / Returns to your original branch
```

### 自动 bisect / Automated Bisect with `git bisect run`

如果你有自动化测试脚本，可以让 bisect 完全自动运行：

If you have an automated test script, you can let bisect run fully automatically:

```bash
# 创建测试脚本 / Create a test script
cat > test_calculator.sh << 'EOF'
#!/bin/bash
# 测试 add 函数是否正确 / Test if add function works correctly
# 2 + 3 应该等于 5 / 2 + 3 should equal 5
node -e "
const fs = require('fs');
eval(fs.readFileSync('src/calculator.js', 'utf8'));
const result = add(2, 3);
process.exit(result === 5 ? 0 : 1);
"
EOF
chmod +x test_calculator.sh

# 运行自动 bisect / Run automated bisect
git bisect start
git bisect bad HEAD
git bisect good v1.0
git bisect run ./test_calculator.sh

# 自动完成后查看结果 / Check result after auto-completion
# 然后重置 / Then reset
git bisect reset
```

### 实战示例：找出计算器 add 函数的 bug / Practical Example: Find the Calculator's add Bug

```bash
# 假设我们有以下提交历史 / Suppose we have this commit history:
git log --oneline
# a1b2c3d feat: add dark mode
# e4f5g6h refactor: clean up calculator code    ← bug 在这里引入 / bug introduced here
# i7j8k9l feat: add division operator
# m0n1o2p feat: add multiplication
# n3o4p5q feat: add subtraction
# q6r7s8t feat: initial calculator (working)

# 启动 bisect / Start bisect
git bisect start

# 当前版本是坏的（2+3=23 而不是 5）/ Current is bad (2+3=23 not 5)
git bisect bad

# 最初的版本是好的 / Initial version was good
git bisect good q6r7s8t

# Git 切到中间点 / Git goes to midpoint:
# Bisecting: ... i7j8k9l feat: add division operator

# 测试 2+3... 结果是 5，正确！/ Test 2+3... result is 5, correct!
git bisect good

# Git 继续缩小范围 / Git narrows further:
# Bisecting: ... e4f5g6h refactor: clean up calculator code

# 测试 2+3... 结果是 23，错误！/ Test 2+3... result is 23, wrong!
git bisect bad

# 找到了！/ Found it!
# e4f5g6h is the first bad commit
# Author: xiaoming
# Date: ...
#     refactor: clean up calculator code

# 查看这个提交改了什么 / See what this commit changed
git show e4f5g6h
# 发现 add 函数被错误地修改了 / Discover add function was incorrectly modified

# 重置 / Reset
git bisect reset
```

---

## 4. `git reflog`（找回丢失的提交 / Finding Lost Commits）

`git reflog` 记录了 HEAD 的每一次移动——即使提交被删除或重置，reflog 也能找到它们。

`git reflog` records every movement of HEAD — even if commits are deleted or reset, reflog can find them.

### `git reflog` vs `git log`

| | `git log` | `git reflog` |
|---|---|---|
| **显示内容 / Shows** | 可达的提交历史 / Reachable commit history | HEAD 的所有移动 / All HEAD movements |
| **已删除的提交 / Deleted commits** | 不可见 / Not visible | 可见 / Visible |
| **reset 后的提交 / Post-reset commits** | 不可见 / Not visible | 可见 / Visible |
| **本地记录 / Local** | 所有仓库 / All repos | 仅本地 / Local only |
| **生命周期 / Lifespan** | 永久 / Permanent | 默认 90 天 / 90 days by default |

### 查看 reflog / Viewing Reflog

```bash
git reflog
```

输出示例 / Example output:

```
a1b2c3d HEAD@{0}: commit: feat: add dark mode
e4f5g6h HEAD@{1}: reset: moving to HEAD~3
i7j8k9l HEAD@{2}: commit: feat: add contact form
m0n1o2p HEAD@{3}: commit: fix: update styles
n3o4p5q HEAD@{4}: commit: feat: add calculator
q6r7s8t HEAD@{5}: checkout: moving from feature/login to main
```

### 恢复误删的提交 / Recovering Accidentally Deleted Commits

```bash
# 场景：你不小心 reset 掉了 3 个提交 / Scenario: You accidentally reset away 3 commits
git reset --hard HEAD~3
# 糟糕！那 3 个提交丢了！/ Oops! Those 3 commits are gone!

# 别慌！用 reflog 找回 / Don't panic! Use reflog to recover
git reflog
# 找到 reset 之前的提交 / Find the commit before reset:
# i7j8k9l HEAD@{1}: commit: feat: add contact form  ← 这个！/ This one!

# 方法 1: 直接 reset 回去 / Method 1: Reset back to it
git reset --hard i7j8k9l

# 方法 2: 使用 reflog 引用 / Method 2: Use reflog reference
git reset --hard HEAD@{1}

# 方法 3: 用 cherry-pick 挑选特定提交 / Method 3: Cherry-pick specific commits
git cherry-pick e4f5g6h
git cherry-pick m0n1o2p
git cherry-pick i7j8k9l
```

### 从 reflog 中 cherry-pick / Cherry-picking from Reflog

```bash
# 只需要某个丢失的提交 / Only need a specific lost commit
git cherry-pick HEAD@{3}

# 查看那个提交的内容（先看看再决定是否要）/ View that commit's content (decide before applying)
git show HEAD@{3}
```

---

## 5. `git diff` 的各种用法 / `git diff` Variations

`git diff` 是查看代码差异的核心命令。

`git diff` is the core command for viewing code differences.

### 常用变体 / Common Variants

```bash
# 工作区 vs 暂存区（未暂存的改动）/ Working directory vs staging area (unstaged changes)
git diff

# 暂存区 vs 最后一次提交（已暂存的改动）/ Staging area vs last commit (staged changes)
git diff --staged
git diff --cached    # 等价于 --staged / Equivalent to --staged

# 两个分支之间的差异 / Diff between two branches
git diff main..feature/calculator

# 某个分支和当前分支的差异 / Diff between a branch and current
git diff main...HEAD

# 两个提交之间的差异 / Diff between two commits
git diff a1b2c3d e4f5g6h

# 某个文件的历史差异 / File history diff
git diff HEAD~3 -- src/calculator.js

# 只看文件名变化 / Only see file name changes
git diff --name-only HEAD~3

# 查看统计摘要 / View statistical summary
git diff --stat HEAD~3

# 忽略空白变化 / Ignore whitespace changes
git diff -w
```

### diff 输出解读 / Reading Diff Output

```diff
diff --git a/src/calculator.js b/src/calculator.js
--- a/src/calculator.js          # 旧版本 / Old version
+++ b/src/calculator.js          # 新版本 / New version
@@ -10,6 +10,7 @@               # 从第 10 行开始，上下文 6 行 / Starting at line 10
 function add(a, b) {
-    return a + b;               # 删除的行（红色）/ Removed line (red)
+    return Number(a) + Number(b);  # 新增的行（绿色）/ Added line (green)
 }
                                  # 上下文行（未改动）/ Context lines (unchanged)
```

---

## 6. 综合练习 / Comprehensive Exercises

以下练习使用 MyPortfolio 的 `calculator.js`（位于 `10-debugging/src/` 目录）。

The following exercises use MyPortfolio's `calculator.js` (in the `10-debugging/src/` directory).

### 练习 1: 使用 git log 查找信息 / Exercise 1: Find Information with git log

```bash
# 问题：找出所有修改过 calculator.js 的提交
# Question: Find all commits that modified calculator.js
git log --oneline -- src/calculator.js

# 问题：找出最近 2 周内小明的所有提交
# Question: Find all of xiaoming's commits in the last 2 weeks
git log --author="xiaoming" --since="2 weeks ago" --oneline

# 问题：找到包含 "fix" 关键词的提交
# Question: Find commits containing the keyword "fix"
git log --grep="fix" --oneline
```

### 练习 2: 使用 git blame 追溯代码 / Exercise 2: Trace Code with git blame

```bash
# 问题：谁最后修改了 add 函数？
# Question: Who last modified the add function?
git blame -L '/function add/,+3' src/calculator.js

# 问题：calculator.js 的第 20-30 行是谁写的？
# Question: Who wrote lines 20-30 of calculator.js?
git blame -L 20,30 src/calculator.js
```

### 练习 3: 使用 git bisect 找到 bug / Exercise 3: Find the Bug with git bisect

```bash
# 挑战：计算器中有一个 bug（add 函数在某些情况下不正确）
# Challenge: The calculator has a bug (add function is incorrect in some cases)

# 1. 打开 src/index.html，试试计算 2 + 3
# 1. Open src/index.html, try calculating 2 + 3
#    结果是 23 而不是 5？bug 存在！
#    Result is 23 instead of 5? Bug exists!

# 2. 使用 git bisect 找到引入 bug 的提交
# 2. Use git bisect to find the commit that introduced the bug
git bisect start
git bisect bad HEAD
git bisect good <最早的提交 hash>

# 3. 在每一步测试计算器是否工作正常
# 3. At each step, test if the calculator works
# 4. 标记 good 或 bad
# 4. Mark good or bad
# 5. 找到后使用 git show 查看修改内容
# 5. After finding it, use git show to view the changes
git bisect reset
```

### 练习 4: 恢复丢失的提交 / Exercise 4: Recover Lost Commits

```bash
# 模拟场景：不小心 reset 了代码
# Simulate scenario: accidentally reset code

# 先确保你有一个安全备份 / First ensure you have a safe backup
git branch backup-before-exercise

# 模拟误操作 / Simulate accidental operation
git reset --hard HEAD~2

# 现在用 reflog 恢复 / Now recover with reflog
git reflog
# 找到 HEAD~2 之前的位置 / Find the position before HEAD~2
git reset --hard HEAD@{1}

# 验证恢复成功 / Verify recovery
git log --oneline
```

---

## 本章小结 / Chapter Summary

| 工具 / Tool | 用途 / Purpose | 关键命令 / Key Command |
|---|---|---|
| `git log --oneline --graph` | 可视化历史 / Visualize history | 日常使用 / Daily use |
| `git blame` | 追溯代码修改者 / Trace code authors | 定位责任 / Locate responsibility |
| `git bisect` | 二分法找 bug / Binary search for bugs | `git bisect start` → `good`/`bad` |
| `git reflog` | 找回丢失提交 / Recover lost commits | 救命稻草 / Safety net |
| `git diff` | 查看代码差异 / View code differences | `--staged`, `branch..branch` |

**调试的黄金法则 / Golden Rule of Debugging**：
先确认 bug 存在，再确定"上次好的版本"，然后用 `git bisect` 快速定位。
First confirm the bug exists, then identify the "last known good version," then use `git bisect` to quickly locate the culprit.

---

> **导航 / Navigation**
> [上一章 / Previous: 团队协作工作流](../09-workflow-patterns/README.md) |
> [目录 / Home](../../README.md) |
> [下一章 / Next: 高级特性与内部原理](../11-advanced/README.md)
