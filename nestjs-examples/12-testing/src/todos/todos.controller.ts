/**
 * Todos 控制器
 *
 * 处理 HTTP 请求并委托给 TodosService。
 * 控制器应该尽量薄，业务逻辑放在服务层。
 *
 * 测试要点：
 * - 控制器正确调用了服务的对应方法
 * - HTTP 状态码正确
 * - 请求参数正确传递
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Priority } from './interfaces/todo.interface';

@Controller('todos')
export class TodosController {
  /**
   * 通过构造函数注入 TodosService
   * NestJS 的依赖注入系统会自动提供 TodosService 实例
   */
  constructor(private readonly todosService: TodosService) {}

  /**
   * POST /todos - 创建新的待办事项
   * @HttpCode(201) 显式设置成功状态码为 201 Created
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  /**
   * GET /todos - 获取所有待办事项（支持过滤）
   *
   * @Query 装饰器从查询字符串中提取参数
   * 例如: GET /todos?completed=true&priority=HIGH
   */
  @Get()
  findAll(
    @Query('completed') completed?: string,
    @Query('priority') priority?: string,
  ) {
    const filter: any = {};
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    if (priority) {
      filter.priority = priority as Priority;
    }
    return this.todosService.findAll(
      Object.keys(filter).length > 0 ? filter : undefined,
    );
  }

  /**
   * GET /todos/stats - 获取统计信息
   * 注意：此路由需要放在 :id 路由之前，否则 "stats" 会被当作 id 参数
   */
  @Get('stats')
  getStats() {
    return this.todosService.getStats();
  }

  /**
   * GET /todos/:id - 获取单个待办事项
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  /**
   * PATCH /todos/:id - 更新待办事项
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(id, updateTodoDto);
  }

  /**
   * PATCH /todos/:id/complete - 标记为完成
   */
  @Patch(':id/complete')
  markAsCompleted(@Param('id') id: string) {
    return this.todosService.markAsCompleted(id);
  }

  /**
   * DELETE /todos/:id - 删除待办事项
   * @HttpCode(200) 设置删除成功返回 200 而不是默认的 204
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
