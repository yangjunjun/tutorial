/**
 * /api/users/[id]
 *
 * 单个用户的 API（动态路由参数）
 * - GET /api/users/1    → 返回 id=1 的用户
 * - DELETE /api/users/1 → 删除 id=1 的用户
 * - 404 如果用户不存在
 *
 * 关键：通过 context.params.id 获取 URL 中的动态参数
 */
import type { APIRoute } from 'astro';
import { users } from '../../../../data/users';

// 运行时用户列表副本
let runtimeUsers = [...users];

/**
 * GET /api/users/:id - 获取单个用户
 */
export const GET: APIRoute = ({ params }) => {
  const id = Number(params.id);

  if (isNaN(id)) {
    return new Response(
      JSON.stringify({ error: '无效的用户 ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = runtimeUsers.find((u) => u.id === id);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: '用户不存在',
        message: `找不到 ID 为 ${id} 的用户`,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ data: user }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

/**
 * DELETE /api/users/:id - 删除用户
 */
export const DELETE: APIRoute = ({ params }) => {
  const id = Number(params.id);

  if (isNaN(id)) {
    return new Response(
      JSON.stringify({ error: '无效的用户 ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const index = runtimeUsers.findIndex((u) => u.id === id);

  if (index === -1) {
    return new Response(
      JSON.stringify({
        error: '用户不存在',
        message: `找不到 ID 为 ${id} 的用户`,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 删除用户
  const [removed] = runtimeUsers.splice(index, 1);

  return new Response(
    JSON.stringify({
      message: '用户已删除',
      data: removed,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
