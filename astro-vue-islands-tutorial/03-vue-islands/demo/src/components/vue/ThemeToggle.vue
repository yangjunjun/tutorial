<script setup lang="ts">
/**
 * ThemeToggle 组件 —— 演示 client:idle / client:visible 的典型用法
 *
 * 展示内容：
 * - localStorage 持久化主题
 * - CSS 变量切换
 * - onMounted 生命周期
 * - 平滑过渡动画
 */
import { ref, onMounted } from 'vue';

// 当前是否为暗色主题
const isDark = ref(false);

// 组件挂载时从 localStorage 读取偏好
onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    isDark.value = true;
    applyTheme(true);
  } else if (!saved) {
    // 跟随系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark.value = prefersDark;
    applyTheme(prefersDark);
  }
});

// 切换主题
function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme(isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}

// 将主题应用到 document
function applyTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty('--bg', '#0f172a');
    root.style.setProperty('--text', '#e2e8f0');
    root.style.setProperty('--card-bg', '#1e293b');
    root.style.setProperty('--border', '#334155');
  } else {
    root.style.setProperty('--bg', '#f8f9fa');
    root.style.setProperty('--text', '#1a1a2e');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--border', '#e2e8f0');
  }
}
</script>

<template>
  <div class="theme-toggle-island">
    <div class="island-badge">Vue Island</div>

    <div class="toggle-container">
      <span class="theme-label">
        {{ isDark ? '暗色模式' : '亮色模式' }}
      </span>

      <button
        class="toggle-btn"
        :class="{ dark: isDark }"
        @click="toggleTheme"
        :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
      >
        <span class="toggle-track">
          <span class="toggle-thumb">
            {{ isDark ? '🌙' : '☀️' }}
          </span>
        </span>
      </button>

      <p class="theme-hint">
        主题偏好保存在 localStorage 中
      </p>
    </div>
  </div>
</template>

<style scoped>
.theme-toggle-island {
  position: relative;
  padding: 1rem;
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

.toggle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.theme-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text, #1a1a2e);
}

/* 切换按钮 */
.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.toggle-track {
  display: flex;
  align-items: center;
  width: 64px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 16px;
  padding: 2px;
  transition: background 0.3s;
}

.toggle-btn.dark .toggle-track {
  background: #4338ca;
}

.toggle-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
  font-size: 0.85rem;
}

.toggle-btn.dark .toggle-thumb {
  transform: translateX(32px);
  background: #1e1b4b;
}

.theme-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
