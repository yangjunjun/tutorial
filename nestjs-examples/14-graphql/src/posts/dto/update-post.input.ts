/**
 * 更新文章的输入类型
 *
 * 所有字段都是可选的（nullable: true），
 * 只更新提供的字段。
 */
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType({ description: '更新文章所需的输入数据' })
export class UpdatePostInput {
  @Field({ nullable: true, description: '文章标题' })
  title?: string;

  @Field({ nullable: true, description: '文章内容' })
  content?: string;

  @Field(() => [String], { nullable: true, description: '文章标签列表' })
  tags?: string[];
}
