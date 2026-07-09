<!--
  SearchBox.vue - 搜索输入框组件

  SSR 搜索页面的核心交互组件。
  使用表单提交（form action）触发页面重新加载，
  这是 SSR 页面的标准搜索模式（区别于客户端 SPA 搜索）。

  Props:
  - currentQuery: 当前搜索词（由 Astro 传入，用于回显）
-->
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  currentQuery?: string;
}>();

// 本地输入值（与 currentQuery 同步）
const query = ref(props.currentQuery || '');

// 当 props 变化时同步（Astro 重新渲染时）
watch(() => props.currentQuery, (val) => {
  query.value = val || '';
});

/** 清空搜索 */
function clearQuery() {
  query.value = '';
}

/**
 * 表单提交处理
 * SSR 模式下，使用原生表单提交触发页面刷新（服务端重新渲染）
 * 这是 Astro SSR 页面的标准搜索模式
 */
function handleSubmit() {
  // 构建 URL 并导航
  const url = new URL(window.location.href);
  url.searchParams.set('q', query.value);

  // 如果搜索词为空，清除参数
  if (!query.value.trim()) {
    url.searchParams.delete('q');
  }

  // 导航到新 URL（触发 SSR 页面重新渲染）
  window.location.href = url.toString();
}
</script>

<template>
  <form class="search-form" @submit.prevent="handleSubmit">
    <div class="search-input-wrapper">
      <!-- 搜索图标 -->
      <span class="search-icon">🔍</span>

      <!-- 搜索输入框 -->
      <input
        v-model="query"
        type="text"
        name="q"
        class="search-input"
        placeholder="搜索用户（姓名、邮箱、简介、角色）..."
        autocomplete="off"
      />

      <!-- 清空按钮 -->
      <button
        v-if="query"
        type="button"
        class="clear-btn"
        @click="clearQuery"
        title="清空"
      >
        ✕
      </button>
    </div>

    <!-- 提交按钮 -->
    <button type="submit" class="search-btn">
      搜索
    </button>

    <!-- 当前搜索词提示 -->
    <p v-if="currentQuery" class="current-query">
      当前搜索: "<strong>{{ currentQuery }}</strong>"
      <a href="/search" class="reset-link">清除搜索</a>
    </p>
  </form>
</template>

<style scoped>
.search-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  background: white;
  padding: 0 12px;
  transition: border-color 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #4361ee;
}

.search-icon {
  font-size: 1.1rem;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 1rem;
  background: transparent;
  color: #1a1a2e;
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f0f2f5;
  color: #6c757d;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #e74c3c;
  color: white;
}

.search-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: #4361ee;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  align-self: flex-end;
}

.search-btn:hover {
  background: #3a56d4;
}

.current-query {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.reset-link {
  color: #4361ee;
  text-decoration: none;
  margin-left: 8px;
}

.reset-link:hover {
  text-decoration: underline;
}
</style>
