# Chapter 09: 团队协作工作流 / Workflow Patterns

> **导航 / Navigation**
> [上一章 / Previous: 分支策略](../08-branching-strategy/README.md) |
> [目录 / Home](../../README.md) |
> [下一章 / Next: Git 调试利器](../10-debugging/README.md)

---

## 为什么工作流很重要 / Why Workflow Matters

在团队开发中，如果没有统一的 Git 工作流，代码很快就会变得混乱：
- 多人同时修改同一个文件
- 不清楚哪个分支是"可部署的"
- 上线时间难以预测

一个好的工作流能让团队：
- **高效协作**，减少合并冲突
- **保持代码质量**，通过审查机制
- **快速定位问题**，便于回滚和修复

In team development, without a unified Git workflow, code quickly becomes chaotic:
- Multiple people editing the same files simultaneously
- Unclear which branch is "deployable"
- Unpredictable release timelines

A good workflow enables teams to:
- **Collaborate efficiently** with fewer merge conflicts
- **Maintain code quality** through review processes
- **Locate issues quickly** for easy rollback and fixes

---

## 1. Git Flow（经典工作流 / Classic Workflow）

Git Flow 由 Vincent Driessen 于 2010 年提出，是最早也是最完整的 Git 工作流之一。

Git Flow, proposed by Vincent Driessen in 2010, is one of the earliest and most comprehensive Git workflows.

### 分支结构 / Branch Structure

```
                        hotfix/*
                           │
    ┌──────────────────────┼──────────────────────────┐
    │                      ▼                          │
    │                   ┌──────┐                      │
    │                   │ main │◄─────────────────┐   │
    │                   └──┬───┘                  │   │
    │                      │                      │   │
    │              release/*│              release/*   │
    │                      ▼                      │   │
    │               ┌──────────┐                  │   │
    │               │ release/ │──────────────────┘   │
    │               │   1.0    │                      │
    │               └──────────┘                      │
    │                                                 │
    │    ┌────────────────────────────────────────┐   │
    │    │              develop                   │   │
    │    └──┬─────┬──────────────────┬────────────┘   │
    │       │     │                  │                 │
    │  feature/  feature/       feature/               │
    │   login    calculator     contact                │
    │     │         │              │                   │
    │     ▼         ▼              ▼                   │
    └─────────────────────────────────────────────────┘
```

### 五种分支类型 / Five Branch Types

| 分支类型 / Branch Type | 来源 / Source | 合并到 / Merges Into | 用途 / Purpose |
|---|---|---|---|
| `main` | — | — | 生产环境代码 / Production code |
| `develop` | `main` | `main` | 开发集成分支 / Development integration |
| `feature/*` | `develop` | `develop` | 新功能开发 / New features |
| `release/*` | `develop` | `main` + `develop` | 发布准备 / Release preparation |
| `hotfix/*` | `main` | `main` + `develop` | 紧急修复 / Emergency fixes |

### 典型操作流程 / Typical Workflow

```bash
# 1. 从 develop 创建功能分支 / Create feature branch from develop
git checkout develop
git checkout -b feature/calculator

# 2. 开发并提交 / Develop and commit
git add src/calculator.js
git commit -m "feat: add basic calculator"

# 3. 推送并创建 Pull Request / Push and create PR
git push origin feature/calculator
# 创建 PR 到 develop / Create PR to develop

# 4. 准备发布 / Prepare release
git checkout develop
git checkout -b release/1.0
# 修复发布前的 bug / Fix pre-release bugs
git checkout main
git merge release/1.0
git tag v1.0

# 5. 紧急修复 / Hotfix
git checkout main
git checkout -b hotfix/fix-login
# 修复后合并到 main 和 develop / Merge to main AND develop
```

### 优点 / Pros

- 结构清晰，角色分明 / Clear structure with well-defined roles
- 适合有版本发布周期的项目 / Ideal for projects with scheduled releases
- 支持并行开发和发布准备 / Supports parallel development and release prep

### 缺点 / Cons

- 分支多，复杂度高 / Many branches, high complexity
- 不适合持续部署 / Not ideal for continuous deployment
- `develop` 和 `main` 长期分叉，合并时冲突多 / Long divergence between develop and main causes conflicts

### 适用场景 / When to Use

- 有明确版本号发布节奏的软件（如 App、SDK）
- Software with clear version release cadence (e.g., mobile apps, SDKs)

---

## 2. GitHub Flow（简化工作流 / Simplified Workflow）

GitHub Flow 是 GitHub 推荐的轻量级工作流，核心只有一个 `main` 分支加功能分支。

GitHub Flow is GitHub's recommended lightweight workflow, centered on a single `main` branch plus feature branches.

### 分支结构 / Branch Structure

```
    main ────●────●────────●────●────●────►
              │    │        │    │
              │    │        │    └── PR merged
              │    │        │
              │    │        └── feature/contact ──► PR ──► merge
              │    │
              │    └── feature/calculator ──► PR ──► merge
              │
              └── feature/login ──► PR ──► merge
```

### 核心原则 / Core Principles

1. `main` 始终可部署 / `main` is always deployable
2. 所有改动通过功能分支 + PR 进入 `main` / All changes enter `main` via feature branches + PRs
3. 合并前必须通过代码审查和 CI / Code review and CI must pass before merging

### 典型操作流程 / Typical Workflow

```bash
# 1. 从 main 创建功能分支 / Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/navbar

# 2. 频繁提交 / Commit frequently
git add src/navbar.html
git commit -m "feat: add responsive navbar"

# 3. 推送到远程 / Push to remote
git push -u origin feature/navbar

# 4. 在 GitHub 创建 Pull Request / Create PR on GitHub
# - 描述改动内容 / Describe changes
# - 请求代码审查 / Request review
# - CI 自动运行测试 / CI runs tests automatically

# 5. 审查通过后合并 / Merge after approval
# 使用 "Squash and merge" 保持历史整洁
# Use "Squash and merge" to keep history clean

# 6. 删除功能分支 / Delete feature branch
git branch -d feature/navbar
git push origin --delete feature/navbar

# 7. 部署 / Deploy
# main 自动部署到生产环境
# main auto-deploys to production
```

### 优点 / Pros

- 简单易懂，学习成本低 / Simple and easy to learn
- 天然支持持续部署 / Naturally supports continuous deployment
- PR 机制促进代码审查 / PR mechanism promotes code review
- 适合小团队和开源项目 / Great for small teams and open source

### 缺点 / Cons

- 没有正式的发布分支 / No formal release branch
- 对于大型项目可能过于简单 / May be too simple for large projects
- 依赖 CI/CD 自动化 / Relies on CI/CD automation

---

## 3. Trunk-Based Development（主干开发）

Trunk-Based Development 是一种更激进的方式：几乎所有工作都直接在 `main` 上完成。

Trunk-Based Development is a more aggressive approach: nearly all work happens directly on `main`.

### 分支结构 / Branch Structure

```
    main ──●──●──●──●──●──●──●──●──●──●──►
            │     │        │       │
            │     │        │       └── 极短的功能分支（几小时）
            │     │        │           Very short-lived branch (hours)
            │     │        │
            │     │        └── Feature Flag: 新功能用开关控制
            │     │            Feature flag: new features behind toggles
            │     │
            │     └── 直接提交到 main（小改动）
            │         Direct commit to main (small changes)
            │
            └── 极短的功能分支（几小时）
                Very short-lived branch (hours)
```

### 核心原则 / Core Principles

- **短生命周期的分支** / **Short-lived branches**（通常不超过 1-2 天 / usually no more than 1-2 days）
- **Feature Flags** / **功能开关**：未完成的功能用开关隐藏 / Incomplete features hidden behind toggles
- **频繁集成** / **Frequent integration**：每天至少合并一次 / Merge at least once daily
- **完善的 CI/CD** / **Robust CI/CD**：自动化测试覆盖率必须高 / High automated test coverage required

### 典型操作流程 / Typical Workflow

```bash
# 小改动直接提交到 main / Small changes committed directly to main
git checkout main
# 修改文件 / Edit files
git add src/footer.html
git commit -m "fix: update footer copyright year"
git push origin main

# 较大改动使用极短的功能分支 / Larger changes use very short-lived branches
git checkout -b feature/search
# 开发（几小时内完成）/ Develop (complete within hours)
git add src/search.js
git commit -m "feat: add search with feature flag"
git push origin feature/search
# 创建 PR，快速审查合并 / Create PR, quick review and merge

# Feature Flag 示例 / Feature Flag example
# 在代码中 / In code:
# if (featureFlags.searchEnabled) {
#     showSearchBar();
# }
```

### 优点 / Pros

- 最少的分支管理开销 / Minimal branch management overhead
- 持续集成最彻底 / Most thorough continuous integration
- 消除长期分支分叉的合并痛苦 / Eliminates merge pain from long-lived branch divergence

### 缺点 / Cons

- 对团队纪律要求极高 / Requires extremely high team discipline
- 需要完善的 Feature Flag 系统 / Needs a robust feature flag system
- 需要高覆盖率的自动化测试 / Requires high automated test coverage
- 新手不友好 / Not beginner-friendly

### 适用场景 / When to Use

- 成熟的 DevOps 团队 / Mature DevOps teams
- 持续部署的 SaaS 产品 / Continuously deployed SaaS products
- Google、Facebook 等大型科技公司 / Large tech companies like Google, Facebook

---

## 4. 工作流对比 / Workflow Comparison

| 特性 / Feature | Git Flow | GitHub Flow | Trunk-Based |
|---|---|---|---|
| **复杂度 / Complexity** | 高 / High | 低 / Low | 中 / Medium |
| **分支数量 / Branch Count** | 5 种 / 5 types | 2 种 / 2 types | 1-2 种 / 1-2 types |
| **发布方式 / Release** | 版本发布 / Versioned | 持续部署 / Continuous | 持续部署 / Continuous |
| **适合团队 / Team Size** | 大团队 / Large | 小-中团队 / Small-Medium | 成熟团队 / Mature |
| **学习曲线 / Learning Curve** | 陡峭 / Steep | 平缓 / Gentle | 中等 / Moderate |
| **CI/CD 要求 / CI/CD Need** | 中 / Medium | 高 / High | 极高 / Very High |
| **Feature Flag** | 不需要 / Not needed | 可选 / Optional | 必须 / Required |
| **代码审查 / Code Review** | 可选 / Optional | PR 必须 / PR required | PR 推荐 / PR recommended |
| **代表用户 / Used By** | 传统软件公司 / Traditional SW | 开源/初创 / Open source/Startup | Google/Meta |

---

## 5. 如何选择合适的工作流 / How to Choose the Right Workflow

选择工作流需要考虑以下因素：

Choosing a workflow depends on the following factors:

### 决策树 / Decision Tree

```
你的团队有多大？/ How big is your team?
│
├── 1-5 人 / 1-5 people
│   ├── 持续部署？/ Continuous deploy?
│   │   ├── 是 / Yes → GitHub Flow ✅
│   │   └── 否 / No → GitHub Flow ✅ (仍然推荐 / Still recommended)
│   │
├── 5-20 人 / 5-20 people
│   ├── 有版本发布周期？/ Scheduled releases?
│   │   ├── 是 / Yes → Git Flow ✅
│   │   └── 否 / No → GitHub Flow ✅
│   │
└── 20+ 人 / 20+ people
    ├── 成熟的 CI/CD？/ Mature CI/CD?
    │   ├── 是 / Yes → Trunk-Based ✅
    │   └── 否 / No → Git Flow ✅
```

### 关键考量因素 / Key Considerations

| 因素 / Factor | 推荐 / Recommend |
|---|---|
| 团队新手多 / Many beginners | GitHub Flow |
| 移动端 App 发布 / Mobile app releases | Git Flow |
| Web SaaS 持续迭代 / Web SaaS continuous iteration | GitHub Flow |
| 每天多次部署 / Multiple deploys per day | Trunk-Based |
| 需要严格版本管理 / Strict versioning needed | Git Flow |

---

## 6. MyPortfolio 推荐方案 / Recommendation for MyPortfolio

对于 MyPortfolio 这个小型前端项目，我们推荐使用 **GitHub Flow**：

For MyPortfolio, a small frontend project, we recommend **GitHub Flow**:

### 理由 / Reasons

1. **团队规模小** / **Small team**：1-3 人开发，不需要复杂分支策略 / 1-3 developers, no need for complex branching
2. **持续部署** / **Continuous deployment**：每次合并都可以部署到 GitHub Pages / Every merge can deploy to GitHub Pages
3. **简单高效** / **Simple and efficient**：只需 `main` + 功能分支 / Only need `main` + feature branches
4. **PR 审查** / **PR review**：即使是个人项目，PR 也是好的自我审查习惯 / Even for personal projects, PRs are good self-review practice

### 推荐的分支命名 / Recommended Branch Naming

```
main                          # 生产分支 / Production branch
feature/calculator            # 计算器功能 / Calculator feature
feature/contact-form          # 联系表单 / Contact form
feature/responsive-nav        # 响应式导航 / Responsive navigation
fix/calculator-divide-zero    # 修复除零错误 / Fix divide-by-zero
update/readme                 # 更新文档 / Update docs
```

---

## 7. 实战练习 / Practical Exercise

### 模拟 GitHub Flow 为 MyPortfolio 添加功能 / Simulate GitHub Flow for a MyPortfolio Feature

让我们模拟完整的 GitHub Flow 来为 MyPortfolio 添加一个"暗色模式"功能：

Let's simulate the complete GitHub Flow to add a "dark mode" feature to MyPortfolio:

```bash
# ============================================
# 步骤 1: 确保 main 是最新的 / Step 1: Ensure main is up to date
# ============================================
git checkout main
git pull origin main

# ============================================
# 步骤 2: 创建功能分支 / Step 2: Create feature branch
# ============================================
git checkout -b feature/dark-mode

# ============================================
# 步骤 3: 开发功能 / Step 3: Develop the feature
# ============================================
# 创建暗色模式的 CSS / Create dark mode CSS
# （这里只是模拟 / This is just a simulation）
echo '/* dark mode styles */' > src/dark-mode.css

# 第一次提交 / First commit
git add src/dark-mode.css
git commit -m "feat: add dark mode CSS styles"

# 添加切换按钮的 JS / Add toggle button JS
echo '// dark mode toggle' > src/dark-mode.js
git add src/dark-mode.js
git commit -m "feat: add dark mode toggle button"

# ============================================
# 步骤 4: 推送并创建 PR / Step 4: Push and create PR
# ============================================
git push -u origin feature/dark-mode

# 在 GitHub 上：/ On GitHub:
# gh pr create --title "feat: Add dark mode support" \
#   --body "## Changes
#   - Added dark mode CSS styles
#   - Added toggle button for switching themes
#   - Persists user preference in localStorage"

# ============================================
# 步骤 5: 处理审查反馈 / Step 5: Address review feedback
# ============================================
# 假设审查者要求添加过渡动画 / Suppose reviewer asks for transition animation
echo '/* transition for smooth switching */' >> src/dark-mode.css
git add src/dark-mode.css
git commit -m "feat: add smooth transition for dark mode switch"
git push

# ============================================
# 步骤 6: 合并后清理 / Step 6: Clean up after merge
# ============================================
# PR 被合并后 / After PR is merged:
git checkout main
git pull origin main
git branch -d feature/dark-mode
git push origin --delete feature/dark-mode
```

### 练习检查清单 / Exercise Checklist

- [ ] 从 `main` 创建了功能分支 / Created feature branch from `main`
- [ ] 提交了至少 2 个有意义的 commit / Made at least 2 meaningful commits
- [ ] 推送到了远程仓库 / Pushed to remote
- [ ] 模拟了 PR 审查过程 / Simulated PR review process
- [ ] 合并后删除了功能分支 / Deleted feature branch after merge

---

## 本章小结 / Chapter Summary

| 工作流 / Workflow | 一句话总结 / One-line Summary |
|---|---|
| Git Flow | 最完整但最复杂，适合版本发布 / Most complete but complex, for versioned releases |
| GitHub Flow | 简洁高效，大多数团队的最佳选择 / Simple and efficient, best choice for most teams |
| Trunk-Based | 最激进，需要成熟团队 / Most aggressive, requires mature teams |

**记住 / Remember**：没有"最好"的工作流，只有最适合你团队的工作流。
There is no "best" workflow — only the one that best fits your team.

---

> **导航 / Navigation**
> [上一章 / Previous: 分支策略](../08-branching-strategy/README.md) |
> [目录 / Home](../../README.md) |
> [下一章 / Next: Git 调试利器](../10-debugging/README.md)
