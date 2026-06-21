/**
 * 创建文章的输入类型
 *
 * @InputType() 与 @ObjectType() 的区别：
 * - @ObjectType() 用于输出（Query/Mutation 的返回值）
 * - @InputType() 用于输入（Mutation 的参数）
 *
 * GraphQL 规范不允许在输入中使用 ObjectType，
 * 因为 ObjectType 可能包含循环引用（如 Author -> Posts -> Author）。
 */
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType({ description: '创建文章所需的输入数据' })
export class CreatePostInput {
  @Field({ description: '文章标题' })
  title: string;

  @Field({ description: '文章内容' })
  content: string;

  /**
   * 作者 ID
   * 使用 Int 类型，表示文章所属的作者
   */
  @Field(() => Int, { description: '作者 ID' })
  authorId: number;

  /**
   * 标签 - 可选字段
   * nullable: true 表示此字段可以不传
   */
  @Field(() => [String], { nullable: true, description: '文章标签列表' })
  tags?: string[];
}
