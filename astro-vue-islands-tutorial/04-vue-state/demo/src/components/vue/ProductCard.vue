<!--
  ProductCard.vue - 商品卡片组件

  每个卡片都是一个独立的 Vue 岛屿。
  点击"加入购物车"时，通过 Nano Store 与 CartSidebar 共享状态。
  两个组件订阅同一个 store，自动保持同步！
-->
<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from '@nanostores/vue';
import { cartItems, addItem } from '../../stores/cart';

// Props：从 Astro 传入的商品信息
const props = defineProps<{
  id: string;
  name: string;
  price: number;
  image: string; // emoji 图标
}>();

// 订阅购物车 store，用于显示当前商品数量
const items = useStore(cartItems);

// 添加动画状态
const isAdding = ref(false);

/** 获取当前商品在购物车中的数量 */
function getQuantity(): number {
  const item = items.value.find((i) => i.id === props.id);
  return item ? item.quantity : 0;
}

/** 添加商品到购物车（通过 Nano Store） */
function handleAddToCart() {
  addItem({
    id: props.id,
    name: props.name,
    price: props.price,
    image: props.image,
  });

  // 触发添加动画
  isAdding.value = true;
  setTimeout(() => {
    isAdding.value = false;
  }, 600);
}
</script>

<template>
  <div class="product-card" :class="{ 'is-adding': isAdding }">
    <!-- 商品图标 -->
    <div class="product-image">{{ image }}</div>

    <!-- 商品信息 -->
    <div class="product-info">
      <h3 class="product-name">{{ name }}</h3>
      <p class="product-price">¥{{ price.toFixed(2) }}</p>
    </div>

    <!-- 数量和操作按钮 -->
    <div class="product-actions">
      <!-- 数量角标 -->
      <span v-if="getQuantity() > 0" class="quantity-badge">
        × {{ getQuantity() }}
      </span>

      <!-- 加入购物车按钮 -->
      <button
        class="add-btn"
        :class="{ added: isAdding }"
        @click="handleAddToCart"
      >
        {{ isAdding ? '✓ 已加入' : '加入购物车' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #e9ecef);
  border-radius: var(--radius, 12px);
  padding: 20px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.08));
}

/* 添加时的脉冲动画 */
.product-card.is-adding {
  animation: pulse 0.4s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.product-image {
  font-size: 3rem;
  margin-bottom: 12px;
}

.product-info {
  margin-bottom: 16px;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text, #1a1a2e);
}

.product-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary, #4361ee);
  margin: 0;
}

.product-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.quantity-badge {
  background: var(--primary, #4361ee);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.add-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--primary, #4361ee);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.add-btn:hover {
  background: var(--primary-hover, #3a56d4);
}

.add-btn:active {
  transform: scale(0.97);
}

/* 已加入状态 */
.add-btn.added {
  background: #2ecc71;
}
</style>
