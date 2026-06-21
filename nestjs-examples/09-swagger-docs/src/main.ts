/**
 * 应用入口（含 Swagger 配置）
 *
 * 学习要点：
 * 1. SwaggerModule.setup() 配置 Swagger UI
 * 2. DocumentBuilder 构建 OpenAPI 文档元数据
 * 3. Swagger 文档自动从装饰器中提取接口信息
 * 4. 可以同时提供 HTML UI、JSON 和 YAML 格式
 *
 * 访问地址：
 * - Swagger UI: http://localhost:3000/api-docs
 * - JSON 规范: http://localhost:3000/api-docs-json
 * - YAML 规范: http://localhost:3000/api-docs-yaml
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ========== Swagger 文档配置 ==========
  // DocumentBuilder 构建 OpenAPI 文档的基础信息
  const swaggerConfig = new DocumentBuilder()
    // 文档标题
    .setTitle('电商 API 文档')
    // 文档描述（支持 Markdown）
    .setDescription(
      `
## 电商系统 RESTful API

这是一个完整的电商 API 示例，包含以下模块：
- **商品管理**：商品的 CRUD 操作
- **用户管理**：用户注册和查询
- **订单管理**：订单创建、查询和取消

### 认证方式
所有接口需要在请求头中携带 Bearer Token：
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### 统一响应格式
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
\`\`\`
    `,
    )
    // API 版本
    .setVersion('1.0')
    // 添加标签（对应 @ApiTags）
    .addTag('商品管理', '商品的增删改查接口')
    .addTag('用户管理', '用户注册和信息查询接口')
    .addTag('订单管理', '订单创建、查询和状态管理接口')
    // 添加 Bearer Token 认证方案
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: '请输入 JWT Token',
    })
    // 添加联系信息
    .setContact(
      'API 支持团队',
      'https://example.com',
      'support@example.com',
    )
    // 添加许可证
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    // 添加服务器地址
    .addServer('http://localhost:3000', '本地开发服务器')
    // 构建文档配置
    .build();

  // 创建 Swagger 文档实例
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // 挂载 Swagger UI
  // 第一个参数是路由前缀（/api-docs）
  // 第二个参数是应用实例
  // 第三个参数是文档配置
  SwaggerModule.setup('api-docs', app, document, {
    // Swagger UI 自定义选项
    swaggerOptions: {
      // 持久化授权数据
      persistAuthorization: true,
      // 默认展开的标签
      docExpansion: 'list', // 'list' | 'full' | 'none'
      // 按标签排序
      tagsSorter: 'alpha',
      // 显示请求耗时
      displayRequestDuration: true,
      // 过滤功能
      filter: true,
    },
    // 自定义 Swagger UI 的 CSS
    customCss: '.swagger-ui .topbar { display: none }',
    // 自定义页面标题
    customSiteTitle: '电商 API 文档',
  });

  const port = 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Swagger 文档服务已启动`);
  logger.log(`Swagger UI: http://localhost:${port}/api-docs`);
  logger.log(`JSON 规范: http://localhost:${port}/api-docs-json`);
  logger.log(`YAML 规范: http://localhost:${port}/api-docs-yaml`);
}

bootstrap();
