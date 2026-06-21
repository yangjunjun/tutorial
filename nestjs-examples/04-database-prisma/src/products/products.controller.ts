/**
 * 商品控制器 - 处理商品相关的 HTTP 请求
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
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * 获取所有商品（支持分页和分类筛选）
   *
   * 查询参数：
   * - page: 页码（默认 1）
   * - pageSize: 每页数量（默认 10）
   * - categoryId: 分类 ID 筛选
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    });
  }

  /**
   * GET /products/:id
   * 获取单个商品（包含分类信息）
   *
   * ParseIntPipe: 将 URL 参数从字符串转为整数
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * POST /products
   * 创建新商品
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * PUT /products/:id
   * 更新商品信息
   */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  /**
   * DELETE /products/:id
   * 删除商品
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
