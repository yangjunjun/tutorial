# Astro + MDX + Vue 3 Islands 渐进式教程

> 从零开始，用 Astro 构建高性能现代 Web 应用

## 简介

**Astro** 是一个面向内容的现代 Web 框架，其核心理念是 **Islands Architecture（岛屿架构）**：

- **默认零 JavaScript** — 页面在服务端渲染为纯 HTML，不向浏览器发送任何 JS
- **按需水合（Partial Hydration）** — 只有真正需要交互的组件（"岛屿"）才会在客户端加载 JS
- **框架无关** — 可以在同一项目中混用 React、Vue、Svelte 等组件

这意味着你的网站默认就是快的：用户下载的内容更少，页面加载更快，SEO 更友好。

### 为什么选择这个技术栈？

| 技术 | 角色 | 选择理由 |
|------|------|----------|
| **Astro** | 站点骨架 & 路由 | 零 JS 默认输出、Islands 架构、文件路由、SSG/SSR 灵活切换 |
| **MDX** | 内容层 | Markdown + JSX 组件，让文档/博客内容既有写作体验又有交互能力 |
| **Vue 3** | 交互岛屿 | Composition API、响应式系统、生态成熟，作为 Island 组件嵌入 Astro |

## 前置要求

- Node.js **18+**（推荐 20 LTS）
- 基本的 HTML / CSS / JavaScript 知识
- 了解 Vue 3 基础语法更佳（非必须，教程会逐步讲解）
- 一个你喜欢的代码编辑器（推荐 VS Code + Astro 扩展）

## 学习路线图

| # | 项目 | 核心知识点 | 难度 |
|---|------|-----------|------|
| 01 | astro-starter | Astro 基础、路由、组件 | ⭐ |
| 02 | mdx-content | MDX 集成、内容集合、Schema | ⭐⭐ |
| 03 | vue-islands | Vue 3 Islands、客户端指令 | ⭐⭐ |
| 04 | vue-state | Vue 状态管理、Nano Stores | ⭐⭐⭐ |
| 05 | api-routes | API 路由、动态路由、SSG/SSR | ⭐⭐⭐ |
| 06 | blog-project | 完整博客实战 | ⭐⭐⭐⭐ |
| 07 | deploy | 多平台部署 | ⭐⭐ |

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  用户浏览器                       │
│                                                   │
│   ┌─────────────────────────────────────────┐    │
│   │         静态 HTML（零 JS 默认输出）        │    │
│   │                                           │    │
│   │   ┌───────────┐  ┌───────────┐           │    │
│   │   │ Vue Island │  │ Vue Island │  ← 按需   │    │
│   │   │ (水合后交互)│  │ (水合后交互)│    水合    │    │
│   │   └───────────┘  └───────────┘           │    │
│   └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                        ▲
                        │ 构建 / SSR
┌─────────────────────────────────────────────────┐
│                   Astro（骨架层）                  │
│                                                   │
│   路由（src/pages/）                               │
│   布局（src/layouts/）                              │
│   组件（src/components/）                           │
│                                                   │
│   ┌─────────────┐    ┌─────────────────┐         │
│   │ MDX（内容层）  │    │ Vue 3（交互层）   │         │
│   │              │    │                   │         │
│   │ .mdx 文件     │    │ .vue 组件          │         │
│   │ 内容集合      │    │ client:load        │         │
│   │ Schema 验证   │    │ client:visible     │         │
│   │ 自定义组件    │    │ client:only        │         │
│   └─────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────┘
```

## 如何使用本教程

每个章节都是一个**独立的子项目**，可以单独运行：

```bash
# 1. 进入某个章节的 demo 目录
cd 01-astro-starter/demo

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:4321
```

> **建议**：按顺序学习前 3 章打好基础，之后可以根据兴趣跳选。

## 目录结构

```
astro-vue-islands-tutorial/
├── README.md                    ← 你正在看的文件
├── 01-astro-starter/
│   ├── readme.md                ← 教程文档
│   └── demo/                    ← 可运行的示例项目
├── 02-mdx-content/
│   ├── readme.md
│   └── demo/
├── 03-vue-islands/
│   ├── readme.md
│   └── demo/
├── 04-vue-state/
│   ├── readme.md
│   └── demo/
├── 05-api-routes/
│   ├── readme.md
│   └── demo/
├── 06-blog-project/
│   ├── readme.md
│   └── demo/
└── 07-deploy/
    ├── readme.md
    └── demo/
```

## License

MIT
