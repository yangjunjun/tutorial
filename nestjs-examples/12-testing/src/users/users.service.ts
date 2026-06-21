/**
 * Users 服务
 *
 * 演示如何测试带有外部依赖的服务。
 * 在实际应用中，这个服务可能会调用外部 API（如用户信息接口）。
 * 为了测试，我们需要 Mock 这些外部调用。
 *
 * Mocking 最佳实践：
 * 1. 只 Mock 外部依赖，不要 Mock 被测服务本身的方法
 * 2. Mock 返回值应该覆盖成功和失败两种场景
 * 3. 使用 jest.spyOn 可以验证方法是否被正确调用
 */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

/** 用户资料接口 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastLogin?: Date;
}

/** 外部 API 返回的原始数据接口 */
export interface ExternalUserData {
  id: string;
  username: string;
  email: string;
  profile_picture: string;
  last_active: string;
}

@Injectable()
export class UsersService {
  /**
   * 模拟外部 API 调用
   *
   * 在真实项目中，这里可能使用 HttpService（@nestjs/axios）来调用外部接口。
   * 为了演示 Mock，我们将其抽离为独立方法，方便 jest.spyOn 进行监视。
   *
   * @param id - 用户 ID
   * @returns 外部 API 返回的用户数据
   */
  async fetchFromExternalApi(id: string): Promise<ExternalUserData> {
    // 模拟外部 API 调用
    // 在实际项目中，这里会是类似这样的代码：
    // const response = await this.httpService.get(`https://api.example.com/users/${id}`).toPromise();
    // return response.data;

    // 这里只是模拟，实际测试时会被 Mock 替换
    throw new Error('此方法应该在测试中被 Mock');
  }

  /**
   * 获取用户资料
   *
   * 从外部 API 获取原始数据，然后转换、丰富为内部格式。
   * 这个方法包含了数据转换逻辑，值得测试。
   *
   * @param id - 用户 ID
   * @returns 格式化后的用户资料
   *
   * 测试要点：
   * - 正常获取并转换数据
   * - 外部 API 返回意外格式时的处理
   * - 外部 API 调用失败时的错误处理
   * - 验证 fetchFromExternalApi 被正确调用
   */
  async getUserProfile(id: string): Promise<UserProfile> {
    try {
      const externalData = await this.fetchFromExternalApi(id);

      // 数据转换与丰富 - 这部分逻辑需要测试覆盖
      const profile: UserProfile = {
        id: externalData.id,
        name: externalData.username,
        email: externalData.email,
        avatar: externalData.profile_picture || undefined,
        lastLogin: externalData.last_active
          ? new Date(externalData.last_active)
          : undefined,
      };

      return profile;
    } catch (error) {
      // 将外部 API 错误转换为合适的 HTTP 异常
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `获取用户资料失败: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * 批量获取用户资料
   *
   * @param ids - 用户 ID 数组
   * @returns 用户资料数组
   *
   * 测试要点：
   * - 并发请求多个用户
   * - 部分请求失败时的处理
   */
  async getMultipleProfiles(ids: string[]): Promise<UserProfile[]> {
    const results = await Promise.allSettled(
      ids.map((id) => this.getUserProfile(id)),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<UserProfile> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
  }
}
