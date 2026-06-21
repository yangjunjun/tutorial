/**
 * 单元测试专用 Jest 配置
 *
 * 只匹配 test/unit/ 目录下的测试文件。
 * 单元测试应该快速运行，不依赖外部服务。
 */
import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  // 显示名称，在运行时区分不同类型的测试
  displayName: 'unit',
  // 只匹配单元测试文件
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
};

export default config;
