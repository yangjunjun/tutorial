# 第二章：MDX 内容层

> 上一章我们搭建了 Astro 项目骨架，本章将引入 **MDX** 与 **Content Collections**，为博客 / 文档站点提供结构化、类型安全的内容管理能力。

## 本章目标

| 能力 | 说明 |
|------|------|
| MDX 集成 | 在 Markdown 中嵌入组件与 JSX 表达式 |
| Content Collections | 用 Zod 定义 schema，获得类型安全的 frontmatter |
| 自定义 MDX 组件 | 覆盖默认 HTML 元素（h1、a、code、blockquote 等） |

---

## 1. 为什么选 MDX 而不是纯 Markdown？

### Markdown 的局限

- 只能输出静态 HTML
- 无法嵌入交互式组件
- 无法使用 JavaScript 表达式

### MDX = Markdown + JSX

```mdx
普通 Markdown 段落。

{/* 嵌入 JSX 表达式 */}
今天的日期是 {new Date().toLocaleDateString('zh-CN')}。

{/* 嵌入 Astro 组件 */}
<Callout type="tip">
  这是一条提示，纯 Markdown 做不到！
</Callout>
```

MDX 让你像写 HTML 一样使用组件，同时保留 Markdown 的简洁语法。

---

## 2. Content Collections —— 结构化内容管理

Astro 的 Content Collections 提供：

- **Schema 验证**：用 Zod 定义 frontmatter 结构，构建时自动校验
- **类型安全**：getCollection() 返回带类型推断的数据
- **统一 API**：不管 Markdown 还是 MDX，读取方式一致

### 定义 Schema

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { articles };
```

### 在页面中使用

```astro
---
import { getCollection } from 'astro:content';

// 自动获得类型推断！
const posts = await getCollection('articles', ({ data }) => {
  return data.draft !== true; // 过滤草稿
});
---

<ul>
  {posts.map(post => (
    <li>{post.data.title} — {post.data.date.toLocaleDateString('zh-CN')}</li>
  ))}
</ul>
```

如果 frontmatter 缺少必填字段或类型不匹配，**构建时会直接报错**，而不是上线后才发现问题。

---

## 3. 自定义 MDX 组件

MDX 渲染时，每个 HTML 元素都可以被替换为自定义组件：

| Markdown 元素 | 可覆盖为 | 用途 |
|---------------|----------|------|
| `h1` | 自定义标题组件 | 加锚点、图标 |
| `a` | 链接组件 | 外链自动新窗口 |
| `code` | 代码块组件 | 语法高亮、文件名标签 |
| `blockquote` | 引用组件 | 带样式的引用框 |

```astro
<!-- src/components/MdxComponents.astro -->
---
// 导出一个对象，key 是 HTML 标签名
---
```

然后在页面中传入 `components` prop：

```astro
<Content components={mdxComponents} />
```

---

## 4. 操作步骤

### 4.1 安装依赖

```bash
npm install @astrojs/mdx
```

### 4.2 配置集成

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
});
```

### 4.3 创建 Content Collections

```
src/content/
├── config.ts            # Schema 定义
├── articles/            # 文章集合
│   ├── hello-mdx.mdx
│   └── astro-islands.mdx
└── docs/                # 文档集合
    ├── getting-started.mdx
    └── content-collections.mdx
```

### 4.4 在页面中读取

```ts
const articles = await getCollection('articles');
const docs = await getCollection('docs');
```

### 4.5 渲染 MDX 内容

```astro
---
import { getEntry, Content } from 'astro:content';

const entry = await getEntry('articles', 'hello-mdx');
const { Content } = await entry.render();
---

<Content />
```

---

## 5. 项目结构一览

```
02-mdx-content/demo/
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── src/
    ├── content/
    │   ├── config.ts
    │   ├── articles/
    │   │   ├── hello-mdx.mdx
    │   │   └── astro-islands.mdx
    │   └── docs/
    │       ├── getting-started.mdx
    │       └── content-collections.mdx
    ├── components/
    │   ├── Callout.astro
    │   ├── CodeBlock.astro
    │   └── MdxComponents.astro
    └── pages/
        ├── index.astro
        ├── articles/
        │   └── [...slug].astro
        └── docs/
            └── [...slug].astro
```

---

## 练习

1. 新增一个 `tutorials` Content Collection，schema 包含：title、difficulty（"beginner" | "intermediate" | "advanced"）、duration（number，分钟）
2. 创建 2 篇 MDX 教程文章，每篇至少使用一次 `<Callout>` 组件
3. 在首页增加一个"Tutorials"板块，按 difficulty 分组展示
4. 尝试覆盖 `<a>` 标签：外链自动加 `target="_blank" rel="noopener"`

> 提示：在 `src/content/config.ts` 中添加新集合，在 `src/pages/index.astro` 中增加展示逻辑。
