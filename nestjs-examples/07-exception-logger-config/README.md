# 07-exception-logger-config - 异常过滤、日志、配置管理、文件上传

## 项目简介

本项目综合演示 NestJS 的基础设施组件：自定义异常过滤器、Winston 日志系统、环境配置管理和文件上传功能。这些是构建生产级应用的核心基础设施。

## 知识点

### 1. 异常过滤器（Exception Filter）
- **HttpExceptionFilter**: 捕获所有异常，统一格式化响应
- **BusinessExceptionFilter**: 处理自定义业务异常
- 异常过滤器的层级：全局 → 控制器 → 方法

### 2. 日志系统（Logger）
- 使用 Winston 替换 NestJS 默认 Logger
- 多传输通道：控制台（彩色输出）+ 文件（日志轮转）
- 自定义日志格式（时间戳 + 级别 + 上下文）

### 3. 配置管理（ConfigModule）
- @nestjs/config 加载 .env 文件
- Joi 校验环境变量（启动时验证）
- 分组配置：app、database、jwt

### 4. 文件上传（File Upload）
- multer 中间件处理 multipart/form-data
- 文件类型和大小验证
- 文件存储配置

## 运行步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量文件
cp .env.example .env

# 3. 启动开发服务器
pnpm start:dev
```

## API 测试

### 正常响应
```bash
curl http://localhost:3000/demo/success
```

### NotFoundException
```bash
curl http://localhost:3000/demo/not-found
# 返回统一格式: { code, message, timestamp, path, method }
```

### 自定义业务异常
```bash
curl http://localhost:3000/demo/business-error
```

### 未预期错误
```bash
curl http://localhost:3000/demo/crash
# 生产环境不会暴露错误详情
```

### 超时测试
```bash
curl http://localhost:3000/demo/timeout
# 超过超时时间会返回 408 Request Timeout
```

### 文件上传
```bash
curl -X POST http://localhost:3000/demo/upload \
  -F "file=@/path/to/image.jpg"
# 限制：图片类型，最大 5MB
```

## 项目结构

```
src/
├── common/
│   ├── filters/
│   │   ├── http-exception.filter.ts      # 全局 HTTP 异常过滤器
│   │   └── business-exception.filter.ts  # 业务异常过滤器
│   ├── exceptions/
│   │   └── business.exception.ts         # 自定义业务异常类
│   └── interceptors/
│       └── logging.interceptor.ts        # 请求日志拦截器
├── logger/
│   ├── winston.logger.ts                 # Winston 日志配置
│   └── logger.module.ts                  # 日志模块
├── config/
│   ├── config.schema.ts                  # Joi 验证模式
│   └── configuration.ts                  # 配置工厂函数
├── demo/
│   ├── demo.controller.ts                # 演示控制器
│   └── demo.module.ts                    # 演示模块
├── uploads/                              # 上传文件目录
├── app.module.ts                         # 根模块
└── main.ts                               # 入口
```

## 异常过滤器优先级

```
方法级 @UseFilters() → 控制器级 @UseFilters() → 全局 app.useGlobalFilters()
```

当多个过滤器同时存在时：
1. 最接近路由的过滤器优先执行
2. 如果过滤器不处理该异常，会向上传播
3. 全局过滤器是最后的兜底

## 环境配置最佳实践

1. **不要将 .env 提交到版本控制** - 使用 .env.example 作为模板
2. **启动时验证配置** - 使用 Joi 确保必要的环境变量存在
3. **按功能分组** - 将配置分为 app、database、jwt 等模块
4. **类型安全** - 通过 ConfigService 获取配置值时提供类型
