/**
 * 应用控制器
 *
 * 【控制器职责】
 * Controller 负责：
 * 1. 处理 HTTP 请求
 * 2. 参数解析和验证
 * 3. 调用 Service 处理业务逻辑
 * 4. 返回 HTTP 响应
 *
 * 【RESTful API 设计】
 * 本控制器遵循 RESTful 规范：
 * - GET /           → API 信息
 * - GET /api/v1/items    → 获取所有数据项
 * - POST /api/v1/items   → 创建新数据项
 *
 * 【版本化路由】
 * 使用 /api/v1/ 前缀实现 API 版本管理。
 * 在生产环境中，推荐使用 URI 版本化（@Version()装饰器）：
 * ```typescript
 * @Controller('items')
 * export class ItemsController {
 *   @Get()
 *   @Version('1')
 *   findAll() { ... }
 * }
 * ```
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AppService, CreateItemDto } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  /**
   * 根路径 - 返回 API 基本信息
   *
   * 通常用于：
   * 1. 健康检查的简单替代
   * 2. API 文档入口
   * 3. 服务发现探针
   */
  @Get()
  getApiInfo() {
    return this.appService.getApiInfo();
  }

  /**
   * 获取所有数据项
   *
   * GET /api/v1/items
   *
   * 【查询参数扩展（生产环境）】
   * ```typescript
   * @Get()
   * findAll(
   *   @Query('page', DefaultValuePipe(1), ParseIntPipe) page: number,
   *   @Query('limit', DefaultValuePipe(10), ParseIntPipe) limit: number,
   *   @Query('sort') sort?: string,
   * ) { ... }
   * ```
   */
  @Get('api/v1/items')
  findAll() {
    this.logger.log('获取所有数据项');
    return {
      data: this.appService.findAll(),
      meta: {
        total: this.appService.findAll().length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 获取单个数据项
   *
   * GET /api/v1/items/:id
   *
   * 【ParseIntPipe 说明】
   * 自动将字符串类型的 URL 参数转换为整数。
   * 如果转换失败（如传入 "abc"），会自动返回 400 Bad Request。
   * 这是 NestJS 内置的请求验证机制。
   */
  @Get('api/v1/items/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`获取数据项 #${id}`);
    return {
      data: this.appService.findOne(id),
    };
  }

  /**
   * 创建新数据项
   *
   * POST /api/v1/items
   *
   * 【HttpCode 装饰器】
   * POST 请求默认返回 201 Created。
   * 这里显式指定，使代码意图更清晰。
   *
   * 【@Body 装饰器】
   * 自动解析请求体为 JavaScript 对象。
   * 配合 ValidationPipe 可以实现自动的 DTO 验证。
   */
  @Post('api/v1/items')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto) {
    this.logger.log(`创建新数据项: ${createItemDto.name}`);
    return {
      data: this.appService.create(createItemDto),
      message: '数据项创建成功',
    };
  }
}
