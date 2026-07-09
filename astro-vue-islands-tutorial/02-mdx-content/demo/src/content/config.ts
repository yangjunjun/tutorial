import { defineCollection, z } from 'astro:content';

// 文章集合 —— 博客文章 schema
const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().optional().default(false),
  }),
});

// 文档集合 —— 技术文档 schema
const docs = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number(),
  }),
});

// 导出所有集合
export const collections = {
  articles,
  docs,
};
