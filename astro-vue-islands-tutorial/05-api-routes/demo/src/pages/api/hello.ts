/**
 * GET /api/hello
 *
 * 最简单的 API 路由示例。
 * 返回一条问候消息和当前时间戳。
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      message: 'Hello from Astro API!',
      timestamp: new Date().toISOString(),
      tip: '这是一个 SSG 项目中的 API 端点，使用 Hybrid 模式后它会在运行时响应请求。',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 允许跨域（开发时方便 Vue 组件调用）
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
