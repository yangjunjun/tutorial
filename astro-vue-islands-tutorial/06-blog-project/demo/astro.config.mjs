import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 站点 URL — 用于 sitemap 和 RSS 生成
  site: 'https://my-astro-blog.example.com',

  // 集成配置
  integrations: [
    // MDX 支持 — 在 Markdown 中使用组件
    mdx(),
    // Vue 3 Islands — 交互式组件
    vue(),
    // Sitemap 自动生成
    sitemap(),
  ],

  // 默认静态输出（所有页面构建时生成 HTML）
  output: 'static',

  // 开发服务器配置
  server: {
    port: 4321,
  },

  // Vite 配置（如需自定义）
  vite: {
    // 可以在这里添加 Vite 插件或配置
  },
});
