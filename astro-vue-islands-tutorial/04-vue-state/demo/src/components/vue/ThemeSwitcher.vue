<!--
  ThemeSwitcher.vue - 主题切换组件

  使用 Nano Store 管理明/暗主题。
  切换时同步更新 <html> 元素的 class，影响整个页面的 CSS 变量。
  主题偏好自动持久化到 localStorage。
-->
<script setup lang="ts">
import { useTheme } from '../../stores/theme';

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <button
    class="theme-toggle"
    :class="theme"
    @click="toggleTheme"
    :title="theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'"
  >
    <!-- 太阳图标（亮色模式） -->
    <span v-if="theme === 'light'" class="icon">☀️</span>
    <!-- 月亮图标（暗色模式） -->
    <span v-else class="icon">🌙</span>
    <span class="label">{{ theme === 'light' ? '亮色' : '暗色' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border, #e9ecef);
  border-radius: 20px;
  background: var(--bg, #f8f9fa);
  color: var(--text, #1a1a2e);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  border-color: var(--primary, #4361ee);
}

.icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .icon {
  transform: rotate(15deg);
}

.label {
  font-weight: 500;
}
</style>
