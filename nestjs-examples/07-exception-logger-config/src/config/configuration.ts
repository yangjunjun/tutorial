/**
 * 配置工厂函数
 *
 * 学习要点：
 * 1. 配置工厂函数返回一个配置对象
 * 2. 通过 ConfigModule.forRoot({ load: [configuration] }) 加载
 * 3. 使用 ConfigService.get('app.port') 获取嵌套配置
 *
 * 配置分组的好处：
 * - 结构清晰，易于维护
 * - 避免命名冲突
 * - 方便在不同环境中切换
 */

export default () => ({
  // 应用配置
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./dev.db',
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: '1h',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
