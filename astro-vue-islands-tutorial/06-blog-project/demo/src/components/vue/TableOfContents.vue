<!--
  TableOfContents.vue — 文章目录 Vue Island

  功能：
  - 根据文章 headings 生成可点击的目录
  - 追踪滚动位置，高亮当前可见章节
  - 平滑滚动到目标位置
  - 移动端可折叠
  - Sticky 定位
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

const props = defineProps<{
  headings: Heading[];
}>();

// 当前激活的章节
const activeSlug = ref('');

// 移动端折叠状态
const isCollapsed = ref(true);

// 只保留 h2 和 h3 级别的标题
const filteredHeadings = computed(() =>
  props.headings.filter(h => h.depth === 2 || h.depth === 3)
);

// 如果没有标题，不渲染目录
const hasHeadings = computed(() => filteredHeadings.value.length > 0);

// 滚动监听 — 高亮当前可见章节
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // 使用 IntersectionObserver 监听标题元素
  const headingElements = filteredHeadings.value
    .map(h => document.getElementById(h.slug))
    .filter(Boolean) as HTMLElement[];

  if (headingElements.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      // 找到最靠上的可见标题
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSlug.value = entry.target.id;
          break;
        }
      }
    },
    {
      rootMargin: '-80px 0px -70% 0px', // 考虑 sticky header 的高度
      threshold: 0,
    }
  );

  headingElements.forEach(el => observer?.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
});

// 点击标题 — 平滑滚动
function scrollToHeading(slug: string) {
  const el = document.getElementById(slug);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSlug.value = slug;
    // 移动端点击后自动折叠
    if (window.innerWidth <= 768) {
      isCollapsed.value = true;
    }
  }
}

// 切换折叠状态
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <nav v-if="hasHeadings" class="toc" aria-label="文章目录">
    <!-- 标题 -->
    <div class="toc-header" @click="toggleCollapse">
      <h3>目录</h3>
      <button class="toc-toggle" :class="{ collapsed: isCollapsed }" aria-label="展开/折叠目录">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- 目录列表 -->
    <ul v-show="!isCollapsed" class="toc-list">
      <li
        v-for="heading in filteredHeadings"
        :key="heading.slug"
        :class="[
          'toc-item',
          `toc-depth-${heading.depth}`,
          { active: activeSlug === heading.slug }
        ]"
      >
        <a
          :href="`#${heading.slug}`"
          @click.prevent="scrollToHeading(heading.slug)"
          class="toc-link"
        >
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.toc {
  background: var(--color-card-bg, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 1.25rem;
  max-width: 280px;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toc-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text, #1a1a2e);
}

.toc-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  color: var(--color-text-muted, #64748b);
}

.toc-toggle:hover {
  background: var(--color-border, #e2e8f0);
}

.toc-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.toc-toggle.collapsed svg {
  transform: rotate(-90deg);
}

.toc-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  border-left: 2px solid var(--color-border, #e2e8f0);
}

.toc-item {
  margin: 0;
}

.toc-link {
  display: block;
  padding: 0.35rem 0 0.35rem 1rem;
  font-size: 0.85rem;
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
  border-left: 2px solid transparent;
  margin-left: -2px;
  transition: color 0.2s, border-color 0.2s;
  line-height: 1.4;
}

.toc-link:hover {
  color: var(--color-text, #1a1a2e);
}

.toc-item.active .toc-link {
  color: var(--color-primary, #6366f1);
  border-left-color: var(--color-primary, #6366f1);
  font-weight: 600;
}

/* h3 级别缩进 */
.toc-depth-3 .toc-link {
  padding-left: 2rem;
  font-size: 0.8rem;
}

/* 移动端默认折叠 */
@media (max-width: 768px) {
  .toc {
    max-width: 100%;
  }
}
</style>
