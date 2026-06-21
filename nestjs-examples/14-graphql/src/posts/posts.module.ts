/**
 * 文章模块
 *
 * 导出 PostsService 供 AuthorsModule 使用
 * （AuthorsResolver 需要通过 PostsService 查找作者的文章）
 */
import { Module } from '@nestjs/common';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

@Module({
  providers: [PostsResolver, PostsService],
  exports: [PostsService],
})
export class PostsModule {}
