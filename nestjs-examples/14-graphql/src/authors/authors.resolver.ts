/**
 * 作者解析器 (Resolver)
 *
 * @Resolver() 装饰器标记这个类为 GraphQL 解析器。
 * 解析器类似于 REST 中的控制器，但处理的是 GraphQL 操作。
 *
 * 解析器类型：
 * - @Query() - 读取操作（类似 GET）
 * - @Mutation() - 写入操作（类似 POST/PUT/DELETE）
 * - @ResolveField() - 解析关联字段（懒加载关联数据）
 * - @Subscription() - 实时推送（本项目不演示）
 */
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Author } from './models/author.model';
import { AuthorsService } from './authors.service';
import { CreateAuthorInput } from './dto/create-author.input';
import { Post } from '../posts/models/post.model';
import { PostsService } from '../posts/posts.service';

/**
 * @Resolver(() => Author)
 * 告诉 NestJS 这个解析器处理 Author 类型的操作。
 * 参数指定了"默认"的类型，用于 @ResolveField 的上下文。
 */
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  /**
   * @Query(() => [Author])
   * 定义一个查询，返回 Author 数组。
   *
   * - () => [Author] 指定返回类型是 Author 的数组
   * - { name: 'authors' } 指定 GraphQL 查询名称
   * - 如果省略 name，默认使用方法名
   */
  @Query(() => [Author], { name: 'authors', description: '获取所有作者' })
  findAll(): Author[] {
    return this.authorsService.findAll();
  }

  /**
   * @Query(() => Author)
   * 带参数的查询 - 根据 ID 获取作者
   *
   * @Args('id', { type: () => Int })
   * - 'id' 是参数名称
   * - { type: () => Int } 指定 GraphQL 类型
   * - 需要显式指定 Int，因为 TS number 默认映射为 Float
   */
  @Query(() => Author, { name: 'author', description: '根据 ID 获取作者' })
  findOne(@Args('id', { type: () => Int }) id: number): Author {
    return this.authorsService.findOne(id);
  }

  /**
   * @Mutation(() => Author)
   * 定义一个变更操作 - 创建作者
   *
   * Mutation 通常用于创建、更新、删除操作。
   * 参数使用 InputType（而不是 ObjectType）。
   */
  @Mutation(() => Author, { description: '创建新作者' })
  createAuthor(
    @Args('input') input: CreateAuthorInput,
  ): Author {
    return this.authorsService.create(input);
  }

  /**
   * @ResolveField() - 解析关联字段
   *
   * 当 GraphQL 查询请求了 author.posts 字段时，
   * 这个方法会被调用来获取该作者的文章列表。
   *
   * @Parent() 装饰器获取父级对象（即 Author 实例），
   * 然后我们可以根据 author.id 查找相关的 posts。
   *
   * 这是 GraphQL 的"N+1 问题"的典型场景：
   * 如果有 10 个作者，每个作者都要调用一次这个方法。
   * 在生产环境中，应该使用 DataLoader 来优化。
   */
  @ResolveField(() => [Post], { description: '获取作者的所有文章' })
  posts(@Parent() author: Author): Post[] {
    // 根据作者 ID 过滤文章
    return this.postsService.findByAuthorId(author.id);
  }
}
