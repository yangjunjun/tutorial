/**
 * 根模块
 *
 * 学习要点：
 * 1. ConfigModule.forRoot() 配置环境变量加载和验证
 * 2. 全局过滤器和拦截器的注册方式
 * 3. 模块导入顺序影响初始化顺序
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { DemoModule } from './demo/demo.module';
import configuration from './config/configuration';
import { validationSchema } from './config/config.schema';

@Module({
  imports: [
    // ========== 配置模块 ==========
    // isGlobal: true 使 ConfigService 全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      // 加载自定义配置工厂
      load: [configuration],
      // Joi 验证模式（启动时校验环境变量）
      validationSchema,
      // 环境变量文件路径
      envFilePath: ['.env'],
      // 如果验证失败，是否阻止应用启动
      // validateSync: true 确保启动时就发现问题
    }),

    // ========== 日志模块 ==========
    LoggerModule,

    // ========== 业务模块 ==========
    DemoModule,
  ],
})
export class AppModule {}
