/**
 * 用户控制器（含 Swagger 文档）
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取用户列表
   */
  @Get()
  @ApiOperation({
    summary: '获取用户列表',
    description: '返回所有注册用户的列表',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * 获取单个用户
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据用户 ID 获取用户信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /**
   * 创建用户
   */
  @Post()
  @ApiOperation({
    summary: '注册新用户',
    description: '创建新用户账户',
  })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
