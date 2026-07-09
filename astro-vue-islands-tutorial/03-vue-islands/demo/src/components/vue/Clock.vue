<script setup lang="ts">
/**
 * Clock 组件 —— 演示 client:only 的典型使用场景
 *
 * 展示内容：
 * - setInterval 实时更新
 * - onMounted / onUnmounted 生命周期管理
 * - 日期格式化
 * - 为什么这个组件需要 client:only（依赖浏览器定时器，无法 SSR）
 */
import { ref, onMounted, onUnmounted } from 'vue';

// 当前时间
const now = ref(new Date());

// 定时器引用（用于清理）
let timer: ReturnType<typeof setInterval> | null = null;

// 格式化时间字符串
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// 格式化日期字符串
function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

// 组件挂载时启动定时器
onMounted(() => {
  // 立即更新一次
  now.value = new Date();
  // 每秒更新
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

// 组件卸载时清理定时器，防止内存泄漏
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<template>
  <div class="clock-island">
    <div class="island-badge">Vue Island</div>

    <div class="clock-display">
      <div class="time">{{ formatTime(now) }}</div>
      <div class="date">{{ formatDate(now) }}</div>
    </div>

    <div class="clock-info">
      <p class="info-text">
        此组件使用 <code>client:only="vue"</code>，
        因为 <code>setInterval</code> 是浏览器 API，无法在服务端运行。
      </p>
      <p class="info-note">
        服务端渲染时此区域为空，客户端 JS 加载后才开始显示。
      </p>
    </div>
  </div>
</template>

<style scoped>
.clock-island {
  position: relative;
  padding: 1.5rem;
  text-align: center;
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

.clock-display {
  margin-bottom: 1.5rem;
}

.time {
  font-size: 3.5rem;
  font-weight: 700;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  color: #6366f1;
  letter-spacing: 0.05em;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 1rem;
  color: #64748b;
}

.clock-info {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  text-align: left;
}

.info-text {
  font-size: 0.85rem;
  color: #475569;
  margin-bottom: 0.3rem;
}

.info-text code {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-family: 'Fira Code', monospace;
}

.info-note {
  font-size: 0.78rem;
  color: #94a3b8;
  font-style: italic;
}
</style>
