/**
 * 日志模块
 *
 * 学习要点：
 * 1. 将日志配置封装为模块
 * 2. 使用 Global 使其全局可用
 * 3. 导出 WinstonModule 供其他模块使用
 */
import { Global, Module } from '@nestjs/common';
import { winstonLogger } from './winston.logger';

@Global()
@Module({
  // winstonLogger 已经是通过 WinstonModule.createLogger() 创建的模块
  imports: [winstonLogger],
  exports: [winstonLogger],
})
export class LoggerModule {}
