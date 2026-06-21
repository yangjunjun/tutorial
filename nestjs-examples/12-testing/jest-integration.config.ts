/**
 * 集成测试专用 Jest 配置
 *
 * 只匹配 test/integration/ 目录下的测试文件。
 * 集成测试会测试模块之间的协作。
 */
import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
};

export default config;
