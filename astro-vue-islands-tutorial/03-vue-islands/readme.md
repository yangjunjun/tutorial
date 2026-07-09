# 第三章：Vue 3 岛屿架构

> 本章将 Vue 3 集成到 Astro 中，深入讲解 Islands Architecture 和各种 client 指令的使用场景与性能影响。

## 本章目标

| 能力 | 说明 |
|------|------|
| Vue 3 集成 | 在 Astro 中使用 Vue SFC 组件 |
| Islands Architecture | 理解"群岛架构"的核心理念 |
| Client 指令 | 掌握 5 种客户端水合策略 |
| 性能优化 | 根据场景选择合适的指令 |

---

## 1. Islands Architecture 群岛架构

### 传统 SPA 的问题

```
┌─────────────────────────────┐
│  整个页面 = 一个大 JS 应用    │
│  - 首屏需要下载全部 JS        │
│  - 即使 90% 的内容是静态的    │
│  - SEO 需要额外 SSR 配置      │
└─────────────────────────────┘
```

### Astro Islands 的做法

```
┌─────────────────────────────┐
│         静态 HTML 海洋        │
│                              │
│   ┌──────┐     ┌──────┐     │
│   │岛屿 1│     │岛屿 2│     │
│   │Vue   │     │React  │     │
│   └──────┘     └──────┘     │
│                              │
│         ┌──────┐            │
│         │岛屿 3│            │
│         │Svelte │            │
│         └──────┘            │
└─────────────────────────────┘
```

- **默认零 JS**：页面以纯 HTML 输出
- **按需水合**：只有"岛屿"（交互组件）才加载 JS
- **框架无关**：可以同时使用 Vue、React、Svelte

---

## 2. Client 指令详解

Astro 提供 5 种指令来控制岛屿的水合（hydration）时机：

### `client:load` —— 页面加载时立即水合

```astro
<Counter client:load />
```

- **何时水合**：页面加载完成后立即执行
- **适用场景**：首屏可见、需要立即交互的组件（导航菜单、搜索框）
- **性能影响**：中等 —— JS 会立即加载并执行

### `client:idle` —— 浏览器空闲时水合

```astro
<ThemeToggle client:idle />
```

- **何时水合**：浏览器完成初始渲染后，利用空闲时间水合
- **适用场景**：非关键交互（主题切换、次要按钮）
- **性能影响**：低 —— 不阻塞首屏渲染

### `client:visible` —— 元素进入视口时水合

```astro
<Accordion client:visible />
```

- **何时水合**：当元素滚动到可视区域时
- **适用场景**：首屏以下的交互组件（折叠面板、懒加载卡片）
- **性能影响**：极低 —— 可能根本不加载（用户没滚动到）

### `client:only="vue"` —— 仅客户端渲染（跳过 SSR）

```astro
<Clock client:only="vue" />
```

- **何时水合**：只在客户端运行，服务端不渲染
- **适用场景**：依赖浏览器 API 的组件（localStorage、Date.now）
- **性能影响**：中等 —— 无 SSR 输出，但有 hydration

### `client:media` —— 满足媒体查询时水合

```astro
<MobileMenu client:media="(max-width: 768px)" />
```

- **何时水合**：当 CSS 媒体查询条件满足时
- **适用场景**：响应式组件（移动端菜单、桌面端侧栏）
- **性能影响**：极低 —— 不满足条件时不加载 JS

---

## 3. 指令选择决策树

```
组件需要交互吗？
├── 不需要 → 不加指令（纯 SSR，零 JS）
└── 需要
    ├── 首屏可见且必须立即可用？
    │   └── 是 → client:load
    ├── 非关键，可以等浏览器空闲？
    │   └── 是 → client:idle
    ├── 在首屏以下（需要滚动才能看到）？
    │   └── 是 → client:visible
    ├── 依赖浏览器 API（无法 SSR）？
    │   └── 是 → client:only="vue"
    └── 只在特定屏幕尺寸下需要？
        └── 是 → client:media="(max-width: 768px)"
```

---

## 4. 从 Astro 向 Vue 传递 Props

```astro
---
import ProductCard from '../components/vue/ProductCard.vue';

const product = { name: 'Astro 教程', price: 99 };
---

<ProductCard
  client:load
  name={product.name}
  price={product.price}
  :featured={true}
/>
```

Vue 组件正常接收 props：

```vue
<script setup lang="ts">
defineProps<{
  name: string;
  price: number;
  featured: boolean;
}>();
</script>
```

---

## 5. 操作步骤

### 5.1 安装依赖

```bash
npm install @astrojs/vue vue
```

### 5.2 配置 Astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
});
```

### 5.3 创建 Vue 组件

在 `src/components/vue/` 下创建 `.vue` 文件。

### 5.4 在页面中使用

```astro
---
import Counter from '../components/vue/Counter.vue';
---

<Counter client:load initialCount={10} />
```

---

## 6. 性能对比

| 指令 | JS 加载时机 | 首屏影响 | 适用场景 |
|------|------------|---------|---------|
| `client:load` | 立即 | 中 | 首屏交互组件 |
| `client:idle` | 空闲时 | 低 | 非关键交互 |
| `client:visible` | 滚动到可见 | 极低 | 首屏以下的组件 |
| `client:only` | 立即（无 SSR） | 中 | 依赖浏览器 API |
| `client:media` | 媒体查询匹配 | 极低 | 响应式组件 |

---

## 练习

1. 创建一个 `SearchBar.vue` 组件，使用 `client:load`（首屏搜索框）
2. 创建一个 `BackToTop.vue` 组件，使用 `client:visible`（滚动到底部才显示）
3. 创建一个 `UserAvatar.vue` 组件，使用 `client:only="vue"`（依赖 localStorage）
4. 在同一个页面使用以上三个组件，用 Chrome DevTools 的 Network 面板观察 JS 加载时机
5. 尝试使用 `client:media` 创建一个只在移动端显示的电话拨号按钮

> 提示：在 Chrome DevTools 中切换到 Slow 3G 网络，可以更明显地观察不同指令的水合时机差异。
