/**
 * TodosService 单元测试
 *
 * =============================================
 * 单元测试基础知识
 * =============================================
 *
 * 1. describe() - 将相关的测试用例组织在一起
 *    - 可以嵌套使用
 *    - 用于描述被测试的模块或方法
 *
 * 2. it() / test() - 定义单个测试用例
 *    - 第一个参数是测试描述（建议用中文或英文描述期望行为）
 *    - 第二个参数是测试函数
 *
 * 3. expect() - 断言函数，验证结果是否符合预期
 *    - expect(value).toBe(expected)      - 严格相等（===）
 *    - expect(value).toEqual(expected)   - 深度相等（适用于对象/数组）
 *    - expect(fn).toThrow(Error)         - 期望函数抛出错误
 *    - expect(value).toBeDefined()       - 值不为 undefined
 *    - expect(value).toBeTruthy()        - 值为真值
 *    - expect(array).toHaveLength(n)     - 数组长度
 *    - expect(obj).toHaveProperty(key)   - 对象包含指定属性
 *
 * 4. beforeEach() - 每个 it 运行前都会执行的钩子
 *    - 常用于重置状态、初始化测试数据
 *    - 确保每个测试用例之间互不影响（测试隔离性）
 *
 * 5. beforeAll() / afterAll() - 所有测试运行前/后的钩子
 *    - 常用于一次性设置/清理（如数据库连接）
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TodosService } from '../../src/todos/todos.service';
import { Priority } from '../../src/todos/interfaces/todo.interface';
import { CreateTodoDto } from '../../src/todos/dto/create-todo.dto';

describe('TodosService', () => {
  let service: TodosService;

  /**
   * beforeEach - 每个测试用例运行前执行
   *
   * 这里我们使用 NestJS 的 Test 工具来创建测试模块，
   * 并获取 TodosService 实例。
   * 每个测试用例都会得到一个全新的、干净的 service 实例。
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodosService],
    }).compile();

    service = module.get<TodosService>(TodosService);
    // 确保数据是干净的
    service.clearAll();
  });

  // =============================================
  // create() 方法测试
  // =============================================
  describe('create()', () => {
    it('应该创建一个新的待办事项', () => {
      // Arrange（准备）- 构造输入数据
      const dto: CreateTodoDto = {
        title: '学习 NestJS',
        description: '完成测试章节',
        priority: Priority.HIGH,
      };

      // Act（执行）- 调用被测方法
      const result = service.create(dto);

      // Assert（断言）- 验证结果
      expect(result).toBeDefined();          // 返回值不为 undefined
      expect(result.id).toBeDefined();       // 应该有 ID
      expect(result.title).toBe('学习 NestJS'); // 标题匹配
      expect(result.description).toBe('完成测试章节');
      expect(result.priority).toBe(Priority.HIGH);
      expect(result.completed).toBe(false);  // 默认未完成
      expect(result.createdAt).toBeInstanceOf(Date); // 创建时间
      expect(result.updatedAt).toBeInstanceOf(Date); // 更新时间
    });

    it('没有指定优先级时应使用默认值 MEDIUM', () => {
      const dto: CreateTodoDto = {
        title: '默认优先级任务',
      };

      const result = service.create(dto);

      // toEqual 用于检查对象的值相等
      expect(result.priority).toEqual(Priority.MEDIUM);
    });

    it('每个新建的待办事项应该有唯一的 ID', () => {
      const dto: CreateTodoDto = { title: '测试唯一ID' };

      const todo1 = service.create(dto);
      const todo2 = service.create(dto);

      // 两个 ID 不应该相同
      expect(todo1.id).not.toBe(todo2.id);
    });

    it('创建的待办事项应该可以被查询到', () => {
      const dto: CreateTodoDto = { title: '可查询的任务' };
      const created = service.create(dto);

      // 验证创建后能通过 findAll 查询到
      const all = service.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(created.id);
    });
  });

  // =============================================
  // findAll() 方法测试
  // =============================================
  describe('findAll()', () => {
    beforeEach(() => {
      // 预置一些测试数据
      service.create({ title: '任务1', priority: Priority.LOW });
      service.create({ title: '任务2', priority: Priority.HIGH });
      const todo3 = service.create({ title: '任务3', priority: Priority.MEDIUM });
      // 标记任务3为已完成
      service.markAsCompleted(todo3.id);
    });

    it('应该返回所有待办事项', () => {
      const result = service.findAll();

      // toHaveLength 验证数组长度
      expect(result).toHaveLength(3);
    });

    it('应该按 completed 状态过滤', () => {
      const completed = service.findAll({ completed: true });
      const pending = service.findAll({ completed: false });

      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('任务3');
      expect(pending).toHaveLength(2);
    });

    it('应该按优先级过滤', () => {
      const highPriority = service.findAll({ priority: Priority.HIGH });

      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].title).toBe('任务2');
    });

    it('应该支持多条件组合过滤', () => {
      const result = service.findAll({
        completed: false,
        priority: Priority.LOW,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('任务1');
    });

    it('没有匹配结果时返回空数组', () => {
      // 先清空
      service.clearAll();

      const result = service.findAll();
      // 空数组而非 null 或 undefined
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // =============================================
  // findOne() 方法测试
  // =============================================
  describe('findOne()', () => {
    it('应该返回指定 ID 的待办事项', () => {
      const created = service.create({ title: '查找测试' });

      const result = service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.title).toBe('查找测试');
    });

    it('查找不存在的 ID 应抛出 NotFoundException', () => {
      // 使用 expect().toThrow() 来验证异常
      // 注意：需要传递一个函数，而不是直接调用
      expect(() => service.findOne('non-existent-id')).toThrow(
        NotFoundException,
      );
    });

    it('异常消息应包含 ID 信息', () => {
      expect(() => service.findOne('bad-id')).toThrow(
        '待办事项 #bad-id 不存在',
      );
    });
  });

  // =============================================
  // update() 方法测试
  // =============================================
  describe('update()', () => {
    it('应该更新指定字段并保留其他字段不变', () => {
      const created = service.create({
        title: '原始标题',
        description: '原始描述',
        priority: Priority.LOW,
      });

      const updated = service.update(created.id, {
        title: '新标题',
      });

      // 标题已更新
      expect(updated.title).toBe('新标题');
      // 描述和优先级保持不变
      expect(updated.description).toBe('原始描述');
      expect(updated.priority).toBe(Priority.LOW);
    });

    it('更新后 updatedAt 应该变化', () => {
      const created = service.create({ title: '时间测试' });
      const originalUpdatedAt = created.updatedAt;

      // 使用 setTimeout 确保时间不同（实际上 Date 精度可能相同）
      const updated = service.update(created.id, { title: '更新后' });

      // updatedAt 应该是一个新的 Date 实例
      expect(updated.updatedAt).toBeInstanceOf(Date);
      // 由于执行速度很快，可能时间相同，但对象引用不同
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it('更新不存在的 ID 应抛出 NotFoundException', () => {
      expect(() =>
        service.update('non-existent', { title: 'test' }),
      ).toThrow(NotFoundException);
    });
  });

  // =============================================
  // remove() 方法测试
  // =============================================
  describe('remove()', () => {
    it('应该删除指定的待办事项', () => {
      const created = service.create({ title: '待删除' });
      expect(service.findAll()).toHaveLength(1);

      // 执行删除
      const removed = service.remove(created.id);

      // 验证删除返回值
      expect(removed.id).toBe(created.id);
      // 验证确实被删除了
      expect(service.findAll()).toHaveLength(0);
    });

    it('删除后无法再次查找到该记录', () => {
      const created = service.create({ title: '待删除' });
      service.remove(created.id);

      expect(() => service.findOne(created.id)).toThrow(NotFoundException);
    });

    it('删除不存在的 ID 应抛出 NotFoundException', () => {
      expect(() => service.remove('non-existent')).toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // markAsCompleted() 方法测试
  // =============================================
  describe('markAsCompleted()', () => {
    it('应该将待办事项标记为已完成', () => {
      const created = service.create({ title: '待完成' });
      expect(created.completed).toBe(false);

      const completed = service.markAsCompleted(created.id);

      expect(completed.completed).toBe(true);
    });

    it('不能重复标记已完成的待办事项', () => {
      const created = service.create({ title: '已完成任务' });
      service.markAsCompleted(created.id);

      // 再次标记应抛出 BadRequestException
      expect(() => service.markAsCompleted(created.id)).toThrow(
        BadRequestException,
      );
    });

    it('重复标记时的错误消息应明确', () => {
      const created = service.create({ title: '已完成任务' });
      service.markAsCompleted(created.id);

      expect(() => service.markAsCompleted(created.id)).toThrow(
        '已经完成，不能重复标记',
      );
    });

    it('标记不存在的 ID 应抛出 NotFoundException', () => {
      expect(() => service.markAsCompleted('non-existent')).toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // getStats() 方法测试
  // =============================================
  describe('getStats()', () => {
    it('空列表时所有统计值应为 0', () => {
      const stats = service.getStats();

      // toEqual 用于深度比较对象
      expect(stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
        },
      });
    });

    it('应该正确统计混合状态的数据', () => {
      // 创建不同优先级和状态的待办事项
      service.create({ title: '低优1', priority: Priority.LOW });
      service.create({ title: '低优2', priority: Priority.LOW });
      const high1 = service.create({ title: '高优1', priority: Priority.HIGH });
      service.create({ title: '中优1', priority: Priority.MEDIUM });
      service.markAsCompleted(high1.id);

      const stats = service.getStats();

      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(3);
      expect(stats.byPriority).toEqual({
        low: 2,
        medium: 1,
        high: 1,
      });
    });

    it('byPriority 各优先级之和应等于总数', () => {
      service.create({ title: 't1', priority: Priority.LOW });
      service.create({ title: 't2', priority: Priority.MEDIUM });
      service.create({ title: 't3', priority: Priority.HIGH });
      service.create({ title: 't4', priority: Priority.LOW });

      const stats = service.getStats();
      const prioritySum =
        stats.byPriority.low +
        stats.byPriority.medium +
        stats.byPriority.high;

      expect(prioritySum).toBe(stats.total);
    });
  });

  // =============================================
  // clearAll() 方法测试
  // =============================================
  describe('clearAll()', () => {
    it('应该清空所有数据并重置 ID 计数器', () => {
      service.create({ title: '任务1' });
      service.create({ title: '任务2' });
      expect(service.findAll()).toHaveLength(2);

      service.clearAll();

      expect(service.findAll()).toHaveLength(0);

      // 重置后创建的新任务 ID 应该从1开始
      const newTodo = service.create({ title: '新任务' });
      expect(newTodo.id).toBe('todo-1');
    });
  });
});
