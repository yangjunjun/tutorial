<!--
  CartSidebar.vue - 购物车侧边栏组件

  与 ProductCard 组件共享同一个 Nano Store (cartItems)。
  当用户在任何 ProductCard 中添加商品时，这里会自动更新。
  这就是跨 Vue 岛屿共享状态的核心演示！
-->
<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import {
  cartItems,
  cartCount,
  cartTotal,
  removeItem,
  updateQuantity,
  clearCart,
} from '../../stores/cart';

// 订阅 store —— 和 ProductCard 订阅的是同一个实例
const items = useStore(cartItems);
const count = useStore(cartCount);
const total = useStore(cartTotal);
</script>

<template>
  <div class="cart-sidebar">
    <div class="cart-header">
      <h2 class="cart-title">🛒 购物车</h2>
      <span class="cart-count">{{ count }} 件商品</span>
    </div>

    <!-- 空状态 -->
    <div v-if="items.length === 0" class="cart-empty">
      <p class="empty-icon">🛒</p>
      <p class="empty-text">购物车是空的</p>
      <p class="empty-hint">去挑选一些商品吧！</p>
    </div>

    <!-- 商品列表 -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <!-- 商品信息 -->
          <div class="item-info">
            <span class="item-image">{{ item.image }}</span>
            <div class="item-details">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-price">¥{{ item.price.toFixed(2) }}</p>
            </div>
          </div>

          <!-- 数量控制 -->
          <div class="item-controls">
            <button
              class="qty-btn"
              @click="updateQuantity(item.id, item.quantity - 1)"
            >
              −
            </button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button
              class="qty-btn"
              @click="updateQuantity(item.id, item.quantity + 1)"
            >
              +
            </button>

            <!-- 删除按钮 -->
            <button class="remove-btn" @click="removeItem(item.id)" title="移除">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 合计区域 -->
      <div class="cart-footer">
        <div class="cart-total">
          <span>合计</span>
          <span class="total-price">¥{{ total.toFixed(2) }}</span>
        </div>
        <button class="clear-btn" @click="clearCart()">清空购物车</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-sidebar {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #e9ecef);
  border-radius: var(--radius, 12px);
  overflow: hidden;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #e9ecef);
}

.cart-title {
  font-size: 1.1rem;
  margin: 0;
}

.cart-count {
  font-size: 0.85rem;
  color: var(--text-secondary, #6c757d);
}

/* ── 空状态 ── */
.cart-empty {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin: 0 0 8px;
}

.empty-text {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text, #1a1a2e);
}

.empty-hint {
  font-size: 0.85rem;
  color: var(--text-secondary, #6c757d);
  margin: 0;
}

/* ── 商品列表 ── */
.cart-items {
  max-height: 400px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border, #e9ecef);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-image {
  font-size: 1.5rem;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text, #1a1a2e);
}

.item-price {
  font-size: 0.85rem;
  color: var(--primary, #4361ee);
  margin: 2px 0 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 38px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border, #e9ecef);
  border-radius: 6px;
  background: var(--bg, #f8f9fa);
  color: var(--text, #1a1a2e);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.qty-btn:hover {
  background: var(--primary, #4361ee);
  color: white;
  border-color: var(--primary, #4361ee);
}

.qty-value {
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  font-size: 0.9rem;
}

.remove-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

/* ── 底部合计 ── */
.cart-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border, #e9ecef);
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.total-price {
  font-size: 1.2rem;
  color: var(--primary, #4361ee);
}

.clear-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  background: transparent;
  color: #e74c3c;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #e74c3c;
  color: white;
}
</style>
