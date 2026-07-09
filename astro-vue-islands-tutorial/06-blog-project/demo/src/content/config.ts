import { z, defineCollection } from 'astro:content';

/**
 * 博客文章集合 Schema 定义
 *
 * 定义了每篇文章 frontmatter 中允许的字段及其类型。
 * 使用 astro:content 的 image() 可以引用本地图片并自动优化。
 */
const posts = defineCollection({
  type: 'content', // 使用 'content' 类型以支持 MDX
  schema: ({ image }) =>
    z.object({
      // 文章标题（必填）
      title: z.string(),

      // 发布日期（必填）
      date: z.coerce.date(),

      // 更新日期（可选）— 文章修改后更新此字段
      updatedDate: z.coerce.date().optional(),

      // 作者（必填）
      author: z.string(),

      // 文章描述 / 摘要（必填）— 用于 SEO 和列表展示
      description: z.string(),

      // 标签数组（必填）— 用于文章分类和筛选
      tags: z.array(z.string()),

      // 分类（必填）— 文章所属大类
      category: z.enum(['教程', '深度', '实战', '工具', '随笔']),

      // 草稿标记（可选）— 设为 true 时构建时跳过
      draft: z.boolean().optional().default(false),

      // 封面图片（可选）— 使用 astro:content 的 image() 实现本地图片引用
      cover: image().optional(),
    }),
});

// 导出所有集合
export const collections = { posts };
