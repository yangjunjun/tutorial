/**
 * ESLint 配置文件
 *
 * 【代码规范化工具说明】
 * ESLint 是 JavaScript/TypeScript 的代码检查工具，可以：
 * 1. 发现潜在的 bug 和错误
 * 2. 强制执行统一的编码风格
 * 3. 配合 Prettier 实现代码格式统一
 *
 * 在 Docker 构建中，lint 通常在 CI/CD 阶段执行，不包含在生产镜像中。
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    // 使用 TypeScript 推荐的 ESLint 规则
    'plugin:@typescript-eslint/recommended',
    // Prettier 集成 - 避免 ESLint 和 Prettier 的规则冲突
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // 【@typescript-eslint/interface-name-prefix】
    // 关闭"接口名不需要 I 前缀"的限制
    // 现代 TypeScript 社区已不再要求接口名以 I 开头
    '@typescript-eslint/interface-name-prefix': 'off',

    // 【@typescript-eslint/explicit-function-return-type】
    // 关闭"必须显式声明函数返回类型"的要求
    // TypeScript 的类型推导已经足够智能
    '@typescript-eslint/explicit-function-return-type': 'off',

    // 【@typescript-eslint/explicit-module-boundary-types】
    // 关闭模块边界类型的强制要求
    // 减少模板代码，提升开发效率
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // 【@typescript-eslint/no-explicit-any】
    // 允许使用 any 类型（警告级别）
    // 在示例代码中为了简化可能会用到 any
    '@typescript-eslint/no-explicit-any': 'warn',

    // 【no-console】
    // 生产环境建议关闭 console 输出
    // 使用 NestJS 的 Logger 替代
    'no-console': 'warn',
  },
};
