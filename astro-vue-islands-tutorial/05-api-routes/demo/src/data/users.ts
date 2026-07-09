/**
 * 共享模拟数据 - 用户列表
 *
 * 提供用户数据和查询辅助函数，供 API 路由和页面使用。
 * 在实际项目中，这里会替换为数据库查询。
 */

// ────────────────────────────────────
// 类型定义
// ────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  bio: string;
}

// ────────────────────────────────────
// 模拟数据（5 个用户）
// ────────────────────────────────────

export const users: User[] = [
  {
    id: 1,
    name: '张明',
    email: 'zhangming@example.com',
    role: 'admin',
    bio: '全栈开发工程师，专注前端架构和性能优化。',
  },
  {
    id: 2,
    name: '李婷',
    email: 'liting@example.com',
    role: 'editor',
    bio: '技术写作爱好者，Astro 和 Vue 社区贡献者。',
  },
  {
    id: 3,
    name: '王浩',
    email: 'wanghao@example.com',
    role: 'viewer',
    bio: 'UI/UX 设计师，擅长设计系统和组件库开发。',
  },
  {
    id: 4,
    name: '赵雪',
    email: 'zhaoxue@example.com',
    role: 'editor',
    bio: '后端工程师，Go 和 Rust 爱好者，微服务架构实践者。',
  },
  {
    id: 5,
    name: '陈磊',
    email: 'chenlei@example.com',
    role: 'viewer',
    bio: '产品经理，关注用户体验和数据驱动决策。',
  },
];

// ────────────────────────────────────
// 辅助函数
// ────────────────────────────────────

/** 按 ID 查找用户 */
export function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
}

/** 按角色筛选用户 */
export function getUsersByRole(role: User['role']): User[] {
  return users.filter((u) => u.role === role);
}

/** 搜索用户（按名字或简介模糊匹配） */
export function searchUsers(query: string): User[] {
  if (!query.trim()) return users;
  const q = query.toLowerCase();
  return users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
}
