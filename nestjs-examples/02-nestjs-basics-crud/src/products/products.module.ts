/**
 * 商品模块（Module）
 *
 * 模块是 NestJS 组织代码的基本单元。每个功能领域通常对应一个模块。
 *
 * @Module() 装饰器接收一个配置对象：
 *
 * - imports:    导入其他模块（这些模块导出的 Provider 可以在本模块中使用）
 * - controllers: 注册本模块的控制器（处理 HTTP 请求）
 * - providers:  注册本模块的提供者（服务、仓储、工具类等）
 * - exports:    导出提供者（让其他模块可以通过 imports 使用这些提供者）
 *
 * 模块的作用：
 * 1. 封装：将相关的控制器和服务组织在一起
 * 2. 依赖管理：通过 imports/exports 控制依赖关系
 * 3. 代码组织：大型项目可以按功能拆分为多个模块
 */
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController], // 注册控制器
  providers: [ProductsService],       // 注册服务提供者
  exports: [ProductsService],         // 导出服务，供其他模块使用
})
export class ProductsModule {}
