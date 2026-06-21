/**
 * 分类控制器
 *
 * 标准的 CRUD 控制器，调用 CategoriesService 处理业务逻辑。
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /categories
   * 获取所有分类（包含商品数量统计）
   */
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * GET /categories/:id
   * 获取单个分类（包含关联商品列表）
   *
   * ParseIntPipe：NestJS 内置管道，将字符串参数转换为整数
   * 如果转换失败，自动返回 400 Bad Request
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  /**
   * POST /categories
   * 创建新分类
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /**
   * DELETE /categories/:id
   * 删除分类
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
