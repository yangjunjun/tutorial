/**
 * 狗狗控制器 - 请求生命周期完整演示
 *
 * 本控制器展示了装饰器在不同层级的应用方式：
 *
 * 1. 控制器级别（@UseGuards, @UseInterceptors）
 *    → 对该控制器下所有路由生效
 *
 * 2. 方法级别（@UseGuards, @UseInterceptors, @UsePipes）
 *    → 只对当前路由生效
 *
 * 装饰器应用顺序（从外到内）：
 * 全局 → 控制器级 → 方法级
 *
 * 每个请求的完整执行顺序：
 * [中间件] → [守卫] → [拦截器前置] → [管道] → [控制器] → [拦截器后置]
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DogsService } from './dogs.service';
import { CreateDogDto } from './dto/create-dog.dto';
import { RolesGuard } from '../guards/role.guard';
import { ParsePositiveIntPipe } from '../pipes/parse-positive-int.pipe';
import { ValidationDetailPipe } from '../pipes/validation-detail.pipe';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { TimeoutInterceptor } from '../interceptors/timeout.interceptor';
import { Roles } from '../decorators/roles.decorator';

@Controller('dogs')
// 控制器级别的守卫 —— 所有路由都需要角色守卫
// RolesGuard 会检查方法上的 @Roles() 元数据
// 如果没有 @Roles()，则直接放行
@UseGuards(RolesGuard)
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  /**
   * GET /dogs
   * 获取所有狗狗
   *
   * 请求生命周期（按顺序执行）：
   * 1. [Middleware] LoggingMiddleware - 记录请求日志
   * 2. [Middleware] authMiddleware - 验证 API Key
   * 3. [Guard] RolesGuard - 检查角色（无 @Roles，直接放行）
   * 4. [Interceptor] LoggingInterceptor - 记录请求/响应
   * 5. [Interceptor] TransformInterceptor - 转换响应格式
   * 6. [Interceptor] TimeoutInterceptor - 超时控制
   * 7. [Controller] 执行业务逻辑
   * 8. [Interceptor] 后置处理（日志、格式转换）
   */
  @Get()
  @UseInterceptors(LoggingInterceptor, TransformInterceptor, TimeoutInterceptor)
  findAll() {
    console.log('[Controller] GET /dogs - 执行查询');
    return this.dogsService.findAll();
  }

  /**
   * GET /dogs/:id
   * 根据 ID 获取单个狗狗
   *
   * 请求生命周期：
   * 1. [Middleware] → 2. [Guard] → 3. [Interceptor]
   * 4. [Pipe] ParsePositiveIntPipe - 将字符串 ID 转换为正整数
   * 5. [Controller] 执行业务逻辑
   *
   * 管道验证示例：
   * - GET /dogs/1    → 正常
   * - GET /dogs/-1   → BadRequestException
   * - GET /dogs/abc  → BadRequestException
   */
  @Get(':id')
  @UseInterceptors(LoggingInterceptor, TransformInterceptor)
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    console.log(`[Controller] GET /dogs/${id} - 执行查询`);
    return this.dogsService.findOne(id);
  }

  /**
   * POST /dogs
   * 创建新狗狗
   *
   * 请求生命周期：
   * 1. [Middleware] → 2. [Guard] → 3. [Interceptor]
   * 4. [Pipe] ValidationDetailPipe - 验证 DTO 数据
   * 5. [Controller] 执行业务逻辑
   *
   * 验证示例：
   * - {"name":"旺财","age":3}       → 正常
   * - {"age":-1}                    → 验证失败
   * - {"name":"","age":3}           → 验证失败
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(LoggingInterceptor, TransformInterceptor)
  create(@Body(ValidationDetailPipe) createDogDto: CreateDogDto) {
    console.log('[Controller] POST /dogs - 创建狗狗');
    return this.dogsService.create(createDogDto);
  }

  /**
   * DELETE /dogs/:id
   * 删除狗狗（需要 admin 角色）
   *
   * 请求生命周期：
   * 1. [Middleware] → 2. [Guard] RolesGuard 检查 @Roles('admin')
   *    - 需要 x-user-role: admin 请求头
   *    - 缺少角色 → ForbiddenException (403)
   * 3. [Interceptor] → 4. [Pipe] → 5. [Controller]
   *
   * 测试场景：
   * - 无 x-user-role 头 → 403 Forbidden
   * - x-user-role: user → 403 Forbidden
   * - x-user-role: admin → 204 No Content
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin') // 设置角色元数据，RolesGuard 会读取
  @UseInterceptors(LoggingInterceptor)
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    console.log(`[Controller] DELETE /dogs/${id} - 删除狗狗`);
    this.dogsService.remove(id);
  }
}
