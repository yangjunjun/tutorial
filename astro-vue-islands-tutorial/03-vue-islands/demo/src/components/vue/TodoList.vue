<script setup lang="ts">
/**
 * TodoList 组件 —— Vue 3 响应式演示
 *
 * 展示内容：
 * - reactive() 响应式数组
 * - v-model 双向绑定
 * - computed 计算属性（剩余待办数）
 * - 列表渲染（v-for）与 key
 * - 过渡动画（TransitionGroup）
 */
import { reactive, computed, ref } from 'vue';

// 类型定义
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 响应式状态
const todos = reactive<Todo[]>([
  { id: 1, text: '学习 Astro 基础', completed: true },
  { id: 2, text: '集成 Vue 3 岛屿', completed: false },
  { id: 3, text: '理解 client 指令', completed: false },
]);

// 新待办输入
const newTodo = ref('');

// 自增 ID
let nextId = 4;

// 计算属性：剩余待办数
const remaining = computed(() => {
  return todos.filter((t) => !t.completed).length;
});

// 添加待办
function addTodo() {
  const text = newTodo.value.trim();
  if (!text) return;
  todos.push({ id: nextId++, text, completed: false });
  newTodo.value = '';
}

// 切换完成状态
function toggleTodo(id: number) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
  }
}

// 删除待办
function removeTodo(id: number) {
  const index = todos.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos.splice(index, 1);
  }
}
</script>

<template>
  <div class="todo-island">
    <div class="island-badge">Vue Island</div>

    <h3 class="todo-title">
      待办事项
      <span class="remaining-badge" v-if="remaining > 0">
        {{ remaining }} 项待办
      </span>
      <span class="remaining-badge done" v-else>
        全部完成！
      </span>
    </h3>

    <!-- 输入区域 -->
    <form class="todo-input" @submit.prevent="addTodo">
      <input
        v-model="newTodo"
        type="text"
        placeholder="添加新的待办事项..."
        class="input-field"
      />
      <button type="submit" class="btn-add">添加</button>
    </form>

    <!-- 待办列表 -->
    <TransitionGroup name="list" tag="ul" class="todo-list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <label class="todo-label">
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodo(todo.id)"
            class="todo-checkbox"
          />
          <span class="todo-text">{{ todo.text }}</span>
        </label>
        <button class="btn-delete" @click="removeTodo(todo.id)">
          &times;
        </button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.todo-island {
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

.todo-title {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.remaining-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: #fef3c7;
  color: #d97706;
}

.remaining-badge.done {
  background: #d1fae5;
  color: #059669;
}

/* 输入区域 */
.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-field {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #6366f1;
}

.btn-add {
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #4f46e5;
}

/* 待办列表 */
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.todo-item:hover {
  background: #f8fafc;
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  flex: 1;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #6366f1;
  cursor: pointer;
}

.todo-text {
  font-size: 0.9rem;
  color: #334155;
  transition: all 0.2s;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.btn-delete {
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-delete:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
