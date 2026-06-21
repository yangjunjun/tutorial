/**
 * 商品控制器（Controller）
 *
 * 控制器负责处理 HTTP 请求，调用服务层处理业务逻辑，然后返回响应。
 *
 * NestJS 路由装饰器：
 * - @Controller('path') → 定义控制器路由前缀
 * - @Get('path')        → 处理 GET 请求
 * - @Post('path')       → 处理 POST 请求
 * - @Put('path')        → 处理 PUT 请求
 * - @Delete('path')     → 处理 DELETE 请求
 * - @Patch('path')      → 处理 PATCH 请求
 *
 * 参数提取装饰器：
 * - @Param('key')  → 提取 URL 路径参数（如 /products/:id 中的 id）
 * - @Query('key')  → 提取 URL 查询参数（如 ?category=books）
 * - @Body()        → 提取请求体（POST/PUT 的 JSON 数据）
 * - @Headers()     → 提取请求头
 *
 * 其他装饰器：
 * - @HttpCode(code) → 自定义 HTTP 响应状态码（POST 默认 201，这里改为 200）
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products') // 路由前缀: /products
export class ProductsController {
  /**
   * 依赖注入：通过构造函数注入 ProductsService
   *
   * private readonly 是 TypeScript 的简写语法：
   * 1. 自动声明属性
   * 2. 自动赋值
   * 3. private 表示外部不可访问
   * 4. readonly 表示不可重新赋值
   *
   * NestJS 的 IoC 容器会自动创建 ProductsService 实例并注入
   */
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * 获取所有商品（支持分类和价格范围筛选）
   *
   * @Query() 装饰器提取 URL 查询参数
   * 例如: GET /products?category=books&minPrice=50&maxPrice=100
   */
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.productsService.findAll({
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  /**
   * GET /products/:id
   * 根据 ID 获取单个商品
   *
   * @Param('id') 提取 URL 路径参数
   * 例如: GET /products/abc-123 中的 "abc-123"
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * POST /products
   * 创建新商品
   *
   * @Body() 提取请求体中的 JSON 数据
   * @HttpCode(201) 明确指定返回 201 Created 状态码
   *
   * ValidationPipe 会自动验证 @Body() 中的数据是否符合 CreateProductDto 的规则
   */
  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * PUT /products/:id
   * 更新商品信息
   *
   * 同时使用 @Param() 和 @Body()：
   * - @Param('id') 提取要更新的商品 ID
   * - @Body() 提取更新的数据
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * DELETE /products/:id
   * 删除商品
   *
   * @HttpCode(204) 返回 204 No Content（无响应体）
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param('id') id: string) {
    this.productsService.remove(id);
  }
}
