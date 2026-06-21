/**
 * 自定义 API 响应装饰器
 *
 * 学习要点：
 * 1. 可以封装 Swagger 装饰器为自定义装饰器
 * 2. applyDecorators 将多个装饰器合并为一个
 * 3. 统一 API 响应格式，减少重复代码
 *
 * 使用方式：
 * @ApiStandardResponse(200, '操作成功', ProductEntity)
 */
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * 标准响应格式装饰器
 *
 * 生成统一格式的响应文档：
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... }
 * }
 */
export function ApiStandardResponse<T extends Type<any>>(
  statusCode: number,
  description: string,
  dataType?: T,
) {
  const decorators = [
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        type: 'object',
        properties: {
          code: { type: 'number', example: statusCode },
          message: { type: 'string', example: description },
          data: dataType
            ? { $ref: getSchemaPath(dataType) }
            : { type: 'object' },
        },
      },
    }),
  ];

  // 如果指定了数据类型，需要额外注册为额外模型
  if (dataType) {
    decorators.push(ApiExtraModels(dataType) as any);
  }

  return applyDecorators(...decorators);
}

/**
 * 分页响应装饰器
 *
 * 生成分页格式的响应文档：
 * {
 *   "code": 200,
 *   "data": {
 *     "items": [...],
 *     "total": 100,
 *     "page": 1,
 *     "limit": 10
 *   }
 * }
 */
export function ApiPaginatedResponse<T extends Type<any>>(
  description: string,
  dataType: T,
) {
  return applyDecorators(
    ApiExtraModels(dataType),
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          code: { type: 'number', example: 200 },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(dataType) },
              },
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
  );
}
