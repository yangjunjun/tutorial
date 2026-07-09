<!--
  SearchWidget.vue — 客户端即时搜索组件

  作为 Vue Island 加载（client:load），在客户端执行搜索。
  所有文章数据通过 props 从 Astro 传入，搜索过程完全在客户端完成。
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// 搜索数据结构
interface SearchPost {
  title: string;
  description: string;
  tags: string[];
  category: string;
  slug: string;
  excerpt: string;
}

// 从 Astro 接收文章数据
const props = defineProps<{
  posts: SearchPost[];
}>();

// 搜索状态
const query = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);

// 搜索结果计算
const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];

  return props.posts.filter(post => {
    // 搜索标题
    if (post.title.toLowerCase().includes(q)) return true;
    // 搜索描述
    if (post.description.toLowerCase().includes(q)) return true;
    // 搜索标签
    if (post.tags.some(tag => tag.toLowerCase().includes(q))) return true;
    // 搜索分类
    if (post.category.toLowerCase().includes(q)) return true;
    // 搜索正文摘要
    if (post.excerpt.toLowerCase().includes(q)) return true;
    return false;
  }).slice(0, 10); // 最多显示 10 条结果
});

// 高亮匹配文本
function highlightText(text: string, maxLen = 100): string {
  const q = query.value.trim();
  if (!q) return text.slice(0, maxLen);

  const truncated = text.slice(0, maxLen);
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return truncated.replace(regex, '<mark>$1</mark>');
}

// 键盘快捷键 Ctrl+K 聚焦搜索框
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.value?.focus();
  }
  // Escape 取消聚焦
  if (e.key === 'Escape') {
    searchInput.value?.blur();
    query.value = '';
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="search-widget">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper" :class="{ focused: isFocused }">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref="searchInput"
        v-model="query"
        type="text"
        placeholder="搜索文章标题、标签、描述..."
        class="search-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
        autocomplete="off"
      />

      <span class="shortcut-hint" v-show="!isFocused && !query">Ctrl+K</span>

      <button
        v-if="query"
        class="clear-btn"
        @click="query = ''; searchInput?.focus()"
        aria-label="清除搜索"
      >
        ×
      </button>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" v-if="query.trim()">
      <p class="results-count" v-if="results.length > 0">
        找到 {{ results.length }} 篇相关文章
      </p>
      <p class="results-count no-results" v-else>
        未找到与 "{{ query }}" 相关的文章
      </p>

      <ul class="results-list" v-if="results.length > 0">
        <li v-for="post in results" :key="post.slug" class="result-item">
          <a :href="`/blog/${post.slug}/`" class="result-link">
            <div class="result-header">
              <h3 v-html="highlightText(post.title)"></h3>
              <span class="result-category">{{ post.category }}</span>
            </div>
            <p class="result-desc" v-html="highlightText(post.description, 150)"></p>
            <div class="result-tags">
              <span v-for="tag in post.tags" :key="tag" class="result-tag">{{ tag }}</span>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <!-- 初始提示 -->
    <div class="search-hint" v-else>
      <p>输入关键词开始搜索，支持搜索文章标题、描述、标签和正文内容。</p>
    </div>
  </div>
</template>

<style scoped>
.search-widget {
  width: 100%;
}

/* 搜索输入框 */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-card-bg, #f8fafc);
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 0 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input-wrapper.focused {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted, #64748b);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 0.85rem 0.75rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--color-text, #1a1a2e);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-muted, #64748b);
}

.shortcut-hint {
  padding: 0.2rem 0.5rem;
  background: var(--color-border, #e2e8f0);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
}

.clear-btn {
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: var(--color-text-muted, #64748b);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--color-text, #1a1a2e);
}

/* 搜索结果 */
.search-results {
  margin-top: 1.5rem;
}

.results-count {
  font-size: 0.9rem;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 1rem;
}

.results-count.no-results {
  padding: 2rem;
  text-align: center;
  background: var(--color-card-bg, #f8fafc);
  border-radius: 12px;
}

.results-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-item {
  background: var(--color-card-bg, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  transition: border-color 0.2s;
}

.result-item:hover {
  border-color: var(--color-primary, #6366f1);
}

.result-link {
  display: block;
  padding: 1.25rem;
  text-decoration: none;
  color: var(--color-text, #1a1a2e);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-header h3 {
  font-size: 1.05rem;
  margin: 0;
}

.result-category {
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  background: var(--color-primary-light, #eef2ff);
  color: var(--color-primary, #6366f1);
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.result-desc {
  font-size: 0.9rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.result-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.result-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  background: var(--color-border, #e2e8f0);
  border-radius: 4px;
  color: var(--color-text-muted, #64748b);
}

/* 高亮标记 */
:deep(mark) {
  background: #fef08a;
  color: #1a1a2e;
  padding: 0 2px;
  border-radius: 2px;
}

/* 初始提示 */
.search-hint {
  margin-top: 1.5rem;
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted, #64748b);
  background: var(--color-card-bg, #f8fafc);
  border-radius: 12px;
  font-size: 0.95rem;
}
</style>
