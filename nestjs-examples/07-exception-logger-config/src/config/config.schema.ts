/**
 * 环境变量验证模式（Joi Schema）
 *
 * 学习要点：
 * 1. Joi 是强大的对象验证库
 * 2. 在应用启动时验证环境变量，防止配置错误导致的运行时崩溃
 * 3. ConfigModule.forRoot({ validationSchema }) 会在启动时自动校验
 *
 * 常见验证规则：
 * - Joi.string().required()  必填字符串
 * - Joi.number().default(x)  可选数字，带默认值
 * - Joi.string().valid(...)   限定可选值
 */
import * as Joi from 'joi';

/**
 * 环境变量验证 Schema
 *
 * 定义每个环境变量的：
 * - 类型（string/number/boolean）
 * - 是否必填
 * - 默认值
 * - 可选值范围
 */
export const validationSchema = Joi.object({
  // 应用端口号，默认 3000
  PORT: Joi.number().default(3000),

  // 数据库连接字符串，开发环境可选默认值
  DATABASE_URL: Joi.string().default('sqlite:./dev.db'),

  // JWT 密钥，必填（生产环境尤为重要）
  JWT_SECRET: Joi.string().required(),

  // 运行环境，限定为 development/production/test
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // 日志级别，限定可选值
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('debug'),
});
