/**
 * 应用入口文件
 *
 * 【NestJS 应用启动流程】
 * 1. NestFactory.create() - 创建 NestJS 应用实例
 * 2. 配置全局中间件、管道、过滤器
 * 3. app.listen() - 启动 HTTP 服务器
 *
 * 【生产环境关键配置】
 * 1. Helmet - 安全 HTTP 头
 * 2. CORS - 跨域资源共享
 * 3. ValidationPipe - 全局参数验证
 * 4. Graceful Shutdown - 优雅关闭
 * 5. Global Exception Filter - 全局异常处理
 *
 * 【Docker 中的注意事项】
 * - 监听 0.0.0.0 而不是 localhost（容器内需要外部访问）
 * - 使用环境变量配置端口
 * - 实现优雅关闭以处理 SIGTERM 信号（Docker stop 发送）
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // =========================================================================
  // 创建 NestJS 应用实例
  // =========================================================================
  // bufferLogs 缓冲日志直到 Logger 初始化完成
  // 这在自定义 Logger 时很有用
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const corsOrigin = configService.get<string>('app.corsOrigin', '*');
  const nodeEnv = configService.get<string>('app.env', 'development');

  // =========================================================================
  // 安全配置：Helmet
  // =========================================================================
  // 【Helmet 是什么？】
  // Helmet 通过设置各种 HTTP 头来保护应用：
  // - X-Content-Type-Options: nosniff （防止 MIME 类型嗅探）
  // - X-Frame-Options: DENY （防止点击劫持）
  // - X-XSS-Protection: 1; mode=block （XSS 过滤）
  // - Content-Security-Policy （内容安全策略）
  // - Strict-Transport-Security （强制 HTTPS）
  //
  // 在生产环境中非常重要，但在开发时可能需要放宽某些限制
  app.use(
    helmet({
      // 开发环境禁用 CSP（Content Security Policy）
      // 生产环境应该配置严格的 CSP
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );
  logger.log('✅ Helmet 安全头已配置');

  // =========================================================================
  // CORS 跨域配置
  // =========================================================================
  // 【CORS 说明】
  // Cross-Origin Resource Sharing 允许浏览器从不同域名访问 API。
  // - 开发环境：通常允许所有来源（*）
  // - 生产环境：应该限制为特定的前端域名
  //
  // 【在 Docker/K8s 中的实践】
  // 如果使用 Nginx Ingress 处理 CORS，可以在这里关闭
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });
  logger.log(`✅ CORS 已配置 (origin: ${corsOrigin})`);

  // =========================================================================
  // 全局验证管道
  // =========================================================================
  // 【ValidationPipe 说明】
  // 自动验证请求体、查询参数和路由参数。
  // - whitelist: true - 自动过滤 DTO 中未定义的属性
  // - forbidNonWhitelisted: true - DTO 有未定义属性时抛出错误
  // - transform: true - 自动转换参数类型（如 string → number）
  //
  // 配合 class-validator 和 class-transformer 使用效果最佳
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  logger.log('✅ 全局验证管道已配置');

  // =========================================================================
  // 全局异常过滤器
  // =========================================================================
  // 捕获所有未处理的异常，返回统一的错误响应格式
  app.useGlobalFilters(new GlobalExceptionFilter());
  logger.log('✅ 全局异常过滤器已配置');

  // =========================================================================
  // 优雅关闭（Graceful Shutdown）
  // =========================================================================
  // 【为什么需要优雅关闭？】
  // 当 Docker 容器或 Kubernetes Pod 被关闭时：
  // 1. Docker/K8s 发送 SIGTERM 信号
  // 2. 应用需要完成正在处理的请求
  // 3. 关闭数据库连接
  // 4. 取消定时任务
  // 5. 释放其他资源
  //
  // 如果不做优雅关闭：
  // - 正在处理的请求会突然中断
  // - 数据库事务可能不完整
  // - 可能导致数据不一致
  //
  // enableShutdownHooks() 让 NestJS 监听 SIGTERM 和 SIGINT 信号
  // 并调用所有模块的 onModuleDestroy() 和 beforeApplicationShutdown()
  app.enableShutdownHooks();
  logger.log('✅ 优雅关闭钩子已启用');

  // =========================================================================
  // 启动应用
  // =========================================================================
  // 【注意】监听 0.0.0.0 而不是 localhost
  // 在 Docker 容器中，localhost 只在容器内部可访问
  // 监听 0.0.0.0 使得端口可以从宿主机或其他容器访问
  await app.listen(port, '0.0.0.0');

  // 打印启动信息
  logger.log(`========================================`);
  logger.log(`  🚀 应用已启动`);
  logger.log(`  环境: ${nodeEnv}`);
  logger.log(`  端口: ${port}`);
  logger.log(`  PID:  ${process.pid}`);
  logger.log(`  URL:  http://localhost:${port}`);
  logger.log(`========================================`);
  logger.log(`  健康检查: http://localhost:${port}/health`);
  logger.log(`  存活探针: http://localhost:${port}/health/live`);
  logger.log(`  就绪探针: http://localhost:${port}/health/ready`);
  logger.log(`  监控指标: http://localhost:${port}/metrics`);
  logger.log(`========================================`);

  // =========================================================================
  // 优雅关闭处理
  // =========================================================================
  // 监听进程信号，手动处理关闭逻辑
  // Docker stop 会先发送 SIGTERM，等待一段时间后发送 SIGKILL
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`收到 ${signal} 信号，开始优雅关闭...`);

    // 关闭 NestJS 应用
    // 这会触发所有模块的 onModuleDestroy 钩子
    await app.close();

    logger.log('应用已优雅关闭');
    process.exit(0);
  };

  // SIGTERM: Docker/K8s 停止容器时发送
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // SIGINT: Ctrl+C 时发送（开发环境）
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
