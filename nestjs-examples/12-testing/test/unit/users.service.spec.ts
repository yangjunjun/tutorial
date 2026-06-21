/**
 * UsersService 单元测试 - Mocking 演示
 *
 * =============================================
 * Mocking 最佳实践
 * =============================================
 *
 * 为什么需要 Mock？
 * - 外部 API 不可靠，测试不应该依赖网络
 * - 数据库操作太慢，单元测试应该毫秒级完成
 * - 需要测试各种边界情况（如 API 返回错误）
 *
 * Mocking 策略：
 *
 * 1. jest.fn() - 创建模拟函数
 *    - 完全替换函数实现
 *    - 可以定义返回值、跟踪调用
 *
 * 2. jest.spyOn() - 监视对象方法
 *    - 不替换实现，只记录调用信息
 *    - 也可以选择替换实现（mockImplementation）
 *    - 适合验证方法是否被正确调用
 *
 * 3. jest.mock() - 模拟整个模块
 *    - 替换模块的所有导出
 *    - 适合模拟第三方库
 *
 * 注意事项：
 * - 每次测试前重置 Mock（使用 jest.clearAllMocks()）
 * - Mock 的返回值应该覆盖各种场景
 * - 验证 Mock 被调用的次数和参数
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersService, ExternalUserData } from '../../src/users/users.service';

describe('UsersService (Mocking 演示)', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // 每次测试前清除所有 Mock 的调用记录和实现
    jest.clearAllMocks();
  });

  // =============================================
  // jest.spyOn() 演示
  // =============================================
  describe('getUserProfile() - 使用 jest.spyOn()', () => {
    /**
     * jest.spyOn() 示例：
     *
     * spyOn 会"监视"对象上的某个方法，
     * 可以选择不改变实现（只记录调用），
     * 也可以通过 mockImplementation/mockResolvedValue 替换实现。
     */
    it('应该从外部 API 获取数据并转换为内部格式', async () => {
      // Arrange - 准备模拟数据
      const mockExternalData: ExternalUserData = {
        id: 'user-1',
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        profile_picture: 'https://example.com/avatar.jpg',
        last_active: '2024-01-15T10:30:00Z',
      };

      // 使用 jest.spyOn 替换 fetchFromExternalApi 方法的实现
      const spy = jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValue(mockExternalData);

      // Act - 执行被测方法
      const result = await service.getUserProfile('user-1');

      // Assert - 验证结果
      expect(result).toEqual({
        id: 'user-1',
        name: 'zhangsan',                  // username 被转换为 name
        email: 'zhangsan@example.com',
        avatar: 'https://example.com/avatar.jpg', // profile_picture 被转换为 avatar
        lastLogin: new Date('2024-01-15T10:30:00Z'), // 字符串被转换为 Date
      });

      // 验证 fetchFromExternalApi 被调用了一次，参数为 'user-1'
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('user-1');
    });

    it('外部 API 返回空 profile_picture 时，avatar 应为 undefined', async () => {
      const mockExternalData: ExternalUserData = {
        id: 'user-2',
        username: 'lisi',
        email: 'lisi@example.com',
        profile_picture: '', // 空字符串
        last_active: '2024-01-15T10:30:00Z',
      };

      jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValue(mockExternalData);

      const result = await service.getUserProfile('user-2');

      // 空字符串应该被转换为 undefined
      expect(result.avatar).toBeUndefined();
    });

    it('外部 API 返回空 last_active 时，lastLogin 应为 undefined', async () => {
      const mockExternalData: ExternalUserData = {
        id: 'user-3',
        username: 'wangwu',
        email: 'wangwu@example.com',
        profile_picture: 'https://example.com/wangwu.jpg',
        last_active: '', // 空字符串
      };

      jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValue(mockExternalData);

      const result = await service.getUserProfile('user-3');

      expect(result.lastLogin).toBeUndefined();
    });
  });

  // =============================================
  // jest.fn() 演示 - 模拟错误场景
  // =============================================
  describe('getUserProfile() - 错误处理', () => {
    /**
     * jest.fn() 示例：
     *
     * 与 spyOn 不同，jest.fn() 创建一个全新的模拟函数。
     * 我们用它来替换 service.fetchFromExternalApi，
     * 模拟外部 API 调用失败的场景。
     */
    it('外部 API 调用失败时应抛出 HttpException', async () => {
      // 模拟外部 API 抛出错误
      jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockRejectedValue(new Error('网络超时'));

      // 使用 try-catch 验证异步异常
      try {
        await service.getUserProfile('user-1');
        // 如果没有抛出异常，测试应该失败
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
        expect(error.message).toContain('获取用户资料失败');
      }
    });

    it('如果已经是 HttpException 则直接抛出', async () => {
      const httpError = new HttpException('未授权', HttpStatus.UNAUTHORIZED);
      jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockRejectedValue(httpError);

      try {
        await service.getUserProfile('user-1');
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        // 应该保持原始的 HTTP 状态码，而不是被包装为 BAD_GATEWAY
        expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });
  });

  // =============================================
  // 多种返回值模拟
  // =============================================
  describe('getUserProfile() - 多种返回值', () => {
    it('使用 mockResolvedValueOnce 模拟连续不同返回值', async () => {
      /**
       * mockResolvedValueOnce 可以设置下一次调用的返回值，
       * 调用一次后就会消费掉。可以链式调用设置多个返回值。
       *
       * 这在测试批量操作时非常有用。
       */
      jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValueOnce({
          id: 'user-1',
          username: 'user_one',
          email: 'one@example.com',
          profile_picture: '',
          last_active: '2024-01-01T00:00:00Z',
        })
        .mockResolvedValueOnce({
          id: 'user-2',
          username: 'user_two',
          email: 'two@example.com',
          profile_picture: 'https://example.com/two.jpg',
          last_active: '',
        });

      const profile1 = await service.getUserProfile('user-1');
      const profile2 = await service.getUserProfile('user-2');

      expect(profile1.name).toBe('user_one');
      expect(profile2.name).toBe('user_two');
      expect(profile1.id).not.toBe(profile2.id);
    });
  });

  // =============================================
  // getMultipleProfiles() 测试
  // =============================================
  describe('getMultipleProfiles()', () => {
    it('应该并发获取多个用户资料', async () => {
      const mockData: Record<string, ExternalUserData> = {
        'user-1': {
          id: 'user-1', username: 'alice',
          email: 'alice@example.com', profile_picture: '', last_active: '',
        },
        'user-2': {
          id: 'user-2', username: 'bob',
          email: 'bob@example.com', profile_picture: '', last_active: '',
        },
      };

      jest.spyOn(service, 'fetchFromExternalApi').mockImplementation(
        async (id: string) => mockData[id],
      );

      const results = await service.getMultipleProfiles(['user-1', 'user-2']);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name).sort()).toEqual(['alice', 'bob']);
    });

    it('部分请求失败时应只返回成功的结果', async () => {
      jest.spyOn(service, 'fetchFromExternalApi').mockImplementation(
        async (id: string) => {
          if (id === 'user-2') {
            throw new Error('用户不存在');
          }
          return {
            id, username: `user_${id}`,
            email: `${id}@example.com`, profile_picture: '', last_active: '',
          };
        },
      );

      const results = await service.getMultipleProfiles([
        'user-1',
        'user-2', // 这个会失败
        'user-3',
      ]);

      // 应该只有2个成功结果（user-1 和 user-3）
      expect(results).toHaveLength(2);
    });
  });

  // =============================================
  // Mock 调用验证
  // =============================================
  describe('验证 Mock 调用', () => {
    it('应该验证方法被调用的次数和参数', async () => {
      const spy = jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValue({
          id: 'test-id',
          username: 'test',
          email: 'test@test.com',
          profile_picture: '',
          last_active: '',
        });

      await service.getUserProfile('test-id');

      // 验证调用次数
      expect(spy).toHaveBeenCalledTimes(1);
      // 验证调用参数
      expect(spy).toHaveBeenCalledWith('test-id');
      // 验证调用参数（另一种方式）
      expect(spy).toHaveBeenLastCalledWith('test-id');
    });

    it('mock.calls 可以获取所有调用信息', async () => {
      const spy = jest
        .spyOn(service, 'fetchFromExternalApi')
        .mockResolvedValue({
          id: 'x', username: 'x',
          email: 'x@x.com', profile_picture: '', last_active: '',
        });

      await service.getUserProfile('id-1');
      await service.getUserProfile('id-2');

      // spy.mock.calls 是一个二维数组
      // 每个元素是一次调用的参数列表
      expect(spy.mock.calls).toHaveLength(2);
      expect(spy.mock.calls[0]).toEqual(['id-1']);
      expect(spy.mock.calls[1]).toEqual(['id-2']);
    });
  });
});
