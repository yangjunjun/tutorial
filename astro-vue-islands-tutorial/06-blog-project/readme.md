# 第六章：完整博客项目实战

## 本章目标

使用 Astro + MDX + Vue 3 Islands 构建一个功能完整的个人博客。通过这个项目，你将把前面章节学到的所有知识整合起来，打造一个可以真正部署上线的博客站点。

## 功能特性

本章博客包含以下完整功能：

| 功能 | 实现方式 | 说明 |
|------|---------|------|
| MDX 内容撰写 | `@astrojs/mdx` + Content Collections | 类型安全的博客文章管理 |
| 标签与分类 | `getStaticPaths` + 动态路由 | 按标签/分类筛选文章 |
| 分页 | `Astro.paginate` | 文章列表分页导航 |
| RSS 订阅 | `@astrojs/rss` | 自动生成 RSS Feed |
| 暗黑模式 | Vue Island + Nano Store | 主题切换与持久化 |
| 站内搜索 | Vue Island (client:load) | 客户端即时搜索 |
| 阅读时间 | 自定义工具函数 | 根据字数估算阅读时间 |
| 文章目录 | Vue Island (client:idle) | 滚动追踪高亮当前章节 |
| SEO 优化 | Open Graph + Sitemap | 搜索引擎友好 |

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    Content Layer                     │
│         MDX 文章 (Content Collections)               │
│    schema 校验 → frontmatter 类型安全                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    Pages Layer                       │
│   首页 / 博客列表 / 文章详情 / 标签 / 搜索 / 关于     │
│          SSG 静态生成 · 零 JS 默认                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Vue Islands Layer                   │
│  SearchWidget · TableOfContents · DarkModeToggle     │
│        按需加载 · 仅在交互区域激活 JS                  │
└─────────────────────────────────────────────────────┘
```

**核心思想：** 页面主体由 Astro 在构建时生成纯静态 HTML，只有在需要交互的地方（搜索框、目录高亮、暗黑模式切换）才引入 Vue 组件作为"岛屿"。

## 项目结构

```
06-blog-project/
├── src/
│   ├── content/
│   │   ├── config.ts          # Content Collection schema 定义
│   │   └── posts/             # MDX 博客文章
│   │       ├── getting-started-astro.mdx
│   │       ├── vue-islands-deep-dive.mdx
│   │       ├── mdx-power.mdx
│   │       ├── building-blog-series.mdx
│   │       └── performance-optimization.mdx
│   ├── pages/
│   │   ├── index.astro        # 首页
│   │   ├── blog/
│   │   │   ├── index.astro    # 博客列表（分页）
│   │   │   └── [...slug].astro # 文章详情
│   │   ├── tags/
│   │   │   ├── index.astro    # 标签总览
│   │   │   └── [tag].astro    # 按标签筛选
│   │   ├── search.astro       # 站内搜索
│   │   ├── about.astro        # 关于页
│   │   └── rss.xml.ts         # RSS Feed
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 基础布局
│   │   └── PostLayout.astro   # 文章布局
│   ├── components/
│   │   ├── PostCard.astro     # 文章卡片
│   │   ├── Pagination.astro   # 分页组件
│   │   ├── TagList.astro      # 标签列表
│   │   └── vue/
│   │       ├── SearchWidget.vue
│   │       ├── TableOfContents.vue
│   │       ├── DarkModeToggle.vue
│   │       └── TagFilter.vue
│   ├── stores/
│   │   └── theme.ts           # 主题 Nano Store
│   └── utils/
│       └── reading-time.ts    # 阅读时间计算
├── public/
│   └── favicon.svg
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## 关键模式解析

### 1. 标签页面与 getStaticPaths

```typescript
// src/pages/tags/[tag].astro
export async function getStaticPaths() {
  const posts = await getCollection('posts');
  // 收集所有标签并去重
  const tags = new Set(posts.flatMap(post => post.data.tags));
  return [...tags].map(tag => ({
    params: { tag },
    props: {
      posts: posts.filter(post => post.data.tags.includes(tag))
    }
  }));
}
```

**要点：** 每个标签生成一个静态页面，构建时完成所有计算，运行时零开销。

### 2. 分页与 Astro.paginate

```typescript
// src/pages/blog/index.astro
export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('posts');
  return paginate(posts.sort((a, b) => b.data.date - a.data.date), {
    pageSize: 5
  });
}
```

**要点：** `Astro.paginate` 自动处理分页逻辑，生成 `/blog`、`/blog/2`、`/blog/3` 等页面。

### 3. RSS 订阅

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
export function GET(context) {
  return rss({
    title: '我的技术博客',
    description: '分享前端开发的技术文章',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
    }))
  });
}
```

### 4. Vue Islands 交互区域

- **搜索组件** (`client:load`)：需要立即响应用户输入
- **文章目录** (`client:idle`)：等浏览器空闲时再加载即可
- **暗黑模式** (`client:load`)：需要尽快初始化主题

## 性能策略

| 策略 | 效果 |
|------|------|
| 所有页面 SSG | 首屏加载极快，CDN 可直接缓存 |
| Islands 仅按需加载 | JS 体积最小化 |
| `client:idle` 延迟加载非关键组件 | 不阻塞首屏渲染 |
| 静态标签/分类页面 | 无服务端查询开销 |
| 客户端搜索 | 无服务端搜索 API 调用 |

## 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

访问 `http://localhost:4321` 查看博客。

## 练习建议

1. **添加新文章**：在 `src/content/posts/` 下创建新的 `.mdx` 文件
2. **自定义主题**：修改 CSS 变量实现个性化配色
3. **添加评论**：集成 Giscus 或 Twikoo 评论系统
4. **国际化**：尝试添加英文版本的文章
5. **图片优化**：使用 `<Image />` 组件优化文章封面图
