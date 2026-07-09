<script setup lang="ts">
/**
 * Counter 组件 —— Vue 3 Composition API 演示
 *
 * 展示内容：
 * - ref() 响应式状态
 * - 事件绑定（@click）
 * - 计算属性（computed）
 * - 通过 Props 接收初始值
 */
import { ref, computed } from 'vue';

const props = defineProps<{
  initialCount?: number;
}>();

// 响应式状态：从 props 获取初始值
const count = ref(props.initialCount ?? 0);

// 计算属性：判断奇偶
const parity = computed(() => (count.value % 2 === 0 ? '偶数' : '奇数'));

// 操作方法
function increment() {
  count.value++;
}

function decrement() {
  count.value--;
}

function reset() {
  count.value = props.initialCount ?? 0;
}
</script>

<template>
  <div class="counter-island">
    <div class="island-badge">Vue Island</div>

    <div class="counter-display">
      <span class="count-value">{{ count }}</span>
      <span class="count-parity">{{ parity }}</span>
    </div>

    <div class="counter-controls">
      <button class="btn btn-dec" @click="decrement">
        -
      </button>
      <button class="btn btn-reset" @click="reset">
        重置
      </button>
      <button class="btn btn-inc" @click="increment">
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.counter-island {
  position: relative;
  text-align: center;
  padding: 1.5rem;
}

.island-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #059669;
  background: #d1fae5;
  padding: 0.2rem 0.6rem;
  border-radius: 0 12px 0 8px;
}

.counter-display {
  margin-bottom: 1.5rem;
}

.count-value {
  display: block;
  font-size: 3rem;
  font-weight: 700;
  color: #6366f1;
  line-height: 1;
  margin-bottom: 0.3rem;
}

.count-parity {
  font-size: 0.85rem;
  color: #94a3b8;
}

.counter-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-inc {
  background: #6366f1;
  color: #fff;
}

.btn-inc:hover {
  background: #4f46e5;
}

.btn-dec {
  background: #e0e7ff;
  color: #4338ca;
}

.btn-dec:hover {
  background: #c7d2fe;
}

.btn-reset {
  background: #f1f5f9;
  color: #64748b;
}

.btn-reset:hover {
  background: #e2e8f0;
}
</style>
