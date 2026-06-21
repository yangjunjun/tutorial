/**
 * 演示控制器
 *
 * 学习要点：
 * 1. 各种异常类型的触发方式
 * 2. 文件上传的完整流程（multer 中间件）
 * 3. 超时拦截器的使用
 */
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  InsufficientStockException,
  OrderNotFoundException,
} from '../common/exceptions/business.exception';

@Controller('demo')
export class DemoController {
  /**
   * GET /demo/success
   * 正常响应 - 演示拦截器记录请求日志
   */
  @Get('success')
  success() {
    return {
      code: 200,
      message: '请求成功',
      data: {
        greeting: '你好，NestJS！',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * GET /demo/not-found
   * 抛出 NotFoundException - 会被 HttpExceptionFilter 捕获
   */
  @Get('not-found')
  notFound() {
    // NestJS 内置异常，HTTP 状态码 404
    throw new NotFoundException('请求的资源不存在');
  }

  /**
   * GET /demo/business-error
   * 抛出自定义业务异常 - 会被 BusinessExceptionFilter 捕获
   */
  @Get('business-error')
  businessError() {
    // 自定义业务异常，包含业务错误码和额外数据
    throw new InsufficientStockException('iPhone 15 Pro', 5, 2);
  }

  /**
   * GET /demo/order-not-found
   * 另一个业务异常示例
   */
  @Get('order-not-found')
  orderNotFound() {
    throw new OrderNotFoundException('ORD-2024-001');
  }

  /**
   * GET /demo/crash
   * 未预期的错误 - 生产环境不应暴露错误详情
   */
  @Get('crash')
  crash() {
    // 模拟一个未预期的运行时错误
    throw new InternalServerErrorException('服务器遇到了未知错误');
  }

  /**
   * GET /demo/timeout
   * 模拟慢请求 - 可配合超时拦截器使用
   */
  @Get('timeout')
  async timeout() {
    // 模拟耗时操作（3秒）
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      code: 200,
      message: '请求完成（耗时 3 秒）',
    };
  }

  /**
   * POST /demo/upload
   * 文件上传示例
   *
   * 学习要点：
   * 1. @UseInterceptors(FileInterceptor) 配置 multer
   * 2. diskStorage 自定义文件存储路径和文件名
   * 3. ParseFilePipe 验证文件类型和大小
   * 4. FileTypeValidator 检查 MIME 类型
   * 5. MaxFileSizeValidator 检查文件大小
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      // 配置 multer 存储
      storage: diskStorage({
        // 文件保存目录
        destination: './uploads',
        // 自定义文件名：时间戳 + 随机数 + 原扩展名
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      // 文件验证管道
      new ParseFilePipe({
        validators: [
          // 文件类型验证：只允许图片
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp)$/,
          }),
          // 文件大小验证：最大 5MB
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024, // 5MB
            message: '文件大小不能超过 5MB',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return {
      code: 200,
      message: '文件上传成功',
      data: {
        originalName: file.originalname,
        fileName: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        url: `/uploads/${file.filename}`,
      },
    };
  }
}
