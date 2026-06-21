/**
 * 完整工作流 E2E 测试
 *
 * 模拟一个真实用户的使用场景：
 * 1. 创建多个不同优先级的待办事项
 * 2. 完成部分任务
 * 3. 查看统计信息
 * 4. 按条件过滤
 * 5. 清理数据
 *
 * 这种测试被称为"场景测试"或"用户旅程测试"，
 * 它验证的是完整的业务流程，而不仅仅是单个 API 端点。
 *
 * 测试组织建议：
 * - 使用 it.only 可以单独运行某个测试
 * - 使用 it.skip 可以跳过某个测试
 * - 工作流测试中的步骤是有顺序依赖的
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('用户工作流 E2E 测试', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 场景：一个忙碌的开发者规划一周的工作
   *
   * 这个测试按照用户实际使用的顺序来组织：
   * - 早上规划任务（创建多个待办事项）
   * - 逐步完成任务
   * - 查看进度统计
   * - 按优先级查看紧急任务
   */
  describe('场景：规划一周工作', () => {
    // 存储创建的待办事项 ID，供后续步骤使用
    const createdTodoIds: string[] = [];

    it('步骤1: 创建多个不同优先级的待办事项', async () => {
      const todos = [
        { title: '修复登录 Bug', priority: 'HIGH', description: '用户反馈无法登录' },
        { title: '编写单元测试', priority: 'MEDIUM', description: '为核心模块添加测试' },
        { title: '更新文档', priority: 'LOW', description: 'README 和 API 文档' },
        { title: '代码审查', priority: 'HIGH', description: '审查团队成员的 PR' },
        { title: '整理桌面', priority: 'LOW' },
      ];

      for (const todo of todos) {
        const response = await request(app.getHttpServer())
          .post('/api/todos')
          .send(todo)
          .expect(201);

        createdTodoIds.push(response.body.id);
        expect(response.body.title).toBe(todo.title);
        expect(response.body.priority).toBe(todo.priority);
      }

      // 验证所有任务都已创建
      expect(createdTodoIds).toHaveLength(5);
    });

    it('步骤2: 获取所有待办事项，确认数量', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(5);
    });

    it('步骤3: 完成部分任务', async () => {
      // 完成前两个任务：修复 Bug 和编写测试
      for (let i = 0; i < 2; i++) {
        const response = await request(app.getHttpServer())
          .patch(`/api/todos/${createdTodoIds[i]}/complete`)
          .expect(200);

        expect(response.body.completed).toBe(true);
        expect(response.body.title).toBeDefined();
      }
    });

    it('步骤4: 查看统计信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos/stats')
        .expect(200);

      // 至少有5个任务
      expect(response.body.total).toBeGreaterThanOrEqual(5);
      // 至少完成了2个
      expect(response.body.completed).toBeGreaterThanOrEqual(2);
      // 待处理数 = 总数 - 完成数
      expect(response.body.pending).toBe(
        response.body.total - response.body.completed,
      );
    });

    it('步骤5: 按优先级过滤 - 查看高优先级任务', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos?priority=HIGH')
        .expect(200);

      // 所有返回的任务都应该是高优先级
      response.body.forEach((todo: any) => {
        expect(todo.priority).toBe('HIGH');
      });
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('步骤6: 按完成状态过滤 - 查看已完成的任务', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos?completed=true')
        .expect(200);

      response.body.forEach((todo: any) => {
        expect(todo.completed).toBe(true);
      });
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('步骤7: 按完成状态过滤 - 查看未完成的任务', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos?completed=false')
        .expect(200);

      response.body.forEach((todo: any) => {
        expect(todo.completed).toBe(false);
      });
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('步骤8: 更新一个待办事项的描述', async () => {
      const updateId = createdTodoIds[2]; // 更新"更新文档"任务
      const response = await request(app.getHttpServer())
        .patch(`/api/todos/${updateId}`)
        .send({
          description: '更新 README、API 文档和部署指南',
        })
        .expect(200);

      expect(response.body.description).toBe(
        '更新 README、API 文档和部署指南',
      );
      // 标题应该保持不变
      expect(response.body.title).toBe('更新文档');
    });

    it('步骤9: 删除低优先级的任务（清理）', async () => {
      // 删除"整理桌面"（最后一个创建的任务）
      const deleteId = createdTodoIds[4];

      await request(app.getHttpServer())
        .delete(`/api/todos/${deleteId}`)
        .expect(200);

      // 确认已删除
      await request(app.getHttpServer())
        .get(`/api/todos/${deleteId}`)
        .expect(404);
    });

    it('步骤10: 最终验证 - 查看剩余任务统计', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos/stats')
        .expect(200);

      // 原始5个任务，删除了1个，应该还剩至少4个
      expect(response.body.total).toBeGreaterThanOrEqual(4);
      // 验证统计数据一致性
      expect(
        response.body.byPriority.low +
        response.body.byPriority.medium +
        response.body.byPriority.high,
      ).toBe(response.body.total);
    });
  });
});
