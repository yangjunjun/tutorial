# 第一章：Astro 基础入门

> 搭建你的第一个 Astro 项目，理解项目结构、文件路由、组件与布局

## 本章目标

学完本章后，你将掌握：

- Astro 项目的目录结构
- `.astro` 文件的语法（frontmatter + HTML 模板）
- 基于文件系统的路由机制
- 组件的创建与复用
- 布局（Layout）的使用与嵌套
- CSS 作用域（scoped styles）

## 快速开始

### 1. 创建项目

```bash
npm create astro@latest
# 选择 "Empty project" 模板
# 安装依赖：Yes
# TypeScript：Yes (strict)
```

或直接使用本章的 demo：

```bash
cd 01-astro-starter/demo
npm install
npm run dev
```

### 2. 项目结构

```
demo/
├── astro.config.mjs        ← Astro 配置文件
├── tsconfig.json            ← TypeScript 配置
├── package.json
└── src/
    ├── pages/               ← 页面路由（文件即路由）
    │   ├── index.astro      ← 首页 → /
    │   ├── about.astro      ← 关于页 → /about
    │   └── blog/
    │       ├── index.astro  ← 博客列表 → /blog
    │       └── first-post.astro ← 文章页 → /blog/first-post
    └── components/          ← 可复用组件
        ├── BaseLayout.astro ← 全局布局
        ├── Card.astro       ← 卡片组件
        └── Counter.astro    ← 计数器（演示 Astro 的局限）
```

## 核心概念

### .astro 文件语法

每个 `.astro` 文件由两部分组成：

```astro
---
// ① Frontmatter（YAML/JS/TS）— 服务端执行
const title = "我的页面";
const items = ["A", "B", "C"];
---

<!-- ② HTML 模板 — 渲染输出 -->
<h1>{title}</h1>
<ul>
  {items.map(item => <li>{item}</li>)}
</ul>
```

**关键规则：**

- Frontmatter 用 `---` 包裹，里面的代码只在**构建时/服务端**执行
- 模板部分支持 JSX 风格的表达式 `{}`
- 可以 `import` 其他组件、工具函数等
- **不支持**在模板中写 JS 逻辑语句（如 `if`/`for`），请用表达式或三元运算符

### CSS 作用域

Astro 的 `<style>` 标签**默认作用域隔离**——样式只作用于当前组件：

```astro
<style>
  /* 这些样式只会应用到当前组件内的元素 */
  h1 {
    color: coral;
  }
</style>
```

如果需要全局样式，使用 `<style is:global>`：

```astro
<style is:global>
  body {
    font-family: system-ui, sans-serif;
  }
</style>
```

### 组件 Props

组件通过 `Astro.props` 接收外部传入的数据：

```astro
---
// components/Greeting.astro
const { name, age = 18 } = Astro.props;
---

<p>你好，{name}！你今年 {age} 岁。</p>
```

使用组件时传 props：

```astro
---
import Greeting from '../components/Greeting.astro';
---

<Greeting name="小明" age={25} />
```

### Slot 插槽

使用 `<slot />` 让组件可以接收子内容：

```astro
---
// components/Box.astro
---
<div class="box">
  <slot />  <!-- 子内容会被渲染在这里 -->
</div>
```

```astro
<Box>
  <p>这段内容会出现在 Box 的 slot 位置</p>
</Box>
```

还支持**具名插槽**：

```astro
<div class="card">
  <slot name="header" />   <!-- <Fragment slot="header"> -->
  <slot />                 <!-- 默认插槽 -->
  <slot name="footer" />   <!-- <Fragment slot="footer"> -->
</div>
```

## 文件路由

Astro 使用**基于文件系统的路由**——`src/pages/` 下的每个 `.astro` 文件自动成为一个页面路由：

| 文件路径 | 对应 URL |
|---------|----------|
| `src/pages/index.astro` | `/` |
| `src/pages/about.astro` | `/about` |
| `src/pages/blog/index.astro` | `/blog` |
| `src/pages/blog/first-post.astro` | `/blog/first-post` |

**注意：**

- 文件名即路由路径，无需手动配置路由表
- `index.astro` 代表该目录的默认页面
- 嵌套文件夹自动生成嵌套路由

### 动态路由（预告，详见第 05 章）

用方括号命名可以创建动态路由：

```
src/pages/blog/[slug].astro  →  /blog/任意值
```

## 布局（Layout）

布局是一种特殊的组件，用于包裹页面的公共结构（如 `<html>`、`<head>`、导航栏、页脚）：

```astro
---
// components/BaseLayout.astro
const { title = "默认标题" } = Astro.props;
---
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <nav><!-- 导航 --></nav>
    <main>
      <slot />  <!-- 页面内容插入这里 -->
    </main>
    <footer><!-- 页脚 --></footer>
  </body>
</html>
```

在页面中使用布局：

```astro
---
import BaseLayout from '../components/BaseLayout.astro';
---

<BaseLayout title="关于我">
  <h1>关于页面</h1>
  <p>这是关于页面的内容。</p>
</BaseLayout>
```

布局也可以嵌套——比如先有一个 `BaseLayout`，再有一个 `BlogLayout` 继承它。

## 项目 Demo 详解

本章的 demo 项目包含以下内容：

### 首页（index.astro）
一个带有 hero 区域和功能展示卡片的着陆页，展示了 Astro 的核心特性。

### 关于页（about.astro）
演示了组件 Props 的使用——通过 BaseLayout 传入自定义标题。

### 博客列表（blog/index.astro）
在 frontmatter 中定义文章数组，用 `.map()` 渲染列表，展示了 Astro 模板中处理数据的方式。

### 文章页（blog/first-post.astro）
一篇示例文章，包含日期格式化、代码块、列表等常见博客元素。

### Counter 组件
一个"不能交互"的计数器——按钮点击不会有任何反应。这是为了演示 **Astro 的局限性**：组件默认是静态的，不支持客户端交互。要实现交互功能，我们需要引入 **Islands**（第 03 章的内容）。

## 练习

完成以下练习来巩固本章知识：

1. **新增页面**：创建 `src/pages/contact.astro`，使用 BaseLayout，包含一个联系表单的静态 HTML
2. **自定义组件**：创建一个 `Badge.astro` 组件，接收 `text` 和 `color` props，渲染一个带颜色的小标签
3. **嵌套布局**：创建 `BlogLayout.astro`，继承 BaseLayout，额外包含一个侧边栏区域
4. **样式挑战**：给首页的功能卡片添加 hover 动画效果

## 下一章

→ [02 - MDX 内容集成](../02-mdx-content/readme.md)：学习如何用 MDX 编写内容，配置内容集合，定义 Schema 验证。
