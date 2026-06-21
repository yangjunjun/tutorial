/**
 * 文章解析器 (Posts Resolver)
 *
 * 这是 GraphQL 的核心 —— 解析器定义了如何获取和修改数据。
 *
 * 解析器方法分类：
 *
 * 1. @Query() - 查询操作
 *    用于读取数据，不修改任何状态。
 *    类似 REST 的 GET 请求。
 *
 * 2. @Mutation() - 变更操作
 *    用于创建、更新、删除数据。
 *    类似 REST 的 POST/PUT/PATCH/DELETE 请求。
 *
 * 3. @ResolveField() - 字段解析
 *    当 GraphQL 查询请求了关联字段时触发。
 *    用于实现"懒加载"关联数据。
 *
 * 4. @Subscription() - 订阅操作（本项目不演示）
 *    用于实时推送数据给客户端。
 *    基于 WebSocket。
 */
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Post } from './models/post.model';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { Author } from '../authors/models/author.model';
import { AuthorsService } from '../authors/authors.service';
import { PaginatedPosts } from '../common/models/pagination.model';

/**
 * @Resolver(() => Post)
 *
 * 告诉 NestJS 这个解析器处理 Post 类型相关的操作。
 * 参数类型用于 @ResolveField 的上下文推断。
 */
@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly authorsService: AuthorsService,
  ) {}

  // =============================================
  // Query 操作 - 读取数据
  // =============================================

  /**
   * 查询所有文章
   *
   * @Query(() => [Post])
   * - () => [Post] 告诉 GraphQL 返回 Post 数组
   * - { name: 'posts' } 指定查询名称
   *
   * 在 GraphQL Playground 中使用：
   * query { posts { id title content } }
   */
  @Query(() => [Post], { name: 'posts', description: '获取所有文章' })
  findAll(): Post[] {
    return this.postsService.findAll();
  }

  /**
   * 查询单个文章
   *
   * @Args('id', { type: () => Int })
   * - 定义查询参数
   * - type: () => Int 显式指定 GraphQL Int 类型
   *   （因为 TS number 默认映射为 Float）
   *
   * 在 GraphQL Playground 中使用：
   * query { post(id: 1) { title content } }
   */
  @Query(() => Post, { name: 'post', description: '根据 ID 获取文章' })
  findOne(@Args('id', { type: () => Int }) id: number): Post {
    return this.postsService.findOne(id);
  }

  /**
   * 分页查询文章
   *
   * 多个 @Args 参数：
   * - page: 页码（默认1）
   * - limit: 每页数量（默认10）
   *
   * defaultValue 设置默认值，使参数变为可选。
   *
   * 在 GraphQL Playground 中使用：
   * query { paginatedPosts(page: 1, limit: 2) { items { title } total page totalPages } }
   */
  @Query(() => PaginatedPosts, { name: 'paginatedPosts', description: '分页获取文章' })
  findPaginated(
    @Args('page', { type: () => Int, defaultValue: 1, nullable: true }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10, nullable: true }) limit: number,
  ): PaginatedPosts {
    return this.postsService.findPaginated(page, limit);
  }

  // =============================================
  // Mutation 操作 - 修改数据
  // =============================================

  /**
   * 创建文章
   *
   * @Mutation(() => Post)
   * - 定义变更操作，返回 Post 类型
   *
   * @Args('input', { type: () => CreatePostInput })
   * - 使用 InputType 作为参数
   * - 所有创建相关的 Mutation 推荐使用 InputType
   *
   * 在 GraphQL Playground 中使用：
   * mutation {
   *   createPost(input: { title: "新文章", content: "内容", authorId: 1 }) {
   *     id title createdAt
   *   }
   * }
   */
  @Mutation(() => Post, { description: '创建新文章' })
  createPost(
    @Args('input') input: CreatePostInput,
  ): Post {
    return this.postsService.create(input);
  }

  /**
   * 更新文章
   *
   * 多个参数的 Mutation：
   * - id: 要更新的文章 ID
   * - input: 更新数据
   *
   * 在 GraphQL Playground 中使用：
   * mutation {
   *   updatePost(id: 1, input: { title: "更新后的标题" }) {
   *     id title updatedAt
   *   }
   * }
   */
  @Mutation(() => Post, { description: '更新文章' })
  updatePost(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdatePostInput,
  ): Post {
    return this.postsService.update(id, input);
  }

  /**
   * 删除文章
   *
   * 返回 Boolean 类型的 Mutation。
   * 有些删除操作返回删除的对象，有些返回布尔值。
   *
   * 在 GraphQL Playground 中使用：
   * mutation { deletePost(id: 1) }
   */
  @Mutation(() => Boolean, { description: '删除文章' })
  deletePost(@Args('id', { type: () => Int }) id: number): boolean {
    return this.postsService.remove(id);
  }

  // =============================================
  // @ResolveField - 解析关联字段
  // =============================================

  /**
   * 解析文章的作者字段
   *
   * 当 GraphQL 查询中包含 author 字段时：
   * query { posts { title author { name email } } }
   *
   * 这个 @ResolveField 方法会被调用来获取 author 数据。
   *
   * @Parent() post: Post
   * - 获取父级对象（即当前正在解析的 Post 实例）
   * - 通过 post.authorId 查找关联的 Author
   *
   * 懒加载的优势：
   * - 如果查询中没有请求 author 字段，这个方法不会被调用
   * - 避免了不必要的数据库查询
   */
  @ResolveField(() => Author, { description: '获取文章的作者信息' })
  author(@Parent() post: Post): Author {
    return this.authorsService.findOne(post.authorId);
  }
}
