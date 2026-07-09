<!--
  EventLogger.vue - CustomEvent 事件监听器组件

  演示浏览器 CustomEvent 跨岛屿通信模式：
  1. 监听 document 上的 'filter-change' 事件
  2. 将收到的事件记录到日志中
  3. 显示事件的时间戳和 payload

  这个组件配合 events.astro 页面中的按钮使用。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/** 事件日志条目 */
interface LogEntry {
  id: number;
  timestamp: string;
  category: string;
  source: string;
}

// 事件日志列表
const logs = ref<LogEntry[]>([]);
let logId = 0;

/** 处理 filter-change 事件 */
function handleFilterChange(event: Event) {
  const customEvent = event as CustomEvent<{ category: string; timestamp: string }>;
  const detail = customEvent.detail;

  logs.value.unshift({
    id: ++logId,
    timestamp: detail?.timestamp || new Date().toLocaleTimeString('zh-CN'),
    category: detail?.category || 'unknown',
    source: 'CustomEvent: filter-change',
  });

  // 最多保留 20 条日志
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20);
  }
}

/** 清空日志 */
function clearLogs() {
  logs.value = [];
  logId = 0;
}

// 组件挂载时注册事件监听
onMounted(() => {
  document.addEventListener('filter-change', handleFilterChange);

  // 添加一条初始日志
  logs.value.push({
    id: ++logId,
    timestamp: new Date().toLocaleTimeString('zh-CN'),
    category: '已就绪',
    source: '组件初始化，开始监听 filter-change 事件',
  });
});

// 组件卸载时移除事件监听（防止内存泄漏）
onUnmounted(() => {
  document.removeEventListener('filter-change', handleFilterChange);
});
</script>

<template>
  <div class="event-logger">
    <!-- 工具栏 -->
    <div class="logger-toolbar">
      <span class="logger-status">
        <span class="status-dot"></span>
        监听中
      </span>
      <button class="clear-btn" @click="clearLogs" v-if="logs.length > 0">
        清空日志
      </button>
    </div>

    <!-- 日志列表 -->
    <div class="log-list">
      <div v-if="logs.length === 0" class="log-empty">
        暂无事件记录。点击上方筛选按钮触发事件。
      </div>

      <TransitionGroup name="log" tag="div">
        <div v-for="log in logs" :key="log.id" class="log-entry">
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-category" :class="{ init: log.category === '已就绪' }">
            {{ log.category }}
          </span>
          <span class="log-source">{{ log.source }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.event-logger {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.logger-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.logger-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6c757d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ecc71;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.clear-btn {
  padding: 4px 10px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #6c757d;
}

.clear-btn:hover {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.log-empty {
  padding: 20px;
  text-align: center;
  color: #adb5bd;
  font-size: 0.9rem;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 4px;
  background: #f8f9fa;
}

.log-time {
  color: #6c757d;
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.log-category {
  background: #4361ee;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.log-category.init {
  background: #2ecc71;
}

.log-source {
  color: #495057;
  font-size: 0.8rem;
  flex: 1;
  text-align: right;
}

/* 日志进入动画 */
.log-enter-active {
  transition: all 0.3s ease;
}

.log-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.log-leave-active {
  transition: all 0.2s ease;
}

.log-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
