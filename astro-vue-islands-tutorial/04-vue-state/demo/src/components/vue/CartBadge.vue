<!--
  CartBadge.vue - 购物车角标组件

  在 Header 中显示当前购物车中的商品总数。
  订阅 Nano Store 的 cartCount 计算属性，自动更新。
-->
<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { cartCount, cartTotal } from '../../stores/cart';

const count = useStore(cartCount);
const total = useStore(cartTotal);
</script>

<template>
  <div class="cart-badge-wrapper">
    <span class="cart-icon">🛒</span>
    <span class="cart-count" v-if="count > 0">{{ count }}</span>
    <span class="cart-total" v-if="count > 0">¥{{ total.toFixed(0) }}</span>
  </div>
</template>

<style scoped>
.cart-badge-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: var(--primary, #4361ee);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.cart-badge-wrapper:hover {
  transform: scale(1.05);
}

.cart-icon {
  font-size: 1rem;
}

.cart-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 0.8rem;
  min-width: 20px;
  text-align: center;
}

.cart-total {
  font-size: 0.85rem;
  opacity: 0.9;
}
</style>
