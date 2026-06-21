/**
 * Author GraphQL 对象类型
 *
 * @ObjectType() 装饰器将这个类标记为 GraphQL 类型。
 * NestJS 会根据类属性和 @Field() 装饰器自动生成 GraphQL Schema。
 *
 * 在 Code-First 方式中：
 * - TypeScript 类 = GraphQL Type
 * - 类属性 + @Field() = GraphQL 字段
 * - 类的继承关系可以映射为 GraphQL 类型继承
 */
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: '作者类型 - 表示博客的作者' })
export class Author {
  /**
   * @Field(() => Int)
   * 显式指定 GraphQL 类型。
   * TypeScript 的 number 默认映射为 Float，
   * 所以整数需要用 () => Int 显式指定。
   */
  @Field(() => Int, { description: '作者唯一 ID' })
  id: number;

  /**
   * @Field() 不传参数时，自动推断类型
   * TypeScript string -> GraphQL String
   */
  @Field({ description: '作者名称' })
  name: string;

  @Field({ description: '作者邮箱' })
  email: string;

  /**
   * 关联字段 - 作者的文章列表
   * 注意：这里不使用 @Field() 装饰器，
   * 而是在 Resolver 中通过 @ResolveField() 来解析。
   * 这样可以实现懒加载，只有在查询中明确请求时才加载关联数据。
   *
   * 为了类型安全，我们在这里声明属性但不加装饰器。
   */
  posts?: any[];
}
