<!--
  TagFilter.vue — 标签筛选组件

  功能：
  - 显示可用标签列表
  - 点击标签进行筛选
  - 显示当前选中的标签
  - 发出筛选事件
-->
<script setup lang="ts">
import { computed } from 'vue';

interface TagInfo {
  name: string;
  count: number;
}

const props = defineProps<{
  tags: TagInfo[];
  selectedTag?: string;
}>();

const emit = defineEmits<{
  (e: 'filter', tag: string | null): void;
}>();

// 是否有选中的标签
const hasSelection = computed(() => !!props.selectedTag);

// 选择标签
function selectTag(tag: string) {
  if (props.selectedTag === tag) {
    // 再次点击取消筛选
    emit('filter', null);
  } else {
    emit('filter', tag);
  }
}

// 清除筛选
function clearFilter() {
  emit('filter', null);
}
</script>

<template>
  <div class="tag-filter">
    <div class="filter-header">
      <span class="filter-label">按标签筛选</span>
      <button
        v-if="hasSelection"
        class="clear-filter"
        @click="clearFilter"
      >
        清除筛选
      </button>
    </div>

    <div class="tags-container">
      <button
        v-for="tag in tags"
        :key="tag.name"
        :class="['tag-btn', { active: selectedTag === tag.name }]"
        @click="selectTag(tag.name)"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count">{{ tag.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tag-filter {
  margin-bottom: 1.5rem;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text, #1a1a2e);
}

.clear-filter {
  padding: 0.25rem 0.6rem;
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.clear-filter:hover {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  background: var(--color-card-bg, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--color-text, #1a1a2e);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-btn:hover {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
}

.tag-btn.active {
  background: var(--color-primary, #6366f1);
  color: white;
  border-color: var(--color-primary, #6366f1);
}

.tag-count {
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
