/**
 * TodosController 集成测试
 *
 * =============================================
 * 集成测试 vs 单元测试
 * =============================================
 *
 * 单元测试：隔离测试单个类/方法，用 Mock 替换依赖
 * 集成测试：测试多个组件一起工作是否正确
 *
 * 集成测试关注：
 * - 依赖注入是否正确配置
 * - Controller 是否正确调用了 Service
 * - Module 是否正确组装
 *
 * 使用 @nestjs/testing 的 Test.createTestingModule：
 * - 可以创建一个真实的 NestJS 测试模块
 * - 可以使用真实的 Service 或 Mock 的 Service
 * - 验证组件之间的协作是否正确
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from '../../src/todos/todos.controller';
import { TodosService } from '../../src/todos/todos.service';
import { Priority } from '../../src/todos/interfaces/todo.interface';

describe('TodosController（集成测试）', () => {
  let controller: TodosController;
  let service: TodosService;

  /**
   * 使用真实的 TodosService 创建测试模块
   *
   * 这里我们选择使用真实的 Service（而不是 Mock），
   * 这样可以验证 Controller 和 Service 之间的集成是否正确。
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [TodosService],
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService);

    // 重置服务状态
    service.clearAll();
  });

  // =============================================
  // 测试 Controller 正确调用了 Service
  // =============================================
  describe('create()', () => {
    it('应该调用 service.create() 并返回创建的待办事项', () => {
      const dto = {
        title: '集成测试任务',
        description: '测试 Controller 到 Service 的调用链',
        priority: Priority.HIGH,
      };

      const result = controller.create(dto);

      // 验证返回结果包含正确的数据
      expect(result).toBeDefined();
      expect(result.title).toBe('集成测试任务');
      expect(result.id).toBeDefined();
    });
  });

  describe('findAll()', () => {
    it('应该返回所有待办事项', () => {
      // 先创建一些数据
      service.create({ title: '任务A', priority: Priority.LOW });
      service.create({ title: '任务B', priority: Priority.HIGH });

      const result = controller.findAll();

      expect(result).toHaveLength(2);
    });

    it('应该支持按完成状态过滤', () => {
      const todo = service.create({ title: '完成任务' });
      service.create({ title: '未完成任务' });
      service.markAsCompleted(todo.id);

      // 模拟查询参数 completed=true
      const completed = controller.findAll('true', undefined);
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('完成任务');
    });

    it('应该支持按优先级过滤', () => {
      service.create({ title: '高优', priority: Priority.HIGH });
      service.create({ title: '低优', priority: Priority.LOW });

      const highPriority = controller.findAll(undefined, 'HIGH');
      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].title).toBe('高优');
    });
  });

  describe('findOne()', () => {
    it('应该返回指定 ID 的待办事项', () => {
      const created = service.create({ title: '查找测试' });

      const result = controller.findOne(created.id);

      expect(result.id).toBe(created.id);
      expect(result.title).toBe('查找测试');
    });
  });

  describe('update()', () => {
    it('应该更新待办事项', () => {
      const created = service.create({ title: '原始标题' });

      const updated = controller.update(created.id, { title: '新标题' });

      expect(updated.title).toBe('新标题');
    });
  });

  describe('markAsCompleted()', () => {
    it('应该标记待办事项为已完成', () => {
      const created = service.create({ title: '待完成' });

      const result = controller.markAsCompleted(created.id);

      expect(result.completed).toBe(true);
    });
  });

  describe('remove()', () => {
    it('应该删除待办事项', () => {
      const created = service.create({ title: '待删除' });

      const removed = controller.remove(created.id);

      expect(removed.id).toBe(created.id);
      expect(service.findAll()).toHaveLength(0);
    });
  });

  describe('getStats()', () => {
    it('应该返回统计信息', () => {
      service.create({ title: 't1', priority: Priority.LOW });
      service.create({ title: 't2', priority: Priority.HIGH });

      const stats = controller.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.byPriority.high).toBe(1);
    });
  });

  // =============================================
  // 使用 Mock Service 的集成测试
  // =============================================
  describe('使用 Mock Service 测试', () => {
    let mockController: TodosController;

    /**
     * 有时我们想隔离测试 Controller，用 Mock 的 Service。
     * 这允许我们专注于 Controller 的逻辑（虽然通常很薄）。
     */
    beforeEach(async () => {
      // 创建 Mock 的 Service
      const mockTodosService = {
        create: jest.fn().mockReturnValue({
          id: 'mock-id',
          title: 'Mock 任务',
          completed: false,
        }),
        findAll: jest.fn().mockReturnValue([
          { id: '1', title: 'Mock 任务1' },
          { id: '2', title: 'Mock 任务2' },
        ]),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        markAsCompleted: jest.fn(),
        getStats: jest.fn().mockReturnValue({
          total: 2, completed: 0, pending: 2,
          byPriority: { low: 1, medium: 1, high: 0 },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [TodosController],
        providers: [
          {
            // 用 Mock 替换真实的 TodosService
            provide: TodosService,
            useValue: mockTodosService,
          },
        ],
      }).compile();

      mockController = module.get<TodosController>(TodosController);
    });

    it('create() 应该调用 mock service 的 create 方法', () => {
      const result = mockController.create({ title: 'test' });

      expect(result.id).toBe('mock-id');
      expect(result.title).toBe('Mock 任务');
    });

    it('findAll() 应该返回 mock 数据', () => {
      const result = mockController.findAll();

      expect(result).toHaveLength(2);
    });

    it('getStats() 应该返回 mock 统计数据', () => {
      const stats = mockController.getStats();

      expect(stats.total).toBe(2);
    });
  });
});
