/**
 * =============================================================================
 * React 前端主组件
 * =============================================================================
 * 功能：
 *   - 展示应用状态和健康检查结果
 *   - 用户列表 CRUD 操作界面
 *   - 与后端 API 交互
 */

import React, { useState, useEffect, useCallback } from 'react';

// API 基础路径
const API_BASE = process.env.REACT_APP_API_URL || '/api';

// ──────────────────────────────────────────────────────────────────────────────
// 样式
// ──────────────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '24px',
    background: '#1a73e8',
    color: '#fff',
    borderRadius: '8px',
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    background: '#fafafa',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  healthy: { background: '#e8f5e9', color: '#2e7d32' },
  unhealthy: { background: '#ffebee', color: '#c62828' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #f0f0f0',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginRight: '8px',
    fontSize: '14px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: '8px',
  },
  primaryBtn: { background: '#1a73e8', color: '#fff' },
  dangerBtn: { background: '#e53935', color: '#fff' },
  successBtn: { background: '#43a047', color: '#fff' },
  info: { color: '#666', fontSize: '13px', marginTop: '8px' },
  loading: { textAlign: 'center', padding: '40px', color: '#999' },
  error: {
    padding: '12px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '4px',
    marginBottom: '16px',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 子组件：健康状态面板
// ──────────────────────────────────────────────────────────────────────────────
function HealthPanel({ health, loading, error, onRefresh }) {
  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>系统健康状态</h2>
      {loading && <p style={styles.loading}>正在检查...</p>}
      {error && <div style={styles.error}>{error}</div>}
      {health && (
        <div>
          <p>
            整体状态：
            <span
              style={{
                ...styles.statusBadge,
                ...(health.status === 'healthy' ? styles.healthy : styles.unhealthy),
              }}
            >
              {health.status === 'healthy' ? '正常' : '异常'}
            </span>
          </p>
          <p>数据库：{health.services?.database === 'connected' ? '已连接' : '断开'}</p>
          <p>Redis 缓存：{health.services?.redis === 'connected' ? '已连接' : '断开'}</p>
          <p style={styles.info}>
            运行时间：{Math.floor(health.uptime / 60)} 分钟 |
            环境：{health.environment} |
            版本：{health.version}
          </p>
        </div>
      )}
      <button
        style={{ ...styles.button, ...styles.primaryBtn, marginTop: '12px' }}
        onClick={onRefresh}
      >
        刷新状态
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 子组件：用户管理面板
// ──────────────────────────────────────────────────────────────────────────────
function UserPanel({ users, loading, error, onAdd, onDelete, onRefresh }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = () => {
    if (!username.trim() || !email.trim()) {
      alert('请填写用户名和邮箱');
      return;
    }
    onAdd({ username: username.trim(), email: email.trim() });
    setUsername('');
    setEmail('');
  };

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>用户管理</h2>

      {/* 添加用户表单 */}
      <div style={{ marginBottom: '16px' }}>
        <input
          style={styles.input}
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          style={{ ...styles.button, ...styles.successBtn }}
          onClick={handleAdd}
        >
          添加用户
        </button>
        <button
          style={{ ...styles.button, ...styles.primaryBtn }}
          onClick={onRefresh}
        >
          刷新列表
        </button>
      </div>

      {loading && <p style={styles.loading}>加载中...</p>}
      {error && <div style={styles.error}>{error}</div>}

      {/* 用户列表 */}
      {users && users.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>用户名</th>
              <th style={styles.th}>邮箱</th>
              <th style={styles.th}>创建时间</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>{user.id}</td>
                <td style={styles.td}>{user.username}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  {new Date(user.created_at).toLocaleString('zh-CN')}
                </td>
                <td style={styles.td}>
                  <button
                    style={{ ...styles.button, ...styles.dangerBtn, padding: '4px 10px' }}
                    onClick={() => onDelete(user.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p style={styles.info}>暂无用户数据</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 主组件
// ──────────────────────────────────────────────────────────────────────────────
function App() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // 获取健康状态
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealthError('无法连接到后端服务：' + err.message);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch(`${API_BASE}/users?page=1&limit=20`);
      const data = await res.json();
      setUsers(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setUsersError('获取用户列表失败：' + err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // 添加用户
  const addUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建失败');
      fetchUsers(); // 刷新列表
    } catch (err) {
      alert('添加用户失败：' + err.message);
    }
  };

  // 删除用户
  const deleteUser = async (id) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除失败');
      fetchUsers(); // 刷新列表
    } catch (err) {
      alert('删除用户失败：' + err.message);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    fetchHealth();
    fetchUsers();
  }, [fetchHealth, fetchUsers]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>全栈应用 Docker 部署演示</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
          React + Express + PostgreSQL + Redis + Nginx
        </p>
      </header>

      <HealthPanel
        health={health}
        loading={healthLoading}
        error={healthError}
        onRefresh={fetchHealth}
      />

      <UserPanel
        users={users}
        loading={usersLoading}
        error={usersError}
        onAdd={addUser}
        onDelete={deleteUser}
        onRefresh={fetchUsers}
      />

      <footer style={{ textAlign: 'center', color: '#999', padding: '24px', fontSize: '13px' }}>
        <p>Docker 全栈应用实战教程 - 第七章</p>
        <p>
          API 地址：{API_BASE} |
          数据来源：{users?.length > 0 ? '（见上方数据）' : '无'}
        </p>
      </footer>
    </div>
  );
}

export default App;
