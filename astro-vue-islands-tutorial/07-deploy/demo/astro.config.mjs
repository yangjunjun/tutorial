import { defineConfig } from 'astro/config';

// ============================================================
// Astro 部署配置 — 根据部署平台取消注释对应的 adapter
// ============================================================
// 部署到 Vercel:
// import vercel from '@astrojs/vercel';
//
// 部署到 Netlify:
// import netlify from '@astrojs/netlify';
//
// 部署到 Cloudflare Pages:
// import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // 输出模式:
  //   'static' — 纯静态站点（适合 GitHub Pages、CDN 部署）
  //   'server' — 全量 SSR（所有页面按需服务端渲染）
  //   'hybrid' — 混合模式（默认 SSG，个别页面 opt-in SSR）
  output: 'static',

  // 站点 URL — 部署后替换为实际域名
  site: 'https://my-astro-blog.example.com',

  // 取消注释对应平台的 adapter（同时需要将 output 改为 'server' 或 'hybrid'）:
  //
  // Vercel adapter:
  // adapter: vercel(),
  //
  // Netlify adapter:
  // adapter: netlify(),
  //
  // Cloudflare adapter:
  // adapter: cloudflare(),
});
