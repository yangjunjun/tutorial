# Chapter 08: Git 钩子与自动化 / Git Hooks & Automation

> **前置要求 / Prerequisites:** 完成 Chapter 07（标签与版本发布）/ Complete Chapter 07 (Tags & Releases)
>
> **预计时间 / Estimated Time:** 50 分钟 / 50 minutes

---

## 目录 / Table of Contents

1. [什么是 Git 钩子？/ What Are Git Hooks?](#什么是-git-钩子--what-are-git-hooks)
2. [钩子生命周期 / Hook Lifecycle](#钩子生命周期--hook-lifecycle)
3. [客户端钩子 vs 服务器端钩子 / Client-side vs Server-side Hooks](#客户端钩子-vs-服务器端钩子--client-side-vs-server-side-hooks)
4. [编写 pre-commit 钩子 / Writing a pre-commit Hook](#编写-pre-commit-钩子--writing-a-pre-commit-hook)
5. [编写 commit-msg 钩子 / Writing a commit-msg Hook](#编写-commit-msg-钩子--writing-a-commit-msg-hook)
6. [编写 pre-push 钩子 / Writing a pre-push Hook](#编写-pre-push-钩子--writing-a-pre-push-hook)
7. [使用 Husky 管理钩子 / Using Husky for Hook Management](#使用-husky-管理钩子--using-husky-for-hook-management)
8. [lint-staged：只检查暂存文件 / lint-staged: Lint Staged Files Only](#lint-staged只检查暂存文件--lint-staged-lint-staged-files-only)
9. [实战：为 MyPortfolio 配置 pre-commit 钩子 / Step-by-Step: Set Up pre-commit Hook](#实战为-myportfolio-配置-pre-commit-钩子--step-by-step-set-up-pre-commit-hook)
10. [练习 / Exercises](#练习--exercises)

---

## 什么是 Git 钩子？/ What Are Git Hooks?

Git 钩子（Hooks）是在 Git 操作的特定阶段**自动执行**的脚本。它们存放在 `.git/hooks/` 目录下，可以用来：

Git hooks are scripts that **automatically execute** at specific stages of Git operations. They live in the `.git/hooks/` directory and can be used to:

- 在提交前自动运行代码检查 / Run code checks before committing
- 验证提交消息格式 / Validate commit message format
- 在推送前运行测试 / Run tests before pushing
- 自动格式化代码 / Auto-format code
- 拒绝不符合规范的提交 / Reject non-conforming commits

```bash
# 查看已有的钩子示例 / View existing hook samples
ls .git/hooks/
# applypatch-msg.sample
# commit-msg.sample
# post-update.sample
# pre-applypatch.sample
# pre-commit.sample
# pre-push.sample
# pre-rebase.sample
# prepare-commit-msg.sample
# update.sample
```

Git 在安装时提供了一系列 `.sample` 文件作为参考。将 `.sample` 后缀去掉即可激活对应的钩子。

Git ships with `.sample` files as references. Remove the `.sample` suffix to activate a hook.

---

## 钩子生命周期 / Hook Lifecycle

### 提交流程中的钩子 / Hooks in the Commit Workflow

```
  用户执行 git commit
  User runs git commit
          │
          ▼
  ┌─────────────────┐
  │  pre-commit     │  ← 检查代码 / Check code
  │  运行代码检查     │     如果失败，中止提交 / Abort if fails
  └────────┬────────┘
           │ 通过 / Pass
           ▼
  ┌─────────────────┐
  │  prepare-       │  ← 准备提交消息 / Prepare message
  │  commit-msg     │     可自动添加信息 / Can auto-add info
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  commit-msg     │  ← 验证提交消息 / Validate message
  │  验证消息格式     │     格式不对则拒绝 / Reject if invalid
  └────────┬────────┘
           │ 通过 / Pass
           ▼
  ┌─────────────────┐
  │  提交完成 ✓     │
  │  Commit done    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  post-commit    │  ← 通知、日志等 / Notifications, logging
  │  发送通知等       │     不影响提交结果 / Doesn't affect commit
  └─────────────────┘
```

### 推送流程中的钩子 / Hooks in the Push Workflow

```
  用户执行 git push
  User runs git push
          │
          ▼
  ┌─────────────────┐
  │  pre-push       │  ← 运行测试 / Run tests
  │  运行测试检查     │     如果失败，中止推送 / Abort if fails
  └────────┬────────┘
           │ 通过 / Pass
           ▼
  ┌─────────────────┐
  │  推送执行        │
  │  Push executes  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  post-push      │  ← 通知 CI 等 / Notify CI, etc.
  │  发送通知等       │     不影响推送结果 / Doesn't affect push
  └─────────────────┘
```

---

## 客户端钩子 vs 服务器端钩子 / Client-side vs Server-side Hooks

| 类型 / Type | 位置 / Location | 用途 / Purpose |
|---|---|---|
| **客户端钩子 / Client-side** | `.git/hooks/` | 在开发者本地机器上运行 / Run on developer's local machine |
| **服务器端钩子 / Server-side** | 服务器 Git 仓库 / Server Git repo | 在远程仓库服务器上运行 / Run on the remote repository server |

### 常用客户端钩子 / Common Client-side Hooks

| 钩子 / Hook | 触发时机 / Trigger | 常见用途 / Common Use |
|---|---|---|
| `pre-commit` | 提交前 / Before commit | 代码检查、格式化 / Linting, formatting |
| `commit-msg` | 提交消息编辑后 / After message editing | 消息格式验证 / Message format validation |
| `post-commit` | 提交后 / After commit | 通知、日志 / Notifications, logging |
| `pre-push` | 推送前 / Before push | 运行测试 / Run tests |

### 常用服务器端钩子 / Common Server-side Hooks

| 钩子 / Hook | 触发时机 / Trigger | 常见用途 / Common Use |
|---|---|---|
| `pre-receive` | 接收推送前 / Before receiving push | 拒绝不合规推送 / Reject non-compliant pushes |
| `update` | 更新引用前 / Before updating ref | 分支级别控制 / Branch-level control |
| `post-receive` | 接收推送后 / After receiving push | 触发部署、通知 / Trigger deploy, notifications |

> **重要 / Important:** 客户端钩子不会被推送到远程仓库。团队共享钩子的最佳实践是使用 Husky 等工具（见下文）。
>
> **Important:** Client-side hooks are NOT pushed to the remote repository. The best practice for sharing hooks in a team is to use tools like Husky (see below).

---

## 编写 pre-commit 钩子 / Writing a pre-commit Hook

pre-commit 钩子在 `git commit` 执行后、提交真正创建前运行。如果钩子脚本以非零状态退出，提交将被中止。

The pre-commit hook runs after `git commit` is invoked but before the commit is created. If the script exits with a non-zero status, the commit is aborted.

### 示例：检查 JavaScript 和 HTML / Example: Check JavaScript and HTML

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 获取暂存的 JS 文件 / Get staged JS files
JS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.js$')

if [ -n "$JS_FILES" ]; then
    echo "Checking JavaScript syntax..."
    for file in $JS_FILES; do
        node --check "$file" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "Syntax error in: $file"
            exit 1
        fi
    done
fi

# 检查是否有 console.log / Check for console.log statements
if [ -n "$JS_FILES" ]; then
    echo "Checking for console.log..."
    for file in $JS_FILES; do
        if grep -n 'console\.log' "$file" | grep -v '// eslint-disable' > /dev/null; then
            echo "Warning: console.log found in $file"
            echo "Consider removing before committing"
        fi
    done
fi

echo "Pre-commit checks passed!"
exit 0
```

> 完整的 pre-commit 钩子示例请参考本目录下的 `scripts/pre-commit.sh`。
>
> See `scripts/pre-commit.sh` in this directory for the full pre-commit hook example.

---

## 编写 commit-msg 钩子 / Writing a commit-msg Hook

commit-msg 钩子用于验证提交消息的格式。这对于强制团队使用统一的消息规范（如 Conventional Commits）非常有用。

The commit-msg hook validates commit message format. This is very useful for enforcing a consistent message convention (like Conventional Commits) across a team.

### 示例：强制 Conventional Commits 格式 / Example: Enforce Conventional Commits

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 正则匹配 Conventional Commits 格式
# Regex to match Conventional Commits format
# type(scope): description
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-zA-Z0-9_-]+\))?: .{1,100}$"

if ! echo "$COMMIT_MSG" | head -1 | grep -qE "$PATTERN"; then
    echo "Invalid commit message format!"
    echo ""
    echo "Expected: type(scope): description"
    echo "Example:  feat(navbar): add gallery link"
    exit 1
fi

echo "Commit message format OK"
exit 0
```

> 完整的 commit-msg 钩子示例请参考本目录下的 `scripts/commit-msg.sh`。
>
> See `scripts/commit-msg.sh` in this directory for the full commit-msg hook example.

---

## 编写 pre-push 钩子 / Writing a pre-push Hook

pre-push 钩子在 `git push` 执行后、实际推送数据到远程之前运行。适合用来运行测试套件。

The pre-push hook runs after `git push` is invoked but before data is actually pushed to the remote. It's ideal for running test suites.

### 示例：推送前运行测试 / Example: Run Tests Before Push

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Running tests before push..."

# 运行项目测试 / Run project tests
npm test

if [ $? -ne 0 ]; then
    echo ""
    echo "Tests failed! Push aborted."
    echo "Fix the failing tests before pushing."
    exit 1
fi

echo "All tests passed. Proceeding with push."
exit 0
```

---

## 使用 Husky 管理钩子 / Using Husky for Hook Management

手动管理 `.git/hooks/` 目录的问题在于：钩子文件不会被 Git 跟踪，无法与团队共享。Husky 是一个 Node.js 工具，可以将钩子配置纳入版本控制。

The problem with manually managing `.git/hooks/` is that hook files are not tracked by Git and can't be shared with the team. Husky is a Node.js tool that puts hook configuration under version control.

### 安装与配置 / Installation and Setup

```bash
# 1. 安装 husky / Install husky
npm install -D husky

# 2. 初始化 husky（会在项目中创建 .husky/ 目录）
# Initialize husky (creates .husky/ directory in your project)
npx husky init

# 3. 这会自动在 package.json 中添加：
# This automatically adds to package.json:
# "scripts": {
#   "prepare": "husky"
# }
# 并创建 .husky/pre-commit 文件
# and creates .husky/pre-commit file
```

### 添加钩子 / Adding Hooks

```bash
# 添加 pre-commit 钩子 / Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# 添加 commit-msg 钩子 / Add commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# 添加 pre-push 钩子 / Add pre-push hook
npx husky add .husky/pre-push "npm test"
```

### 目录结构 / Directory Structure

```
MyPortfolio/
├── .husky/
│   ├── pre-commit      ← git add 后运行 / Runs after git add
│   ├── commit-msg      ← 验证消息 / Validates message
│   └── pre-push        ← 推送前运行 / Runs before push
├── package.json
└── ...
```

> Husky 的 `.husky/` 目录会被 Git 跟踪，因此团队成员 `git clone` 后执行 `npm install` 就会自动获得相同的钩子配置。
>
> The `.husky/` directory is tracked by Git, so team members who `git clone` and run `npm install` automatically get the same hook configuration.

---

## lint-staged：只检查暂存文件 / lint-staged: Lint Staged Files Only

lint-staged 只对 Git 暂存区中的文件运行 linter，而不是检查整个项目。这让 pre-commit 钩子运行速度更快。

lint-staged runs linters only on files in the Git staging area, not the entire project. This makes pre-commit hooks run much faster.

### 安装 / Installation

```bash
npm install -D lint-staged
```

### 配置 / Configuration

在 `package.json` 中添加配置：

Add configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.css": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.html": [
      "prettier --write"
    ]
  }
}
```

### 与 Husky 配合使用 / Use with Husky

```bash
# 设置 pre-commit 钩子运行 lint-staged
# Set pre-commit hook to run lint-staged
npx husky add .husky/pre-commit "npx lint-staged"
```

### 工作流程 / Workflow

```
  git add src/app.js src/style.css
          │
          ▼
  git commit
          │
          ▼
  Husky 触发 pre-commit 钩子
  Husky triggers pre-commit hook
          │
          ▼
  lint-staged 只检查暂存的文件：
  lint-staged only checks staged files:
    - src/app.js  → eslint --fix → prettier --write
    - src/style.css → stylelint --fix → prettier --write
          │
          ▼
  所有检查通过 → 提交创建
  All checks pass → commit created
```

---

## 实战：为 MyPortfolio 配置 pre-commit 钩子 / Step-by-Step: Set Up pre-commit Hook

以下是为 MyPortfolio 项目配置完整 Git 钩子的步骤：

Here are the steps to set up complete Git hooks for the MyPortfolio project:

```bash
# 1. 初始化 npm 项目（如果还没有）
# Initialize npm project (if not already done)
npm init -y

# 2. 安装开发依赖 / Install dev dependencies
npm install -D husky lint-staged eslint prettier

# 3. 初始化 ESLint 配置 / Initialize ESLint config
npx eslint --init
# 选择：检查 JavaScript 文件 / Choose: check JavaScript files
# 选择：浏览器环境 / Choose: browser environment

# 4. 配置 Prettier / Configure Prettier
# 创建 .prettierrc / Create .prettierrc
echo '{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 4,
  "trailingComma": "none"
}' > .prettierrc

# 5. 初始化 Husky / Initialize Husky
npx husky init

# 6. 配置 lint-staged（在 package.json 中添加）
# Configure lint-staged (add to package.json)
# 添加以下内容到 package.json：
# Add the following to package.json:
#   "lint-staged": {
#     "*.js": ["eslint --fix", "prettier --write"],
#     "*.css": ["prettier --write"],
#     "*.html": ["prettier --write"]
#   }

# 7. 设置 pre-commit 钩子 / Set up pre-commit hook
echo "npx lint-staged" > .husky/pre-commit

# 8. 测试钩子是否生效 / Test if the hook works
# 故意引入语法错误 / Intentionally introduce a syntax error
echo "const x = {" >> src/app.js
git add src/app.js
git commit -m "test: verify pre-commit hook"
# 应该看到 lint 错误并阻止提交
# You should see lint errors and the commit is blocked

# 9. 恢复文件并重新提交 / Restore the file and commit again
git checkout src/app.js
git add src/app.js
git commit -m "chore: set up pre-commit hook with lint-staged"
# 这次应该通过所有检查
# This time all checks should pass
```

---

## 练习 / Exercises

### 练习 1：安装并测试 pre-commit 钩子 / Exercise 1: Install and Test pre-commit Hook

```bash
# 1. 按照上面的步骤为 MyPortfolio 配置 Husky + lint-staged
# Follow the steps above to set up Husky + lint-staged

# 2. 测试各种场景 / Test various scenarios:
#    a. 提交格式正确的 JS 文件 / Commit well-formatted JS
#    b. 提交有语法错误的 JS 文件 / Commit JS with syntax errors
#    c. 提交包含 ESLint 警告的文件 / Commit files with ESLint warnings
```

### 练习 2：创建 commit-msg 钩子 / Exercise 2: Create a commit-msg Hook

```bash
# 1. 复制 commit-msg 钩子脚本 / Copy the commit-msg hook script
cp scripts/commit-msg.sh .husky/commit-msg
chmod +x .husky/commit-msg

# 2. 测试有效消息 / Test valid messages
git add .
git commit -m "feat(navbar): add responsive menu toggle"
# 应该通过 / Should pass

# 3. 测试无效消息 / Test invalid messages
git add .
git commit -m "update stuff"
# 应该被拒绝 / Should be rejected

git commit -m "fix"
# 应该被拒绝（缺少描述）/ Should be rejected (missing description)

git commit -m "fix(css): correct hero section padding on mobile"
# 应该通过 / Should pass
```

### 练习 3：配置 pre-push 测试钩子 / Exercise 3: Configure pre-push Test Hook

```bash
# 1. 添加一个简单的测试脚本 / Add a simple test script
# 在 package.json 的 scripts 中添加：
# Add to package.json scripts:
#   "test": "echo 'Running tests...' && node --check src/app.js"

# 2. 配置 pre-push 钩子 / Configure pre-push hook
npx husky add .husky/pre-push "npm test"

# 3. 测试推送 / Test pushing
git push origin main
# 应该先看到测试输出，再执行推送
# You should see test output first, then the push
```

---

## 常用命令速查 / Command Quick Reference

| 命令 / Command | 说明 / Description |
|---|---|
| `ls .git/hooks/` | 查看可用钩子 / View available hooks |
| `chmod +x .git/hooks/pre-commit` | 激活钩子 / Activate a hook |
| `npm install -D husky` | 安装 Husky / Install Husky |
| `npx husky init` | 初始化 Husky / Initialize Husky |
| `npx husky add .husky/pre-commit "cmd"` | 添加钩子 / Add a hook |
| `npm install -D lint-staged` | 安装 lint-staged / Install lint-staged |
| `git config core.hooksPath .husky` | 设置自定义钩子目录 / Set custom hooks dir |

---

## 导航 / Navigation

- **上一章 / Previous Chapter:** [Chapter 07: 标签与版本发布 / Tags & Releases](../07-tags-and-releases/README.md)
- **下一章 / Next Chapter:** [Chapter 09: 工作流模式 / Workflow Patterns](../09-workflow-patterns/README.md)
- **返回目录 / Back to Index:** [首页 / Home](../README.md)
