/**
 * 应用 E2E 测试
 *
 * 【E2E 测试说明】
 * End-to-End（端到端）测试模拟完整的 HTTP 请求-响应周期：
 * 1. 启动真实的 NestJS 应用
 * 2. 发送 HTTP 请求
 * 3. 验证响应状态码和内容
 *
 * 【与单元测试的区别】
 * - 单元测试：测试单个函数或类（使用 mock）
 * - E2E 测试：测试完整的应用栈（包含中间件、管道、过滤器等）
 *
 * 【在 CI/CD 中的角色】
 * E2E 测试是部署前的最后一道质量关卡，确保：
 * 1. 应用能正确启动
 * 2. API 端点返回预期的响应
 * 3. 错误处理逻辑正常工作
 *
 * 【Docker 镜像测试】
 * 在 CI/CD 流程中，构建 Docker 镜像后也会运行类似的测试：
 * ```bash
 * docker run -d --name test-app -p 3000:3000 nestjs-app
 * sleep 5
 * curl -f http://localhost:3000/health/live || exit 1
 * ```
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // 在所有测试之前启动应用
  beforeAll(async () => {
    // 创建测试模块
    // 使用真实的 AppModule，包含所有中间件、管道和过滤器
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // 创建应用实例
    app = moduleFixture.createNestApplication();

    // 配置与 main.ts 相同的全局管道和过滤器
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    // 初始化应用
    await app.init();
  });

  // 在所有测试完成后关闭应用
  afterAll(async () => {
    await app.close();
  });

  // -----------------------------------------------------------------------
  // 根路径测试
  // -----------------------------------------------------------------------
  describe('GET /', () => {
    it('应该返回 API 信息', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          // 验证响应包含关键字段
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('endpoints');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  // -----------------------------------------------------------------------
  // CRUD 操作测试
  // -----------------------------------------------------------------------
  describe('Items API (e2e)', () => {
    // 获取所有数据项
    describe('GET /api/v1/items', () => {
      it('应该返回数据项列表', () => {
        return request(app.getHttpServer())
          .get('/api/v1/items')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
          });
      });
    });

    // 获取单个数据项
    describe('GET /api/v1/items/:id', () => {
      it('应该返回指定 ID 的数据项', () => {
        return request(app.getHttpServer())
          .get('/api/v1/items/1')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('id', 1);
            expect(res.body.data).toHaveProperty('name');
          });
      });

      it('应该对不存在的 ID 返回 404', () => {
        return request(app.getHttpServer())
          .get('/api/v1/items/9999')
          .expect(404)
          .expect((res) => {
            expect(res.body).toHaveProperty('code');
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('requestId');
          });
      });

      it('应该对无效的 ID 格式返回 400', () => {
        return request(app.getHttpServer())
          .get('/api/v1/items/abc')
          .expect(400);
      });
    });

    // 创建新数据项
    describe('POST /api/v1/items', () => {
      it('应该创建新数据项并返回 201', () => {
        const newItem = {
          name: '测试项目',
          description: 'E2E 测试创建的数据项',
        };

        return request(app.getHttpServer())
          .post('/api/v1/items')
          .send(newItem)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('name', newItem.name);
            expect(res.body.data).toHaveProperty(
              'description',
              newItem.description,
            );
            expect(res.body.data).toHaveProperty('createdAt');
          });
      });

      it('创建的数据项应该出现在列表中', async () => {
        // 先记录当前数量
        const beforeRes = await request(app.getHttpServer()).get(
          '/api/v1/items',
        );
        const countBefore = beforeRes.body.data.length;

        // 创建新项
        await request(app.getHttpServer())
          .post('/api/v1/items')
          .send({ name: '计数测试项' })
          .expect(201);

        // 验证数量增加
        const afterRes = await request(app.getHttpServer()).get(
          '/api/v1/items',
        );
        expect(afterRes.body.data.length).toBe(countBefore + 1);
      });
    });
  });

  // -----------------------------------------------------------------------
  // 错误处理测试
  // -----------------------------------------------------------------------
  describe('错误处理', () => {
    it('应该为不存在的路由返回 404', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });
  });
});
