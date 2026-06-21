/**
 * Winston 日志配置
 *
 * 学习要点：
 * 1. Winston 是 Node.js 最流行的日志库
 * 2. 传输通道（Transport）：日志的输出目标
 *    - Console: 控制台输出（开发时使用彩色格式）
 *    - File: 文件输出（生产环境持久化日志）
 * 3. 日志级别（从低到高）：
 *    error → warn → info → http → verbose → debug → silly
 * 4. 自定义 format 可以控制日志的输出格式
 *
 * nest-winston 是 NestJS 的 Winston 适配器
 * 它将 Winston 集成为 NestJS 的 LoggerService
 */
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import * as path from 'path';

/**
 * 创建 Winston 日志实例
 *
 * 配置说明：
 * - 日志级别从环境变量或默认 debug
 * - 控制台输出带颜色（开发友好）
 * - 文件输出使用 JSON 格式（便于日志分析工具处理）
 */
export const winstonLogger = WinstonModule.createLogger({
  // 默认日志级别，可通过环境变量覆盖
  level: process.env.LOG_LEVEL || 'debug',

  transports: [
    // ========== 控制台传输 ==========
    // 开发环境使用彩色输出，方便阅读
    new winston.transports.Console({
      format: winston.format.combine(
        // 添加时间戳
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        // 彩色输出（仅控制台）
        winston.format.colorize(),
        // 自定义输出格式
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const ctx = context || 'Application';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level} [${ctx}] ${message}${metaStr}`;
        }),
      ),
    }),

    // ========== 综合日志文件 ==========
    // 记录所有级别的日志
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB 后轮转
      maxFiles: 5,                // 保留最近 5 个文件
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(), // JSON 格式便于日志分析
      ),
    }),

    // ========== 错误日志文件 ==========
    // 只记录 error 级别的日志
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error', // 只记录错误
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
