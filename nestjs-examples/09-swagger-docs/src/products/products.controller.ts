/**
 * 商品控制器（完整 Swagger 标注）
 *
 * 学习要点：
 * 1. @ApiTags 对接口进行分组
 * 2. @ApiOperation 描述每个接口的功能
 * 3. @ApiResponse 描述成功和失败的响应格式
 * 4. @ApiParam 描述 URL 路径参数
 * 5. @ApiQuery 描述查询参数
 * 6. @ApiBearerAuth 标记需要认证的接口
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('商品管理') // Swagger 分组标签
@ApiBearerAuth()     // 标记此分组下的接口需要 Bearer Token
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * 获取商品列表
   */
  @Get()
  @ApiOperation({
    summary: '获取商品列表',
    description: '支持分页、排序和按分类筛选',
  })
  @ApiResponse({
    status: 200,
    description: '商品列表查询成功',
    type: [ProductEntity],
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: '商品分类筛选',
    enum: ['电子产品', '服装', '食品', '图书', '家居', '其他'],
  })
  findAll(@Query() paginationDto: PaginationDto, @Query('category') category?: string) {
    return this.productsService.findAll(paginationDto, category);
  }

  /**
   * 获取单个商品
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取商品详情',
    description: '根据商品 ID 获取完整的商品信息',
  })
  @ApiParam({
    name: 'id',
    description: '商品 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '商品信息',
    type: ProductEntity,
  })
  @ApiResponse({ status: 404, description: '商品不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * 创建商品
   */
  @Post()
  @ApiOperation({
    summary: '创建商品',
    description: '创建新商品，需要管理员或商家权限',
  })
  @ApiResponse({
    status: 201,
    description: '商品创建成功',
    type: ProductEntity,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * 更新商品
   */
  @Put(':id')
  @ApiOperation({
    summary: '更新商品',
    description: '更新指定商品信息（全量或部分更新）',
  })
  @ApiParam({
    name: 'id',
    description: '商品 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '商品更新成功',
    type: ProductEntity,
  })
  @ApiResponse({ status: 404, description: '商品不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * 删除商品
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除商品',
    description: '删除指定商品（仅管理员可操作）',
  })
  @ApiParam({
    name: 'id',
    description: '商品 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({ status: 200, description: '商品删除成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @ApiResponse({ status: 403, description: '权限不足，仅管理员可操作' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
