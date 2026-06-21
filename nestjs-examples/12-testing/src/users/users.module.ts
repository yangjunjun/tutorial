/**
 * Users 模块
 *
 * 提供用户相关的服务。
 * 在实际项目中可能还会导入 HttpModule 等。
 */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
