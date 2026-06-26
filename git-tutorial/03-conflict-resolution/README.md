# Chapter 03: 合并冲突与解决 / Conflict Resolution

> **前置要求 / Prerequisites:** 完成 Chapter 02（分支管理）/ Complete Chapter 02 (Branching)
>
> **预计时间 / Estimated Time:** 45 分钟 / 45 minutes

---

## 目录 / Table of Contents

1. [冲突是如何产生的 / How Conflicts Arise](#冲突是如何产生的--how-conflicts-arise)
2. [冲突标记详解 / Conflict Markers Explained](#冲突标记详解--conflict-markers-explained)
3. [模拟冲突场景 / Simulating a Conflict](#模拟冲突场景--simulating-a-conflict)
4. [解决冲突 / Resolving Conflicts](#解决冲突--resolving-conflicts)
5. [使用 VS Code 合并编辑器 / Using VS Code Merge Editor](#使用-vs-code-合并编辑器--using-vs-code-merge-editor)
6. [使用外部合并工具 / Using External Merge Tools](#使用外部合并工具--using-external-merge-tools)
7. [取消合并 / Aborting a Merge](#取消合并--aborting-a-merge)
8. [避免冲突的最佳实践 / Best Practices for Avoiding Conflicts](#避免冲突的最佳实践--best-practices-for-avoiding-conflicts)
9. [练习 / Exercises](#练习--exercises)

---

## 冲突是如何产生的 / How Conflicts Arise

当两个分支修改了**同一文件的同一行**（或相邻行）时，Git 无法自动判断应该保留哪个版本，于是产生冲突。

When two branches modify **the same lines** (or adjacent lines) **of the same file**, Git cannot automatically decide which version to keep, so it creates a conflict.

### 冲突场景图 / Conflict Scenario Diagram

```
                    main
                     │
                     ▼
              ┌──────────────┐
              │   index.html │
              │  <nav>       │
              │   Home       │
              │   About      │
              │   Contact    │
              └──────┬───────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ▼                   ▼
  feature/gallery       feature/blog
           │                   │
  添加 Gallery 链接      添加 Blog 链接
  Add Gallery link       Add Blog link
           │                   │
           ▼                   ▼
  ┌──────────────┐    ┌──────────────┐
  │   index.html │    │   index.html │
  │   Home       │    │   Home       │
  │   About      │    │   About      │
  │ ★ Gallery    │    │ ★ Blog       │
  │   Contact    │    │   Contact    │
  └──────┬───────┘    └──────┬───────┘
           │                   │
           └─────────┬─────────┘
                     │
                     ▼
              ┌──────────────┐
              │   ⚠️ 冲突!    │
              │   CONFLICT!  │
              │              │
              │ Git 不知道    │
              │ 该保留哪个？  │
              │ Which to     │
              │ keep?        │
              └──────────────┘
```

**常见冲突场景 / Common Conflict Scenarios:**

| 场景 / Scenario | 描述 / Description |
|---|---|
| 同一行修改 / Same-line edit | 两人改了同一行代码 / Two people changed the same line |
| 相邻行修改 / Adjacent-line edit | 修改了紧邻的不同行 / Modified immediately adjacent lines |
| 删除 vs 修改 / Delete vs Modify | 一人删除了某行，另一人修改了它 / One deleted a line, the other modified it |
| 文件重命名 / File rename | 两人对同一文件做了不同重命名 / Two different renames of the same file |

---

## 冲突标记详解 / Conflict Markers Explained

当冲突发生时，Git 会在文件中插入特殊的标记：

When a conflict occurs, Git inserts special markers into the file:

```
<<<<<<< HEAD
这是当前分支的内容 / This is the content from the current branch
=======
这是要合并的分支的内容 / This is the content from the branch being merged
>>>>>>> feature/blog
```

### 标记含义 / Marker Meanings

| 标记 / Marker | 含义 / Meaning |
|---|---|
| `<<<<<<< HEAD` | **冲突区域的开始** — 当前分支（你所在的分支）的内容 / **Start of conflict** — content from the current branch |
| `=======` | **分隔符** — 分隔两个版本的内容 / **Separator** — divides the two versions |
| `>>>>>>> feature/blog` | **冲突区域的结束** — 被合并分支的内容 / **End of conflict** — content from the branch being merged |

> **注意 / Note:** `HEAD` 指向你当前所在的分支。`>>>>>>>` 后面是你要合并进来的分支名。
>
> `HEAD` points to your current branch. The name after `>>>>>>>` is the branch you're merging in.

---

## 模拟冲突场景 / Simulating a Conflict

让我们用 MyPortfolio 项目来模拟一个真实的冲突场景。

Let's simulate a real conflict scenario with the MyPortfolio project.

### 场景 / Scenario

两位开发者同时修改了 `index.html` 的导航栏：
- **开发者 A** 在 `feature/gallery` 分支添加了 "作品集 Gallery" 链接
- **开发者 B** 在 `feature/blog` 分支添加了 "博客 Blog" 链接

Two developers both modified the navbar in `index.html`:
- **Developer A** added a "Gallery" link on the `feature/gallery` branch
- **Developer B** added a "Blog" link on the `feature/blog` branch

### 步骤 1：创建初始状态 / Step 1: Create the Initial State

```bash
# 确保在 main 分支 / Make sure you're on main
git checkout main

# 查看当前导航栏 / Check the current navbar
cat src/index.html
```

当前 `index.html` 导航栏部分 / Current navbar in `index.html`:

```html
<nav>
    <ul>
        <li><a href="index.html">首页 Home</a></li>
        <li><a href="about.html">关于 About</a></li>
        <li><a href="contact.html">联系 Contact</a></li>
    </ul>
</nav>
```

### 步骤 2：创建 feature/gallery 分支并修改 / Step 2: Create feature/gallery Branch and Modify

```bash
# 创建并切换到 feature/gallery 分支
# Create and switch to feature/gallery branch
git checkout -b feature/gallery

# 修改 index.html，在 About 后面添加 Gallery 链接
# Edit index.html, add Gallery link after About
# 在 <li><a href="about.html">...</a></li> 之后添加：
# Add after the About line:
#         <li><a href="gallery.html">作品集 Gallery</a></li>

git add src/index.html
git commit -m "feat: 添加作品集导航链接 / Add gallery nav link"
```

### 步骤 3：创建 feature/blog 分支并修改 / Step 3: Create feature/blog Branch and Modify

```bash
# 切换回 main（从同一个起点开始）
# Switch back to main (start from the same point)
git checkout main

# 创建 feature/blog 分支
# Create feature/blog branch
git checkout -b feature/blog

# 修改 index.html，在 About 后面添加 Blog 链接
# Edit index.html, add Blog link after About
# 在 <li><a href="about.html">...</a></li> 之后添加：
# Add after the About line:
#         <li><a href="blog.html">博客 Blog</a></li>

git add src/index.html
git commit -m "feat: 添加博客导航链接 / Add blog nav link"
```

### 步骤 4：合并并触发冲突 / Step 4: Merge and Trigger Conflict

```bash
# 先合并 feature/gallery（成功）
# First merge feature/gallery (succeeds)
git checkout main
git merge feature/gallery

# 再合并 feature/blog（冲突！）
# Then merge feature/blog (conflict!)
git merge feature/blog
```

Git 输出 / Git output:

```
Auto-merging src/index.html
CONFLICT (content): Merge conflict in src/index.html
Automatic merge failed; fix conflicts and then commit the result.
```

### 步骤 5：查看冲突文件 / Step 5: View the Conflicted File

打开 `src/index.html`，你会看到：

Open `src/index.html`, you'll see:

```html
<nav>
    <ul>
        <li><a href="index.html">首页 Home</a></li>
        <li><a href="about.html">关于 About</a></li>
<<<<<<< HEAD
        <li><a href="gallery.html">作品集 Gallery</a></li>
=======
        <li><a href="blog.html">博客 Blog</a></li>
>>>>>>> feature/blog
        <li><a href="contact.html">联系 Contact</a></li>
    </ul>
</nav>
```

### 步骤 6：查看冲突状态 / Step 6: Check Conflict Status

```bash
git status
```

输出 / Output:

```
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   src/index.html
```

---

## 解决冲突 / Resolving Conflicts

有三种基本的解决方式：

There are three basic resolution strategies:

### 方式 1：保留当前分支（ours）/ Strategy 1: Keep Current Branch (ours)

只保留 `HEAD`（当前分支）的内容，删除被合并分支的修改。

Keep only the `HEAD` (current branch) content, discard the merged branch's changes.

```html
<!-- 解决后 / After resolution -->
<li><a href="gallery.html">作品集 Gallery</a></li>
```

### 方式 2：保留被合并分支（theirs）/ Strategy 2: Keep Merged Branch (theirs)

只保留被合并分支的内容。

Keep only the merged branch's content.

```html
<!-- 解决后 / After resolution -->
<li><a href="blog.html">博客 Blog</a></li>
```

### 方式 3：保留两者（推荐）/ Strategy 3: Keep Both (Recommended)

合并两个分支的修改，创建新的内容。

Combine changes from both branches into new content.

```html
<!-- 解决后 / After resolution -->
<li><a href="gallery.html">作品集 Gallery</a></li>
<li><a href="blog.html">博客 Blog</a></li>
```

### 手动解决冲突的完整步骤 / Complete Steps for Manual Resolution

```bash
# 1. 编辑冲突文件，删除冲突标记，保留想要的内容
#    Edit the conflicted file, remove markers, keep desired content

# 2. 标记为已解决
#    Mark as resolved
git add src/index.html

# 3. 完成合并提交
#    Complete the merge commit
git commit -m "merge: 合并 feature/blog，保留 Gallery 和 Blog 链接 / Merge feature/blog, keep both Gallery and Blog links"
```

解决后的 `index.html` / `index.html` after resolution:

```html
<nav>
    <ul>
        <li><a href="index.html">首页 Home</a></li>
        <li><a href="about.html">关于 About</a></li>
        <li><a href="gallery.html">作品集 Gallery</a></li>
        <li><a href="blog.html">博客 Blog</a></li>
        <li><a href="contact.html">联系 Contact</a></li>
    </ul>
</nav>
```

### 快捷解决方式 / Quick Resolution Shortcuts

```bash
# 保留当前分支版本（放弃对方修改）
# Keep current branch version (discard other side)
git checkout --ours src/index.html
git add src/index.html

# 保留被合并分支版本（放弃当前修改）
# Keep merged branch version (discard current side)
git checkout --theirs src/index.html
git add src/index.html
```

> **警告 / Warning:** 这两个命令会完全丢弃一方的修改，请谨慎使用！
>
> These commands completely discard one side's changes. Use with caution!

---

## 使用 VS Code 合并编辑器 / Using VS Code Merge Editor

VS Code 提供了强大的可视化合并编辑器，让冲突解决变得直观。

VS Code provides a powerful visual merge editor that makes conflict resolution intuitive.

### 启用合并编辑器 / Enable Merge Editor

VS Code 默认已启用合并编辑器。如果没有，可以在设置中开启：

The merge editor is enabled by default. If not, enable it in settings:

```json
{
    "git.mergeEditor": true
}
```

### 使用步骤 / Usage Steps

1. **打开冲突文件** — VS Code 会自动检测到冲突并用高亮标记
   **Open the conflicted file** — VS Code auto-detects conflicts and highlights them

2. **点击 "Open Merge Editor"** — 打开三栏合并视图
   **Click "Open Merge Editor"** — Opens a three-pane merge view

3. **三栏视图说明 / Three-pane view explained:**

```
┌──────────────────┬──────────────────┬──────────────────┐
│  左侧 / Left     │   结果 / Result  │   右侧 / Right   │
│  (当前分支)      │   (最终文件)     │  (被合并分支)     │
│  (Current)       │   (Final)        │  (Incoming)      │
│                  │                  │                  │
│  Gallery link    │   ???            │   Blog link      │
│                  │                  │                  │
│  [ ] Accept     │   选择内容       │   [ ] Accept     │
│  Current Change  │   Select content │   Incoming Change│
└──────────────────┴──────────────────┴──────────────────┘
```

4. **选择操作 / Choose an action:**
   - **Accept Current Change** — 接受当前分支的修改
   - **Accept Incoming Change** — 接受被合并分支的修改
   - **Accept Both Changes** — 同时接受两者的修改
   - **Compare** — 对比两个版本

5. **保存并关闭** — 结果会自动写入文件
   **Save and close** — Results are written to the file automatically

### 内联冲突提示 / Inline Conflict Hints

VS Code 还在代码行上方显示快捷操作按钮：

VS Code also shows quick action buttons above the conflict lines:

```
    Accept Current Change | Accept Incoming Change | Accept Both | Compare
<<<<<<< HEAD
        <li><a href="gallery.html">作品集 Gallery</a></li>
=======
        <li><a href="blog.html">博客 Blog</a></li>
>>>>>>> feature/blog
```

---

## 使用外部合并工具 / Using External Merge Tools

对于复杂的冲突，专业的合并工具能提供更好的体验。

For complex conflicts, dedicated merge tools provide a better experience.

### 配置合并工具 / Configure a Merge Tool

```bash
# 查看可用的合并工具
# List available merge tools
git mergetool --tool-help

# 配置 meld 为默认合并工具
# Configure meld as default merge tool
git config --global merge.tool meld

# 配置 kdiff3
# Configure kdiff3
git config --global merge.tool kdiff3

# 配置 VS Code 作为合并工具
# Configure VS Code as merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

### 常用合并工具 / Popular Merge Tools

| 工具 / Tool | 平台 / Platform | 特点 / Features |
|---|---|---|
| **Meld** | Linux, Windows, macOS | 免费开源，三栏对比 / Free, open-source, 3-way diff |
| **KDiff3** | 全平台 / All platforms | 强大的三向合并 / Powerful 3-way merge |
| **Beyond Compare** | 全平台 / All platforms | 商业软件，功能最全 / Commercial, most feature-rich |
| **P4Merge** | 全平台 / All platforms | 免费，Perforce 出品 / Free, by Perforce |
| **VS Code** | 全平台 / All platforms | 内置合并编辑器 / Built-in merge editor |

### 启动合并工具 / Launch the Merge Tool

```bash
# 对冲突文件启动合并工具
# Launch merge tool for conflicted files
git mergetool

# 指定工具
# Specify a tool
git mergetool --tool=meld

# 跳过确认提示
# Skip confirmation prompts
git config --global mergetool.prompt false
```

> **提示 / Tip:** `git mergetool` 会为每个有冲突的文件依次启动合并工具。
>
> `git mergetool` launches the merge tool for each conflicted file one by one.

---

## 取消合并 / Aborting a Merge

如果你发现冲突太复杂，或者合并不是你想要的，可以随时取消：

If the conflict is too complex or the merge wasn't what you wanted, you can abort:

```bash
# 取消正在进行的合并，回到合并前的状态
# Abort the in-progress merge, return to pre-merge state
git merge --abort
```

### 何时使用 `--abort` / When to Use `--abort`

- 冲突太多，需要重新规划合并策略 / Too many conflicts, need to re-plan the merge strategy
- 合并了错误的分支 / Merged the wrong branch
- 想在合并前先 rebase / Want to rebase before merging
- 需要与团队讨论后再合并 / Need to discuss with the team before merging

```bash
# 取消合并
# Abort the merge
git merge --abort

# 验证已回到合并前状态
# Verify you're back to pre-merge state
git status
git log --oneline -5
```

> **注意 / Note:** `git merge --abort` 只能在合并进行中（尚未 commit）时使用。一旦合并已提交，需要用 `git revert` 或 `git reset` 来撤销。
>
> `git merge --abort` only works while a merge is in progress (not yet committed). Once the merge is committed, use `git revert` or `git reset` to undo it.

---

## 避免冲突的最佳实践 / Best Practices for Avoiding Conflicts

### 1. 频繁合并 / Merge Frequently

```
  ❌ 长时间不合并                          ✅ 频繁合并
  Long-lived branches                      Merge often

  main ──●───────●                         main ──●──●──●──●
              \                                 \  \  \
  feature ────●──●──●──●──●──●         feature ──●──●──●──●
                 (6个提交后合并，                    (每1-2个提交
                  冲突风险高)                       就合并一次)
```

### 2. 小步提交 / Make Small Commits

每个提交只做一件事，减少冲突的可能性。

Each commit does one thing, reducing the chance of conflicts.

```bash
# ❌ 一个提交改了太多东西 / One commit changes too many things
git commit -m "更新导航栏、修改样式、修复bug"

# ✅ 分成小提交 / Split into small commits
git commit -m "feat: 添加 Gallery 导航链接"
git commit -m "style: 调整导航栏间距"
git commit -m "fix: 修复移动端导航菜单"
```

### 3. 定期同步主分支 / Regularly Sync with Main

```bash
# 定期将 main 合并到你的功能分支
# Regularly merge main into your feature branch
git checkout feature/gallery
git merge main

# 或者使用 rebase（见 Chapter 05）
# Or use rebase (see Chapter 05)
git rebase main
```

### 4. 沟通与协调 / Communication & Coordination

- **分配文件所有权** — 明确谁负责哪些文件 / **Assign file ownership** — Clarify who owns which files
- **使用 CODEOWNERS 文件** — 自动通知相关开发者 / **Use CODEOWNERS file** — Auto-notify relevant developers
- **合并前在团队频道通知** — 避免两人同时改同一文件 / **Notify in team channel before merging** — Avoid simultaneous edits
- **使用 feature flags** — 避免长期分支 / **Use feature flags** — Avoid long-lived branches

### 5. 使用 .gitattributes 配置合并策略 / Configure Merge Strategies with .gitattributes

```gitattributes
# 某些文件总是使用某一方的版本
# Some files should always use one side's version

# 锁文件总是使用当前分支版本
# Lock files always use current branch version
package-lock.json merge=ours

# 自动生成的文件使用自定义合并
# Auto-generated files use custom merge
*.min.js merge=union
```

---

## 练习 / Exercises

### 练习 1：手动制造并解决冲突 / Exercise 1: Create and Resolve a Conflict Manually

```bash
# 1. 从 main 创建两个分支
#    Create two branches from main
git checkout main
git checkout -b exercise/branch-a
# 修改 index.html 的 <h1> 标签内容
# Modify the <h1> tag content in index.html
git add src/index.html && git commit -m "exercise: branch-a change"

git checkout main
git checkout -b exercise/branch-b
# 修改 index.html 的同一个 <h1> 标签为不同内容
# Modify the same <h1> tag to different content
git add src/index.html && git commit -m "exercise: branch-b change"

# 2. 合并两个分支，触发冲突
#    Merge both branches to trigger a conflict
git checkout main
git merge exercise/branch-a
git merge exercise/branch-b

# 3. 解决冲突（选择你喜欢的版本）
#    Resolve the conflict (pick your preferred version)

# 4. 完成合并提交
#    Complete the merge commit
```

### 练习 2：使用三种策略分别解决同一冲突 / Exercise 2: Resolve the Same Conflict with Three Strategies

重复练习 1 的冲突场景，分别用三种方式解决：
1. 保留 branch-a 的内容
2. 保留 branch-b 的内容
3. 合并两者的内容

Repeat the conflict scenario from Exercise 1, resolving with three strategies:
1. Keep branch-a's content
2. Keep branch-b's content
3. Combine both contents

### 练习 3：多文件冲突 / Exercise 3: Multi-file Conflict

创建两个分支，让它们在 `index.html` 和 `style.css` 中同时产生冲突，然后逐一解决。

Create two branches that conflict in both `index.html` and `style.css`, then resolve them one by one.

### 练习 4：使用 VS Code 合并编辑器 / Exercise 4: Use VS Code Merge Editor

重复练习 1，但这次使用 VS Code 的合并编辑器来解决冲突，体验可视化操作。

Repeat Exercise 1, but use VS Code's merge editor to resolve the conflict and experience the visual workflow.

### 练习 5：实践 `git merge --abort` / Exercise 5: Practice `git merge --abort`

制造一个冲突，然后用 `git merge --abort` 取消合并，验证工作目录回到了合并前的状态。

Create a conflict, then use `git merge --abort` to cancel the merge. Verify the working directory is back to pre-merge state.

---

## 本章小结 / Chapter Summary

| 命令 / Command | 用途 / Purpose |
|---|---|
| `git status` | 查看冲突文件列表 / View conflicted files |
| `git add <file>` | 标记冲突为已解决 / Mark conflict as resolved |
| `git commit` | 完成合并提交 / Complete the merge commit |
| `git merge --abort` | 取消合并 / Abort the merge |
| `git checkout --ours <file>` | 保留当前分支版本 / Keep current branch version |
| `git checkout --theirs <file>` | 保留被合并分支版本 / Keep merged branch version |
| `git mergetool` | 使用外部工具解决冲突 / Use external tool for conflict resolution |

---

## 导航 / Navigation

| 上一章 / Previous Chapter | 下一章 / Next Chapter |
|---|---|
| [Chapter 02: 分支管理 / Branching](../02-branching/README.md) | [Chapter 04: 远程仓库与协作 / Remote Repositories](../04-remote-repos/README.md) |

[返回总目录 / Back to Table of Contents](../README.md)
