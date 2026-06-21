/**
 * Jest 基础配置
 *
 * 所有测试类型共享的配置项。
 * 使用 ts-jest 预设来直接运行 TypeScript 测试文件。
 */
import type { Config } from 'jest';

const config: Config = {
  // 使用 ts-jest 预设处理 TypeScript 文件
  preset: 'ts-jest',
  // 测试环境为 Node.js（不是浏览器）
  testEnvironment: 'node',
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'ts'],
  // 将 TypeScript 文件通过 ts-jest 转换
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // 根目录
  rootDir: '.',
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
  ],
  // 覆盖率阈值 - 确保测试质量
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'clover'],
};

export default config;
