/**
 * /api/users
 *
 * 用户 CRUD API（模拟数据）
 * - GET: 返回所有用户
 * - POST: 新增用户
 *
 * 注意：这里是内存数据，刷新后会重置。
 * 在生产项目中应替换为数据库操作。
 */
import type { APIRoute } from 'astro';
import { users, type User } from '../../../data/users';

// 运行时用户列表的副本（允许 POST 修改）
let runtimeUsers = [...users];
let nextId = users.length + 1;

/**
 * GET /api/users - 获取所有用户
 * 支持查询参数：?role=admin 按角色筛选
 */
export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const roleFilter = url.searchParams.get('role');

  let result = runtimeUsers;

  // 按角色筛选
  if (roleFilter) {
    result = result.filter(
      (u) => u.role === roleFilter
    );
  }

  return new Response(
    JSON.stringify({
      data: result,
      total: result.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

/**
 * POST /api/users - 新增用户
 *
 * 请求体 JSON：
 * { "name": "新用户", "email": "new@example.com", "role": "viewer", "bio": "简介" }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // 简单的参数校验
    if (!body.name || !body.email) {
      return new Response(
        JSON.stringify({
          error: '缺少必填字段',
          message: 'name 和 email 是必填的',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 创建新用户
    const newUser: User = {
      id: nextId++,
      name: body.name,
      email: body.email,
      role: body.role || 'viewer',
      bio: body.bio || '',
    };

    runtimeUsers.push(newUser);

    return new Response(
      JSON.stringify({
        message: '用户创建成功',
        data: newUser,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: '请求格式错误',
        message: '请发送有效的 JSON 数据',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
