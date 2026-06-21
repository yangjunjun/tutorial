/**
 * 根模块
 *
 * 关键配置：GraphQLModule.forRoot()
 *
 * GraphQLModule 是 @nestjs/graphql 提供的核心模块，
 * 它负责：
 * 1. 解析所有 @ObjectType、@InputType 等装饰器
 * 2. 自动生成 GraphQL Schema
 * 3. 设置 GraphQL 端点 (/graphql)
 * 4. 启用 GraphQL Playground（开发环境）
 *
 * Code-First 配置：
 * - autoSchemaFile: true 让框架自动从代码生成 Schema
 * - 也可以指定文件路径，如 autoSchemaFile: 'schema.gql'
 *   这样会同时生成一个 .graphql 文件（可用于文档或其他工具）
 */
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PostsModule } from './posts/posts.module';
import { AuthorsModule } from './authors/authors.module';

@Module({
  imports: [
    /**
     * GraphQLModule.forRoot<ApolloDriverConfig>()
     *
     * ApolloDriver 是 GraphQL 引擎的驱动，
     * NestJS 支持多种 GraphQL 引擎：
     * - ApolloDriver（默认，基于 Apollo Server）
     * - MercuriusDriver（基于 Fastify + Mercurius）
     *
     * 配置选项：
     * - autoSchemaFile: 自动生成 schema 文件
     * - sortSchema: 按字母排序 schema 中的类型
     * - playground: 启用 GraphQL Playground（交互 IDE）
     * - introspection: 启用 Schema 自省（Playground 依赖此功能）
     * - debug: 启用调试模式（在错误响应中显示堆栈跟踪）
     */
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code-First 方式：自动从 TypeScript 代码生成 Schema
      autoSchemaFile: true,
      // 排序 Schema 输出，便于阅读
      sortSchema: true,
      // 开发环境启用 Playground
      playground: true,
      // 启用 Schema 自省（Playground 需要）
      introspection: true,
    }),
    PostsModule,
    AuthorsModule,
  ],
})
export class AppModule {}
