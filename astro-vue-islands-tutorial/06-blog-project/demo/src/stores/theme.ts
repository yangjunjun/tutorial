/**
 * theme.ts — 主题状态管理 (Nano Store)
 *
 * 使用 Nano Store 实现跨 Vue Island 的主题状态共享。
 * Nano Store 极其轻量（~300 bytes），非常适合 Islands 架构。
 *
 * 使用方式：
 *   import { $theme, toggleTheme } from './stores/theme';
 *   const theme = useStore($theme);  // 在 Vue 组件中
 */
import { atom } from 'nanostores';

// 主题类型
export type Theme = 'light' | 'dark';

// 主题状态 Atom
export const $theme = atom<Theme>('light');

/**
 * 初始化主题 — 从 localStorage 读取用户偏好
 * 在服务端环境（SSR/SSG）中跳过
 */
export function initTheme(): void {
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem('theme') as Theme | null;

  if (saved === 'dark' || saved === 'light') {
    $theme.set(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // 如果没有手动设置过，跟随系统偏好
    $theme.set('dark');
  }

  // 应用到 DOM
  applyTheme($theme.get());
}

/**
 * 切换主题 — 在 light/dark 之间切换
 */
export function toggleTheme(): void {
  const next = $theme.get() === 'light' ? 'dark' : 'light';
  $theme.set(next);
  applyTheme(next);
  localStorage.setItem('theme', next);
}

/**
 * 将主题应用到 document — 设置 data-theme 属性
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

// 监听主题变化 — 自动应用到 DOM
$theme.listen((theme) => {
  applyTheme(theme);
});

// 在模块加载时初始化（仅客户端）
if (typeof window !== 'undefined') {
  initTheme();
}
