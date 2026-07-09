<!--
  DarkModeToggle.vue — 暗黑模式切换组件

  功能：
  - 使用 Nano Store 管理主题状态
  - 切换太阳/月亮图标
  - 应用主题 class 到 document
  - 将偏好保存到 localStorage
  - 平滑的颜色过渡动画
-->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { $theme, toggleTheme } from '../../stores/theme';

// 从 Nano Store 读取当前主题
const theme = useStore($theme);

// 是否已挂载（防止 SSR 闪烁）
const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});

// 切换主题
function handleToggle() {
  toggleTheme();
}
</script>

<template>
  <button
    class="theme-toggle"
    :class="{ mounted }"
    :aria-label="theme === 'dark' ? '切换到亮色模式' : '切换到暗黑模式'"
    :title="theme === 'dark' ? '亮色模式' : '暗黑模式'"
    @click="handleToggle"
  >
    <!-- 太阳图标（亮色模式时显示） -->
    <svg
      v-if="theme === 'light'"
      class="icon sun"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>

    <!-- 月亮图标（暗黑模式时显示） -->
    <svg
      v-else
      class="icon moon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--color-card-bg, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  color: var(--color-text, #1a1a2e);
  /* 未挂载时隐藏，防止 SSR 闪烁 */
  opacity: 0;
}

.theme-toggle.mounted {
  opacity: 1;
  transition: opacity 0.1s, background 0.2s, border-color 0.2s, transform 0.2s;
}

.theme-toggle:hover {
  border-color: var(--color-primary, #6366f1);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

/* 切换时的旋转动画 */
.sun {
  animation: spin-in 0.4s ease;
}

.moon {
  animation: spin-in 0.4s ease;
}

@keyframes spin-in {
  from {
    transform: rotate(-90deg) scale(0);
    opacity: 0;
  }
  to {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
}
</style>
