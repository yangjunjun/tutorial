/**
 * Todos 端到端测试 (E2E)
 *
 * =============================================
 * E2E 测试基础知识
 * =============================================
 *
 * E2E 测试模拟真实的 HTTP 请求/响应周期：
 * - 启动完整的 NestJS 应用
 * - 使用 supertest 发送 HTTP 请求
 * - 验证 HTTP 响应（状态码、响应体、Headers）
 *
 * E2E 测试组织原则：
 * 1. beforeAll() - 一次性启动应用
 * 2. afterAll()  - 关闭应用
 * 3. 测试按照逻辑流程组织（CRUD 顺序）
 * 4. 使用有意义的描述
 *
 * supertest 常用方法：
 * - .get('/path')     - GET 请求
 * - .post('/path')    - POST 请求
 * - .patch('/path')   - PATCH 请求
 * - .delete('/path')  - DELETE 请求
 * - .send(body)       - 发送请求体
 * - .expect(status)   - 验证状态码
 * - .expect(header)   - 验证响应头
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Todos E2E 测试', () => {
  let app: INestApplication;

  /**
   * beforeAll - 在所有测试之前启动应用
   *
   * 注意：
   * - 使用 beforeAll 而非 beforeEach，因为启动应用耗时较长
   * - 应用在所有测试之间共享
   * - 每个测试可能会修改数据，需要注意测试顺序
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 应用全局管道（和 main.ts 中一样的配置）
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

  /**
   * afterAll - 在所有测试之后关闭应用
   * 释放端口、清理资源
   */
  afterAll(async () => {
    await app.close();
  });

  // =============================================
  // POST /api/todos - 创建待办事项
  // =============================================
  describe('POST /api/todos', () => {
    it('应该成功创建待办事项 (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/todos')
        .send({
          title: 'E2E 测试任务',
          description: '端到端测试创建',
          priority: 'HIGH',
        })
        .expect(201); // 期望 HTTP 状态码 201

      // 验证响应体
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('E2E 测试任务');
      expect(response.body.priority).toBe('HIGH');
      expect(response.body.completed).toBe(false);
    });

    it('标题为空时应返回 400 错误', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/todos')
        .send({ title: '' }) // 空标题违反 @MinLength(1)
        .expect(400);

      // 验证错误响应包含验证消息
      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('缺少标题时应返回 400 错误', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .send({ description: '没有标题' }) // 缺少必填的 title
        .expect(400);
    });

    it('无效的优先级枚举值应返回 400 错误', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .send({
          title: '无效优先级',
          priority: 'INVALID', // 不在枚举中
        })
        .expect(400);
    });

    it('包含未定义属性时应返回 400 错误 (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .send({
          title: '额外属性',
          unknownField: 'should be stripped',
        })
        .expect(400); // forbidNonWhitelisted 会拒绝额外属性
    });
  });

  // =============================================
  // GET /api/todos - 获取待办事项列表
  // =============================================
  describe('GET /api/todos', () => {
    it('应该返回待办事项列表 (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // =============================================
  // GET /api/todos/:id - 获取单个待办事项
  // =============================================
  describe('GET /api/todos/:id', () => {
    it('不存在的 ID 应返回 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos/non-existent-id')
        .expect(404);

      expect(response.body.message).toContain('不存在');
    });
  });

  // =============================================
  // PATCH /api/todos/:id/complete - 标记完成
  // =============================================
  describe('PATCH /api/todos/:id/complete', () => {
    it('不存在的 ID 应返回 404', async () => {
      await request(app.getHttpServer())
        .patch('/api/todos/non-existent/complete')
        .expect(404);
    });
  });

  // =============================================
  // DELETE /api/todos/:id - 删除待办事项
  // =============================================
  describe('DELETE /api/todos/:id', () => {
    it('不存在的 ID 应返回 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/todos/non-existent-id')
        .expect(404);
    });
  });

  // =============================================
  // 完整 CRUD 工作流测试
  // =============================================
  describe('完整 CRUD 工作流', () => {
    let todoId: string;

    it('步骤1: 创建待办事项', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/todos')
        .send({
          title: 'CRUD 流程测试',
          description: '测试完整的创建-读取-更新-删除流程',
          priority: 'MEDIUM',
        })
        .expect(201);

      todoId = response.body.id;
      expect(todoId).toBeDefined();
    });

    it('步骤2: 读取刚创建的待办事项', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .expect(200);

      expect(response.body.id).toBe(todoId);
      expect(response.body.title).toBe('CRUD 流程测试');
    });

    it('步骤3: 更新待办事项', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .send({ title: '已更新的标题' })
        .expect(200);

      expect(response.body.title).toBe('已更新的标题');
      // 描述应该保持不变
      expect(response.body.description).toBe('测试完整的创建-读取-更新-删除流程');
    });

    it('步骤4: 标记为已完成', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}/complete`)
        .expect(200);

      expect(response.body.completed).toBe(true);
    });

    it('步骤5: 重复标记完成应返回 400', async () => {
      await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}/complete`)
        .expect(400);
    });

    it('步骤6: 删除待办事项', async () => {
      await request(app.getHttpServer())
        .delete(`/api/todos/${todoId}`)
        .expect(200);
    });

    it('步骤7: 确认已删除 - 再次获取应返回 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .expect(404);
    });
  });

  // =============================================
  // 统计信息测试
  // =============================================
  describe('GET /api/todos/stats', () => {
    it('应该返回统计信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todos/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('byPriority');
      expect(typeof response.body.total).toBe('number');
    });
  });
});
