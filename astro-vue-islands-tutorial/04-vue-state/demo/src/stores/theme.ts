/**
 * 主题 Nano Store
 *
 * 管理页面的明/暗主题偏好，持久化到 localStorage。
 * 提供 useTheme composable 方便在 Vue 组件中使用。
 */
import { atom, onMount } from 'nanostores';
import { useStore } from '@nanostores/vue';

// ────────────────────────────────────
// 类型定义
// ────────────────────────────────────

export type Theme = 'light' | 'dark';

// ────────────────────────────────────
// Store 定义
// ────────────────────────────────────

/** 当前主题（默认从 localStorage 读取，没有则跟随系统） */
export const theme = atom<Theme>(getInitialTheme());

// ────────────────────────────────────
// localStorage 持久化
// ────────────────────────────────────

const STORAGE_KEY = 'theme-preference';

/** 获取初始主题：优先读 localStorage，其次跟随系统偏好 */
function getInitialTheme(): Theme {
  // 仅在浏览器环境中执行（SSR 时跳过）
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  // 跟随系统偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 将主题同步到 <html> 元素的 class 和 localStorage
 * 使用 onMount 确保只在客户端执行
 */
onMount(theme, (currentTheme) => {
  if (typeof document === 'undefined') return;

  // 设置 document 根元素的 class
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(currentTheme);

  // 持久化到 localStorage
  localStorage.setItem(STORAGE_KEY, currentTheme);
});

// ────────────────────────────────────
// Actions
// ────────────────────────────────────

/** 切换明/暗主题 */
export function toggleTheme() {
  theme.set(theme.get() === 'light' ? 'dark' : 'light');
}

/** 直接设置主题 */
export function setTheme(newTheme: Theme) {
  theme.set(newTheme);
}

// ────────────────────────────────────
// Vue Composable
// ────────────────────────────────────

/**
 * Vue 组合式函数，在组件中方便地使用主题 store
 *
 * @example
 * ```vue
 * <script setup>
 * const { theme, toggleTheme } = useTheme();
 * </script>
 * <template>
 *   <button @click="toggleTheme">
 *     当前主题: {{ theme }}
 *   </button>
 * </template>
 * ```
 */
export function useTheme() {
  const currentTheme = useStore(theme);

  return {
    /** 当前主题值（响应式 ref） */
    theme: currentTheme,
    /** 切换明/暗主题 */
    toggleTheme,
    /** 设置指定主题 */
    setTheme,
  };
}
