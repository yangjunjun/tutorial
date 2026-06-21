/**
 * 演示模块
 */
import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';

@Module({
  controllers: [DemoController],
})
export class DemoModule {}
