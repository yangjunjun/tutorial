/**
 * 端到端测试专用 Jest 配置
 *
 * 只匹配 test/e2e/ 目录下的测试文件。
 * E2E 测试会启动完整的 NestJS 应用，模拟真实的 HTTP 请求。
 *
 * 注意：
 * - testTimeout 设为 30 秒，因为 E2E 测试通常比较慢
 * - E2E 测试不参与覆盖率统计（由单元测试负责）
 */
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'e2e',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  // 匹配 E2E 测试文件
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // E2E 测试通常更耗时，增加超时时间
  testTimeout: 30000,
};

export default config;
