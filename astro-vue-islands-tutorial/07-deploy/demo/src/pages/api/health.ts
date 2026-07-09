/**
 * 健康检查 API 端点
 *
 * 用于 SSR 部署的健康检查，监控系统可以通过访问此端点判断服务是否正常。
 *
 * 注意：此端点仅在 output: 'server' 或 'hybrid' 模式下可用。
 * 纯静态部署（output: 'static'）不会生成此 API 路由。
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const healthData = {
    // 服务状态
    status: 'healthy',

    // 时间戳
    timestamp: new Date().toISOString(),

    // 运行时间（如果是 SSR 环境）
    uptime: process.uptime ? process.uptime() : null,

    // 环境信息
    environment: {
      node: process.version,
      platform: process.platform,
      // 不暴露敏感信息
    },

    // 检查项
    checks: {
      // 服务端渲染可用
      ssr: true,
      // API 路由可用
      api: true,
      // 内存使用（MB）
      memory: process.memoryUsage
        ? {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          }
        : null,
    },
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // 禁止缓存健康检查结果
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
