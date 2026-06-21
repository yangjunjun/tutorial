/**
 * Todos 服务
 *
 * 包含所有待办事项的业务逻辑。
 * 使用内存存储（不使用数据库），这样可以专注于测试逻辑。
 *
 * 测试要点：
 * - 每个 public 方法都应该有对应的测试
 * - 测试正常路径（Happy Path）和异常路径（Edge Cases）
 * - 测试业务规则（如：不能重复完成、不能删除不存在的记录）
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  Todo,
  TodoStats,
  TodoFilter,
  Priority,
} from './interfaces/todo.interface';

@Injectable()
export class TodosService {
  /** 内存存储 - 使用 Map 提高按 ID 查找的效率 */
  private todos: Map<string, Todo> = new Map();

  /** ID 计数器 */
  private idCounter = 1;

  /**
   * 生成唯一 ID
   * 使用自增计数器，简单可靠
   */
  private generateId(): string {
    return `todo-${this.idCounter++}`;
  }

  /**
   * 创建新的待办事项
   *
   * @param createTodoDto - 创建待办事项的数据传输对象
   * @returns 创建后的待办事项（包含 id、时间戳等）
   */
  create(createTodoDto: CreateTodoDto): Todo {
    const now = new Date();
    const todo: Todo = {
      id: this.generateId(),
      title: createTodoDto.title,
      description: createTodoDto.description,
      priority: createTodoDto.priority || Priority.MEDIUM,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.set(todo.id, todo);
    return todo;
  }

  /**
   * 获取所有待办事项（支持过滤）
   *
   * @param filter - 可选的过滤条件
   * @returns 符合条件的待办事项数组
   *
   * 测试要点：
   * - 无过滤条件时返回所有记录
   * - 按 completed 过滤
   * - 按 priority 过滤
   * - 多条件组合过滤
   */
  findAll(filter?: TodoFilter): Todo[] {
    let results = Array.from(this.todos.values());

    if (filter) {
      // 按完成状态过滤
      if (filter.completed !== undefined) {
        results = results.filter((todo) => todo.completed === filter.completed);
      }

      // 按优先级过滤
      if (filter.priority !== undefined) {
        results = results.filter((todo) => todo.priority === filter.priority);
      }
    }

    return results;
  }

  /**
   * 根据 ID 获取单个待办事项
   *
   * @param id - 待办事项 ID
   * @returns 待办事项
   * @throws NotFoundException 当 ID 不存在时
   *
   * 测试要点：
   * - 存在的 ID 返回正确数据
   * - 不存在的 ID 抛出 NotFoundException
   */
  findOne(id: string): Todo {
    const todo = this.todos.get(id);
    if (!todo) {
      throw new NotFoundException(`待办事项 #${id} 不存在`);
    }
    return todo;
  }

  /**
   * 更新待办事项
   *
   * @param id - 待办事项 ID
   * @param updateTodoDto - 更新数据
   * @returns 更新后的待办事项
   * @throws NotFoundException 当 ID 不存在时
   *
   * 测试要点：
   * - 只更新提供的字段，未提供的字段保持不变
   * - updatedAt 时间戳自动更新
   * - 不存在的 ID 抛出异常
   */
  update(id: string, updateTodoDto: UpdateTodoDto): Todo {
    const todo = this.findOne(id); // 如果不存在会抛出 NotFoundException

    const updated: Todo = {
      ...todo,
      ...updateTodoDto,
      updatedAt: new Date(),
    };

    this.todos.set(id, updated);
    return updated;
  }

  /**
   * 删除待办事项
   *
   * @param id - 待办事项 ID
   * @returns 被删除的待办事项
   * @throws NotFoundException 当 ID 不存在时
   *
   * 测试要点：
   * - 删除存在的记录后，再次查找应抛出异常
   * - 删除不存在的记录直接抛出异常
   * - 删除后总数减1
   */
  remove(id: string): Todo {
    const todo = this.findOne(id); // 如果不存在会抛出 NotFoundException
    this.todos.delete(id);
    return todo;
  }

  /**
   * 标记待办事项为已完成
   *
   * @param id - 待办事项 ID
   * @returns 更新后的待办事项
   * @throws NotFoundException 当 ID 不存在时
   * @throws BadRequestException 当待办事项已经完成时
   *
   * 业务规则：
   * - 已经完成的待办事项不能再次标记为完成
   *
   * 测试要点：
   * - 正常标记为完成
   * - 重复标记抛出 BadRequestException
   * - 不存在的 ID 抛出 NotFoundException
   */
  markAsCompleted(id: string): Todo {
    const todo = this.findOne(id);

    // 业务规则：不能重复完成
    if (todo.completed) {
      throw new BadRequestException(
        `待办事项 #${id} 已经完成，不能重复标记`,
      );
    }

    const updated: Todo = {
      ...todo,
      completed: true,
      updatedAt: new Date(),
    };

    this.todos.set(id, updated);
    return updated;
  }

  /**
   * 获取统计信息
   *
   * @returns 包含总数、完成数、待处理数、按优先级统计的对象
   *
   * 测试要点：
   * - 空列表时所有统计为0
   * - 混合状态下的正确统计
   * - byPriority 中各优先级计数正确
   */
  getStats(): TodoStats {
    const allTodos = Array.from(this.todos.values());

    const total = allTodos.length;
    const completed = allTodos.filter((t) => t.completed).length;
    const pending = total - completed;

    const byPriority = {
      low: allTodos.filter((t) => t.priority === Priority.LOW).length,
      medium: allTodos.filter((t) => t.priority === Priority.MEDIUM).length,
      high: allTodos.filter((t) => t.priority === Priority.HIGH).length,
    };

    return { total, completed, pending, byPriority };
  }

  /**
   * 清空所有数据（仅用于测试）
   *
   * 在测试的 beforeEach 中调用，确保每个测试用例的初始状态一致。
   */
  clearAll(): void {
    this.todos.clear();
    this.idCounter = 1;
  }
}
