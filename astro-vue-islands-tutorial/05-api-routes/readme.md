# 第五章：API 路由、动态页面与数据获取

## 本章目标

- 掌握 Astro 的 **API 路由**（`src/pages/api/*.ts`）创建 REST 接口
- 理解**动态路由**（`[slug]`、`[...path]`）和 `getStaticPaths` 的用法
- 区分 **SSG（静态生成）** 和 **SSR（服务端渲染）** 的适用场景
- 学会 **Hybrid 混合渲染**模式：默认静态，按需服务端渲染
- 掌握多种**数据获取**方式：`Astro.glob()`、`fetch()`、Content Collections

---

## 一、API 路由

Astro 可以在 `src/pages/api/` 目录下创建 API 端点，返回 JSON 或其他格式的数据。

### 基本结构

```
src/pages/
  api/
    hello.ts        → GET /api/hello
    users.ts        → GET/POST /api/users
    users/
      [id].ts       → GET/DELETE /api/users/:id
```

### 示例：简单的 GET 接口

```ts
// src/pages/api/hello.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ message: 'Hello from Astro API!' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
```

### 支持的方法

导出与 HTTP 方法同名的函数即可：

```ts
export const GET: APIRoute = () => { /* ... */ };
export const POST: APIRoute = () => { /* ... */ };
export const PUT: APIRoute = () => { /* ... */ };
export const DELETE: APIRoute = () => { /* ... */ };
export const PATCH: APIRoute = () => { /* ... */ };
```

### 请求上下文（Context）

API 路由函数接收一个 `context` 参数，包含：

```ts
export const GET: APIRoute = async (context) => {
  context.params      // 路由参数（动态路由时使用）
  context.request      // 原始 Request 对象
  context.url          // 当前 URL
  context.redirect()   // 重定向
};
```

### 读取请求体

```ts
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json(); // 解析 JSON body
  // 处理数据...
};
```

---

## 二、动态路由

动态路由让你用 URL 参数生成页面。

### `[param]` 单参数

```
src/pages/blog/[slug].astro
→ /blog/hello-world
→ /blog/my-first-post
```

```astro
---
// 必须导出 getStaticPaths（SSG 模式）
export async function getStaticPaths() {
  return [
    { params: { slug: 'hello-world' }, props: { title: 'Hello World' } },
    { params: { slug: 'my-first-post' }, props: { title: 'My First Post' } },
  ];
}

const { title } = Astro.props;
---
<h1>{title}</h1>
```

### `[...slug]` 多段通配（Rest 参数）

```
src/pages/docs/[...slug].astro
→ /docs/getting-started
→ /docs/api/routes
→ /docs/guides/deploy/vercel
```

```astro
---
export async function getStaticPaths() {
  return [
    { params: { slug: 'getting-started' } },
    { params: { slug: 'api/routes' } },
    { params: { slug: 'guides/deploy/vercel' } },
  ];
}

const slug = Astro.params.slug; // 'api/routes' 等
---
```

### `getStaticPaths` 详解

这是 SSG 模式下动态页面的**必需函数**，告诉 Astro 在构建时要生成哪些页面：

```ts
export async function getStaticPaths() {
  // 返回一个数组，每项包含 params 和可选的 props
  return [
    {
      params: { slug: 'hello' },  // 对应 [slug] 参数
      props: { post: { title: 'Hello', content: '...' } }, // 传给页面模板
    },
    // ...更多页面
  ];
}
```

---

## 三、数据获取

### 1. Astro.glob()（仅 SSG）

在 frontmatter 中使用 `Astro.glob()` 获取项目中的文件：

```astro
---
// 获取所有 Markdown 文件
const posts = await Astro.glob('../content/**/*.md');
---

{posts.map(post => (
  <article>
    <h2>{post.frontmatter.title}</h2>
  </article>
))}
```

### 2. fetch() 请求

在任何页面或 API 路由中使用 `fetch()`：

```astro
---
// 构建时从 API 获取数据
const response = await fetch('https://api.example.com/posts');
const posts = await response.json();

// 或者请求自己项目的 API（SSR 模式下）
const localRes = await fetch(new URL('/api/users', Astro.url));
const users = await localRes.json();
---
```

### 3. Content Collections（推荐）

Astro 的内容集合是类型安全的内容管理方式：

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };
```

```astro
---
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
---
```

---

## 四、SSG vs SSR vs Hybrid

### SSG（静态站点生成）

- 构建时生成 HTML 文件
- 适合博客、文档、营销页面
- 速度最快，可部署到 CDN

### SSR（服务端渲染）

- 每次请求时在服务器生成 HTML
- 适合需要实时数据的页面（搜索、用户仪表盘）
- 需要适配器（`@astrojs/node`、`@astrojs/vercel` 等）

### Hybrid 混合渲染（推荐）

默认 SSG，按需切换为 SSR：

```ts
// astro.config.mjs
export default defineConfig({
  output: 'hybrid',  // 混合模式
  adapter: node({ mode: 'standalone' }),
});
```

```astro
---
// 某个页面使用 SSR（其余默认 SSG）
export const prerender = false;

// 读取请求参数
const url = new URL(Astro.request.url);
const query = url.searchParams.get('q');
---
```

```astro
---
// 某个页面强制 SSG（在 SSR 项目中）
export const prerender = true;
---
```

### 何时使用哪种模式？

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| 博客文章 | SSG | 内容固定，构建时生成 |
| API 接口 | SSR | 需要处理实时请求 |
| 搜索页面 | SSR | 依赖查询参数 |
| 用户个人页面 | SSG (getStaticPaths) | 用户数据已知 |
| 实时数据仪表盘 | SSR | 数据频繁变化 |

---

## 五、实战：本 Demo 结构

```
src/
  data/users.ts          # 共享模拟数据
  pages/
    index.astro          # 首页（SSG）
    api/hello.ts         # GET /api/hello
    api/users.ts         # GET/POST /api/users
    api/users/[id].ts    # GET/DELETE /api/users/:id
    blog/[slug].astro    # 动态博客页面（SSG）
    search.astro         # 搜索页面（SSR）
    users/[id].astro     # 用户详情页（SSG）
  components/vue/
    ApiDemo.vue          # 客户端 API 调用 Demo
    SearchBox.vue        # 搜索输入框组件
```

---

## 练习

1. **基础**：新增一个 `/api/posts` 接口，支持 GET（返回列表）和 POST（新增文章）
2. **进阶**：创建一个 `/blog/[slug].astro` 页面，从 Content Collections 读取 Markdown 文件并渲染
3. **挑战**：实现一个分页功能 —— `/api/users?page=1&limit=10`，配合一个 Vue 组件展示分页用户列表

---

## 小结

| 概念 | 用途 | 关键点 |
|------|------|--------|
| API 路由 | 创建 REST 接口 | 导出 GET/POST 等函数 |
| 动态路由 | URL 参数生成页面 | `[param]` 和 `[...slug]` |
| getStaticPaths | SSG 动态页面 | 必须告知所有路径 |
| Hybrid 模式 | 按需选择 SSG/SSR | `prerender` 导出控制 |
| fetch() | 数据获取 | 构建时或客户端请求 |
