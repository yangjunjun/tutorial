# 第四阶段：高级主题篇 / Stage 4: Advanced Topics (Week 8-9)

## 概述 / Overview

**中文：**
第四阶段是 NestJS 学习路线的高级主题篇，涵盖四个关键领域：测试体系、微服务架构、GraphQL 和 WebSocket 实时通信。这些主题是从"能写代码"到"能写好代码"的关键跨越。通过本阶段的学习，你将掌握如何编写可靠的测试来保障代码质量，如何将单体应用拆分为微服务来提升可扩展性，如何使用 GraphQL 提供更灵活的 API 查询能力，以及如何利用 WebSocket 实现实时双向通信。每个项目都包含完整的代码示例和最佳实践指南。

**English:**
Stage 4 covers advanced topics in the NestJS learning path, spanning four critical areas: testing ecosystems, microservice architecture, GraphQL, and WebSocket real-time communication. These topics represent the crucial leap from "writing code that works" to "writing code that's production-ready." Through this stage, you will learn how to write reliable tests to ensure code quality, decompose monolithic applications into microservices for better scalability, leverage GraphQL for flexible API querying, and implement real-time bidirectional communication with WebSocket. Each project includes complete code examples and best practice guides.

**本阶段学习目标 / Learning Objectives：**

| # | 项目 / Project | 核心技术 / Core Tech | 学时 / Hours |
|---|---|---|---|
| 12 | 测试体系 / Testing | Jest, supertest, TestingModule | 8-10h |
| 13 | 微服务架构 / Microservices | TCP Transport, ClientsModule | 8-10h |
| 14 | GraphQL | Apollo Server, Code-First | 8-10h |
| 15 | WebSocket 实时通信 / Real-time | Socket.io, Gateway | 6-8h |

---

## 项目 12: 测试体系 / Project 12: Testing

### 为什么需要测试？ / Why Testing Matters

**中文：**
在真实的企业项目中，测试不是可选项，而是必需品。没有测试的代码就像没有保险的房子——可能今天没事，但你永远不知道明天会不会出问题。测试给你信心去重构代码、添加新功能、修复 Bug，而不用担心"改了一个地方，整个系统都崩了"。NestJS 对测试提供了非常友好的支持，内置了 `@nestjs/testing` 包，让你可以轻松创建测试模块、注入依赖、模拟外部服务。

**English:**
In real enterprise projects, testing is not optional — it's essential. Untested code is like a house without insurance — it might be fine today, but you never know when something will break. Tests give you the confidence to refactor code, add new features, and fix bugs without the fear of "changing one thing and breaking the entire system." NestJS provides excellent testing support out of the box with the `@nestjs/testing` package, allowing you to easily create test modules, inject dependencies, and mock external services.

---

### 测试金字塔 / Testing Pyramid

**中文：**
测试金字塔是软件测试的经典分层模型，将测试分为三个层级：

```
        /  E2E  \          ← 少量（慢但最接近真实用户行为）
       /----------\
      / Integration \      ← 适量（测试模块间协作）
     /----------------\
    /    Unit Tests     \  ← 大量（快速、隔离、覆盖面广）
   /--------------------\
```

**三个层级的对比 / Comparison of the three levels：**

| 层级 / Level | 测试范围 / Scope | 速度 / Speed | 数量 / Quantity | 目的 / Purpose |
|---|---|---|---|---|
| 单元测试 / Unit | 单个函数或类 | 毫秒级 | 最多 | 验证业务逻辑正确性 |
| 集成测试 / Integration | 多个模块协作 | 百毫秒级 | 适中 | 验证模块间交互 |
| E2E 测试 / End-to-End | 完整请求链路 | 秒级 | 最少 | 验证端到端用户流程 |

**English:**
The testing pyramid is a classic layered model for software testing that divides tests into three levels. **Unit tests** form the base — they test individual functions or classes in isolation and run in milliseconds. You should have the most unit tests. **Integration tests** sit in the middle — they verify that multiple modules work together correctly and run in hundreds of milliseconds. **E2E tests** are at the top — they test the full request/response cycle from HTTP input to database output, run in seconds, and you should have the fewest of them. Together, these three layers form a comprehensive testing strategy that balances speed, coverage, and confidence.

---

### 单元测试 / Unit Testing

**中文：**
单元测试是最基础的测试类型，用于验证单个函数、方法或类的行为是否符合预期。NestJS 使用 Jest 作为默认的测试框架，提供了 `describe`、`it`（或 `test`）、`expect`、`beforeEach` 等核心 API。下面以一个 Todo 服务为例，展示如何编写全面的单元测试。

**English:**
Unit tests are the most fundamental test type, verifying the behavior of individual functions, methods, or classes. NestJS uses Jest as its default testing framework, providing core APIs like `describe`, `it` (or `test`), `expect`, and `beforeEach`. Below we use a Todo service as an example to demonstrate comprehensive unit testing.

#### Jest 基础 API / Jest Fundamentals

```typescript
// todo.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TodoService（单元测试 / Unit Tests）', () => {
  let service: TodoService;

  // 模拟仓库对象 / Mock repository object
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: getRepositoryToken(Todo),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);

    // 每次测试前重置所有 mock / Reset all mocks before each test
    jest.clearAllMocks();
  });

  // ========== 创建 Todo / Create Todo ==========

  it('应该成功创建一个 todo', async () => {
    const createDto = { title: '学习 NestJS 测试', description: '编写单元测试' };
    const createdTodo = { id: 1, ...createDto, completed: false, createdAt: new Date() };

    mockRepository.create.mockReturnValue(createdTodo);
    mockRepository.save.mockResolvedValue(createdTodo);

    const result = await service.create(createDto);

    expect(result).toEqual(createdTodo);
    expect(result.title).toBe('学习 NestJS 测试');
    expect(result.completed).toBe(false);
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('当标题为空时应该抛出 BadRequestException', async () => {
    const createDto = { title: '', description: '没有标题' };

    await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('当标题超过 200 字符时应该抛出异常', async () => {
    const createDto = { title: 'a'.repeat(201), description: '标题太长' };

    await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
  });

  // ========== 查询所有 Todo / Find All Todos ==========

  it('应该返回所有 todo 列表', async () => {
    const todos = [
      { id: 1, title: 'Todo 1', completed: false },
      { id: 2, title: 'Todo 2', completed: true },
    ];
    mockRepository.find.mockResolvedValue(todos);

    const result = await service.findAll();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Todo 1');
    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });

  it('当列表为空时应该返回空数组', async () => {
    mockRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  // ========== 根据 ID 查询 / Find By ID ==========

  it('应该根据 ID 返回单个 todo', async () => {
    const todo = { id: 1, title: '学习 NestJS', completed: false };
    mockRepository.findOne.mockResolvedValue(todo);

    const result = await service.findOne(1);

    expect(result).toEqual(todo);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('当 todo 不存在时应该抛出 NotFoundException', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('当 ID 为负数时应该抛出 BadRequestException', async () => {
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
  });

  // ========== 更新 Todo / Update Todo ==========

  it('应该成功更新 todo 的标题', async () => {
    const existingTodo = { id: 1, title: '旧标题', completed: false };
    const updatedTodo = { ...existingTodo, title: '新标题' };

    mockRepository.findOne.mockResolvedValue(existingTodo);
    mockRepository.save.mockResolvedValue(updatedTodo);

    const result = await service.update(1, { title: '新标题' });

    expect(result.title).toBe('新标题');
    expect(mockRepository.findOne).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('应该成功切换 todo 的完成状态', async () => {
    const existingTodo = { id: 1, title: '切换测试', completed: false };
    const updatedTodo = { ...existingTodo, completed: true };

    mockRepository.findOne.mockResolvedValue(existingTodo);
    mockRepository.save.mockResolvedValue(updatedTodo);

    const result = await service.update(1, { completed: true });

    expect(result.completed).toBe(true);
  });

  it('更新不存在的 todo 应该抛出 NotFoundException', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.update(999, { title: '不存在' }))
      .rejects.toThrow(NotFoundException);
  });

  // ========== 删除 Todo / Delete Todo ==========

  it('应该成功删除一个 todo', async () => {
    const todo = { id: 1, title: '待删除', completed: false };
    mockRepository.findOne.mockResolvedValue(todo);
    mockRepository.delete.mockResolvedValue({ affected: 1 });

    const result = await service.remove(1);

    expect(result).toEqual({ message: 'Todo 删除成功' });
    expect(mockRepository.delete).toHaveBeenCalledWith(1);
  });

  it('删除不存在的 todo 应该抛出 NotFoundException', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });

  // ========== 统计 / Statistics ==========

  it('应该返回正确的 todo 统计信息', async () => {
    mockRepository.count.mockResolvedValueOnce(10);  // total
    mockRepository.count.mockResolvedValueOnce(7);   // completed
    mockRepository.count.mockResolvedValueOnce(3);   // pending

    const stats = await service.getStats();

    expect(stats).toEqual({ total: 10, completed: 7, pending: 3 });
  });

  // ========== 边界情况 / Edge Cases ==========

  it('当数据库操作失败时应该抛出 InternalServerErrorException', async () => {
    mockRepository.find.mockRejectedValue(new Error('Database connection lost'));

    await expect(service.findAll()).rejects.toThrow();
  });

  it('标题中的特殊字符应该被正确处理', async () => {
    const specialTitle = 'Todo with <script>alert("xss")</script>';
    const createDto = { title: specialTitle, description: 'XSS 测试' };
    const createdTodo = { id: 1, ...createDto, completed: false };

    mockRepository.create.mockReturnValue(createdTodo);
    mockRepository.save.mockResolvedValue(createdTodo);

    const result = await service.create(createDto);

    expect(result.title).toBe(specialTitle);
  });
});
```

**以上测试用例覆盖了 / The test cases above cover：**

| 类别 / Category | 测试用例数 / Count | 说明 / Description |
|---|---|---|
| 创建操作 / Create | 3 | 成功创建、空标题、超长标题 |
| 查询操作 / Read | 4 | 查全部、空列表、按 ID 查、不存在 |
| 更新操作 / Update | 3 | 更新标题、切换状态、不存在 |
| 删除操作 / Delete | 2 | 成功删除、不存在 |
| 统计 / Stats | 1 | 统计数量 |
| 边界 / Edge Cases | 2 | 数据库异常、特殊字符 |

---

### Mock 技术 / Mocking Techniques

**中文：**
Mock（模拟）是单元测试的核心技术。通过 Mock，我们可以隔离被测代码，让它不依赖真实的数据库、外部 API 或文件系统。NestJS + Jest 提供了三种主要的 Mock 方式：

**English:**
Mocking is the core technique of unit testing. Through mocking, we isolate the code under test from real databases, external APIs, or file systems. NestJS + Jest provides three primary mocking approaches:

#### 1. `jest.fn()` — 手动创建模拟函数 / Manually create mock functions

```typescript
// 最简单的方式 / The simplest approach
const mockFn = jest.fn();
mockFn.mockReturnValue('hello');       // 同步返回值 / sync return
mockFn.mockResolvedValue('world');     // 异步返回值 / async return (Promise)
mockFn.mockRejectedValue(new Error('fail')); // 模拟抛出错误 / simulate error

expect(mockFn()).toBe('hello');
expect(mockFn).toHaveBeenCalledTimes(1);
```

#### 2. `jest.spyOn()` — 监视已有对象的方法 / Spy on existing object methods

```typescript
// 监视而不替换原始实现 / Spy without replacing original implementation
const spy = jest.spyOn(service, 'findAll');

// 监视并替换实现 / Spy and replace implementation
jest.spyOn(service, 'findAll').mockResolvedValue([
  { id: 1, title: 'Mocked Todo', completed: false },
]);
```

#### 3. `jest.mock()` — 模拟整个模块 / Mock entire modules

```typescript
// 模拟外部 HTTP 服务 / Mock external HTTP service
jest.mock('@nestjs/axios');

// 在测试中使用 / Use in tests
it('应该调用外部天气 API', async () => {
  const mockAxios = {
    get: jest.fn().mockResolvedValue({
      data: { temperature: 25, city: '北京' },
    }),
  };

  // ...测试代码 / test code
  expect(mockAxios.get).toHaveBeenCalledWith(
    expect.stringContaining('/weather'),
  );
});
```

#### Mock 外部 API 的完整示例 / Complete external API mock example

```typescript
// weather.service.spec.ts
describe('WeatherService（外部 API Mock）', () => {
  let service: WeatherService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WeatherService);
    httpService = module.get(HttpService);
  });

  it('应该解析外部 API 返回的天气数据', async () => {
    const mockResponse = {
      data: {
        weather: [{ description: '晴天' }],
        main: { temp: 28, humidity: 45 },
      },
    };

    jest.spyOn(httpService, 'get').mockResolvedValue(mockResponse);

    const result = await service.getWeather('北京');

    expect(result.city).toBe('北京');
    expect(result.temperature).toBe(28);
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('外部 API 超时时应该优雅降级', async () => {
    jest.spyOn(httpService, 'get')
      .mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' });

    const result = await service.getWeather('北京');

    // 降级返回缓存数据 / Graceful degradation: return cached data
    expect(result).toHaveProperty('fromCache', true);
  });
});
```

---

### 集成测试 / Integration Testing

**中文：**
集成测试验证多个模块协作时的正确性。与单元测试不同，集成测试通常会使用真实的 Service 实现，但可能 Mock 掉外部依赖（如数据库、第三方 API）。在 NestJS 中，我们使用 `Test.createTestingModule()` 来组装测试所需的模块。

**English:**
Integration tests verify correctness when multiple modules collaborate. Unlike unit tests, integration tests typically use real Service implementations but may mock external dependencies like databases or third-party APIs. In NestJS, we use `Test.createTestingModule()` to assemble the modules needed for testing.

```typescript
// orders.controller.spec.ts（集成测试 / Integration Test）
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';

describe('OrdersController（集成测试 / Integration Test）', () => {
  let controller: OrdersController;
  let ordersService: OrdersService;

  // 模拟外部服务，但使用真实的 OrdersService / Mock external services, use real OrdersService
  const mockProductsService = {
    findById: jest.fn(),
    checkStock: jest.fn(),
    reduceStock: jest.fn(),
  };

  const mockOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,  // 真实的 Service / Real service
        {
          provide: 'PRODUCTS_SERVICE',
          useValue: mockProductsService,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('创建订单时应该调用 ProductsService 检查库存', async () => {
    mockProductsService.checkStock.mockResolvedValue(true);
    mockProductsService.findById.mockResolvedValue({
      id: 1, name: 'NestJS 实战', price: 89,
    });
    mockOrderRepository.create.mockReturnValue({
      id: 1, productId: 1, quantity: 2, total: 178,
    });
    mockOrderRepository.save.mockResolvedValue({
      id: 1, productId: 1, quantity: 2, total: 178,
    });

    const result = await controller.createOrder({
      productId: 1,
      quantity: 2,
    });

    expect(result.total).toBe(178);
    expect(mockProductsService.checkStock).toHaveBeenCalledWith(1, 2);
    expect(mockProductsService.reduceStock).toHaveBeenCalledWith(1, 2);
  });

  it('库存不足时应该拒绝创建订单', async () => {
    mockProductsService.checkStock.mockResolvedValue(false);

    await expect(
      controller.createOrder({ productId: 1, quantity: 100 }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

---

### E2E 测试 / End-to-End Testing

**中文：**
E2E（端到端）测试是最接近真实用户行为的测试方式。它会启动一个真实的 HTTP 服务器，发送实际的 HTTP 请求，验证完整的响应内容。在 NestJS 中，我们通常使用 `supertest` 库来执行 E2E 测试。

**English:**
E2E (End-to-End) testing is the test type closest to real user behavior. It starts a real HTTP server, sends actual HTTP requests, and validates the complete response. In NestJS, we typically use the `supertest` library for E2E testing.

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Todo API（E2E 测试）', () => {
  let app: INestApplication;
  let createdTodoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 重要：应用与生产环境相同的管道 / Important: apply same pipes as production
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ========== 创建 Todo 的完整流程 / Complete create flow ==========

  describe('POST /todos', () => {
    it('应该创建一个新 todo（201）', () => {
      return request(app.getHttpServer())
        .post('/todos')
        .send({ title: 'E2E 测试任务', description: '端到端测试' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('E2E 测试任务');
          expect(res.body.completed).toBe(false);
          createdTodoId = res.body.id; // 保存 ID 供后续测试用
        });
    });

    it('标题为空时应该返回 400 验证错误', () => {
      return request(app.getHttpServer())
        .post('/todos')
        .send({ title: '', description: '空标题' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('发送不存在的字段时应该被过滤（whitelist）', () => {
      return request(app.getHttpServer())
        .post('/todos')
        .send({
          title: '白名单测试',
          description: '测试 whitelist',
          maliciousField: 'should be stripped',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('maliciousField');
        });
    });
  });

  // ========== 查询流程 / Query flow ==========

  describe('GET /todos', () => {
    it('应该返回 todo 列表', () => {
      return request(app.getHttpServer())
        .get('/todos')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /todos/:id', () => {
    it('应该返回指定 ID 的 todo', () => {
      return request(app.getHttpServer())
        .get(`/todos/${createdTodoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdTodoId);
          expect(res.body.title).toBe('E2E 测试任务');
        });
    });

    it('查询不存在的 todo 应该返回 404', () => {
      return request(app.getHttpServer())
        .get('/todos/99999')
        .expect(404);
    });
  });

  // ========== 更新流程 / Update flow ==========

  describe('PATCH /todos/:id', () => {
    it('应该更新 todo 的完成状态', () => {
      return request(app.getHttpServer())
        .patch(`/todos/${createdTodoId}`)
        .send({ completed: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.completed).toBe(true);
        });
    });
  });

  // ========== 删除流程 / Delete flow ==========

  describe('DELETE /todos/:id', () => {
    it('应该成功删除 todo', () => {
      return request(app.getHttpServer())
        .delete(`/todos/${createdTodoId}`)
        .expect(200);
    });

    it('删除后再次查询应该返回 404', () => {
      return request(app.getHttpServer())
        .get(`/todos/${createdTodoId}`)
        .expect(404);
    });
  });
});
```

---

### 测试配置 / Test Configuration

**中文：**
在真实项目中，我们通常需要为不同类型的测试配置不同的 Jest 配置。以下是一个推荐的多配置文件结构：

**English:**
In real projects, you typically need separate Jest configurations for different test types. Here is a recommended multi-config file structure:

```
project-root/
├── jest.config.ts           # 单元测试配置 / Unit test config
├── jest-integration.config.ts  # 集成测试配置 / Integration test config
├── test/
│   ├── jest-e2e.config.ts   # E2E 测试配置 / E2E test config
│   └── app.e2e-spec.ts
└── src/
    ├── **/\*.spec.ts         # 单元测试文件 / Unit test files
    └── **/\*.integration-spec.ts  # 集成测试文件 / Integration test files
```

```typescript
// jest.config.ts（单元测试配置 / Unit Test Configuration）
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage/unit',
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
};
```

```json
// package.json 中的测试脚本 / Test scripts in package.json
{
  "scripts": {
    "test": "jest --config jest.config.ts",
    "test:watch": "jest --config jest.config.ts --watch",
    "test:cov": "jest --config jest.config.ts --coverage",
    "test:integration": "jest --config jest-integration.config.ts",
    "test:e2e": "jest --config test/jest-e2e.config.ts",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 项目 13: 微服务架构 / Project 13: Microservice Architecture

### 什么是微服务？ / What are Microservices?

**中文：**
微服务是一种将应用程序构建为一组小型、自治服务的架构风格。每个服务运行在自己的进程中，通过轻量级机制（通常是 TCP、HTTP 或消息队列）进行通信。与单体架构（Monolith）相比，微服务有以下关键区别：

**English:**
Microservices is an architectural style that structures an application as a collection of small, autonomous services. Each service runs in its own process and communicates via lightweight mechanisms (typically TCP, HTTP, or message queues). Compared to monolithic architecture, microservices have the following key differences:

| 对比项 / Aspect | 单体架构 / Monolith | 微服务 / Microservices |
|---|---|---|
| 部署 / Deployment | 整体部署 / Deploy as one | 独立部署 / Deploy independently |
| 技术栈 / Tech Stack | 统一 / Unified | 可混合 / Can mix |
| 扩展 / Scaling | 整体扩展 / Scale all | 按需扩展 / Scale per service |
| 故障隔离 / Fault Isolation | 一损俱损 / One crash kills all | 局部影响 / Contained failures |
| 复杂度 / Complexity | 初期简单 / Simple early on | 初期复杂 / Complex early on |

**什么时候应该拆分为微服务？/ When should you split into microservices?**

**中文：**
不要过早地将应用拆分为微服务。以下信号表明可能是合适的时机：(1) 团队规模增长，多个团队需要独立部署不同模块；(2) 某些模块的扩展需求明显不同（例如订单服务需要 10 个实例，而通知服务只需要 1 个）；(3) 不同模块的发布频率差异很大；(4) 想要为不同模块选择不同的技术栈或数据库。

**English:**
Don't prematurely decompose your application into microservices. Signals that it might be the right time include: (1) team size growth requiring independent deployment of different modules; (2) significantly different scaling needs across modules (e.g., the order service needs 10 instances while the notification service needs only 1); (3) vastly different release frequencies across modules; (4) wanting to choose different tech stacks or databases for different modules.

---

### NestJS Transport 抽象层 / NestJS Transport Abstraction

**中文：**
NestJS 的一大优势是它提供了传输层抽象。你可以用相同的代码模式（`@MessagePattern`、`@EventPattern`）来处理不同的传输协议。NestJS 内置支持以下传输方式：

**English:**
A major advantage of NestJS is its transport layer abstraction. You can use the same code patterns (`@MessagePattern`, `@EventPattern`) across different transport protocols. NestJS has built-in support for the following transports:

| 传输方式 / Transport | 包 / Package | 适用场景 / Use Case |
|---|---|---|
| TCP | `@nestjs/microservices` | 本地开发，低延迟 |
| Redis | `@nestjs/microservices` | 简单消息队列 |
| RabbitMQ | `@nestjs/microservices` | 企业级消息代理 |
| NATS | `@nestjs/microservices` | 高性能、云原生 |
| gRPC | `@nestjs/microservices` | 高性能 RPC，跨语言 |
| Kafka | `@nestjs/microservices` | 大数据流处理 |
| MQTT | `@nestjs/microservices` | IoT 物联网 |

本项目使用 TCP 传输，因为它不需要额外的中间件安装，适合本地开发和学习。

This project uses TCP transport because it requires no additional middleware installation, making it ideal for local development and learning.

---

### API 网关 / API Gateway

**中文：**
在微服务架构中，API 网关是客户端请求的统一入口点。它接收 HTTP 请求，然后将请求转发到对应的微服务。网关还负责聚合多个微服务的响应，以及处理认证、限流等横切关注点。

**English:**
In a microservice architecture, the API Gateway serves as the unified entry point for client requests. It receives HTTP requests and forwards them to the corresponding microservices. The gateway also handles aggregating responses from multiple microservices, as well as cross-cutting concerns like authentication and rate limiting.

```
客户端 / Client
    │
    ▼
┌─────────────┐
│  API Gateway │  ← HTTP 入口 / HTTP entry point (port 3000)
│  (NestJS)    │
└──────┬───────┘
       │ TCP
       ├──► 订单服务 / Order Service (port 3001)
       ├──► 用户服务 / User Service  (port 3002)
       └──► 通知服务 / Notification Service (port 3003)
```

```typescript
// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('API Gateway running on http://localhost:3000');
}
bootstrap();
```

```typescript
// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';

@Module({
  imports: [
    // 注册微服务客户端 / Register microservice clients
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3001 },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class AppModule {}
```

```typescript
// apps/api-gateway/src/orders/orders.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notifyClient: ClientProxy,
  ) {}

  // 请求-响应模式：创建订单 / Request-Response: create order
  async createOrder(createOrderDto: CreateOrderDto) {
    const order = await firstValueFrom(
      this.orderClient.send('order.create', createOrderDto),
    );

    // 事件模式：发送订单创建通知（fire-and-forget）
    // Event pattern: send order creation notification (fire-and-forget)
    this.notifyClient.emit('notification.order-created', {
      orderId: order.id,
      userId: order.userId,
      total: order.total,
    });

    return order;
  }

  // 查询订单列表 / Query order list
  async getOrders(userId: number) {
    return firstValueFrom(
      this.orderClient.send('order.findAll', { userId }),
    );
  }
}
```

---

### 事件驱动通信 / Event-Driven Communication

**中文：**
事件驱动通信是一种"发后即忘"（fire-and-forget）的模式。发送方（网关）发出事件后不等待接收方的响应。这适用于不需要返回结果的场景，比如发送通知、记录日志、更新统计等。在 NestJS 中，使用 `client.emit()` 发送事件，使用 `@EventPattern()` 接收事件。

**English:**
Event-driven communication is a "fire-and-forget" pattern. The sender (gateway) emits an event and does not wait for the receiver's response. This is suitable for scenarios that don't require a return value, such as sending notifications, logging, or updating statistics. In NestJS, use `client.emit()` to send events and `@EventPattern()` to receive them.

```typescript
// apps/notification-service/src/notification.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('notification.order-created')
  async handleOrderCreated(
    @Payload() data: { orderId: number; userId: number; total: number },
  ) {
    console.log(`[Notification] 订单 #${data.orderId} 已创建`);
    await this.notificationService.sendEmail({
      to: `user${data.userId}@example.com`,
      subject: `订单确认 / Order Confirmation #${data.orderId}`,
      body: `您的订单已创建，总金额: ¥${data.total}`,
    });
  }

  @EventPattern('notification.order-shipped')
  async handleOrderShipped(
    @Payload() data: { orderId: number; trackingNumber: string },
  ) {
    console.log(`[Notification] 订单 #${data.orderId} 已发货`);
    await this.notificationService.sendSMS({
      to: '+86-138-xxxx-xxxx',
      message: `您的订单 #${data.orderId} 已发货，快递单号: ${data.trackingNumber}`,
    });
  }
}
```

---

### 请求-响应模式 / Request-Response Pattern

**中文：**
请求-响应模式是最常见的微服务通信方式，类似于函数调用：调用方发送请求并等待返回结果。在 NestJS 中，使用 `@MessagePattern()` 定义消息处理器，使用 `client.send()` 发送请求。注意 `client.send()` 返回的是 RxJS Observable，需要使用 `firstValueFrom()` 将其转换为 Promise。

**English:**
The request-response pattern is the most common microservice communication style, similar to a function call: the caller sends a request and waits for the result. In NestJS, use `@MessagePattern()` to define message handlers and `client.send()` to send requests. Note that `client.send()` returns an RxJS Observable, which needs to be converted to a Promise using `firstValueFrom()`.

```typescript
// apps/order-service/src/order.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async createOrder(@Payload() data: CreateOrderDto) {
    return this.orderService.create(data);
  }

  @MessagePattern('order.findAll')
  async findAllOrders(@Payload() data: { userId: number }) {
    return this.orderService.findAllByUser(data.userId);
  }

  @MessagePattern('order.findOne')
  async findOneOrder(@Payload() data: { orderId: number }) {
    return this.orderService.findOne(data.orderId);
  }

  @MessagePattern('order.cancel')
  async cancelOrder(@Payload() data: { orderId: number }) {
    return this.orderService.cancel(data.orderId);
  }
}
```

**何时使用事件 vs 消息？/ When to use events vs messages?**

| 场景 / Scenario | 推荐方式 / Recommended | 原因 / Reason |
|---|---|---|
| 创建订单并返回结果 / Create order, return result | `@MessagePattern` / `send()` | 需要返回值 / Need return value |
| 订单创建后发通知 / Notify after order created | `@EventPattern` / `emit()` | 不需要返回值 / No return needed |
| 查询数据 / Query data | `@MessagePattern` / `send()` | 需要返回数据 / Need data back |
| 记录审计日志 / Record audit log | `@EventPattern` / `emit()` | 异步、不阻塞 / Async, non-blocking |

---

### 运行微服务 / Running Microservices

**中文：**
每个微服务都需要独立的入口文件（`main.ts`）。网关以 HTTP 模式运行，而微服务以微服务模式运行。

**English:**
Each microservice needs its own entry file (`main.ts`). The gateway runs in HTTP mode, while microservices run in microservice mode.

```typescript
// apps/order-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 3001 },
    },
  );

  await app.listen();
  console.log('Order Service running on TCP port 3001');
}
bootstrap();
```

```typescript
// apps/notification-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 3003 },
    },
  );

  await app.listen();
  console.log('Notification Service running on TCP port 3003');
}
bootstrap();
```

```bash
# 运行命令 / Run commands（需要开 3 个终端 / Open 3 terminals）
# 终端 1 / Terminal 1: 启动 API 网关
npx nest start api-gateway

# 终端 2 / Terminal 2: 启动订单服务
npx nest start order-service

# 终端 3 / Terminal 3: 启动通知服务
npx nest start notification-service
```

---

## 项目 14: GraphQL / Project 14: GraphQL

### GraphQL vs REST

**中文：**
REST API 是最常见的 API 设计风格，但它有两个经典问题：过度获取（Over-fetching）和获取不足（Under-fetching）。过度获取是指客户端只需要用户名称，但 API 返回了整个用户对象（包含邮箱、地址、头像等不需要的字段）。获取不足是指客户端需要同时获取用户信息和他的最近订单，但必须分别调用 `/users/1` 和 `/users/1/orders` 两个接口。GraphQL 允许客户端精确指定需要的字段，一次请求获取所有数据，从根本上解决了这两个问题。

**English:**
REST API is the most common API design style, but it has two classic problems: over-fetching and under-fetching. Over-fetching occurs when a client only needs a user's name but the API returns the entire user object (including email, address, avatar, and other unneeded fields). Under-fetching occurs when a client needs both user info and their recent orders, but must make separate calls to `/users/1` and `/users/1/orders`. GraphQL allows clients to precisely specify the fields they need and fetch all data in a single request, fundamentally solving both problems.

| 对比项 / Aspect | REST | GraphQL |
|---|---|---|
| 端点 / Endpoints | 多个端点 / Multiple endpoints | 单个端点 / Single endpoint |
| 数据形状 / Data Shape | 服务器决定 / Server decides | 客户端决定 / Client decides |
| 版本控制 / Versioning | `/api/v1/`, `/api/v2/` | 字段级演进 / Field-level evolution |
| 过度获取 / Over-fetching | 常见问题 / Common problem | 不存在 / Not an issue |
| 获取不足 / Under-fetching | 常见问题 / Common problem | 不存在 / Not an issue |
| 学习曲线 / Learning Curve | 低 / Low | 中-高 / Medium-High |
| 缓存 / Caching | HTTP 缓存天然支持 | 需要额外方案（如 Apollo Cache） |

**什么时候选择 GraphQL？/ When to choose GraphQL?**

**中文：**
GraphQL 特别适合以下场景：(1) 移动端应用需要减少数据传输量；(2) 前端需要灵活的数据查询能力；(3) 数据关系复杂，存在大量嵌套查询；(4) 多个客户端（Web、iOS、Android）有不同的数据需求。如果你的 API 很简单且客户端需求固定，REST 可能更合适。

**English:**
GraphQL is particularly suitable for: (1) mobile apps that need to minimize data transfer; (2) frontends requiring flexible data querying; (3) complex data relationships with many nested queries; (4) multiple clients (Web, iOS, Android) with different data needs. If your API is simple and client requirements are fixed, REST might be more appropriate.

---

### Code-First vs Schema-First

**中文：**
NestJS 支持两种 GraphQL 开发方式：

- **Code-First（代码优先）**：通过 TypeScript 类和装饰器定义 GraphQL 类型，Schema 自动生成。这是 NestJS 推荐的方式，因为它利用 TypeScript 的类型系统，提供编译时检查和代码复用。
- **Schema-First（Schema 优先）**：先手写 `.graphql` Schema 文件，然后生成对应的 TypeScript 类型。这种方式适合团队中前端和后端独立开发的场景。

**English:**
NestJS supports two GraphQL development approaches:

- **Code-First**: Define GraphQL types through TypeScript classes and decorators; the schema is auto-generated. This is the NestJS-recommended approach as it leverages TypeScript's type system for compile-time checking and code reuse.
- **Schema-First**: Write `.graphql` schema files first, then generate corresponding TypeScript types. This approach suits teams where frontend and backend develop independently.

```typescript
// posts/models/post.model.ts（Code-First 方式）
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Author } from '../../authors/models/author.model';
import { Comment } from '../../comments/models/comment.model';

@ObjectType({ description: '博客文章 / Blog post' })
export class Post {
  @Field(() => ID, { description: '文章唯一标识' })
  id: number;

  @Field({ description: '文章标题' })
  title: string;

  @Field({ description: '文章内容' })
  content: string;

  @Field(() => Int, { description: '阅读量', defaultValue: 0 })
  viewCount: number;

  @Field({ description: '是否已发布' })
  published: boolean;

  @Field(() => Date, { description: '创建时间' })
  createdAt: Date;

  @Field(() => Author, { description: '文章作者' })
  author: Author;

  @Field(() => [Comment], { description: '文章评论列表', nullable: true })
  comments?: Comment[];
}
```

---

### Resolver 解析器 / Resolvers

**中文：**
Resolver 是 GraphQL 的核心概念，它负责将 GraphQL 查询映射到具体的数据获取逻辑。在 NestJS 中，Resolver 就是一个带有 `@Resolver()` 装饰器的 Provider 类。`@Query()` 用于定义查询（读），`@Mutation()` 用于定义变更（写），`@ResolveField()` 用于解析嵌套字段。

**English:**
Resolvers are the core concept of GraphQL, responsible for mapping GraphQL queries to specific data-fetching logic. In NestJS, a Resolver is a Provider class decorated with `@Resolver()`. `@Query()` defines queries (reads), `@Mutation()` defines mutations (writes), and `@ResolveField()` resolves nested fields.

```typescript
// posts/posts.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostsService } from './posts.service';
import { Author } from '../authors/models/author.model';
import { Comment } from '../comments/models/comment.model';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  // 查询所有文章 / Query all posts
  @Query(() => [Post], { name: 'posts', description: '获取所有文章' })
  async findAll(
    @Args('publishedOnly', { type: () => Boolean, nullable: true })
    publishedOnly?: boolean,
  ): Promise<Post[]> {
    return this.postsService.findAll(publishedOnly);
  }

  // 根据 ID 查询单篇文章 / Query single post by ID
  @Query(() => Post, { name: 'post', description: '根据 ID 获取文章' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Post> {
    return this.postsService.findOne(id);
  }

  // 创建文章 / Create post (Mutation)
  @Mutation(() => Post, { description: '创建新文章' })
  async createPost(
    @Args('input') input: CreatePostInput,
  ): Promise<Post> {
    return this.postsService.create(input);
  }

  // 更新文章 / Update post (Mutation)
  @Mutation(() => Post, { description: '更新已有文章' })
  async updatePost(
    @Args('input') input: UpdatePostInput,
  ): Promise<Post> {
    return this.postsService.update(input.id, input);
  }

  // 删除文章 / Delete post (Mutation)
  @Mutation(() => Boolean, { description: '删除文章，返回是否成功' })
  async removePost(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.postsService.remove(id);
  }

  // 解析嵌套字段：作者 / Resolve nested field: author
  @ResolveField(() => Author, { description: '获取文章作者' })
  async author(@Parent() post: Post): Promise<Author> {
    return this.postsService.getAuthor(post.id);
  }

  // 解析嵌套字段：评论 / Resolve nested field: comments
  @ResolveField(() => [Comment], { description: '获取文章评论' })
  async comments(@Parent() post: Post): Promise<Comment[]> {
    return this.postsService.getComments(post.id);
  }
}
```

---

### Input Types 输入类型 / Input Types

**中文：**
GraphQL 的 Mutation 通常使用 Input Type 来组织输入参数。在 Code-First 方式中，使用 `@InputType()` 装饰器定义。

**English:**
GraphQL Mutations typically use Input Types to organize input parameters. In the Code-First approach, use the `@InputType()` decorator to define them.

```typescript
// posts/dto/create-post.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

@InputType({ description: '创建文章的输入 / Input for creating a post' })
export class CreatePostInput {
  @Field({ description: '文章标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @MaxLength(200)
  title: string;

  @Field({ description: '文章内容' })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;

  @Field({ nullable: true, description: '文章摘要（可选）' })
  @IsOptional()
  @IsString()
  summary?: string;

  @Field(() => Int, { description: '作者 ID' })
  authorId: number;

  @Field({ defaultValue: false, description: '是否立即发布' })
  published?: boolean;
}
```

---

### GraphQL Playground / GraphQL Playground

**中文：**
NestJS GraphQL 模块自动提供了一个交互式 Playground（通常在 `http://localhost:3000/graphql`），你可以在其中编写和测试 GraphQL 查询。以下是几个常用的查询示例：

**English:**
The NestJS GraphQL module automatically provides an interactive Playground (typically at `http://localhost:3000/graphql`) where you can write and test GraphQL queries. Here are some commonly used query examples:

```graphql
# 查询所有已发布的文章（只获取需要的字段）
# Query all published posts (only fetch needed fields)
query GetPublishedPosts {
  posts(publishedOnly: true) {
    id
    title
    viewCount
    createdAt
    author {
      name
      email
    }
  }
}

# 查询单篇文章及其评论
# Query a single post with its comments
query GetPostWithComments {
  post(id: 1) {
    id
    title
    content
    author {
      name
    }
    comments {
      id
      text
      author {
        name
      }
      createdAt
    }
  }
}

# 创建新文章（Mutation）
# Create new post (Mutation)
mutation CreateNewPost {
  createPost(input: {
    title: "NestJS GraphQL 入门"
    content: "这是一篇关于 GraphQL 的教程..."
    authorId: 1
    published: true
  }) {
    id
    title
    published
    createdAt
  }
}

# 更新文章
# Update post
mutation UpdateExistingPost {
  updatePost(input: {
    id: 1
    title: "NestJS GraphQL 进阶（更新标题）"
  }) {
    id
    title
  }
}
```

---

## 项目 15: WebSocket 实时通信 / Project 15: WebSocket Real-time Communication

### WebSocket vs HTTP

**中文：**
HTTP 是请求-响应协议：客户端发送请求，服务器返回响应，然后连接关闭。如果你需要实时数据（如聊天消息、股票价格、在线游戏状态），HTTP 模型效率很低——客户端不得不反复轮询服务器。WebSocket 提供了一个持久的双向连接，服务器可以随时主动推送数据到客户端，客户端也可以随时发送数据到服务器。

**English:**
HTTP is a request-response protocol: the client sends a request, the server returns a response, and the connection closes. If you need real-time data (like chat messages, stock prices, or online game states), the HTTP model is inefficient — the client must repeatedly poll the server. WebSocket provides a persistent bidirectional connection where the server can proactively push data to the client at any time, and the client can send data to the server at any time.

| 对比项 / Aspect | HTTP | WebSocket |
|---|---|---|
| 连接 / Connection | 短连接（每次请求新建连接） | 长连接（一次握手持续通信） |
| 通信方向 / Direction | 单向（客户端 → 服务器） | 双向（客户端 ↔ 服务器） |
| 延迟 / Latency | 较高（每次请求有 HTTP 开销） | 极低（无重复握手） |
| 适用场景 / Use Cases | CRUD 操作、页面加载 | 聊天、实时通知、仪表盘 |
| 协议 / Protocol | `http://` / `https://` | `ws://` / `wss://` |

**WebSocket 适用场景 / WebSocket Use Cases：**
- 即时聊天 / Instant messaging
- 实时通知推送 / Real-time notification push
- 在线协作编辑（如 Google Docs） / Online collaborative editing
- 实时数据仪表盘 / Real-time data dashboards
- 多人在线游戏 / Multiplayer online games
- 直播弹幕 / Live streaming comments (danmaku)

---

### Socket.io Gateway / Socket.io Gateway

**中文：**
NestJS 通过 `@WebSocketGateway()` 装饰器提供了对 WebSocket 的一流支持。本项目使用 Socket.io 作为底层 WebSocket 库，因为它提供了自动重连、房间（Room）、命名空间（Namespace）、回退机制等高级功能。一个 Gateway 就是一个带有 `@WebSocketGateway()` 装饰器的类，它还可以实现生命周期接口。

**English:**
NestJS provides first-class WebSocket support through the `@WebSocketGateway()` decorator. This project uses Socket.io as the underlying WebSocket library because it offers advanced features like auto-reconnection, rooms, namespaces, and fallback mechanisms. A Gateway is a class decorated with `@WebSocketGateway()` that can also implement lifecycle interfaces.

```typescript
// chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },         // 允许跨域 / Allow CORS
  namespace: '/chat',            // 命名空间 / Namespace
  transports: ['websocket', 'polling'], // 传输方式 / Transport methods
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  // 客户端 ID → 用户信息映射 / Client ID → User info mapping
  private connectedUsers = new Map<string, { userId: string; username: string }>();

  constructor(private readonly chatService: ChatService) {}

  // 网关初始化 / Gateway initialization
  afterInit(server: Server) {
    this.logger.log('WebSocket 网关已初始化 / WebSocket Gateway initialized');
  }

  // 客户端连接 / Client connection
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const username = client.handshake.query.username as string;

    this.connectedUsers.set(client.id, { userId, username });
    this.logger.log(`用户连接 / User connected: ${username} (${client.id})`);

    // 通知所有人有新用户加入 / Notify everyone about new user
    this.server.emit('user:joined', {
      userId,
      username,
      onlineCount: this.connectedUsers.size,
    });
  }

  // 客户端断开 / Client disconnection
  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.logger.log(`用户断开 / User disconnected: ${user.username}`);
      this.connectedUsers.delete(client.id);

      this.server.emit('user:left', {
        userId: user.userId,
        username: user.username,
        onlineCount: this.connectedUsers.size,
      });
    }
  }

  // ========== 消息处理 / Message Handling ==========

  // 加入聊天室 / Join chat room
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    this.logger.log(`${client.id} 加入房间 / joined room: ${data.room}`);

    // 通知房间内其他人 / Notify others in the room
    client.to(data.room).emit('room:user-joined', {
      userId: this.connectedUsers.get(client.id)?.userId,
      username: this.connectedUsers.get(client.id)?.username,
      room: data.room,
    });

    return { event: 'room:joined', data: { room: data.room } };
  }

  // 离开聊天室 / Leave chat room
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`${client.id} 离开房间 / left room: ${data.room}`);

    client.to(data.room).emit('room:user-left', {
      userId: this.connectedUsers.get(client.id)?.userId,
      room: data.room,
    });
  }

  // 发送消息到房间 / Send message to room
  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; content: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      userId: user.userId,
      username: user.username,
      content: data.content,
      timestamp: new Date().toISOString(),
    };

    // 保存到数据库 / Save to database
    await this.chatService.saveMessage(message);

    // 广播到房间（包括发送者自己） / Broadcast to room (including sender)
    this.server.to(data.room).emit('message:new', message);
  }

  // 私聊消息 / Private message
  @SubscribeMessage('message:private')
  handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; content: string },
  ) {
    const sender = this.connectedUsers.get(client.id);
    if (!sender) return;

    // 找到目标用户的 socket ID / Find target user's socket ID
    for (const [socketId, userInfo] of this.connectedUsers.entries()) {
      if (userInfo.userId === data.targetUserId) {
        this.server.to(socketId).emit('message:private', {
          from: { userId: sender.userId, username: sender.username },
          content: data.content,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }
  }

  // 获取在线用户列表 / Get online user list
  @SubscribeMessage('users:online')
  handleGetOnlineUsers() {
    const users = Array.from(this.connectedUsers.values());
    return { event: 'users:online', data: users };
  }

  // 打字指示器 / Typing indicator
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    client.to(data.room).emit('typing:update', {
      userId: user?.userId,
      username: user?.username,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    client.to(data.room).emit('typing:update', {
      userId: user?.userId,
      username: user?.username,
      isTyping: false,
    });
  }
}
```

---

### 事件订阅 / Event Subscription

**中文：**
`@SubscribeMessage()` 装饰器用于订阅来自客户端的特定事件。当客户端发送匹配的事件名称时，对应的处理方法就会被调用。Socket.io 的消息处理支持以下广播方式：

**English:**
The `@SubscribeMessage()` decorator subscribes to specific events from clients. When a client sends a matching event name, the corresponding handler is invoked. Socket.io message handling supports the following broadcasting modes:

```typescript
// 不同的广播方式 / Different broadcasting modes

// 1. 只回复发送者 / Reply only to sender
return { event: 'response', data: '...' };

// 2. 广播给所有人（包括发送者） / Broadcast to everyone (including sender)
this.server.emit('event', data);

// 3. 广播给所有人（不包括发送者） / Broadcast to everyone except sender
client.broadcast.emit('event', data);

// 4. 广播给房间内的所有人 / Broadcast to everyone in a room
this.server.to('room-name').emit('event', data);

// 5. 广播给房间内除发送者外的人 / Broadcast to room except sender
client.to('room-name').emit('event', data);

// 6. 发给特定 socket ID / Send to specific socket ID
this.server.to(socketId).emit('event', data);
```

---

### 定向推送 / Targeted Delivery

**中文：**
在实际的聊天应用中，我们经常需要向特定用户推送消息（如私聊、通知）。关键挑战是：一个用户可能有多个设备连接（手机、电脑、平板），每个连接都有不同的 Socket ID。解决方案是维护一个用户 ID 到 Socket ID 列表的映射。

**English:**
In real chat applications, we often need to push messages to specific users (like private chats or notifications). The key challenge is that a user may have multiple device connections (phone, computer, tablet), each with a different Socket ID. The solution is to maintain a mapping from user ID to a list of Socket IDs.

```typescript
// chat/chat.gateway.ts — 多设备支持 / Multi-device support
private userSockets = new Map<string, Set<string>>();

handleConnection(client: Socket) {
  const userId = client.handshake.query.userId as string;
  
  // 将 socket ID 添加到用户的 socket 集合中
  // Add socket ID to user's socket set
  if (!this.userSockets.has(userId)) {
    this.userSockets.set(userId, new Set());
  }
  this.userSockets.get(userId).add(client.id);
}

handleDisconnect(client: Socket) {
  const userId = client.handshake.query.userId as string;
  const sockets = this.userSockets.get(userId);
  if (sockets) {
    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }
  }
}

// 推送给指定用户的所有设备 / Push to all devices of a specific user
pushToUser(userId: string, event: string, data: any) {
  const socketIds = this.userSockets.get(userId);
  if (socketIds) {
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
```

---

### HTML 客户端 / HTML Client

**中文：**
为了测试 WebSocket 服务，我们可以创建一个简单的 HTML 客户端。Socket.io 提供了官方的客户端库，可以通过 CDN 引入。

**English:**
To test the WebSocket server, we can create a simple HTML client. Socket.io provides an official client library that can be included via CDN.

```html
<!-- public/chat.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>NestJS WebSocket 聊天室 / Chat Room</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; padding: 20px; }
    .login-panel, .chat-panel { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .chat-panel { display: none; }
    h1 { font-size: 24px; margin-bottom: 16px; color: #333; }
    input, button { padding: 10px 16px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; }
    input { width: 100%; margin-bottom: 12px; }
    button { background: #4A90D9; color: white; border: none; cursor: pointer; }
    button:hover { background: #357ABD; }
    #messages { height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 12px; margin: 12px 0; }
    .message { padding: 8px 12px; margin: 4px 0; border-radius: 8px; max-width: 80%; }
    .message.sent { background: #4A90D9; color: white; margin-left: auto; }
    .message.received { background: #f0f0f0; }
    .message .meta { font-size: 11px; opacity: 0.7; }
    #typing-indicator { font-size: 12px; color: #999; height: 20px; }
    .online-count { font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <!-- 登录面板 / Login Panel -->
    <div class="login-panel" id="loginPanel">
      <h1>WebSocket 聊天室 / WebSocket Chat Room</h1>
      <input id="usernameInput" placeholder="输入用户名 / Enter username" />
      <input id="roomInput" placeholder="输入房间名 / Enter room name" value="general" />
      <button onclick="joinChat()">加入聊天 / Join Chat</button>
    </div>

    <!-- 聊天面板 / Chat Panel -->
    <div class="chat-panel" id="chatPanel">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 id="roomTitle"></h1>
        <span class="online-count" id="onlineCount"></span>
      </div>
      <div id="messages"></div>
      <div id="typing-indicator"></div>
      <div style="display: flex; gap: 8px;">
        <input id="messageInput" placeholder="输入消息... / Type a message..."
               onkeypress="if(event.key==='Enter') sendMessage()"
               oninput="handleTyping()"
               style="flex: 1; margin: 0;" />
        <button onclick="sendMessage()">发送 / Send</button>
      </div>
    </div>
  </div>

  <script>
    let socket;
    let currentRoom;
    let userId;
    let typingTimeout;

    function joinChat() {
      const username = document.getElementById('usernameInput').value.trim();
      const room = document.getElementById('roomInput').value.trim() || 'general';
      if (!username) return alert('请输入用户名 / Please enter a username');

      userId = 'user_' + Date.now();
      currentRoom = room;

      // 连接到 WebSocket 服务器 / Connect to WebSocket server
      socket = io('http://localhost:3000/chat', {
        query: { userId, username },
        transports: ['websocket'],
      });

      // 连接成功 / Connection established
      socket.on('connect', () => {
        console.log('已连接 / Connected:', socket.id);
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('chatPanel').style.display = 'block';
        document.getElementById('roomTitle').textContent = `# ${room}`;

        // 加入房间 / Join room
        socket.emit('room:join', { room });
      });

      // 接收新消息 / Receive new message
      socket.on('message:new', (msg) => {
        const div = document.createElement('div');
        div.className = `message ${msg.userId === userId ? 'sent' : 'received'}`;
        div.innerHTML = `
          <div class="meta">${msg.username} · ${new Date(msg.timestamp).toLocaleTimeString()}</div>
          <div>${msg.content}</div>
        `;
        document.getElementById('messages').appendChild(div);
        div.scrollIntoView();
      });

      // 用户加入 / User joined
      socket.on('user:joined', (data) => {
        document.getElementById('onlineCount').textContent =
          `${data.onlineCount} 人在线 / online`;
        addSystemMessage(`${data.username} 加入了聊天室 / joined the chat`);
      });

      // 用户离开 / User left
      socket.on('user:left', (data) => {
        document.getElementById('onlineCount').textContent =
          `${data.onlineCount} 人在线 / online`;
        addSystemMessage(`${data.username} 离开了聊天室 / left the chat`);
      });

      // 打字指示器 / Typing indicator
      socket.on('typing:update', (data) => {
        const indicator = document.getElementById('typing-indicator');
        indicator.textContent = data.isTyping
          ? `${data.username} 正在输入... / is typing...`
          : '';
      });
    }

    function sendMessage() {
      const input = document.getElementById('messageInput');
      const content = input.value.trim();
      if (!content || !socket) return;

      socket.emit('message:send', { room: currentRoom, content });
      input.value = '';

      // 停止打字指示 / Stop typing indicator
      socket.emit('typing:stop', { room: currentRoom });
    }

    function handleTyping() {
      if (!socket) return;
      socket.emit('typing:start', { room: currentRoom });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing:stop', { room: currentRoom });
      }, 2000);
    }

    function addSystemMessage(text) {
      const div = document.createElement('div');
      div.style.cssText = 'text-align:center; color:#999; font-size:12px; padding:4px;';
      div.textContent = text;
      document.getElementById('messages').appendChild(div);
    }
  </script>
</body>
</html>
```

---

## 阶段总结 / Stage Summary

**中文：**
恭喜你完成了第四阶段——高级主题篇的学习！让我们回顾一下你在这个阶段掌握的核心技能：

**English:**
Congratulations on completing Stage 4 — Advanced Topics! Let's review the core skills you've mastered in this stage:

### 技能清单 / Skills Checklist

| 项目 / Project | 核心技能 / Core Skills | 掌握程度 / Mastery |
|---|---|---|
| 12-测试 / Testing | Jest 单元测试、Mock 技术、集成测试、E2E 测试、覆盖率配置 | ★★★☆☆ |
| 13-微服务 / Microservices | Transport 抽象、API 网关、事件驱动、请求-响应模式 | ★★★☆☆ |
| 14-GraphQL | Code-First 方式、Resolver、InputType、Playground 调试 | ★★★☆☆ |
| 15-WebSocket | Socket.io Gateway、房间管理、定向推送、HTML 客户端 | ★★★☆☆ |

### 关键概念回顾 / Key Concepts Review

**1. 测试策略选择 / Choosing Test Strategy：**

```
单元测试 / Unit Test    → 测试 Service 的业务逻辑 / Test business logic
集成测试 / Integration  → 测试 Controller + Service 协作 / Test Controller + Service collaboration
E2E 测试 / E2E Test     → 测试完整 HTTP 请求链路 / Test full HTTP request chain
```

**2. 微服务通信决策 / Microservice Communication Decisions：**

```
需要返回值？ / Need a return value?
  ├─ 是 / Yes → @MessagePattern + client.send()     （请求-响应 / Request-Response）
  └─ 否 / No  → @EventPattern + client.emit()       （事件驱动 / Event-Driven）
```

**3. GraphQL 查询设计 / GraphQL Query Design：**

```
读操作 / Read  → @Query()     → GET 的替代方案 / Alternative to GET
写操作 / Write → @Mutation()  → POST/PATCH/DELETE 的替代方案 / Alternative to POST/PATCH/DELETE
嵌套 / Nested  → @ResolveField() → 按需加载关联数据 / Lazy-load related data
```

**4. WebSocket 通信模式 / WebSocket Communication Patterns：**

```
一对一 / One-to-One     → server.to(socketId).emit()
一对多（房间） / One-to-Many (Room) → server.to(room).emit()
广播 / Broadcast        → server.emit()
私聊 / Private          → 查找用户所有 socket → 逐个推送 / Find all sockets → push individually
```

### 下一步建议 / Next Steps

**中文：**
你现在已经具备了 NestJS 的核心技能。接下来建议：(1) 将所有项目的测试覆盖率提升到 80% 以上；(2) 尝试将项目 13 的微服务部署到 Docker 容器中；(3) 为项目 14 的 GraphQL API 添加认证和权限控制；(4) 为项目 15 的 WebSocket 服务添加 Redis 适配器以支持多实例部署。

**English:**
You now have solid NestJS core skills. Recommended next steps: (1) Raise test coverage above 80% for all projects; (2) Try deploying Project 13's microservices into Docker containers; (3) Add authentication and authorization to Project 14's GraphQL API; (4) Add a Redis adapter to Project 15's WebSocket service to support multi-instance deployment.

---

> **文档版本 / Document Version:** v1.0
> **适用 NestJS 版本 / Applicable NestJS Version:** v10+
> **最后更新 / Last Updated:** 2026-06-08
