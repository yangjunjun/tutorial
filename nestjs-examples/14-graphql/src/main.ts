/**
 * 应用入口
 *
 * GraphQL 应用的启动与普通 NestJS 应用相同。
 * GraphQL 端点 (/graphql) 由 GraphQLModule 自动注册。
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
  console.log('GraphQL 服务运行在: http://localhost:3000/graphql');
  console.log('GraphQL Playground: http://localhost:3000/graphql');
}

bootstrap();
