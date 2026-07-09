/**
 * 购物车 Nano Store
 *
 * 使用 nanostores 实现跨 Vue 岛屿共享的购物车状态管理。
 * 所有使用 useStore(cartItems) 的 Vue 组件都会自动同步。
 */
import { atom, computed } from 'nanostores';

// ────────────────────────────────────
// 类型定义
// ────────────────────────────────────

/** 购物车中的单个商品 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string; // emoji 图标
}

// ────────────────────────────────────
// Store 定义
// ────────────────────────────────────

/** 购物车商品列表（核心 store） */
export const cartItems = atom<CartItem[]>([]);

/** 计算属性：购物车中的商品总数 */
export const cartCount = computed(cartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

/** 计算属性：购物车总价 */
export const cartTotal = computed(cartItems, (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0)
);

// ────────────────────────────────────
// Actions（操作方法）
// ────────────────────────────────────

/**
 * 添加商品到购物车
 * 如果商品已存在，数量 +1；否则添加新商品
 */
export function addItem(newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  const current = cartItems.get();
  const existingIndex = current.findIndex((item) => item.id === newItem.id);

  if (existingIndex >= 0) {
    // 商品已存在，增加数量
    const updated = current.map((item, index) =>
      index === existingIndex
        ? { ...item, quantity: item.quantity + (newItem.quantity ?? 1) }
        : item
    );
    cartItems.set(updated);
  } else {
    // 新商品，添加到列表
    cartItems.set([...current, { ...newItem, quantity: newItem.quantity ?? 1 }]);
  }
}

/**
 * 从购物车中移除商品
 */
export function removeItem(id: string) {
  const current = cartItems.get();
  cartItems.set(current.filter((item) => item.id !== id));
}

/**
 * 更新指定商品的数量
 * 如果数量设为 0 或更少，则移除该商品
 */
export function updateQuantity(id: string, quantity: number) {
  if (quantity <= 0) {
    removeItem(id);
    return;
  }
  const current = cartItems.get();
  cartItems.set(
    current.map((item) => (item.id === id ? { ...item, quantity } : item))
  );
}

/**
 * 清空购物车
 */
export function clearCart() {
  cartItems.set([]);
}
