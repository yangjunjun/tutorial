/**
 * 创建作者的输入类型 (Input Type)
 *
 * @InputType() vs @ObjectType():
 * - @ObjectType() 定义输出类型（Query/Mutation 的返回值）
 * - @InputType() 定义输入类型（Mutation 的参数）
 *
 * 为什么需要分开？
 * GraphQL 规范规定输入和输出必须是不同类型。
 * 例如，输出类型可能包含 id、createdAt 等自动生成的字段，
 * 但输入类型中不应该包含这些字段。
 */
import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: '创建作者所需的输入数据' })
export class CreateAuthorInput {
  @Field({ description: '作者名称' })
  name: string;

  @Field({ description: '作者邮箱' })
  email: string;
}
