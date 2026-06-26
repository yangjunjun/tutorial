# Chapter 01: 第一个仓库与基本工作流 / First Repo & Basic Workflow

---

## 目录 / Table of Contents

1. [Git 的三个工作区域 / The Three Areas](#git-的三个工作区域--the-three-areas)
2. [初始化仓库 / Initialize Repository](#初始化仓库--initialize-repository)
3. [暂存文件 / Staging Files](#暂存文件--staging-files)
4. [提交更改 / Committing Changes](#提交更改--committing-changes)
5. [.gitignore 文件 / The .gitignore File](#gitignore-文件--the-gitignore-file)
6. [查看历史 / Viewing History](#查看历史--viewing-history)
7. [查看差异 / Viewing Differences](#查看差异--viewing-differences)
8. [实战演练 / Step-by-Step Walkthrough](#实战演练--step-by-step-walkthrough)
9. [练习 / Exercises](#练习--exercises)

---

## Git 的三个工作区域 / The Three Areas

### 中文

理解 Git 的核心，首先要理解它的三个工作区域。这是 Git 最基础也最重要的概念。

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Working Tree   │────▶│  Staging Area   │────▶│   Repository    │
│  （工作区）      │     │  （暂存区）       │     │  （本地仓库）     │
│                 │     │                 │     │                 │
│  你编辑的文件    │     │  准备提交的文件   │     │  已提交的历史    │
│  Your files     │     │  Files to be    │     │  Commit history │
│  being edited   │     │  committed      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

      修改文件              git add               git commit
    Edit files          Stage changes          Record changes
```

**工作区（Working Tree / Working Directory）**：
- 就是你实际工作的目录，你在这里编辑、创建、删除文件
- 所有修改都首先发生在这里

**暂存区（Staging Area / Index）**：
- 一个"准备区域"，用来选择哪些修改要包含在下一次提交中
- 就像购物前先把商品放进购物车

**本地仓库（Repository / .git Directory）**：
- Git 存储所有版本历史的地方
- 每次 `commit` 都会在这里创建一个新的快照

### English

To understand Git's core, you first need to understand its three working areas. This is the most fundamental and important concept in Git.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Working Tree   │────▶│  Staging Area   │────▶│   Repository    │
│                 │     │                 │     │                 │
│  Your files     │     │  Files to be    │     │  Commit history │
│  being edited   │     │  committed      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

      Edit files         Stage changes         Record changes
      (modify)           (git add)             (git commit)
```

**Working Tree (Working Directory)**:
- The directory where you actually work — editing, creating, and deleting files
- All changes happen here first

**Staging Area (Index)**:
- A "preparation zone" where you select which changes to include in the next commit
- Think of it like putting items in a shopping cart before checking out

**Repository (.git Directory)**:
- Where Git stores all version history
- Each `commit` creates a new snapshot here

---

## 初始化仓库 / Initialize Repository

### 中文

让我们开始创建 MyPortfolio 项目！

```bash
# 创建项目目录
mkdir MyPortfolio
cd MyPortfolio

# 初始化 Git 仓库
git init

# 你会看到：Initialized empty Git repository in /path/to/MyPortfolio/.git/
```

`git init` 做了什么？
- 在当前目录下创建了一个隐藏的 `.git/` 文件夹
- 这个文件夹包含了 Git 的所有元数据和对象数据库
- **不要手动修改或删除 `.git/` 文件夹！**

检查仓库状态：

```bash
git status
# On branch main
# No commits yet
# nothing to commit (create/copy files and use "git add" to track)
```

### English

Let's start building the MyPortfolio project!

```bash
# Create the project directory
mkdir MyPortfolio
cd MyPortfolio

# Initialize a Git repository
git init

# You'll see: Initialized empty Git repository in /path/to/MyPortfolio/.git/
```

What does `git init` do?
- Creates a hidden `.git/` folder in the current directory
- This folder contains all of Git's metadata and object database
- **Do not manually modify or delete the `.git/` folder!**

Check the repository status:

```bash
git status
# On branch main
# No commits yet
# nothing to commit (create/copy files and use "git add" to track)
```

---

## 暂存文件 / Staging Files

### 中文

现在创建一些文件，然后学习如何将它们加入暂存区。

```bash
# 创建 index.html（具体内容见 src/index.html）
# 创建 style.css（具体内容见 src/style.css）

# 查看状态 — 新文件会显示为 "Untracked"
git status
```

输出示例：

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        index.html
        style.css

nothing added to commit but untracked files present (use "git add" to track)
```

**git add** — 将文件添加到暂存区：

```bash
# 暂存单个文件
git add index.html

# 暂存多个文件
git add index.html style.css

# 暂存所有更改（谨慎使用）
git add .

# 暂存某个目录下的所有更改
git add src/
```

添加后再次查看状态：

```bash
git status
```

输出示例：

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   index.html
        new file:   style.css
```

注意状态的变化：从 `Untracked files`（红色）变成了 `Changes to be committed`（绿色）。

### English

Now let's create some files, then learn how to stage them.

```bash
# Create index.html (see src/index.html for content)
# Create style.css (see src/style.css for content)

# Check status — new files show as "Untracked"
git status
```

Example output:

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        index.html
        style.css

nothing added to commit but untracked files present (use "git add" to track)
```

**git add** — stage files:

```bash
# Stage a single file
git add index.html

# Stage multiple files
git add index.html style.css

# Stage all changes (use with caution)
git add .

# Stage all changes in a directory
git add src/
```

Check status again after adding:

```bash
git status
```

Example output:

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   index.html
        new file:   style.css
```

Notice the status change: from `Untracked files` (red) to `Changes to be committed` (green).

---

## 提交更改 / Committing Changes

### 中文

暂存区准备好后，就可以创建提交了。

```bash
# 基本提交
git commit -m "feat: add initial homepage and styles"

# 更详细的提交信息（使用多行）
git commit -m "feat: add initial homepage and styles" -m "
- Create index.html with hero section and project grid
- Add base CSS styles for navigation, hero, and footer
- Set up bilingual content structure (Chinese/English)"
```

**好的提交信息应该遵循以下规范：**

```
<type>: <short description>

[optional longer description]

[optional footer: references to issues, breaking changes, etc.]
```

**常用的 type（类型）：**

| Type | 说明 / Description |
|------|-------------------|
| `feat` | 新功能 / New feature |
| `fix` | 修复 bug / Bug fix |
| `docs` | 文档更改 / Documentation changes |
| `style` | 格式调整（不影响代码逻辑）/ Formatting (no logic change) |
| `refactor` | 代码重构 / Code refactoring |
| `test` | 添加或修改测试 / Adding or modifying tests |
| `chore` | 构建/工具变更 / Build/tooling changes |

**提交最佳实践：**

- 每次提交只做一件事（原子提交）
- 提交信息用英文或中文都可以，保持团队统一
- 使用祈使语气（"add" 而不是 "added" 或 "adds"）
- 第一行不超过 50 个字符

### English

Once the staging area is ready, you can create a commit.

```bash
# Basic commit
git commit -m "feat: add initial homepage and styles"

# More detailed commit message (multi-line)
git commit -m "feat: add initial homepage and styles" -m "
- Create index.html with hero section and project grid
- Add base CSS styles for navigation, hero, and footer
- Set up bilingual content structure (Chinese/English)"
```

**A good commit message should follow this convention:**

```
<type>: <short description>

[optional longer description]

[optional footer: references to issues, breaking changes, etc.]
```

**Common commit types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding or modifying tests |
| `chore` | Build/tooling changes |

**Commit best practices:**

- Each commit should do one thing (atomic commits)
- Commit messages can be in English or Chinese — be consistent with your team
- Use imperative mood ("add" not "added" or "adds")
- Keep the first line under 50 characters

---

## .gitignore 文件 / The .gitignore File

### 中文

并非所有文件都应该被 Git 追踪。有些文件（如编译产物、敏感信息、依赖包）应该被忽略。

`.gitignore` 文件告诉 Git 哪些文件或目录不需要被追踪。

**创建 `.gitignore` 文件：**

```bash
# 在项目根目录创建
touch .gitignore
```

**推荐的 `.gitignore` 内容（适用于前端项目）：**

```gitignore
# ===== 依赖目录 / Dependencies =====
node_modules/
vendor/
bower_components/

# ===== 构建输出 / Build Output =====
dist/
build/
*.min.js
*.min.css

# ===== 编辑器和 IDE / Editors & IDEs =====
.vscode/
.idea/
*.swp
*.swo
*~

# ===== 操作系统文件 / OS Files =====
.DS_Store
Thumbs.db
desktop.ini

# ===== 环境变量 / Environment Variables =====
.env
.env.local
.env.*.local

# ===== 日志文件 / Log Files =====
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ===== 临时文件 / Temporary Files =====
*.tmp
*.temp
.cache/
```

**.gitignore 语法规则：**

| 模式 | 说明 / Description |
|------|-------------------|
| `node_modules/` | 忽略目录 / Ignore directory |
| `*.log` | 忽略所有 .log 文件 / Ignore all .log files |
| `!important.log` | 不忽略此文件（例外）/ Do NOT ignore this file (exception) |
| `build/*.js` | 只忽略 build 目录下的 .js / Ignore only .js in build/ |
| `**/temp` | 忽略所有层级的 temp 目录 / Ignore temp at any depth |
| `/root-only.txt` | 只忽略根目录的此文件 / Ignore only at root |

**如果文件已经被追踪了，.gitignore 不会生效。需要先从缓存中移除：**

```bash
# 从 Git 追踪中移除（但保留本地文件）
git rm --cached node_modules -r

# 然后添加到 .gitignore
echo "node_modules/" >> .gitignore

# 提交更改
git add .gitignore
git commit -m "chore: add .gitignore and remove tracked dependencies"
```

### English

Not all files should be tracked by Git. Some files (compiled output, sensitive info, dependency packages) should be ignored.

The `.gitignore` file tells Git which files or directories should not be tracked.

**Create a `.gitignore` file:**

```bash
# In the project root
touch .gitignore
```

**Recommended `.gitignore` content (for front-end projects):**

```gitignore
# ===== Dependencies =====
node_modules/
vendor/
bower_components/

# ===== Build Output =====
dist/
build/
*.min.js
*.min.css

# ===== Editors & IDEs =====
.vscode/
.idea/
*.swp
*.swo
*~

# ===== OS Files =====
.DS_Store
Thumbs.db
desktop.ini

# ===== Environment Variables =====
.env
.env.local
.env.*.local

# ===== Log Files =====
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ===== Temporary Files =====
*.tmp
*.temp
.cache/
```

**.gitignore syntax rules:**

| Pattern | Description |
|---------|-------------|
| `node_modules/` | Ignore directory |
| `*.log` | Ignore all .log files |
| `!important.log` | Do NOT ignore this file (exception) |
| `build/*.js` | Ignore only .js in build/ |
| `**/temp` | Ignore temp at any depth |
| `/root-only.txt` | Ignore only at root |

**If a file is already tracked, .gitignore won't affect it. You need to remove it from cache first:**

```bash
# Remove from Git tracking (but keep the local file)
git rm --cached node_modules -r

# Then add to .gitignore
echo "node_modules/" >> .gitignore

# Commit the changes
git add .gitignore
git commit -m "chore: add .gitignore and remove tracked dependencies"
```

---

## 查看历史 / Viewing History

### 中文

`git log` 是查看提交历史的核心命令。

```bash
# 基本日志（完整信息）
git log

# 精简日志（一行一个提交）
git log --oneline

# 图形化显示分支
git log --oneline --graph --decorate --all

# 显示最近 N 条提交
git log -5

# 显示每次提交修改了哪些文件
git log --stat

# 显示某个文件的历史
git log -- index.html

# 显示某个作者的提交
git log --author="Xiaoming"

# 搜索提交信息中的关键词
git log --grep="feat"
```

输出示例：

```
* a1b2c3d (HEAD -> main) feat: add initial homepage and styles
* e4f5g6h chore: initial commit with .gitignore
```

### English

`git log` is the core command for viewing commit history.

```bash
# Basic log (full information)
git log

# Concise log (one commit per line)
git log --oneline

# Graphical branch display
git log --oneline --graph --decorate --all

# Show last N commits
git log -5

# Show files changed in each commit
git log --stat

# Show history of a specific file
git log -- index.html

# Show commits by a specific author
git log --author="Xiaoming"

# Search for keywords in commit messages
git log --grep="feat"
```

Example output:

```
* a1b2c3d (HEAD -> main) feat: add initial homepage and styles
* e4f5g6h chore: initial commit with .gitignore
```

---

## 查看差异 / Viewing Differences

### 中文

`git diff` 用来查看文件之间的差异。

```bash
# 查看工作区与暂存区的差异（未暂存的修改）
git diff

# 查看暂存区与最新提交的差异（已暂存的修改）
git diff --cached
# 或
git diff --staged

# 查看工作区与最新提交的差异（所有修改）
git diff HEAD

# 查看两个提交之间的差异
git diff abc1234 def5678

# 查看某个文件的差异
git diff -- style.css

# 简洁模式（只显示文件名）
git diff --name-only

# 显示文件名和变更统计
git diff --stat
```

输出示例：

```diff
diff --git a/index.html b/index.html
index 83db48f..f735c2e 100644
--- a/index.html
+++ b/index.html
@@ -18,6 +18,10 @@
             <h2>我的项目 / My Projects</h2>
             <div class="project-grid">
-                <!-- Projects will be added here -->
+                <div class="project-card">
+                    <h3>天气应用 / Weather App</h3>
+                    <p>A weather app built with JavaScript</p>
+                </div>
             </div>
```

### English

`git diff` is used to view differences between files.

```bash
# Diff between working tree and staging area (unstaged changes)
git diff

# Diff between staging area and latest commit (staged changes)
git diff --cached
# or
git diff --staged

# Diff between working tree and latest commit (all changes)
git diff HEAD

# Diff between two commits
git diff abc1234 def5678

# Diff of a specific file
git diff -- style.css

# Name-only mode (show only file names)
git diff --name-only

# Show file names and change statistics
git diff --stat
```

Example output:

```diff
diff --git a/index.html b/index.html
index 83db48f..f735c2e 100644
--- a/index.html
+++ b/index.html
@@ -18,6 +18,10 @@
             <h2>My Projects</h2>
             <div class="project-grid">
-                <!-- Projects will be added here -->
+                <div class="project-card">
+                    <h3>Weather App</h3>
+                    <p>A weather app built with JavaScript</p>
+                </div>
             </div>
```

---

## 实战演练 / Step-by-Step Walkthrough

### 中文

现在让我们完整地走一遍 MyPortfolio 项目的初始设置流程。

**步骤 1：创建项目并初始化仓库**

```bash
mkdir MyPortfolio
cd MyPortfolio
git init
```

**步骤 2：创建 .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
EOF
```

**步骤 3：创建 index.html**

将以下内容保存为 `index.html`（完整代码见 `src/index.html`）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>MyPortfolio - 个人作品集</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="index.html">首页 Home</a></li>
                <li><a href="about.html">关于 About</a></li>
                <li><a href="contact.html">联系 Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h1>你好，我是小明</h1>
            <p>前端开发者 / Front-End Developer</p>
        </section>
        <section class="projects">
            <h2>我的项目 / My Projects</h2>
            <div class="project-grid">
                <!-- Projects will be added here -->
            </div>
        </section>
    </main>
    <footer>
        <p>&copy; 2026 MyPortfolio. All rights reserved.</p>
    </footer>
</body>
</html>
```

**步骤 4：创建 style.css**

将以下内容保存为 `style.css`（完整代码见 `src/style.css`）：

```css
/* MyPortfolio - 基础样式 */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; line-height: 1.6; color: #333; }
header { background-color: #2c3e50; padding: 1rem 0; }
nav ul { list-style: none; display: flex; justify-content: center; gap: 2rem; }
nav a { color: #ecf0f1; text-decoration: none; font-size: 1.1rem; }
.hero { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.projects { max-width: 1000px; margin: 2rem auto; padding: 0 2rem; }
footer { text-align: center; padding: 2rem; background-color: #2c3e50; color: #ecf0f1; }
```

**步骤 5：查看状态并暂存文件**

```bash
git status                        # 查看所有未追踪的文件
git add .gitignore                # 先暂存 .gitignore
git add index.html style.css      # 暂存页面和样式
git status                        # 确认暂存区的内容
```

**步骤 6：创建第一次提交**

```bash
git commit -m "feat: initialize MyPortfolio with homepage and base styles" -m "
- Add index.html with bilingual navigation and hero section
- Add style.css with base styles for layout, nav, and hero
- Add .gitignore for common front-end project files"
```

**步骤 7：查看提交历史**

```bash
git log --oneline
# 应该能看到你刚刚的提交

git log --stat
# 查看每个提交修改了哪些文件
```

**步骤 8：修改文件并创建第二次提交**

```bash
# 假设你修改了 index.html 中的一些内容
# ...

git status                        # 查看哪些文件被修改了
git diff                          # 查看具体的修改内容
git add index.html                # 暂存修改
git commit -m "docs: update hero section text"
git log --oneline                 # 查看更新后的历史
```

**完整流程示意图：**

```
创建文件 ──▶ git add ──▶ git commit ──▶ 修改文件 ──▶ git add ──▶ git commit ──▶ ...
   │            │             │              │            │             │
   ▼            ▼             ▼              ▼            ▼             ▼
 工作区      暂存区        仓库          工作区       暂存区         仓库
Working    Staging      Repository     Working     Staging      Repository
 Tree       Area                       Tree        Area
```

### English

Now let's walk through the complete MyPortfolio initial setup.

**Step 1: Create the project and initialize the repository**

```bash
mkdir MyPortfolio
cd MyPortfolio
git init
```

**Step 2: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
EOF
```

**Step 3: Create index.html**

Save the following as `index.html` (full code in `src/index.html`):

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>MyPortfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h1>Hi, I'm Xiaoming</h1>
            <p>Front-End Developer</p>
        </section>
        <section class="projects">
            <h2>My Projects</h2>
            <div class="project-grid">
                <!-- Projects will be added here -->
            </div>
        </section>
    </main>
    <footer>
        <p>&copy; 2026 MyPortfolio. All rights reserved.</p>
    </footer>
</body>
</html>
```

**Step 4: Create style.css**

Save the following as `style.css` (full code in `src/style.css`):

```css
/* MyPortfolio - Base Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; line-height: 1.6; color: #333; }
header { background-color: #2c3e50; padding: 1rem 0; }
nav ul { list-style: none; display: flex; justify-content: center; gap: 2rem; }
nav a { color: #ecf0f1; text-decoration: none; font-size: 1.1rem; }
.hero { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.projects { max-width: 1000px; margin: 2rem auto; padding: 0 2rem; }
footer { text-align: center; padding: 2rem; background-color: #2c3e50; color: #ecf0f1; }
```

**Step 5: Check status and stage files**

```bash
git status                        # View all untracked files
git add .gitignore                # Stage .gitignore first
git add index.html style.css      # Stage page and styles
git status                        # Confirm staging area contents
```

**Step 6: Create the first commit**

```bash
git commit -m "feat: initialize MyPortfolio with homepage and base styles" -m "
- Add index.html with bilingual navigation and hero section
- Add style.css with base styles for layout, nav, and hero
- Add .gitignore for common front-end project files"
```

**Step 7: View commit history**

```bash
git log --oneline
# You should see your commit

git log --stat
# View which files each commit changed
```

**Step 8: Modify files and create a second commit**

```bash
# Suppose you modify some content in index.html
# ...

git status                        # See which files were modified
git diff                          # View the exact changes
git add index.html                # Stage the changes
git commit -m "docs: update hero section text"
git log --oneline                 # View updated history
```

**Complete workflow diagram:**

```
Create ──▶ git add ──▶ git commit ──▶ Modify ──▶ git add ──▶ git commit ──▶ ...
  │          │            │              │         │            │
  ▼          ▼            ▼              ▼         ▼            ▼
Working   Staging     Repository     Working    Staging     Repository
 Tree      Area                       Tree       Area
```

---

## 练习 / Exercises

### 中文

1. **从零开始**：按照本章步骤，从头创建一个 MyPortfolio 仓库，完成第一次提交。

2. **多次提交**：
   - 创建 `index.html` 并提交
   - 创建 `style.css` 并提交
   - 创建 `.gitignore` 并提交
   - 这样你就有 3 个独立的提交，练习"原子提交"

3. **练习 git status**：在每个操作（修改、add、commit）之后都运行 `git status`，仔细观察输出的变化。

4. **练习 git diff**：
   - 修改 `style.css`，运行 `git diff` 查看改动
   - `git add style.css`，再运行 `git diff --cached` 查看暂存区的改动
   - 对比两者的区别

5. **提交信息规范**：回顾你的提交历史，尝试用 Conventional Commits 规范重写最后一条提交信息：
   ```bash
   git commit --amend -m "feat: your improved message"
   ```

6. **挑战**：创建一个 `README.md` 文件，用 Markdown 格式写一段项目简介，然后提交到仓库。

### English

1. **Start from scratch**: Follow the steps in this chapter to create a MyPortfolio repo from scratch and make your first commit.

2. **Multiple commits**:
   - Create `index.html` and commit
   - Create `style.css` and commit
   - Create `.gitignore` and commit
   - This gives you 3 separate commits — practice "atomic commits"

3. **Practice git status**: Run `git status` after every operation (modify, add, commit) and carefully observe how the output changes.

4. **Practice git diff**:
   - Modify `style.css`, run `git diff` to see changes
   - `git add style.css`, then run `git diff --cached` to see staged changes
   - Compare the difference between the two

5. **Commit message convention**: Review your commit history and try rewriting the last commit message using Conventional Commits:
   ```bash
   git commit --amend -m "feat: your improved message"
   ```

6. **Challenge**: Create a `README.md` file with a brief project introduction in Markdown, then commit it to the repository.

---

**上一章 / Previous Chapter**: [Chapter 00: Git 简介与安装配置 / Intro & Setup](../00-intro-and-setup/README.md)

**下一章 / Next Chapter**: [Chapter 02: 分支创建与切换 / Branching](../02-branching/README.md)
