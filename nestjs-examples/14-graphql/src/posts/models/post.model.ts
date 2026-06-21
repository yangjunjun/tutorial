/**
 * Post GraphQL 对象类型
 *
 * 定义文章在 GraphQL Schema 中的类型。
 * 使用 @ObjectType() 和 @Field() 装饰器。
 *
 * 与 REST DTO 的区别：
 * - REST: 使用 class-validator 装饰器做验证
 * - GraphQL: 使用 @Field() 装饰器定义类型，
 *   类型系统本身就是验证（类型不匹配会报错）
 */
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Author } from '../../authors/models/author.model';

@ObjectType({ description: '文章类型 - 表示博客中的一篇文章' })
export class Post {
  @Field(() => Int, { description: '文章唯一 ID' })
  id: number;

  @Field({ description: '文章标题' })
  title: string;

  @Field({ description: '文章内容' })
  content: string;

  /**
   * 作者 ID - 内部使用，不在 GraphQL 中暴露
   * 不加 @Field() 装饰器的属性不会出现在 Schema 中
   */
  authorId: number;

  /**
   * 标签列表
   * @Field(() => [String])
   * 方括号表示数组，即 GraphQL 的 List 类型
   * [String] 表示字符串数组
   */
  @Field(() => [String], { nullable: true, description: '文章标签' })
  tags?: string[];

  /**
   * 作者 - 关联类型
   * @Field(() => Author) 指定关联到 Author 类型
   *
   * 注意：这个字段的实际数据通过
   * PostsResolver 中的 @ResolveField() 来解析
   */
  @Field(() => Author, { nullable: true, description: '文章作者' })
  author?: Author;

  /**
   * 日期字段
   * TypeScript Date -> GraphQL DateTime (标量类型)
   * GraphQL 内置的标量类型：Int, Float, String, Boolean, ID
   * DateTime 是自定义标量，由 graphql-type-json 等包提供
   */
  @Field({ description: '创建时间' })
  createdAt: Date;

  @Field({ description: '更新时间' })
  updatedAt: Date;
}
