/**
 * RSS Feed 生成
 *
 * 使用 @astrojs/rss 自动生成标准 RSS 2.0 Feed
 * 访问 /rss.xml 获取
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  // 获取所有已发布的文章
  const posts = await getCollection('posts', ({ data }) => {
    return data.draft !== true;
  });

  // 按日期降序排列
  const sortedPosts = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    // Feed 标题 — 显示在 RSS 阅读器中
    title: 'Astro Vue Islands 博客',

    // Feed 描述
    description: '探索前端开发的无限可能 — Astro · Vue 3 · MDX 技术博客',

    // 站点 URL — 从 astro.config.mjs 中的 site 配置读取
    site: context.site ?? 'https://my-astro-blog.example.com',

    // Feed 条目 — 每篇文章一条
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
      // 可选：文章分类
      categories: post.data.tags,
      // 可选：作者
      author: post.data.author,
    })),

    // 可选：自定义数据
    customData: `<language>zh-cn</language>`,
  });
};
