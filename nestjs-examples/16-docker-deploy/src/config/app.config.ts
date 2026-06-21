/**
 * 应用配置文件
 *
 * 【NestJS ConfigModule 说明】
 * @nestjs/config 模块提供了配置管理方案：
 * 1. 从 .env 文件加载环境变量
 * 2. 提供配置验证（通过 Joi schema）
 * 3. 支持不同环境的配置文件
 * 4. 通过 ConfigService 注入到任何服务中
 *
 * 【Docker 部署中的配置管理】
 * - 开发环境：使用 .env 文件
 * - Docker 部署：通过 docker-compose 的 environment 字段注入
 * - Kubernetes：使用 ConfigMap 和 Secret
 * - 云平台：使用专用的密钥管理服务（AWS Parameter Store, GCP Secret Manager）
 */
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * 应用配置工厂
 * registerAs 创建一个命名空间的配置，可以通过 'app' 键访问
 *
 * 使用示例：
 * ```typescript
 * constructor(private configService: ConfigService) {
 *   const port = this.configService.get<number>('app.port');
 * }
 * ```
 */
export const appConfig = registerAs('app', () => ({
  // 应用运行环境
  env: process.env.NODE_ENV || 'development',

  // 应用名称
  name: process.env.APP_NAME || 'nestjs-docker-demo',

  // 应用版本
  version: process.env.APP_VERSION || '1.0.0',

  // 应用监听端口
  // parseInt 将字符串环境变量转为数字
  port: parseInt(process.env.PORT, 10) || 3000,

  // 日志级别
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS 配置
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // API 密钥
  apiKey: process.env.API_KEY || 'default-dev-key',

  // 健康检查阈值
  health: {
    // 内存使用阈值（字节）：默认 300MB
    memoryThreshold:
      parseInt(process.env.HEALTH_MEMORY_THRESHOLD, 10) * 1024 * 1024 ||
      300 * 1024 * 1024,
    // 磁盘使用率阈值（百分比）
    diskThreshold: parseInt(process.env.HEALTH_DISK_THRESHOLD, 10) || 90,
  },
}));

/**
 * 环境变量验证 Schema
 *
 * 【为什么需要验证环境变量？】
 * 1. 防止因缺少必要配置导致应用启动后才崩溃
 * 2. 在应用启动时就发现配置错误（Fail Fast 原则）
 * 3. 确保配置值的类型和范围正确
 *
 * Joi 是一个强大的数据验证库：
 * - .required() 表示此字段必须存在
 * - .optional() 表示此字段可选
 * - .default() 设置默认值
 * - .valid() 限制可选值
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000).min(1).max(65535),
  APP_NAME: Joi.string().default('nestjs-docker-demo'),
  APP_VERSION: Joi.string().default('1.0.0'),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),
  CORS_ORIGIN: Joi.string().default('*'),
  API_KEY: Joi.string().optional(),
  HEALTH_MEMORY_THRESHOLD: Joi.number().default(300),
  HEALTH_DISK_THRESHOLD: Joi.number().default(90),
});
