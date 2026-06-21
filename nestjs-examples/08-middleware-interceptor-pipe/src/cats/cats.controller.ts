/**
 * 猫咪控制器
 *
 * 学习要点：
 * 1. 不同级别的装饰器组合使用
 *    - 类级别：应用到所有路由
 *    - 方法级别：只应用到特定路由
 *    - 参数级别：应用到特定参数
 * 2. 管道在参数级别使用
 * 3. 拦截器在方法级别使用
 *
 * 装饰器执行顺序：
 * 1. 参数管道先执行（验证和转换参数）
 * 2. 方法级拦截器前处理
 * 3. Controller 方法执行
 * 4. 方法级拦截器后处理
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import { ParseUuidPipe } from '../pipes/parse-uuid.pipe';
import { DefaultValuePipe } from '../pipes/default-value.pipe';
import { TrimPipe } from '../pipes/trim.pipe';
import { CacheInterceptor } from '../interceptors/cache.interceptor';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  /**
   * 获取猫咪列表
   * GET /cats?page=1&limit=10
   *
   * 演示：
   * 1. DefaultValuePipe - 为 page 和 limit 设置默认值
   * 2. DefaultValuePipe 的 toNumber 参数将字符串转为数字
   * 3. CacheInterceptor - 缓存 GET 响应
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  findAll(
    // DefaultValuePipe 链式使用：
    // 第一个 DefaultValuePipe(1, true) → 默认值 1，转为数字
    // 第二个 DefaultValuePipe(10, true) → 默认值 10，转为数字
    @Query('page', new DefaultValuePipe(1, true)) page: number,
    @Query('limit', new DefaultValuePipe(10, true)) limit: number,
  ) {
    return this.catsService.findAll(page, limit);
  }

  /**
   * 根据 UUID 获取猫咪
   * GET /cats/:id
   *
   * 演示：
   * ParseUuidPipe - 验证 ID 是否为有效 UUID 格式
   * 如果不是有效 UUID，返回 400 Bad Request
   */
  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.catsService.findOne(id);
  }

  /**
   * 创建猫咪
   * POST /cats
   *
   * 演示：
   * TrimPipe - 自动去除请求体中字符串的前后空格
   * 例如：{ "name": "  Tom  " } → { "name": "Tom" }
   */
  @Post()
  create(
    @Body(new TrimPipe())
    body: { name: string; age: number; breed?: string },
  ) {
    return this.catsService.create(body);
  }
}
