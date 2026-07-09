# 第四章：Vue 组件状态管理与跨组件通信

## 本章目标

- 掌握 Vue 岛屿组件的**状态管理**机制
- 理解 Astro 群岛架构下**跨组件通信**的挑战与解决方案
- 学会使用 **Nano Stores** 实现框架无关的共享状态
- 掌握 **CustomEvent** 浏览器事件实现松耦合通信
- 了解 **View Transitions** 实现页面级状态持久化

---

## 核心挑战：每个 Vue 岛屿都是独立的

在前面的章节中，我们学习了如何在 Astro 页面中嵌入 Vue 组件作为"岛屿"。但有一个关键问题：

> **每个 Vue 岛屿都是一个独立的 Vue 应用实例。**

这意味着：
- `ProductCard` 组件有自己的 Vue 实例
- `CartSidebar` 组件有另一个独立的 Vue 实例
- 它们之间**无法直接共享 `ref`、`reactive` 或 `provide/inject`**

```
┌──────────────────────────────────────┐
│           Astro 页面 (HTML)           │
│                                      │
│  ┌──────────────┐  ┌──────────────┐  │
│  │ Vue 岛屿 A   │  │ Vue 岛屿 B   │  │
│  │ (独立实例)    │  │ (独立实例)    │  │
│  │              │  │              │  │
│  │ 无法直接通信 │  │ 无法直接通信 │  │
│  └──────────────┘  └──────────────┘  │
│                                      │
│  ┌──────────────┐                    │
│  │ Vue 岛屿 C   │                    │
│  │ (独立实例)    │                    │
│  └──────────────┘                    │
└──────────────────────────────────────┘
```

那如何让「商品卡片」点击"加入购物车"后，「购物车侧边栏」自动更新呢？

---

## 方案一：Astro Props 传递（单向，有限）

最简单的方式是通过 Astro 的 props 把数据传给 Vue：

```astro
---
// index.astro
const cartCount = 0; // Astro 服务端数据
---
<CartBadge :count={cartCount} client:load />
```

**局限性：**
- 只能**单向传递**（Astro → Vue），Vue 组件无法修改
- 数据在**构建时/请求时**确定，不是响应式的
- 无法实现两个 Vue 岛屿之间的实时同步

---

## 方案二：Nano Stores（推荐）

[Nano Stores](https://github.com/nanostores/nanostores) 是一个**框架无关**的超轻量状态管理库：

- **体积超小**：~300 bytes
- **框架无关**：可以在 Vue、React、Svelte 等任何框架中使用
- **跨岛屿共享**：同一个 store 实例可以在多个 Vue 岛屿中使用
- **响应式**：自动追踪依赖，状态变更时自动更新 UI

### 安装

```bash
npm install nanostores @nanostores/vue
```

### 基本用法

```ts
// stores/cart.ts
import { atom, computed } from 'nanostores';

// 创建一个原子 store
export const cartItems = atom<CartItem[]>([]);

// 创建一个计算 store
export const cartTotal = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 操作方法
export function addItem(item: CartItem) {
  const current = cartItems.get();
  cartItems.set([...current, item]);
}
```

```vue
<!-- Vue 组件中使用 -->
<script setup>
import { useStore } from '@nanostores/vue';
import { cartItems, addItem } from '../stores/cart';

const items = useStore(cartItems);
</script>
```

### 为什么 Nano Stores 能跨岛屿工作？

```
┌──────────────────────────────────────────┐
│              浏览器内存                    │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │     Nano Store (全局单例)            │ │
│  │     cartItems = atom([])            │ │
│  └──────────┬──────────┬───────────────┘ │
│             │          │                  │
│  ┌──────────▼──┐  ┌───▼──────────┐      │
│  │ Vue 岛屿 A  │  │ Vue 岛屿 B   │      │
│  │ useStore()  │  │ useStore()   │      │
│  │ 订阅变更    │  │ 订阅变更     │      │
│  └─────────────┘  └──────────────┘      │
└──────────────────────────────────────────┘
```

关键在于：Nano Store 在浏览器中是一个**全局单例**，所有 Vue 岛屿的 `useStore()` 都订阅同一个 store。

---

## 方案三：浏览器 CustomEvent（松耦合通信）

利用浏览器原生的 `CustomEvent` + `dispatchEvent` / `addEventListener` 实现跨组件通信：

```ts
// 发送事件（任意组件或 Astro 脚本）
document.dispatchEvent(new CustomEvent('filter-change', {
  detail: { category: 'electronics' }
}));

// 监听事件（Vue 岛屿组件）
document.addEventListener('filter-change', (e) => {
  console.log(e.detail.category); // 'electronics'
});
```

**优点：**
- 完全解耦，发送方和接收方互不依赖
- 不需要额外安装任何库
- 适合一次性通知或事件驱动的场景

**缺点：**
- 不是响应式的
- 需要手动管理事件监听器的注册和销毁
- 不适合频繁、大量的状态同步

---

## 方案四：View Transitions 页面级状态持久化

Astro 的 [View Transitions](https://docs.astro.build/en/guides/view-transitions/) 可以在页面导航之间保持状态：

```astro
<head>
  <meta name="view-transition" content="same-document" />
</head>
```

配合 `transition:persist` 属性，可以让特定 DOM 元素在页面切换时保持不变：

```astro
<div transition:persist="cart-sidebar">
  <CartSidebar client:load />
</div>
```

这适合**页面级别**的状态保持，比如导航后购物车不丢失。

---

## 实战模式

### 1. 购物车模式
本项目 demo 中的核心示例：
- `ProductCard` 组件调用 `addItem()` 将商品加入 Nano Store
- `CartSidebar` 组件通过 `useStore()` 实时响应购物车变化
- Header 中的购物车角标也订阅同一个 store

### 2. 用户偏好（主题切换）
- 主题偏好存储在 Nano Store 中
- 同时持久化到 `localStorage`
- 任何 Vue 岛屿都可以读取和切换主题
- 主题变更立即反映到整个页面

### 3. 事件驱动的筛选
- 筛选条件通过 `CustomEvent` 广播
- 商品列表岛屿监听事件并重新筛选
- 适合非 Nano Stores 场景的松耦合方案

---

## 练习

1. **基础**：在购物车中增加一个"收藏夹"功能，使用 Nano Store 管理收藏商品
2. **进阶**：实现一个 `NotificationStore`，任何组件都可以触发通知消息，页面顶部统一显示
3. **挑战**：结合 `CustomEvent` 和 Nano Stores，实现一个搜索功能：输入框在一个岛屿中，搜索结果在另一个岛屿中显示

---

## 小结

| 方案 | 适用场景 | 复杂度 | 响应式 |
|------|----------|--------|--------|
| Astro Props | 简单的服务端数据传递 | 低 | 否 |
| Nano Stores | 跨岛屿共享状态 | 中 | 是 |
| CustomEvent | 松耦合事件通知 | 低 | 否 |
| View Transitions | 页面导航状态保持 | 中 | 部分 |

**推荐**：大多数跨岛屿状态共享场景，优先使用 **Nano Stores**。
