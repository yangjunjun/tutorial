/**
 * 文章服务
 *
 * 管理文章的 CRUD 操作。
 * 使用内存存储，预置示例数据。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Injectable()
export class PostsService {
  /** 内存存储 */
  private posts: Post[] = [
    {
      id: 1,
      title: 'NestJS 入门指南',
      content: 'NestJS 是一个用于构建高效、可扩展的服务端应用的渐进式框架...',
      authorId: 1,
      tags: ['NestJS', 'TypeScript', '后端'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      title: 'GraphQL 基础教程',
      content: 'GraphQL 是一种用于 API 的查询语言，它让客户端能够精确获取所需的数据...',
      authorId: 1,
      tags: ['GraphQL', 'API'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 3,
      title: 'TypeScript 高级技巧',
      content: 'TypeScript 提供了许多高级类型系统特性，如泛型、条件类型、映射类型等...',
      authorId: 2,
      tags: ['TypeScript', '编程'],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
  ];

  /** ID 计数器 */
  private idCounter = 4;

  /** 获取所有文章 */
  findAll(): Post[] {
    return this.posts;
  }

  /** 根据 ID 获取文章 */
  findOne(id: number): Post {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundException(`文章 #${id} 不存在`);
    }
    return post;
  }

  /** 根据作者 ID 获取文章列表 */
  findByAuthorId(authorId: number): Post[] {
    return this.posts.filter((p) => p.authorId === authorId);
  }

  /** 创建文章 */
  create(input: CreatePostInput): Post {
    const now = new Date();
    const post: Post = {
      id: this.idCounter++,
      title: input.title,
      content: input.content,
      authorId: input.authorId,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    this.posts.push(post);
    return post;
  }

  /** 更新文章 */
  update(id: number, input: UpdatePostInput): Post {
    const post = this.findOne(id);
    const updatedPost: Post = {
      ...post,
      ...input,
      updatedAt: new Date(),
    };
    // 替换数组中的元素
    const index = this.posts.findIndex((p) => p.id === id);
    this.posts[index] = updatedPost;
    return updatedPost;
  }

  /** 删除文章 */
  remove(id: number): boolean {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`文章 #${id} 不存在`);
    }
    this.posts.splice(index, 1);
    return true;
  }

  /** 分页查询 */
  findPaginated(page: number = 1, limit: number = 10): {
    items: Post[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const total = this.posts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = this.posts.slice(start, start + limit);

    return { items, total, page, totalPages };
  }
}
