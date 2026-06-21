/**
 * 分页模型
 *
 * GraphQL 中常用的分页模式。
 * 本项目展示简单的偏移量分页（Offset Pagination）。
 *
 * 另一种常见的分页方式是游标分页（Cursor Pagination），
 * 适合无限滚动场景。
 */
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Post } from '../../posts/models/post.model';

@ObjectType({ description: '分页文章列表' })
export class PaginatedPosts {
  /**
   * 当前页的文章列表
   * @Field(() => [Post]) 表示 Post 类型的数组
   */
  @Field(() => [Post], { description: '当前页的文章列表' })
  items: Post[];

  @Field(() => Int, { description: '文章总数' })
  total: number;

  @Field(() => Int, { description: '当前页码' })
  page: number;

  @Field(() => Int, { description: '总页数' })
  totalPages: number;
}
