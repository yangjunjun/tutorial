/**
 * 健康检查端点 E2E 测试
 *
 * 【测试重点】
 * 健康检查端点是容器编排系统判断服务状态的关键接口。
 * 测试需要确保：
 * 1. 端点正确响应
 * 2. 响应格式符合 Kubernetes 的期望
 * 3. 各探针的行为符合设计意图
 *
 * 【在 CI/CD 中的应用】
 * 这些测试确保健康检查端点在部署前就能正常工作，
 * 避免部署后 Kubernetes 因健康检查失败而不断重启 Pod。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------------------------------------------------
  // 综合健康检查
  // -----------------------------------------------------------------------
  describe('GET /health', () => {
    it('应该返回健康检查结果', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // 验证 @nestjs/terminus 的标准响应格式
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');

      // status 应该是 'ok' 或 'error'
      expect(['ok', 'error']).toContain(response.body.status);
    });

    it('应该包含内存健康检查信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // 检查 info 对象中包含内存相关的检查
      const info = response.body.info;
      expect(info).toBeDefined();

      // 至少应该有一个内存相关的健康指标
      const hasMemoryCheck =
        'memory_heap' in info || 'memory_rss' in info;
      expect(hasMemoryCheck).toBe(true);
    });

    it('应该包含磁盘健康检查信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const info = response.body.info;
      expect(info).toBeDefined();

      // 应该包含磁盘检查
      expect('disk_storage' in info).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 存活探针
  // -----------------------------------------------------------------------
  describe('GET /health/live', () => {
    it('应该返回存活状态', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.info).toHaveProperty('live');
      expect(response.body.info.live).toHaveProperty('status', 'up');
    });

    it('存活探针应该始终返回 200（除非应用崩溃）', async () => {
      // 连续多次调用存活探针，都应该返回成功
      // 这模拟了 Kubernetes 定期检查的行为
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get('/health/live')
          .expect(200);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 就绪探针
  // -----------------------------------------------------------------------
  describe('GET /health/ready', () => {
    it('应该返回就绪状态', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      // 在测试环境中，应用应该始终就绪
      expect(['ok', 'error']).toContain(response.body.status);
    });

    it('响应格式应该符合 Kubernetes 的要求', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      // Kubernetes 要求健康检查端点：
      // 1. 返回 200-399 表示健康
      // 2. 返回 400+ 表示不健康
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(400);

      // 响应应该是 JSON 格式
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  // -----------------------------------------------------------------------
  // 监控指标端点
  // -----------------------------------------------------------------------
  describe('GET /metrics', () => {
    it('应该返回 Prometheus 格式的指标数据', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      // 检查 Content-Type
      expect(response.headers['content-type']).toContain('text/plain');

      // 检查包含 Prometheus 指标格式的关键行
      const body = response.text;
      expect(body).toContain('HELP');
      expect(body).toContain('TYPE');
      expect(body).toContain('http_requests_total');
    });

    it('应该包含进程运行时间指标', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('nodejs_uptime_seconds');
    });

    it('应该包含内存使用指标', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('nodejs_heap_size_bytes');
    });
  });

  // -----------------------------------------------------------------------
  // 指标摘要端点
  // -----------------------------------------------------------------------
  describe('GET /metrics/summary', () => {
    it('应该返回 JSON 格式的指标摘要', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('processInfo');
      expect(response.body.processInfo).toHaveProperty('uptime');
      expect(response.body.processInfo).toHaveProperty('memoryUsage');
      expect(response.body.processInfo).toHaveProperty('nodeVersion');
    });
  });
});
