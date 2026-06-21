/**
 * @ApiEndpoint() 类装饰器 + @ApiParam() 参数装饰器
 *
 * 这个文件演示 NestJS 核心的元数据存储模式（Metadata Pattern）。
 *
 * NestJS 使用 reflect-metadata 库来实现"装饰器 + 元数据"的模式：
 * - Reflect.defineMetadata(key, value, target) —— 存储元数据
 * - Reflect.getMetadata(key, target) —— 读取元数据
 *
 * 这种模式贯穿整个 NestJS 框架：
 * - @Controller('path') 存储路由路径元数据
 * - @Get('/users') 存储 HTTP 方法和路由元数据
 * - @Body() 存储参数提取方式的元数据
 *
 * 参数装饰器（Parameter Decorator）：
 * - 接收 target, propertyKey（方法名）, parameterIndex（参数索引）
 * - 常用于记录"哪个参数需要从请求的哪个部分提取"
 * - NestJS 中的 @Param(), @Query(), @Body() 就是参数装饰器
 */

// 定义元数据的 key 常量
const API_ENDPOINT_KEY = 'api:endpoint';
const API_PARAMS_KEY = 'api:params';

/**
 * ApiEndpoint 配置接口
 */
interface ApiEndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}

/**
 * @ApiEndpoint() 类装饰器
 * 存储 API 端点的元数据（HTTP 方法和路径）
 *
 * 这与 NestJS 内部 @Controller() 的实现原理类似
 */
export function ApiEndpoint(config: ApiEndpointConfig): ClassDecorator {
  return function (target: Function) {
    // 使用 Reflect.defineMetadata 存储元数据
    Reflect.defineMetadata(API_ENDPOINT_KEY, config, target);
    console.log(`[ApiEndpoint] 已注册端点: ${config.method} ${config.path} -> ${target.name}`);
  };
}

/**
 * @ApiParam() 参数装饰器
 * 记录参数的名称和位置信息
 *
 * 参数装饰器接收：
 * - target: 类的原型
 * - propertyKey: 方法名
 * - parameterIndex: 参数在参数列表中的索引位置
 */
export function ApiParam(name: string): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 获取已有的参数元数据
    const existingParams: Array<{ name: string; index: number }> =
      Reflect.getOwnMetadata(API_PARAMS_KEY, target, propertyKey!) || [];

    // 添加当前参数的信息
    existingParams.push({
      name,
      index: parameterIndex,
    });

    // 存储更新后的参数列表
    Reflect.defineMetadata(API_PARAMS_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 辅助函数：读取类上的 API 端点元数据
 * 这就是 NestJS 框架内部读取路由信息的方式
 */
export function getApiEndpoint(target: Function): ApiEndpointConfig | undefined {
  return Reflect.getMetadata(API_ENDPOINT_KEY, target);
}

/**
 * 辅助函数：读取方法上的参数元数据
 */
export function getApiParams(target: Object, propertyKey: string): Array<{ name: string; index: number }> {
  return Reflect.getMetadata(API_PARAMS_KEY, target, propertyKey) || [];
}
