/**
 * 商品控制器 - HTTP 路由处理
 *
 * 学习点：
 * 1. @UseInterceptors(CacheInterceptor) - NestJS 内置的缓存拦截器
 *    自动缓存 GET 请求的响应（基于 URL 作为缓存键）
 * 2. 简单场景用 CacheInterceptor，复杂场景在 Service 中手动管理缓存
 * 3. @UseInterceptors 可以应用在类级别（所有路由）或方法级别（特定路由）
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products - 商品列表
   *
   * 注意：这里没有使用 CacheInterceptor，而是在 Service 中手动管理缓存
   * 因为我们需要更精细的缓存控制（分页参数、缓存失效等）
   *
   * 如果使用 CacheInterceptor：
   * @UseInterceptors(CacheInterceptor)
   * - 优点：零代码，自动缓存
   * - 缺点：缓存键固定为 URL，无法自定义失效策略
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.productsService.findAll(
      parseInt(page || '1'),
      parseInt(pageSize || '10'),
      sortBy || 'createdAt',
    );
  }

  /**
   * GET /products/hot - 热门商品
   *
   * 热门商品通常展示在首页，查询频率高
   * 使用较长的缓存时间（10分钟）减少数据库压力
   */
  @Get('hot')
  async getHotProducts(@Query('limit') limit?: string) {
    return this.productsService.getHotProducts(parseInt(limit || '10'));
  }

  /**
   * GET /products/search - 商品搜索（游标分页）
   *
   * 查询参数：
   * - query: 搜索关键词（必填）
   * - limit: 每页数量（默认10）
   * - cursor: 游标（首次不传，翻页时传入上次返回的 nextCursor）
   *
   * 使用示例：
   * 首次: GET /products/search?query=Apple&limit=5
   * 翻页: GET /products/search?query=Apple&limit=5&cursor=10
   */
  @Get('search')
  async searchProducts(
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!query) {
      return { message: '请提供搜索关键词', data: [] };
    }
    return this.productsService.searchProducts(
      query,
      parseInt(limit || '10'),
      cursor,
    );
  }

  /**
   * GET /products/:id - 商品详情
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * POST /products - 创建商品
   *
   * 创建商品后会自动失效列表缓存
   * 确保下次查询时能获取到最新数据
   */
  @Post()
  async create(
    @Body() body: {
      name: string;
      price: number;
      stock: number;
      category?: string;
      description?: string;
    },
  ) {
    this.logger.log(`创建商品: ${body.name}`);
    return this.productsService.create(body);
  }

  /**
   * PATCH /products/:id - 更新商品
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      name: string;
      price: number;
      stock: number;
      category: string;
      description: string;
    }>,
  ) {
    this.logger.log(`更新商品: ${id}`);
    return this.productsService.update(id, body);
  }

  /**
   * DELETE /products/:id - 删除商品
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`删除商品: ${id}`);
    return this.productsService.remove(id);
  }
}
