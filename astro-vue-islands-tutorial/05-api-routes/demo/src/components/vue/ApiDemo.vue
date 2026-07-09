<!--
  ApiDemo.vue - 客户端 API 调用演示组件

  展示 Vue 岛屿如何在客户端通过 fetch() 调用 Astro API 路由。
  包含：
  1. GET /api/hello - 获取问候消息
  2. GET /api/users - 获取用户列表
  3. POST /api/users - 新增用户

  演示了加载状态、错误处理和多种 HTTP 方法。
-->
<script setup lang="ts">
import { ref } from 'vue';

// ────────────────────────────────────
// 状态定义
// ────────────────────────────────────

// Hello API 状态
const helloData = ref<{ message: string; timestamp: string } | null>(null);
const helloLoading = ref(false);
const helloError = ref('');

// Users API 状态
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  bio: string;
}

const usersList = ref<User[]>([]);
const usersLoading = ref(false);
const usersError = ref('');

// 新增用户表单
const newUser = ref({ name: '', email: '', role: 'viewer', bio: '' });
const createLoading = ref(false);
const createMessage = ref('');

// ────────────────────────────────────
// API 调用方法
// ────────────────────────────────────

/** 调用 GET /api/hello */
async function fetchHello() {
  helloLoading.value = true;
  helloError.value = '';

  try {
    const res = await fetch('/api/hello');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    helloData.value = await res.json();
  } catch (err) {
    helloError.value = `请求失败: ${err instanceof Error ? err.message : '未知错误'}`;
  } finally {
    helloLoading.value = false;
  }
}

/** 调用 GET /api/users */
async function fetchUsers() {
  usersLoading.value = true;
  usersError.value = '';

  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    usersList.value = data.data;
  } catch (err) {
    usersError.value = `请求失败: ${err instanceof Error ? err.message : '未知错误'}`;
  } finally {
    usersLoading.value = false;
  }
}

/** 调用 POST /api/users */
async function createUser() {
  if (!newUser.value.name || !newUser.value.email) {
    createMessage.value = '请填写姓名和邮箱';
    return;
  }

  createLoading.value = true;
  createMessage.value = '';

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser.value),
    });

    const data = await res.json();

    if (res.ok) {
      createMessage.value = `✅ 创建成功: ${data.data.name} (ID: ${data.data.id})`;
      // 清空表单
      newUser.value = { name: '', email: '', role: 'viewer', bio: '' };
      // 刷新用户列表
      fetchUsers();
    } else {
      createMessage.value = `❌ 创建失败: ${data.message || data.error}`;
    }
  } catch (err) {
    createMessage.value = `❌ 请求失败: ${err instanceof Error ? err.message : '未知错误'}`;
  } finally {
    createLoading.value = false;
  }
}

// 组件挂载时自动获取 Hello 数据
fetchHello();
</script>

<template>
  <div class="api-demo">
    <!-- ── Hello API ── -->
    <div class="demo-block">
      <div class="block-header">
        <h3>GET /api/hello</h3>
        <button class="fetch-btn" @click="fetchHello" :disabled="helloLoading">
          {{ helloLoading ? '加载中...' : '重新获取' }}
        </button>
      </div>

      <div v-if="helloLoading && !helloData" class="loading">加载中...</div>
      <div v-if="helloError" class="error">{{ helloError }}</div>
      <div v-if="helloData" class="response">
        <pre>{{ JSON.stringify(helloData, null, 2) }}</pre>
      </div>
    </div>

    <!-- ── Users API ── -->
    <div class="demo-block">
      <div class="block-header">
        <h3>GET /api/users</h3>
        <button class="fetch-btn" @click="fetchUsers" :disabled="usersLoading">
          {{ usersLoading ? '加载中...' : '获取用户列表' }}
        </button>
      </div>

      <div v-if="usersLoading && usersList.length === 0" class="loading">加载中...</div>
      <div v-if="usersError" class="error">{{ usersError }}</div>

      <ul v-if="usersList.length > 0" class="user-list">
        <li v-for="user in usersList" :key="user.id" class="user-item">
          <div class="user-avatar">{{ user.name[0] }}</div>
          <div class="user-info">
            <strong>{{ user.name }}</strong>
            <span class="user-email">{{ user.email }}</span>
            <span class="user-role">{{ user.role }}</span>
          </div>
        </li>
      </ul>
    </div>

    <!-- ── Create User ── -->
    <div class="demo-block">
      <h3>POST /api/users</h3>

      <form class="create-form" @submit.prevent="createUser">
        <div class="form-row">
          <input
            v-model="newUser.name"
            placeholder="姓名 *"
            class="form-input"
          />
          <input
            v-model="newUser.email"
            placeholder="邮箱 *"
            type="email"
            class="form-input"
          />
        </div>
        <div class="form-row">
          <select v-model="newUser.role" class="form-input">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <input
            v-model="newUser.bio"
            placeholder="简介（可选）"
            class="form-input"
          />
        </div>
        <button type="submit" class="submit-btn" :disabled="createLoading">
          {{ createLoading ? '创建中...' : '+ 创建用户' }}
        </button>
      </form>

      <p v-if="createMessage" class="message" :class="{ success: createMessage.startsWith('✅') }">
        {{ createMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.api-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-block {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
}

.demo-block h3 {
  font-size: 0.95rem;
  margin: 0 0 12px;
  color: #4361ee;
  font-family: 'Fira Code', monospace;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.block-header h3 {
  margin: 0;
}

.fetch-btn {
  padding: 6px 14px;
  border: 1px solid #4361ee;
  border-radius: 6px;
  background: white;
  color: #4361ee;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.fetch-btn:hover:not(:disabled) {
  background: #4361ee;
  color: white;
}

.fetch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  color: #6c757d;
  font-size: 0.85rem;
  padding: 8px 0;
}

.error {
  color: #e74c3c;
  font-size: 0.85rem;
  padding: 8px 12px;
  background: #fdf2f2;
  border-radius: 6px;
}

.response {
  margin-top: 8px;
}

.response pre {
  background: #1a1a2e;
  color: #a8e6cf;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
  line-height: 1.5;
}

/* ── 用户列表 ── */
.user-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.user-item:last-child { border-bottom: none; }

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-size: 0.85rem;
}

.user-email {
  color: #6c757d;
}

.user-role {
  margin-left: auto;
  padding: 2px 8px;
  background: #e8f4fd;
  color: #2980b9;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ── 创建用户表单 ── */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #4361ee;
}

.submit-btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #4361ee;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #3a56d4;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: #e74c3c;
}

.message.success {
  color: #2ecc71;
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
