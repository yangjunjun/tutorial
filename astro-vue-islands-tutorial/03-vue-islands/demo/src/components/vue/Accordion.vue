<script setup lang="ts">
/**
 * Accordion 组件 —— 展示 Vue 过渡动画与 Props/Emits
 *
 * 展示内容：
 * - defineProps 接收数据
 * - defineEmits 触发事件
 * - 响应式展开状态管理
 * - Transition 过渡动画
 */
import { ref } from 'vue';

// 类型定义
interface AccordionItem {
  title: string;
  content: string;
}

// 接收 props
const props = defineProps<{
  items: AccordionItem[];
}>();

// 定义 emits
const emit = defineEmits<{
  toggle: [index: number, isOpen: boolean];
}>();

// 当前展开的面板索引（-1 表示全部折叠）
const openIndex = ref(-1);

// 切换面板
function togglePanel(index: number) {
  const wasOpen = openIndex.value === index;
  openIndex.value = wasOpen ? -1 : index;
  emit('toggle', index, !wasOpen);
}
</script>

<template>
  <div class="accordion-island">
    <div class="island-badge">Vue Island</div>

    <div class="accordion">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="accordion-item"
        :class="{ open: openIndex === index }"
      >
        <!-- 面板标题 -->
        <button
          class="accordion-header"
          @click="togglePanel(index)"
          :aria-expanded="openIndex === index"
        >
          <span class="header-title">{{ item.title }}</span>
          <span class="header-icon" :class="{ rotated: openIndex === index }">
            ▾
          </span>
        </button>

        <!-- 面板内容（带过渡动画） -->
        <Transition name="accordion">
          <div v-if="openIndex === index" class="accordion-body">
            <p class="accordion-content">{{ item.content }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-island {
  position: relative;
  padding: 1rem 0;
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

.accordion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accordion-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.accordion-item.open {
  border-color: #6366f1;
}

/* 标题按钮 */
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.accordion-header:hover {
  background: #f1f5f9;
}

.header-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.accordion-item.open .header-title {
  color: #6366f1;
}

.header-icon {
  font-size: 1rem;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.header-icon.rotated {
  transform: rotate(180deg);
}

/* 内容区域 */
.accordion-body {
  padding: 0 1rem 1rem;
}

.accordion-content {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.7;
}

/* 过渡动画 */
.accordion-enter-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.accordion-leave-active {
  transition: all 0.2s ease-in;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
