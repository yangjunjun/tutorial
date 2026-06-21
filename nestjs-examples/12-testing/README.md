# 12-testing - NestJS 测试示例

## 项目简介

本项目是一个带有完整测试覆盖的待办事项(Todo)应用，旨在演示 NestJS 中的各种测试策略。
通过这个项目，你将学习如何编写单元测试、集成测试和端到端测试(E2E)。

## 学习要点

### 1. 测试金字塔 (Testing Pyramid)

```
        /  E2E  \          <- 少量端到端测试（慢但真实）
       / 集成测试 \         <- 适量集成测试（验证模块协作）
      /  单元测试   \       <- 大量单元测试（快速验证逻辑）
```

- **单元测试**：测试单个函数/方法，隔离外部依赖，速度最快
- **集成测试**：测试模块之间的协作，验证依赖注入是否正确
- **端到端测试**：模拟真实 HTTP 请求，验证完整请求/响应周期

### 2. Mocking 策略

- `jest.fn()` - 创建模拟函数，替代外部依赖
- `jest.spyOn()` - 监视对象方法的调用
- `jest.mock()` - 模拟整个模块
- 模拟 HTTP 调用、数据库操作等外部依赖

### 3. 测试组织

```
test/
├── unit/              # 单元测试
│   ├── todos.service.spec.ts
│   └── users.service.spec.ts
├── integration/       # 集成测试
│   └── todos.controller.spec.ts
└── e2e/              # 端到端测试
    ├── todos.e2e-spec.ts
    └── workflow.e2e-spec.ts
```

### 4. 覆盖率目标

- 行覆盖率 (Lines): >= 80%
- 分支覆盖率 (Branches): >= 75%
- 函数覆盖率 (Functions): >= 80%
- 语句覆盖率 (Statements): >= 80%

## 技术栈

- NestJS - 应用框架
- Jest - 测试框架
- Supertest - HTTP 端到端测试
- class-validator - DTO 验证

## 运行方式

```bash
# 安装依赖
pnpm install

# 运行所有测试
pnpm test

# 仅运行单元测试
pnpm test:unit

# 仅运行集成测试
pnpm test:integration

# 仅运行端到端测试
pnpm test:e2e

# 监听模式（修改文件自动重新运行）
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 启动应用（查看实际功能）
pnpm start:dev
```

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /todos | 获取所有待办事项 |
| GET | /todos/:id | 获取单个待办事项 |
| POST | /todos | 创建待办事项 |
| PATCH | /todos/:id | 更新待办事项 |
| PATCH | /todos/:id/complete | 标记为完成 |
| DELETE | /todos/:id | 删除待办事项 |
| GET | /todos/stats | 获取统计信息 |

## 关键概念

### describe 与 it

```typescript
// describe 用于组织相关的测试用例
describe('TodosService', () => {
  // it 定义单个测试用例
  it('应该创建一个新的待办事项', () => {
    // 测试代码...
  });
});
```

### expect 断言

```typescript
expect(result).toBe(expected);       // 严格相等
expect(result).toEqual(expected);    // 深度相等（对象/数组）
expect(fn).toThrow(Error);           // 期望抛出错误
expect(array).toHaveLength(3);       // 数组长度
expect(obj).toHaveProperty('key');   // 对象包含属性
```

### beforeEach 生命周期

```typescript
beforeEach(() => {
  // 每个测试用例运行前都会执行
  // 通常用于重置状态、初始化测试数据
});
```
