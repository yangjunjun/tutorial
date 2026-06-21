/**
 * 根模块（AppModule）
 *
 * 在请求生命周期项目中，AppModule 的职责：
 * 1. 导入功能模块（DogsModule）
 * 2. 配置全局中间件（如果有的话）
 */
import { Module } from '@nestjs/common';
import { DogsModule } from './dogs/dogs.module';

@Module({
  imports: [DogsModule],
})
export class AppModule {}
