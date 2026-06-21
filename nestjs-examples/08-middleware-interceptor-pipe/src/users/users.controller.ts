/**
 * 用户控制器
 *
 * 学习要点：
 * 1. 使用 SerializeInterceptor 隐藏敏感字段
 * 2. UserResponseDto 中 @Exclude() 标记的字段不会出现在响应中
 * 3. 拦截器在 Controller 返回数据后自动执行序列化
 */
import { Controller, Get, Param, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';
import { UserResponseDto } from '../dto/user.dto';

@Controller('users')
// 类级别使用序列化拦截器
// 所有路由的响应都会通过 UserResponseDto 进行序列化
@UseInterceptors(new SerializeInterceptor(UserResponseDto))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取所有用户
   * GET /users
   *
   * 虽然 UsersService.findAll() 返回包含 password 的完整数据
   * 但 SerializeInterceptor 会自动移除 @Exclude() 标记的字段
   */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * 获取单个用户
   * GET /users/:id
   *
   * ParseIntPipe 将 URL 参数转换为数字
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
