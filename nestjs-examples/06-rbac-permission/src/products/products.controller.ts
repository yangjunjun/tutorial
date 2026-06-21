/**
 * 商品控制器
 *
 * 学习要点：
 * 1. 类级别同时使用 JwtAuthGuard 和 RolesGuard
 *    执行顺序：JwtAuthGuard → RolesGuard
 * 2. 不同路由使用不同的 @Roles() 配置
 * 3. 所有权检查在 Service 层实现
 * 4. @Public() 装饰器跳过认证
 * 5. @CurrentUser() 参数装饰器获取当前用户
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
// 类级别的守卫，应用到所有路由
// 注意顺序：先 JWT 认证，再角色检查
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * 获取商品列表（所有登录用户可访问）
   * GET /products
   *
   * 商家只看到自己的商品，管理员看到所有商品，普通用户看到所有商品
   */
  @Get()
  @Roles('USER', 'MERCHANT', 'ADMIN')
  async findAll(@CurrentUser() user) {
    return this.productsService.findAll(user);
  }

  /**
   * 公开商品列表（无需认证）
   * GET /products/public
   */
  @Public()
  @Get('public')
  async findPublic() {
    return this.productsService.findPublicProducts();
  }

  /**
   * 获取单个商品
   * GET /products/:id
   */
  @Get(':id')
  @Roles('USER', 'MERCHANT', 'ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * 创建商品（仅商家和管理员）
   * POST /products
   *
   * @CurrentUser() 自动注入当前登录用户信息
   */
  @Post()
  @Roles('MERCHANT', 'ADMIN')
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  /**
   * 更新商品（商家仅能更新自己的，管理员可以更新所有）
   * PUT /products/:id
   */
  @Put(':id')
  @Roles('MERCHANT', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  /**
   * 删除商品（仅管理员）
   * DELETE /products/:id
   *
   * 演示最严格的权限控制：只有 ADMIN 角色可以执行
   */
  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
